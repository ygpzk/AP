"""Sviluppa una lezione finita: toglie quello che lezione non è, pulisce la lavagna, archivia l'audio.

    python sviluppa.py <cartella_lezione> [--passi lezione,miniature,pulita,audio,ascolto,picchi]
                       [--sfondo rvm|birefnet] [--gpu] [--rifai]

I passi (ognuno salta quello che ha già fatto; l'avanzamento è in sviluppo.json, la regia lo mostra):
  lezione    per ogni fotogramma: è la lezione o un'altra cosa (un'altra scheda, un gioco sopra)?
             e dov'è il riquadro del video. Le registrazioni nuove lo sanno già (cattura.py); per
             quelle vecchie, fatte fotografando tutto lo schermo, lo si capisce dalla cornice viola
             di Teams e, quando manca, dal confronto con la barra di Teams degli altri fotogrammi.
             Risultato in lavagna.json. I fotogrammi «fuori» restano dove sono ma non si vedono più
             in galleria e non si leggono.
  miniature  le anteprime piccole per la galleria (miniature/*.webp).
  pulita     la lavagna senza la persona davanti: un modello che ritaglia le persone (Robust Video
             Matting, 15 MB, 0,1 s a fotogramma sulla CPU; o BiRefNet, più fine ma 13 s) dice dov'è
             il docente, e in quei punti resta la lavagna com'era l'ultima volta che si vedeva.
             Se la telecamera si sposta o cambia la scena si ricomincia. In pulita/*.webp, e in
             nitida/*.webp la stessa con la luce spianata e il tratto rinforzato.
  audio      i pezzi WAV diventano un solo audio.opus (40 kb/s: un ventesimo dello spazio), che la
             galleria suona e scorre; i WAV restano finché non li togli tu dalla regia.
  ascolto    ascolto.opus: la stessa voce senza il ronzio dell'aula e a volume costante (ffmpeg:
             passa-alto, riduzione del rumore a FFT, normalizzazione EBU R128). Per le orecchie:
             la trascrizione si fa sempre sull'audio originale, che la riduzione del rumore peggiora.
  picchi     il volume secondo per secondo (picchi.json), per la linea del tempo della galleria.
"""
import argparse
import json
import subprocess
import sys
import time
import wave
from collections import Counter
from pathlib import Path

import cv2
import numpy as np

import cattura
from comune import (CHUNK_S, MODELLI, a_bassa_priorita, leggi_immagine, leggi_json, leggi_jsonl, scrivi_immagine,
                    scrivi_json, scrivi_pid, sessione_onnx)

PASSI = ('lezione', 'miniature', 'pulita', 'audio', 'ascolto', 'picchi')
MEMORIA_S = 150  # per quanti secondi vale la lavagna vista dietro la persona
FILE_SFONDO = {'rvm': 'rvm_mobilenetv3_fp32.onnx', 'birefnet': 'birefnet-lite.onnx'}


class Avanzamento:
    def __init__(self, cart, passi):
        self.p = cart / 'sviluppo.json'
        self.d = {**(leggi_json(self.p, {}) or {}), 'stato': 'in corso', 'passi_chiesti': list(passi), 'errore': None,
                  'da': time.strftime('%Y-%m-%dT%H:%M:%S')}
        self.d.setdefault('fatti', {})
        self.t = 0

    def dice(self, passo, fatto=0, totale=0, forza=False):
        self.d.update(passo=passo, fatto=fatto, totale=totale)
        if forza or time.time() - self.t > 1:
            scrivi_json(self.p, self.d)
            self.t = time.time()

    def finito(self, passo, **cosa):
        self.d['fatti'][passo] = {'alle': time.strftime('%Y-%m-%dT%H:%M:%S'), **cosa}
        self.dice(passo, forza=True)
        print(passo, 'fatto', cosa, flush=True)

    def chiudi(self, errore=None):
        self.d.update(stato='errore' if errore else 'finito', errore=errore, passo=None)
        scrivi_json(self.p, self.d)


# ── 1 · quali fotogrammi sono la lezione, e dov'è il video ──
def fascia(im, box):
    """La barra di Teams sopra il riquadro del video, piccola e in grigio: uguale in tutti i fotogrammi della lezione."""
    x0, y0, x1, _ = box
    alto = max(y0 - 62, 0)
    if y0 - alto < 20:
        return None
    return cv2.resize(cv2.cvtColor(im[alto:y0 - 10, x0:x1], cv2.COLOR_BGR2GRAY), (160, 12), interpolation=cv2.INTER_AREA).astype(np.int16)


def passo_lezione(cart, av, rifai):
    frames = leggi_jsonl(cart / 'frames.jsonl')
    lav = {} if rifai else (leggi_json(cart / 'lavagna.json', {}) or {})
    fot = lav.setdefault('fotogrammi', {})
    da_vedere = [f for f in frames if f['file'] not in fot]
    trovati = {}
    for i, f in enumerate(da_vedere):
        av.dice('lezione', i, len(da_vedere) * 2)
        if 'box' in f or 'misura' in f:  # registrazione nuova: la finestra era quella della lezione, il riquadro è già scritto
            fot[f['file']] = {'box': f.get('box'), 'fuori': bool(f.get('fuori'))}
            continue
        im = leggi_immagine(cart / f['file'])
        if im is None:
            fot[f['file']] = {'box': None, 'fuori': True}
            continue
        trovati[f['file']] = cattura.riquadro(im)
    if trovati:
        # il riquadro di riferimento è il più frequente; la sua barra di Teams fa da impronta
        comuni = Counter(tuple(b) for b in trovati.values() if b)
        rif = list(comuni.most_common(1)[0][0]) if comuni else None
        impronta, campioni = None, []
        if rif:
            for nome, b in trovati.items():
                if b and abs(b[0] - rif[0]) < 6 and abs(b[1] - rif[1]) < 6 and len(campioni) < 12:
                    z = fascia(leggi_immagine(cart / nome), rif)
                    if z is not None:
                        campioni.append(z)
            impronta = np.median(campioni, axis=0) if campioni else None
        ultimo = rif
        for i, (nome, b) in enumerate(trovati.items()):
            av.dice('lezione', len(da_vedere) + i, len(da_vedere) * 2)
            if b:
                ultimo = b
                fot[nome] = {'box': b, 'fuori': False}
                continue
            dentro = False
            if impronta is not None:  # senza cornice viola: se la barra di Teams è al suo posto, è ancora la lezione
                z = fascia(leggi_immagine(cart / nome), rif)
                dentro = z is not None and float(np.abs(z - impronta).mean()) < 14
            fot[nome] = {'box': ultimo if dentro else None, 'fuori': not dentro}
    lav['fuori'] = sum(1 for v in fot.values() if v['fuori'])
    lav['lezione'] = len(fot) - lav['fuori']
    scrivi_json(cart / 'lavagna.json', lav)
    av.finito('lezione', lezione=lav['lezione'], fuori=lav['fuori'])
    return lav


def ritaglio(im, box):
    if not box:
        return im
    x0, y0, x1, y1 = box
    r = im[max(y0, 0):y1, max(x0, 0):x1]
    return r if r.size else im


def buoni(cart):
    """I fotogrammi della lezione in ordine di tempo, col loro riquadro."""
    fot = (leggi_json(cart / 'lavagna.json', {}) or {}).get('fotogrammi', {})
    return [(f, fot.get(f['file'], {}).get('box')) for f in leggi_jsonl(cart / 'frames.jsonl')
            if not fot.get(f['file'], {}).get('fuori')]


# ── 2 · le miniature ──
def passo_miniature(cart, av, rifai):
    lista, fatte = buoni(cart), 0
    for i, (f, box) in enumerate(lista):
        av.dice('miniature', i, len(lista))
        dest = cart / 'miniature' / (Path(f['file']).stem + '.webp')
        if dest.exists() and not rifai:
            continue
        im = leggi_immagine(cart / f['file'])
        if im is None:
            continue
        r = ritaglio(im, box)
        scrivi_immagine(dest, cv2.resize(r, (480, max(1, round(r.shape[0] * 480 / r.shape[1]))), interpolation=cv2.INTER_AREA), 72)
        fatte += 1
    av.finito('miniature', nuove=fatte, totale=len(lista))


# ── 3 · la lavagna senza la persona davanti ──
class Persone:
    """Dov'è una persona nell'immagine (maschera vero/falso). rvm: Robust Video Matting; birefnet: BiRefNet lite."""

    def __init__(self, quale, gpu):
        self.quale = quale
        p = MODELLI / FILE_SFONDO[quale]
        if not p.exists():
            raise SystemExit(f'manca il modello {p.name}: si scarica dalla regia (Modelli) o con «python modelli.py scarica {quale}»')
        self.s = sessione_onnx(p, gpu=gpu and quale == 'birefnet', fili=4)
        self.zero = np.zeros((1, 1, 1, 1), np.float32)

    def maschera(self, im):
        h, w = im.shape[:2]
        if self.quale == 'rvm':
            x = (im[..., ::-1].astype(np.float32) / 255).transpose(2, 0, 1)[None]
            rapporto = np.array([min(1.0, 400 / max(h, w))], np.float32)  # il modello lavora a ~400 px di lato
            _, pha, *_ = self.s.run(None, {'src': x, 'r1i': self.zero, 'r2i': self.zero, 'r3i': self.zero, 'r4i': self.zero,
                                            'downsample_ratio': rapporto})
            return pha[0, 0] > 0.3
        x = cv2.resize(im, (1024, 1024), interpolation=cv2.INTER_AREA)[..., ::-1].astype(np.float32) / 255
        x = ((x - (0.485, 0.456, 0.406)) / (0.229, 0.224, 0.225)).transpose(2, 0, 1)[None].astype(np.float32)
        y = self.s.run(None, {self.s.get_inputs()[0].name: x})[-1][0, 0]
        return cv2.resize(1 / (1 + np.exp(-y)), (w, h)) > 0.5


def nitida(im):
    """La lavagna come una scansione: la luce spianata (via le ombre e i riflessi larghi), il tratto più scuro."""
    grigio = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    k = max(31, (im.shape[1] // 14) | 1)
    fondo = cv2.GaussianBlur(cv2.morphologyEx(grigio, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k // 2 | 1, k // 2 | 1))), (k, k), 0)
    fondo = np.maximum(fondo.astype(np.float32), 40)
    piatta = np.clip(im.astype(np.float32) / fondo[..., None] * 232, 0, 255)
    sfocata = cv2.GaussianBlur(piatta, (0, 0), 1.6)
    return np.clip(piatta + 0.9 * (piatta - sfocata), 0, 255).astype(np.uint8)


def passo_pulita(cart, av, rifai, sfondo, gpu):
    lista = buoni(cart)
    if not lista:
        av.finito('pulita', fotogrammi=0)
        return
    lav = leggi_json(cart / 'lavagna.json', {}) or {}
    fot = lav.setdefault('fotogrammi', {})
    misure = Counter((b[2] - b[0], b[3] - b[1]) for _, b in lista if b)
    if not rifai and all((cart / 'pulita' / (Path(f['file']).stem + '.webp')).exists() for f, _ in lista):
        av.finito('pulita', fotogrammi=len(lista), gia=True)
        return
    persone = Persone(sfondo, gpu)
    W, H = misure.most_common(1)[0][0] if misure else (0, 0)
    tela = quando = None  # la lavagna messa insieme fin qui, e per ogni punto il secondo in cui si è vista l'ultima volta
    coperture, ripartenze = [], 0
    for i, (f, box) in enumerate(lista):
        av.dice('pulita', i, len(lista))
        im = leggi_immagine(cart / f['file'])
        if im is None:
            continue
        r = ritaglio(im, box)
        if not W:
            H, W = r.shape[:2]
        if r.shape[:2] != (H, W):
            r = cv2.resize(r, (W, H), interpolation=cv2.INTER_AREA)
        m = persone.maschera(r)
        # la maschera si allarga un po': i bordi della persona, l'ombra sulla lavagna, il braccio che si muove
        m = cv2.dilate(m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (W // 40 | 1, W // 40 | 1))) > 0
        coperto = float(m.mean())
        if tela is not None:
            libero = ~m & (quando > -1e8)
            diversi = (np.abs(r.astype(np.int16) - tela.astype(np.int16)).max(axis=2) > 45) & libero
            parte = diversi.sum() / max(1, libero.sum())
            if parte > 0.30:  # un'altra inquadratura: si ricomincia
                tela = None
                ripartenze += 1
            elif parte > 0.03:  # la lavagna è cambiata molto (cancellata): quello che c'era dietro la persona non vale più
                quando[m] = -1e9
        if tela is None:
            tela, quando = r.copy(), np.where(m, -1e9, f['t']).astype(np.float32)
        else:
            tela[~m] = r[~m]
            quando[~m] = f['t']
        pulita = tela.copy()
        # dietro la persona resta la lavagna dell'ultima volta che si è vista, se è stata vista da poco: dove non
        # si è mai vista, o è passato troppo (MEMORIA_S), resta la persona — meglio lei che una lavagna vecchia
        mai = m & (f['t'] - quando > MEMORIA_S)
        pulita[mai] = r[mai]
        nome = Path(f['file']).stem + '.webp'
        scrivi_immagine(cart / 'pulita' / nome, pulita, 84)
        scrivi_immagine(cart / 'nitida' / nome, nitida(pulita), 84)
        fot.setdefault(f['file'], {'box': box, 'fuori': False}).update(coperto=round(coperto, 3), mai=round(float(mai.mean()), 3))
        coperture.append(coperto)
    lav['sfondo'] = persone.quale
    scrivi_json(cart / 'lavagna.json', lav)
    av.finito('pulita', fotogrammi=len(lista), modello=persone.quale, coperto_medio=round(float(np.mean(coperture or [0])), 3),
              ripartenze=ripartenze)


# ── 4 · l'audio: un file solo, piccolo; e la copia pulita per le orecchie ──
def ffmpeg(args, av=None, passo='', durata=0):
    """Lancia ffmpeg a bassa priorità e segue l'avanzamento dal tempo scritto in uscita."""
    p = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-progress', 'pipe:1', *args],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace',
                         creationflags=0x08000000 | 0x4000)  # senza finestra, sotto la priorità normale
    for riga in p.stdout:
        if riga.startswith('out_time_us=') and av and durata:
            try:
                av.dice(passo, round(int(riga.split('=')[1]) / 1e6), round(durata))
            except ValueError:
                pass
    err = p.stderr.read()
    if p.wait() != 0:
        raise RuntimeError('ffmpeg: ' + err.strip()[-400:])


def durata_di(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)],
                       capture_output=True, text=True, creationflags=0x08000000)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def passo_audio(cart, av, rifai):
    """I pezzi WAV in un solo audio.opus. Ogni pezzo vale CHUNK_S secondi esatti sull'orologio della lezione: uno
    più corto (una ripartenza del registratore) si allunga col silenzio, così il secondo 3600 dell'Opus è il
    secondo 3600 dei fotogrammi e della trascrizione."""
    dest = cart / 'audio.opus'
    pezzi = sorted((cart / 'audio').glob('c_*.wav'))
    if not pezzi:
        av.finito('audio', **({'gia': True, 'durata': round(durata_di(dest))} if dest.exists() else {'pezzi': 0}))
        return
    with wave.open(str(pezzi[0])) as w:
        rate = w.getframerate()
    with wave.open(str(pezzi[-1])) as w:
        coda = w.getnframes() / w.getframerate()
    durata = (len(pezzi) - 1) * CHUNK_S + coda
    if dest.exists() and not rifai and abs(durata_di(dest) - durata) < 2:
        av.finito('audio', gia=True, durata=round(durata_di(dest)))
        return
    tmp = cart / 'audio.tmp.opus'
    p = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', 'pipe:0',
                          '-c:a', 'libopus', '-b:a', '40k', '-application', 'voip', '-frame_duration', '60', '-f', 'opus', str(tmp)],
                         stdin=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=0x08000000 | 0x4000)
    try:
        for i, f in enumerate(pezzi):
            av.dice('audio', i, len(pezzi))
            with wave.open(str(f)) as w:
                x = w.readframes(w.getnframes()) if w.getframerate() == rate else b''
            giusto = CHUNK_S * rate * 2
            if i < len(pezzi) - 1:
                x = x[:giusto] + bytes(max(0, giusto - len(x)))
            p.stdin.write(x)
        p.stdin.close()
    except (BrokenPipeError, OSError):
        pass
    err = p.stderr.read().decode('utf-8', 'replace')
    if p.wait() != 0:
        tmp.unlink(missing_ok=True)
        raise RuntimeError('ffmpeg: ' + err.strip()[-400:])
    vera = durata_di(tmp)
    if abs(vera - durata) > 2:  # non combacia: i WAV restano l'unica copia buona
        tmp.unlink(missing_ok=True)
        raise RuntimeError(f'audio.opus dura {vera:.0f} s, i pezzi {durata:.0f} s: non lo tengo')
    tmp.replace(dest)
    wav = sum(f.stat().st_size for f in pezzi)
    av.finito('audio', pezzi=len(pezzi), durata=round(vera), wav_mb=round(wav / 1e6), opus_mb=round(dest.stat().st_size / 1e6, 1))


def passo_ascolto(cart, av, rifai):
    dest, origine = cart / 'ascolto.opus', cart / 'audio.opus'
    if dest.exists() and not rifai:
        av.finito('ascolto', gia=True)
        return
    if not origine.exists():
        av.finito('ascolto', saltato='manca audio.opus')
        return
    durata = durata_di(origine)
    tmp = cart / 'ascolto.tmp.opus'
    filtri = 'highpass=f=80,afftdn=nr=14:nf=-40:tn=1,loudnorm=I=-18:TP=-2:LRA=11'
    ffmpeg(['-i', str(origine), '-af', filtri, '-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', '40k',
            '-application', 'voip', '-f', 'opus', str(tmp)], av, 'ascolto', durata)
    tmp.replace(dest)
    av.finito('ascolto', durata=round(durata_di(dest)), filtri=filtri)


def passo_picchi(cart, av, rifai):
    dest = cart / 'picchi.json'
    if dest.exists() and not rifai:
        av.finito('picchi', gia=True)
        return
    pezzi = sorted((cart / 'audio').glob('c_*.wav'))
    v = []
    if pezzi:
        for i, p in enumerate(pezzi):
            av.dice('picchi', i, len(pezzi))
            with wave.open(str(p)) as w:
                rate = w.getframerate()
                x = np.abs(np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.int32))
            v += [int(x[s:s + rate].max()) if len(x[s:s + rate]) else 0 for s in range(0, max(len(x), 1), rate)][:CHUNK_S]
    elif (cart / 'audio.opus').exists():  # i WAV non ci sono più: dal file archiviato, a 8 kHz
        r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(cart / 'audio.opus'), '-ac', '1', '-ar', '8000',
                            '-f', 's16le', '-'], capture_output=True, creationflags=0x08000000 | 0x4000)
        x = np.abs(np.frombuffer(r.stdout, np.int16).astype(np.int32))
        v = [int(x[s:s + 8000].max()) for s in range(0, len(x), 8000)]
    # in decibel, da 0 (silenzio, −60 dB) a 100 (pieno)
    db = [max(0, min(100, round((20 * np.log10(max(a, 1) / 32768) + 60) / 60 * 100))) for a in v]
    dest.write_text(json.dumps({'passo_s': 1, 'livelli': db}), encoding='utf-8')
    av.finito('picchi', secondi=len(db))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--passi', default=','.join(PASSI))
    ap.add_argument('--sfondo', default='rvm', choices=tuple(FILE_SFONDO))
    ap.add_argument('--gpu', action='store_true', help='BiRefNet sulla scheda video (le riempie la memoria: solo a PC fermo)')
    ap.add_argument('--rifai', action='store_true')
    a = ap.parse_args()
    cart = Path(a.cartella)
    passi = [p for p in a.passi.split(',') if p in PASSI]
    a_bassa_priorita()
    scrivi_pid(cart, 'sviluppa')
    av = Avanzamento(cart, passi)
    try:
        if 'lezione' in passi or not (cart / 'lavagna.json').exists():
            passo_lezione(cart, av, a.rifai)
        if 'miniature' in passi:
            passo_miniature(cart, av, a.rifai)
        if 'pulita' in passi:
            passo_pulita(cart, av, a.rifai, a.sfondo, a.gpu)
        if 'picchi' in passi:
            passo_picchi(cart, av, a.rifai)
        if 'audio' in passi:
            passo_audio(cart, av, a.rifai)
        if 'ascolto' in passi:
            passo_ascolto(cart, av, a.rifai)
    except SystemExit as e:
        av.chiudi(str(e))
        raise
    except Exception as e:
        av.chiudi(f'{type(e).__name__}: {e}')
        raise
    av.chiudi()


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
