"""Registra la lezione: audio di sistema (loopback WASAPI) e finestra della lezione, sullo stesso orologio.

    python registra.py <cartella_lezione> [--titolo "teams|riunione"] [--programma opera.exe] [--modo finestra|schermo]

Audio: pezzi WAV mono da CHUNK_S secondi in audio/ (il pezzo k comincia a k*CHUNK_S).
I buchi (nessun suono in uscita, cambio di dispositivo) diventano silenzio, così il
tempo dell'audio resta quello dell'orologio e combacia con i fotogrammi.
Video: si fotografa la finestra della lezione (cattura.py), anche se è coperta da altro, e
solo finché il suo titolo è quello di una lezione: se nel browser si passa a un'altra scheda
i fotogrammi si fermano (l'audio no) e ripartono quando si torna. Un fotogramma in frames/
quando la lavagna cambia e si ferma, o ogni 20 s se continua a cambiare; vivo.jpg è
l'anteprima per la regia, rifatta ogni 2 s. Si ferma quando compare il file STOP (o con Ctrl+C).
"""
import argparse
import queue
import threading
import time
import wave
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
import pyaudiowpatch as pa

import cattura
from comune import CHUNK_S, aggiungi_jsonl, leggi_json, leggi_jsonl, scrivi_immagine, scrivi_json, scrivi_pid

stato = {'audio': {}, 'video': {}}


def scrivi_wav(p, x, rate):
    tmp = p.with_suffix('.tmp')
    with wave.open(str(tmp), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(x.astype(np.int16).tobytes())
    tmp.replace(p)


class Audio:
    def __init__(self, cart, t0, ferma):
        self.cart, self.t0, self.ferma = cart / 'audio', t0, ferma
        self.cart.mkdir(parents=True, exist_ok=True)
        self.q = queue.Queue()
        self.p = pa.PyAudio()
        self.rate = None  # fissato alla prima apertura
        self.flussi = []

    def apri(self):
        self.chiudi()
        self.p.terminate()
        self.p = pa.PyAudio()
        w = self.p.get_host_api_info_by_type(pa.paWASAPI)
        out = self.p.get_device_info_by_index(w['defaultOutputDevice'])
        lb = next(d for d in self.p.get_loopback_device_info_generator() if out['name'] in d['name'])
        self.rate_dev, self.ch = int(lb['defaultSampleRate']), lb['maxInputChannels']
        self.rate = self.rate or self.rate_dev

        def cb_in(dati, n, info, st):
            self.q.put((time.perf_counter(), dati))
            return (None, pa.paContinue)

        def cb_out(dati, n, info, st):  # silenzio in uscita: tiene vivo il loopback anche senza suono
            return (bytes(n * out['maxOutputChannels'] * 2), pa.paContinue)

        try:
            self.flussi.append(self.p.open(format=pa.paInt16, channels=out['maxOutputChannels'],
                                           rate=int(out['defaultSampleRate']), output=True,
                                           output_device_index=out['index'], stream_callback=cb_out))
        except Exception as e:
            print('silenzio di mantenimento non partito:', e, flush=True)
        self.flussi.append(self.p.open(format=pa.paInt16, channels=self.ch, rate=self.rate_dev, input=True,
                                       input_device_index=lb['index'], frames_per_buffer=self.rate_dev // 10,
                                       stream_callback=cb_in))
        self.dispositivo = lb['name']
        stato['audio'].update(dispositivo=lb['name'], rate=self.rate)
        print('audio da', lb['name'], self.rate_dev, 'Hz', flush=True)

    def chiudi(self):
        for s in self.flussi:
            try:
                s.stop_stream()
                s.close()
            except Exception:
                pass
        self.flussi = []

    def gira(self):
        self.apri()
        n = self.rate * CHUNK_S
        k = len(list(self.cart.glob('c_*.wav')))  # ripresa dopo un crash: si continua la numerazione
        buf, in_buf, scritti = [], 0, k * n  # scritti = campioni già nei pezzi
        ultimo_dato = ultimo_suono = time.perf_counter()
        livelli, chiuso = [], False
        while True:
            if self.ferma.is_set() and not chiuso:
                self.chiudi()  # niente più dati: si svuota la coda e si chiude l'ultimo pezzo
                chiuso = True
            try:
                t, dati = self.q.get(timeout=0.5)
                ultimo_dato = t
                x = np.frombuffer(dati, np.int16).reshape(-1, self.ch).mean(axis=1)
                if self.rate_dev != self.rate:
                    x = np.interp(np.linspace(0, len(x) - 1, int(len(x) * self.rate / self.rate_dev)),
                                  np.arange(len(x)), x)
            except queue.Empty:
                if chiuso:
                    break
                t, x = time.perf_counter(), np.zeros(0)
                if t - ultimo_dato > 5:
                    print('audio fermo da 5 s: riapro il dispositivo', flush=True)
                    try:
                        self.apri()
                    except Exception as e:
                        print('riapertura fallita:', e, flush=True)
                    ultimo_dato = time.perf_counter()
            atteso = int((t - self.t0) * self.rate)
            buco = atteso - (scritti + in_buf + len(x))
            if buco > self.rate:  # più di 1 s mancante: silenzio al posto del buco, un pezzo alla volta
                while buco > 0:
                    z = min(buco, n - in_buf) if in_buf < n else 0
                    if z:
                        buf.append(np.zeros(z))
                        in_buf += z
                        buco -= z
                    if in_buf >= n:
                        tutto = np.concatenate(buf)
                        scrivi_wav(self.cart / f'c_{k:05d}.wav', np.clip(tutto[:n], -32768, 32767), self.rate)
                        k += 1
                        scritti += n
                        buf, in_buf = [tutto[n:]], len(tutto) - n
            if len(x):
                buf.append(x)
                in_buf += len(x)
                rms = float(np.sqrt(np.mean(x ** 2)))
                livelli.append(rms)
                if rms > 150:
                    ultimo_suono = t
            while in_buf >= n:
                tutto = np.concatenate(buf)
                scrivi_wav(self.cart / f'c_{k:05d}.wav', np.clip(tutto[:n], -32768, 32767), self.rate)
                k += 1
                scritti += n
                buf, in_buf = [tutto[n:]], len(tutto) - n
            if len(livelli) >= 5:  # ogni mezzo secondo: la regia ha il suo misuratore
                db = 20 * np.log10(max(np.mean(livelli), 1) / 32768)
                stato['audio'].update(livello_db=round(float(db), 1), pezzi=k,
                                      silenzio_s=round(time.perf_counter() - ultimo_suono))
                livelli = []
        if in_buf:
            scrivi_wav(self.cart / f'c_{k:05d}.wav', np.clip(np.concatenate(buf), -32768, 32767), self.rate)
            k += 1
        self.p.terminate()
        stato['audio'].update(pezzi=k, fine=True)


def schermo_intero(titolo):
    """Il modo vecchio: lo schermo dov'è la finestra della lezione (o il principale), così com'è."""
    import mss
    with mss.MSS() as sct:
        mon = sct.monitors[1]
        f = cattura.trova(titolo)
        if f:
            cx, cy = f['area'][0] + f['area'][2] // 2, f['area'][1] + f['area'][3] // 2
            mon = next((m for m in sct.monitors[1:] if m['left'] <= cx < m['left'] + m['width']
                        and m['top'] <= cy < m['top'] + m['height']), mon)
        img = sct.grab(mon)
        a = np.frombuffer(img.bgra, np.uint8).reshape(img.height, img.width, 4)[..., :3]
        return np.ascontiguousarray(a), mon.get('name') or 'schermo'


def video(cart, t0, ferma, titolo, programma, modo):
    dest = cart / 'frames'
    dest.mkdir(parents=True, exist_ok=True)

    def diff(a, b):
        return float((np.abs(a - b) > 20).mean())

    prec = salvato = box = None
    t_salvato, n = -1e9, len(leggi_jsonl(cart / 'frames.jsonl'))
    vista = fuori = 0
    t_vivo = -1e9
    prossimo = time.perf_counter()
    stato['video'].update(modo=modo, fotogrammi=n)
    while not ferma.is_set():
        if modo == 'niente':  # solo l'audio
            time.sleep(0.5)
            continue
        t = time.perf_counter() - t0
        img = nome = None
        try:
            if modo == 'schermo':
                img, nome = schermo_intero(titolo)
            else:
                f = cattura.trova(titolo, programma)
                if f:
                    img, nome = cattura.fotografa(f['hwnd']), f['titolo']
        except Exception as e:  # una finestra che si chiude a metà: si riprova fra un secondo
            print('cattura:', e, flush=True)
        if img is None:
            fuori += 1
            stato['video'].update(finestra=None, vista_s=vista, fuori_s=fuori)
            prec = None
        else:
            vista += 1
            piccolo = img[::6, ::6].astype(np.int16).sum(axis=2) // 3
            if prec is not None and prec.shape != piccolo.shape:  # la finestra ha cambiato misura
                prec = salvato = None
            fermo = prec is not None and diff(piccolo, prec) < 0.002
            cambio = 1.0 if salvato is None or salvato.shape != piccolo.shape else diff(piccolo, salvato)
            if cambio > 0.004 and ((fermo and t - t_salvato >= 3) or t - t_salvato >= 20):
                nome_f = f't_{int(t):06d}.jpg'
                scrivi_immagine(dest / nome_f, img, 90)
                box = cattura.riquadro(img) or box  # senza cornice viola resta l'ultimo riquadro trovato
                aggiungi_jsonl(cart / 'frames.jsonl', {'t': round(t, 1), 'file': f'frames/{nome_f}',
                                                       'ora': datetime.now().strftime('%H:%M:%S'),
                                                       'cambio': round(cambio, 4), 'fermo': fermo, 'box': box,
                                                       'misura': [img.shape[1], img.shape[0]]})
                salvato, t_salvato = piccolo, t
                n += 1
                stato['video'].update(fotogrammi=n, ultimo=nome_f, box=box)
            if t - t_vivo >= 2:  # l'anteprima della regia
                h = round(img.shape[0] * 960 / img.shape[1])
                scrivi_immagine(cart / 'vivo.jpg', cv2.resize(img, (960, h), interpolation=cv2.INTER_AREA), 72)
                t_vivo = t
            prec = piccolo
            stato['video'].update(finestra=(nome or '')[:90], misura=[img.shape[1], img.shape[0]], vista_s=vista, fuori_s=fuori)
        prossimo += 1
        time.sleep(max(0, prossimo - time.perf_counter()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--titolo', default=cattura.TITOLO, help='espressione regolare sul titolo della finestra della lezione')
    ap.add_argument('--programma', default='', help='solo le finestre di questo programma (es. opera.exe)')
    ap.add_argument('--modo', default='finestra', choices=('finestra', 'schermo', 'niente'), help='niente = solo audio')
    a = ap.parse_args()
    cart = Path(a.cartella)
    cart.mkdir(parents=True, exist_ok=True)
    scrivi_pid(cart, 'registra')
    (cart / 'FINE').unlink(missing_ok=True)
    ferma = threading.Event()
    meta = leggi_json(cart / 'meta.json', {}) or {}
    if meta.get('inizio'):  # ripresa dopo un crash: stesso orologio, il buco diventa silenzio
        inizio = datetime.fromisoformat(meta['inizio'])
        t0 = time.perf_counter() - (datetime.now() - inizio).total_seconds()
        print('riprendo la registrazione iniziata alle', inizio.strftime('%H:%M:%S'), flush=True)
    else:
        inizio, t0 = datetime.now(), time.perf_counter()
    # quello che il server ha scritto all'avvio (materia, docente…) resta com'è
    fisso = {k: meta[k] for k in ('materia', 'materia_id', 'titolo', 'docente', 'aula', 'motore', 'versione') if meta.get(k)}

    def scrivi(**altro):
        scrivi_json(cart / 'meta.json', {**fisso, 'inizio': inizio.isoformat(timespec='seconds'),
                                         'durata_s': round(time.perf_counter() - t0), 'chunk_s': CHUNK_S, **altro, **stato})

    audio = Audio(cart, t0, ferma)
    ta = threading.Thread(target=audio.gira, daemon=True)
    tv = threading.Thread(target=video, args=(cart, t0, ferma, a.titolo, a.programma, a.modo), daemon=True)
    ta.start()
    tv.start()
    try:
        while not (cart / 'STOP').exists() and ta.is_alive() and tv.is_alive():
            scrivi()
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    if not (cart / 'STOP').exists() and not (ta.is_alive() and tv.is_alive()):
        print('un filo si è fermato da solo: esco e mi faccio rilanciare', flush=True)
        raise SystemExit(1)  # il server lo rilancia: stesso orologio, il buco diventa silenzio
    ferma.set()
    tv.join(5)
    ta.join(15)
    scrivi(fine=datetime.now().isoformat(timespec='seconds'))
    (cart / 'vivo.jpg').unlink(missing_ok=True)
    (cart / 'FINE').write_text(datetime.now().isoformat(timespec='seconds'), encoding='utf-8')
    print('fermato', flush=True)


if __name__ == '__main__':
    main()
