"""Cose condivise dal motore di Lezioni OS: cartelle, tempi, file JSON scritti a metà, immagini, GPU."""
import json
import os
import sys
import time
from pathlib import Path

CHUNK_S = 10  # secondi per pezzo audio: il pezzo k comincia a k*CHUNK_S

QUI = Path(__file__).resolve().parent
RADICE = QUI.parent  # la cartella di Lezioni OS (server.mjs, config.json, orario.json)
# l'ambiente Python, i modelli scaricati e la lezione in corso: fuori dal codice, così la cartella
# di Lezioni OS si può aggiornare senza reinstallare niente
CASA = Path(os.environ.get('LOCALAPPDATA') or Path.home() / 'AppData' / 'Local') / 'Lezioni'
MODELLI = CASA / 'modelli'


def leggi_json(p, vuoto=None):
    try:
        return json.loads(Path(p).read_text(encoding='utf-8-sig'))  # -sig: regge anche i file scritti da PowerShell
    except (FileNotFoundError, json.JSONDecodeError, PermissionError):
        return vuoto


def configurazione():
    """config.json di Lezioni OS, con sopra config.locale.json (le cose di questo PC)."""
    return {**(leggi_json(RADICE / 'config.json', {}) or {}), **(leggi_json(RADICE / 'config.locale.json', {}) or {})}


def cartella_lezioni():
    """Dove stanno le lezioni: config.json → cartella, poi LEZIONI_DIR, altrimenti Documenti\\Lezioni."""
    c = configurazione().get('cartella') or os.environ.get('LEZIONI_DIR')
    if c:
        return Path(c)
    try:  # la cartella Documenti vera, anche se spostata (OneDrive, altro disco)
        import ctypes.wintypes
        buf = ctypes.create_unicode_buffer(ctypes.wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buf)  # CSIDL_PERSONAL
        if buf.value:
            return Path(buf.value) / 'Lezioni'
    except (AttributeError, OSError):
        pass
    return Path.home() / 'Documents' / 'Lezioni'


def lezione_corrente():
    p = CASA / 'corrente.txt'
    return Path(p.read_text(encoding='utf-8-sig').strip()) if p.exists() else None


def hms(t):
    t = int(t)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m:02d}:{s:02d}'


def scrivi_json(p, d):
    tmp = Path(f'{p}.{os.getpid()}.tmp')
    tmp.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8')
    for _ in range(40):  # su Windows il replace fallisce se un lettore ha il file aperto
        try:
            os.replace(tmp, p)
            return
        except PermissionError:
            time.sleep(0.05)
    tmp.unlink(missing_ok=True)


def leggi_jsonl(p):
    p = Path(p)
    if not p.exists():
        return []
    out = []
    for riga in p.read_text(encoding='utf-8').splitlines():
        if riga.strip():
            try:
                out.append(json.loads(riga))
            except json.JSONDecodeError:
                pass  # riga a metà mentre l'altro processo scrive
    return out


def aggiungi_jsonl(p, d):
    with open(p, 'a', encoding='utf-8') as f:
        f.write(json.dumps(d, ensure_ascii=False) + '\n')


def scrivi_pid(cart, nome):
    """Il numero del processo in log/<nome>.pid: il server vede se è vivo e lo rilancia se cade."""
    (Path(cart) / 'log').mkdir(parents=True, exist_ok=True)
    (Path(cart) / 'log' / f'{nome}.pid').write_text(str(os.getpid()), encoding='utf-8')


def a_bassa_priorita():
    """Il lavoro di dopo la lezione non deve rubare il PC a chi lo sta usando."""
    try:
        import ctypes
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)  # BELOW_NORMAL
    except (AttributeError, OSError):
        pass


# ── immagini: OpenCV su Windows non apre i percorsi con le accentate («università»), si passa dai byte ──
def leggi_immagine(p):
    import cv2
    import numpy as np
    try:
        return cv2.imdecode(np.fromfile(str(p), np.uint8), cv2.IMREAD_COLOR)
    except (OSError, ValueError):
        return None


def scrivi_immagine(p, im, qualita=90):
    import cv2
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    est = p.suffix.lower()
    par = [cv2.IMWRITE_WEBP_QUALITY, qualita] if est == '.webp' else [cv2.IMWRITE_JPEG_QUALITY, qualita] if est in ('.jpg', '.jpeg') else []
    ok, buf = cv2.imencode(est, im, par)
    if not ok:
        return False
    tmp = p.with_name(p.name + f'.{os.getpid()}.tmp')
    buf.tofile(str(tmp))
    for _ in range(40):
        try:
            os.replace(tmp, p)
            return True
        except PermissionError:
            time.sleep(0.05)
    tmp.unlink(missing_ok=True)
    return False


# ── la lettura della lavagna (ocr/*.json): chi ha già letto cosa ──
def fotogrammi_letti(cart):
    """I fotogrammi che hanno già la lettura della lavagna (in ocr/*.json)."""
    fatti = set()
    for p in (Path(cart) / 'ocr').glob('*.json'):
        fatti |= {d['frame'] for d in leggi_json(p, []) or []}
    return fatti


def da_fare(cart):
    """I fotogrammi della lezione ancora senza lettura della lavagna, in ordine di tempo
    (quelli segnati «fuori»: un'altra scheda, un'altra finestra, non si leggono)."""
    fatti = fotogrammi_letti(cart)
    fot = (leggi_json(Path(cart) / 'lavagna.json', {}) or {}).get('fotogrammi', {})  # scritto da sviluppa.py
    return [f for f in leggi_jsonl(Path(cart) / 'frames.jsonl')
            if f['file'] not in fatti and not f.get('fuori') and not fot.get(f['file'], {}).get('fuori')]


def prossimo_ocr(cart):
    """Il nome libero per il prossimo blocco di letture: ocr/ocr_NNN.json."""
    (Path(cart) / 'ocr').mkdir(exist_ok=True)
    n = [int(p.stem.split('_')[-1]) for p in (Path(cart) / 'ocr').glob('ocr_*.json') if p.stem.split('_')[-1].isdigit()]
    return Path(cart) / 'ocr' / f'ocr_{(max(n) + 1) if n else 0:03d}.json'


# ── la scheda video ──
def cuda_dll():
    """cuBLAS, cuDNN e le altre arrivano dai pacchetti pip nvidia-*: ctranslate2 e ONNX Runtime le cercano nel PATH."""
    base = Path(sys.prefix) / 'Lib' / 'site-packages' / 'nvidia'
    for d in base.glob('*/bin'):
        if d.is_dir():
            os.add_dll_directory(str(d))
            if str(d) not in os.environ.get('PATH', ''):
                os.environ['PATH'] = str(d) + os.pathsep + os.environ.get('PATH', '')


def sessione_onnx(percorso, gpu=False, fili=4):
    """Una sessione ONNX Runtime: sulla CPU (pochi fili: il PC deve restare leggero) o, se chiesto e
    c'è, sulla scheda video, con la memoria tenuta stretta."""
    import onnxruntime as ort
    ort.set_default_logger_severity(3)
    o = ort.SessionOptions()
    o.intra_op_num_threads = fili
    fornitori = ['CPUExecutionProvider']
    if gpu and 'CUDAExecutionProvider' in ort.get_available_providers():
        cuda_dll()
        try:
            ort.preload_dlls()
        except Exception:  # versioni vecchie: basta il PATH
            pass
        fornitori.insert(0, ('CUDAExecutionProvider', {'cudnn_conv_algo_search': 'DEFAULT', 'cudnn_conv_use_max_workspace': '0',
                                                       'arena_extend_strategy': 'kSameAsRequested'}))
    return ort.InferenceSession(str(percorso), o, providers=fornitori)
