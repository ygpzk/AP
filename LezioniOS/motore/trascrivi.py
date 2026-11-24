"""Trascrive l'audio della lezione mentre viene registrato, con i tempi parola per parola.

    python trascrivi.py <cartella_lezione> [--motore whisper-large-v3] [--lingua it]
                        [--materia "analisi matematica"] [--lessico "derivata, limite, Landau"]

Legge audio/c_*.wav, scrive trascrizione.jsonl (tempi in secondi dall'inizio della
registrazione, gli stessi dei fotogrammi) e rigenera grezzo.md dopo ogni passata.
Ogni finestra lascia fuori gli ultimi secondi, che rientrano nella successiva: così
nessuna frase viene tagliata a metà. Finisce quando c'è il file FINE e l'audio è tutto
trascritto. Riparte da dove era rimasto se viene rilanciato; per fermarlo pulito fra
una passata e l'altra si crea il file FERMA_TRASCRIZIONE nella cartella della lezione.

I motori (provati il 24.11.2026 su tre minuti di una lezione vera di Analisi, RTX 3060 Ti):
  whisper-large-v3        il più preciso in italiano, prende anche le domande degli studenti;
                          sulla scheda video, ~3 GB di memoria video
  whisper-large-v3-turbo  lo stesso orecchio con un decodificatore più corto: più svelto, ~1,5 GB
  parakeet-v3             NVIDIA Parakeet TDT 0.6B v3 con ONNX Runtime: 11× il tempo reale sulla sola
                          CPU (la scheda video resta libera), 36–56× sulla GPU; in aula sbaglia di più
                          e sui rumori scivola in altre lingue: per quando il PC serve ad altro
  auto                    whisper-large-v3 se c'è la scheda video, se no whisper small sulla CPU
Il lessico della materia (orario.json) va a Whisper in testa al contesto: «Landau», «x con zero».
"""
import argparse
import importlib
import re
import time
import wave
from pathlib import Path

import numpy as np

from comune import CHUNK_S, aggiungi_jsonl, cuda_dll, leggi_json, scrivi_json, scrivi_pid
import componi

cuda_dll()

FINESTRA_MIN, FINESTRA_MAX, MARGINE = 25, 240, 6
ALLUCINAZIONI = ('amara.org', 'sottotitoli creati', 'sottotitoli e revisione', 'qtss', 'grazie per la visione',
                 'grazie per aver seguito', 'iscriviti al canale', 'thanks for watching', 'subtitles by')
SOLO_SUL_SILENZIO = ('grazie.', 'grazie', 'grazie a tutti.')  # vere solo se c'è voce: sul silenzio sono inventate
# quello che Parakeet scrive sui rumori dell'aula (sedie, colpi, brusio): una parolina in un'altra lingua
VERSI = {'yeah', 'yes', 'yep', 'uh', 'uhm', 'um', 'mm', 'mmm', 'hm', 'hmm', 'oh', 'ah', 'eh', 'ok', 'okay', 'so', 'bye', 'thank', 'you', 'thanks'}
INGLESE = re.compile(r"^(it'?s|i'?m|i |we |you |that'?s|there'?s|what'?s|let'?s)", re.I)


def rumore(testo):
    """Solo versi («Yeah. Yeah.»), o una frasetta in inglese: non l'ha detto nessuno."""
    parole = re.findall(r"[a-zà-ù']+", testo.lower())
    return not parole or all(w in VERSI for w in parole) or (len(parole) <= 6 and bool(INGLESE.match(testo.strip())))


def a_frasi(f):
    """Una frase troppo lunga (Whisper a volte non mette un punto per un minuto) torna tante frasi, tagliata
    ai punti fermi con i tempi delle sue parole: in galleria la voce si segue frase per frase."""
    parole = f['parole']
    if len(parole) < 28 and f['t1'] - f['t0'] < 20:
        return [f]
    pezzi, da = [], 0
    for i, w in enumerate(parole):
        fine_frase = w[0].rstrip().endswith(('.', '?', '!')) and i - da >= 5
        pausa = i + 1 < len(parole) and parole[i + 1][1] - w[2] > 0.9 and i - da >= 8
        if (fine_frase or pausa or i - da >= 45) and len(parole) - i > 4:
            pezzi.append(parole[da:i + 1])
            da = i + 1
    pezzi.append(parole[da:])
    return [{**f, 't0': p[0][1], 't1': p[-1][2], 'parole': p, 'testo': ''.join(w[0] for w in p).strip()} for p in pezzi if p]


def prompt(materia):
    """L'inizio del contesto: dice a Whisper che lessico aspettarsi."""
    m = f' di {materia}' if materia else ''
    return f'Lezione universitaria{m}: definizioni, teoremi, dimostrazioni, formule ed esercizi.'


def durata_pezzo(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


def a_16k(p):
    """WAV mono int16 → float32 a 16 kHz."""
    with wave.open(str(p)) as w:
        rate = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    if rate == 16000:
        return x
    if rate % 16000 == 0:  # passa-basso a 7,6 kHz (sinc finestrato) e decimazione
        f = rate // 16000
        k = np.arange(-48, 49)
        h = np.sinc(2 * 7600 / rate * k) * np.hamming(len(k))
        return np.convolve(x, h / h.sum(), mode='same')[::f].astype(np.float32)
    return np.interp(np.arange(0, len(x), rate / 16000), np.arange(len(x)), x).astype(np.float32)


def carica(pezzi, da, a):
    """Audio a 16 kHz fra i secondi da e a."""
    i0, i1 = int(da // CHUNK_S), int(np.ceil(a / CHUNK_S))
    x = np.concatenate([a_16k(p) for p in pezzi[i0:i1]])
    s = int((da - i0 * CHUNK_S) * 16000)
    return x[s:s + int((a - da) * 16000)]


def spezza(parole, taglio):
    """Le parole finite prima del taglio, chiudendo alla pausa più lunga degli ultimi 8 s."""
    dentro = [i for i, w in enumerate(parole) if w[2] <= taglio]
    if not dentro:
        return []
    cand = [i for i in dentro if parole[i][2] >= taglio - 8] or dentro[-1:]
    i = max(cand, key=lambda i: parole[i + 1][1] - parole[i][2] if i + 1 < len(parole) else 0)
    return parole[:i + 1]


# ── i motori: ognuno dà una lista di frasi {t0, t1, testo, parole: [[parola, da, a]], sicura} coi tempi
#    relativi all'inizio dell'audio passato ──
class Whisper:
    def __init__(self, nome, dispositivo):
        import ctranslate2
        from faster_whisper import WhisperModel
        gpu = dispositivo != 'cpu' and ctranslate2.get_cuda_device_count() > 0
        self.modello = None
        if gpu:
            try:
                self.modello = WhisperModel(nome, device='cuda', compute_type='int8_float16')
            except Exception as e:  # driver vecchio, memoria piena: si va avanti sulla CPU
                print('GPU non utilizzabile, passo alla CPU:', e, flush=True)
                gpu = False
        if self.modello is None:
            nome = nome if dispositivo == 'cpu' and nome != 'large-v3' else 'small'  # large-v3 sulla CPU non tiene il passo
            self.modello = WhisperModel(nome, device='cpu', compute_type='int8')
        self.nome = f'Whisper {nome} ({"GPU" if gpu else "CPU"})'

    def trascrivi(self, x, lingua, contesto, lessico):
        segs, info = self.modello.transcribe(
            x, language=lingua, beam_size=5, word_timestamps=True, vad_filter=True,
            vad_parameters={'min_silence_duration_ms': 500}, condition_on_previous_text=False,
            initial_prompt=(f'Lessico: {lessico[:420]}. ' if lessico else '') + contesto[-220:])
        frasi = []
        for s in segs:
            frasi += a_frasi({'t0': s.start, 't1': s.end, 'testo': s.text.strip(),
                              'parole': [[w.word, w.start, w.end] for w in (s.words or [])],
                              'sicura': not (s.no_speech_prob > 0.6 and s.avg_logprob < -1), 'silenzio': s.no_speech_prob})
        return frasi, (info.language if info.language_probability > 0.7 else None)


class Parakeet:
    def __init__(self, dispositivo):
        import onnx_asr
        import onnxruntime as ort
        ort.set_default_logger_severity(3)
        gpu = dispositivo == 'gpu' and 'CUDAExecutionProvider' in ort.get_available_providers()
        if gpu:
            try:
                ort.preload_dlls()
            except Exception:
                pass
        o = ort.SessionOptions()
        o.intra_op_num_threads = 4  # sulla CPU non più di quattro fili: il PC resta usabile
        modello = onnx_asr.load_model('nemo-parakeet-tdt-0.6b-v3', quantization=None if gpu else 'int8', sess_options=o,
                                      providers=(['CUDAExecutionProvider'] if gpu else []) + ['CPUExecutionProvider'])
        vad = onnx_asr.load_vad('silero', providers=['CPUExecutionProvider'])
        self.modello = modello.with_vad(vad).with_timestamps()
        self.nome = f'Parakeet TDT 0.6B v3 ({"GPU" if gpu else "CPU"})'

    def trascrivi(self, x, lingua, contesto, lessico):
        frasi = []
        for r in self.modello.recognize(x, sample_rate=16000):
            testo = (r.text or '').strip()
            if not testo:
                continue
            parole = []  # i pezzi di parola tornano parole: un pezzo che comincia con lo spazio ne apre una
            for pezzo, t in zip(r.tokens or [], r.timestamps or []):
                if pezzo.startswith(' ') or not parole:
                    parole.append([pezzo, r.start + t, r.start + t + 0.08])
                else:
                    parole[-1][0] += pezzo
                    parole[-1][2] = r.start + t + 0.08
            for i in range(len(parole) - 1):
                parole[i][2] = max(parole[i][2], min(parole[i + 1][1], parole[i][2] + 0.6))
            frasi.append({'t0': r.start, 't1': r.end, 'testo': testo, 'parole': parole,
                          'sicura': not (rumore(testo) or r.end - r.start < 0.5), 'silenzio': 0})
        return frasi, None


def carica_motore(motore, dispositivo):
    if motore.startswith('parakeet'):
        return Parakeet(dispositivo)
    nome = {'auto': 'large-v3', 'whisper-large-v3': 'large-v3', 'whisper-large-v3-turbo': 'large-v3-turbo',
            'whisper-small': 'small', 'whisper-medium': 'medium'}.get(motore, motore)
    return Whisper(nome, dispositivo)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--lingua', default=None, help='it, en, ... (vuoto: la riconosce dalla prima voce)')
    ap.add_argument('--motore', '--modello', default='auto', help='auto, whisper-large-v3, whisper-large-v3-turbo, parakeet-v3')
    ap.add_argument('--dispositivo', default='auto', choices=('auto', 'gpu', 'cpu'))
    ap.add_argument('--materia', default='', help='es. «analisi matematica»: aiuta coi termini')
    ap.add_argument('--lessico', default='', help='le parole della materia, separate da virgole')
    a = ap.parse_args()
    cart = Path(a.cartella)
    scrivi_pid(cart, 'trascrivi')
    p_stato = cart / 'trascrizione_stato.json'
    st = leggi_json(p_stato, None) or {'fatto_s': 0.0, 'lingua': a.lingua, 'coda': prompt(a.materia)}
    st['lingua'] = a.lingua or st.get('lingua')
    st['coda'] = re.sub(r'(\s*Grazie\.?)+', ' ', st.get('coda') or prompt(a.materia))  # ripulisce un contesto già inquinato
    ultimo = ''

    motore = carica_motore(a.motore, a.dispositivo)
    st['motore'] = motore.nome  # componi.py lo scrive in testa al grezzo
    scrivi_json(p_stato, st)
    print('motore pronto:', st['motore'], flush=True)

    riprova_da = 0  # dopo una frase rimasta aperta si aspetta altro audio prima di rifare la finestra
    while True:
        if (cart / 'FERMA_TRASCRIZIONE').exists():  # per riavviarlo fra una passata e l'altra
            (cart / 'FERMA_TRASCRIZIONE').unlink()
            print('fermato su richiesta', flush=True)
            return
        fine = (cart / 'FINE').exists()
        pezzi = sorted((cart / 'audio').glob('c_*.wav'))
        if not pezzi:
            if fine:
                break
            time.sleep(3)
            continue
        disp = (len(pezzi) - 1) * CHUNK_S + (durata_pezzo(pezzi[-1]) if fine else CHUNK_S)
        fatto = st['fatto_s']
        if disp - fatto < (FINESTRA_MIN if not fine else 0.5) or (disp < riprova_da and not fine):
            if fine:
                break
            time.sleep(3)
            continue

        fino = min(disp, fatto + FINESTRA_MAX)
        ultima = fine and fino >= disp
        x = carica(pezzi, fatto, fino)
        t = time.perf_counter()
        frasi, lingua = motore.trascrivi(x, st['lingua'], st['coda'], a.lessico)
        if not st['lingua'] and frasi and lingua:
            st['lingua'] = lingua
            print('lingua:', lingua, flush=True)

        taglio = (fino - fatto) - MARGINE
        # le frasi finite prima del taglio intere, quella a cavallo fino alla pausa migliore: così anche
        # quando la prof parla di fila la voce non resta indietro
        tieni = [f for f in frasi if ultima or f['t1'] <= taglio]
        aperta = None if ultima else next((f for f in frasi if f['t0'] < taglio < f['t1']), None)
        spezzata = False
        if aperta:
            parole = spezza(aperta['parole'], taglio)
            if parole:
                tieni.append({**aperta, 'parole': parole, 'testo': ''.join(w[0] for w in parole).strip(), 't1': parole[-1][2]})
                spezzata = True
        if tieni:
            nuovo = fatto + (tieni[-1]['parole'][-1][2] if tieni[-1]['parole'] else tieni[-1]['t1'])
        elif frasi:
            nuovo = fatto  # nessuna parola sicura prima del taglio: si riprova con più audio
            riprova_da = fino + CHUNK_S
        else:
            nuovo = fino if ultima else max(fatto, fino - MARGINE)  # silenzio

        for f in tieni:
            testo, parole = f['testo'], f['parole']
            if not testo or not f['sicura'] or any(h in testo.lower() for h in ALLUCINAZIONI):
                continue
            if testo.lower() in SOLO_SUL_SILENZIO and (f['silenzio'] > 0.2 or testo.lower() == ultimo):
                continue  # su rumore (cancellino, sedie) Whisper ripete «Grazie.» a catena
            ultimo = testo.lower()
            aggiungi_jsonl(cart / 'trascrizione.jsonl', {
                't0': round(fatto + (parole[0][1] if parole else f['t0']), 2),
                't1': round(fatto + (parole[-1][2] if parole else f['t1']), 2), 'testo': testo,
                'parole': [[w[0].strip(), round(fatto + w[1], 2), round(fatto + w[2], 2)] for w in parole]})
            if testo.lower() not in SOLO_SUL_SILENZIO:  # il contesto non deve suggerire altri «Grazie»
                st['coda'] = (st['coda'] + ' ' + testo)[-600:]
        st['fatto_s'] = round(nuovo, 2)
        st['calcolo'] = round((fino - fatto) / max(time.perf_counter() - t, 0.01), 1)  # quante volte il tempo reale
        scrivi_json(p_stato, st)
        print(f'{fatto:7.1f}-{fino:7.1f}s  {len(tieni)}/{len(frasi)} frasi{" (una spezzata)" if spezzata else ""}  '
              f'{time.perf_counter() - t:4.1f}s di calcolo', flush=True)
        try:  # ricaricato: il formato si può ritoccare a lezione in corso; un suo errore non ferma la trascrizione
            importlib.reload(componi).componi(cart)
        except Exception as e:
            print('grezzo.md non aggiornato:', e, flush=True)
        if ultima:
            break
    st['finita'] = True
    scrivi_json(p_stato, st)
    componi.componi(cart)
    print('trascrizione finita', flush=True)


if __name__ == '__main__':
    main()
