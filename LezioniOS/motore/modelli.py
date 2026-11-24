"""I modelli di Lezioni OS: quali sono, a cosa servono, se ci sono, e come si scaricano.

    python modelli.py              l'elenco in JSON (lo legge la regia)
    python modelli.py scarica rvm  scarica un modello (rvm, birefnet, whisper-large-v3-turbo, parakeet-v3…)

I pesi stanno fuori dal repository: quelli di Whisper e Parakeet nella cache di Hugging Face, i file
ONNX della lavagna in %LOCALAPPDATA%\\Lezioni\\modelli, quelli di Ollama nella sua cartella.
"""
import json
import os
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

from comune import MODELLI

HF = Path(os.environ.get('HF_HOME') or Path.home() / '.cache' / 'huggingface') / 'hub'

CATALOGO = [
    # ── la voce ──
    {'id': 'whisper-large-v3', 'gruppo': 'voce', 'nome': 'Whisper large-v3', 'di': 'OpenAI · faster-whisper', 'licenza': 'MIT',
     'peso': '3,1 GB', 'gira': 'scheda video · ~3 GB', 'hf': 'models--Systran--faster-whisper-large-v3',
     'dice': 'Il più preciso in italiano. Sulla lezione di prova ha preso anche la domanda dello studente dal fondo dell\'aula.',
     'provato': 'sì: 6–10× il tempo reale'},
    {'id': 'whisper-large-v3-turbo', 'gruppo': 'voce', 'nome': 'Whisper large-v3 turbo', 'di': 'OpenAI · faster-whisper', 'licenza': 'MIT',
     'peso': '1,6 GB', 'gira': 'scheda video · ~1,5 GB', 'hf': 'models--mobiuslabsgmbh--faster-whisper-large-v3-turbo',
     'dice': 'Lo stesso orecchio di large-v3 con un decodificatore di 4 strati invece di 32: più svelto e metà memoria, un filo meno preciso.',
     'provato': 'no: da scaricare'},
    {'id': 'parakeet-v3', 'gruppo': 'voce', 'nome': 'Parakeet TDT 0.6B v3', 'di': 'NVIDIA · onnx-asr', 'licenza': 'CC BY 4.0',
     'peso': '0,7 GB (int8) · 2,5 GB', 'gira': 'CPU, la scheda video resta libera', 'hf': 'models--istupakov--parakeet-tdt-0.6b-v3-onnx',
     'dice': '25 lingue europee, velocissimo. In aula sbaglia più di Whisper e sui rumori scrive paroline in inglese: per quando il PC serve ad altro.',
     'provato': 'sì: 11× sulla CPU, 36–56× sulla GPU'},
    {'id': 'silero-vad', 'gruppo': 'voce', 'nome': 'Silero VAD', 'di': 'Silero', 'licenza': 'MIT', 'peso': '2 MB', 'gira': 'CPU',
     'hf': 'models--istupakov--silero-vad-onnx', 'dice': 'Sente dove c\'è voce e dove silenzio: i motori trascrivono solo la voce.',
     'provato': 'sì', 'sempre': True},
    # ── la lavagna ──
    {'id': 'rvm', 'gruppo': 'lavagna', 'nome': 'Robust Video Matting', 'di': 'ByteDance', 'licenza': 'GPL-3.0', 'peso': '15 MB',
     'gira': 'CPU · 0,1 s a fotogramma', 'file': 'rvm_mobilenetv3_fp32.onnx',
     'url': 'https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx',
     'dice': 'Ritaglia le persone: dice dov\'è il docente, e lì resta la lavagna dell\'ultima volta che si vedeva. Sulle schermate che non sono lezione non inventa niente.',
     'provato': 'sì: 68 fotogrammi in 33 s'},
    {'id': 'birefnet', 'gruppo': 'lavagna', 'nome': 'BiRefNet lite', 'di': 'ZhengPeng7 · rembg', 'licenza': 'MIT', 'peso': '224 MB',
     'gira': 'CPU · 13 s a fotogramma', 'file': 'birefnet-lite.onnx',
     'url': 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx',
     'dice': 'Il ritaglio più fine che ci sia (capelli, dita, fogli). Sulla scheda video riempie tutti gli 8 GB: si usa solo a PC fermo, e per la lavagna RVM basta.',
     'provato': 'sì: stesso ritaglio di RVM, 100 volte più lento'},
    # ── l'audio ──
    {'id': 'opus', 'gruppo': 'audio', 'nome': 'Opus', 'di': 'Xiph · ffmpeg', 'licenza': 'BSD', 'peso': 'in ffmpeg', 'gira': 'CPU',
     'comando': 'ffmpeg', 'dice': 'L\'audio della lezione in un file solo a 40 kb/s: 6 minuti da 35 MB a 1,3 MB, e si scorre.',
     'provato': 'sì', 'sempre': True},
    {'id': 'afftdn', 'gruppo': 'audio', 'nome': 'Riduzione del rumore + EBU R128', 'di': 'ffmpeg', 'licenza': 'LGPL', 'peso': 'in ffmpeg',
     'gira': 'CPU', 'comando': 'ffmpeg', 'dice': 'L\'ascolto pulito: via il ronzio dell\'aula, volume costante. Solo per le orecchie: la trascrizione si fa sull\'originale.',
     'provato': 'sì', 'sempre': True},
    # ── la lettura ──
    {'id': 'qwen3-vl', 'gruppo': 'lettura', 'nome': 'Qwen3-VL 4B', 'di': 'Alibaba · Ollama', 'licenza': 'Apache 2.0', 'peso': '3,3 GB',
     'gira': 'scheda video · ~5 GB', 'ollama': 'qwen3-vl:4b',
     'dice': 'Legge la lavagna ripulita sul PC, senza chiavi e senza costi. Sperimentale: quando risponde, titoli e formule semplici sono giusti; a volte ragiona senza arrivare alla risposta.',
     'provato': 'sì: 2–3 minuti a lavagna, non sempre risponde'},
    {'id': 'claude', 'gruppo': 'lettura', 'nome': 'Claude', 'di': 'Anthropic', 'licenza': 'a consumo o in abbonamento', 'peso': 'nel cloud',
     'gira': 'cloud', 'chiave': 'ANTHROPIC_API_KEY',
     'dice': 'La lettura che fa fede per le formule, e gli appunti in PDF. Con la chiave API va da solo; senza, la fa Claude Code.',
     'provato': 'sì (lezione del 21.10.2026)'},
]


def ollama_ha():
    try:
        r = urllib.request.urlopen('http://127.0.0.1:11434/api/tags', timeout=2)
        return {m['name'] for m in json.loads(r.read()).get('models', [])}
    except Exception:
        return None


def elenco():
    ha = ollama_ha()
    out = []
    for m in CATALOGO:
        d = {k: v for k, v in m.items() if k not in ('url', 'hf', 'file', 'comando', 'chiave')}
        if 'file' in m:
            d['presente'] = (MODELLI / m['file']).exists()
        elif 'hf' in m:
            d['presente'] = any((HF / m['hf'] / 'snapshots').glob('*/*')) if (HF / m['hf']).exists() else False
        elif 'comando' in m:
            d['presente'] = bool(shutil.which(m['comando']))
        elif 'ollama' in m:
            d['presente'] = None if ha is None else m['ollama'] in ha
            d['nota'] = 'Ollama è spento' if ha is None else ''
        elif 'chiave' in m:
            d['presente'] = bool(os.environ.get(m['chiave']))
            d['nota'] = '' if d['presente'] else 'senza chiave: con Claude Code'
        d['scaricabile'] = any(k in m for k in ('url', 'hf', 'ollama')) and not d.get('presente')
        out.append(d)
    return out


def scarica(quale):
    m = next((m for m in CATALOGO if m['id'] == quale), None)
    if not m:
        raise SystemExit(f'modello sconosciuto: {quale}')
    if 'url' in m:
        MODELLI.mkdir(parents=True, exist_ok=True)
        dest = MODELLI / m['file']
        tmp = dest.with_suffix('.scarico')
        print('scarico', m['url'], flush=True)
        urllib.request.urlretrieve(m['url'], tmp)
        tmp.replace(dest)
    elif m['id'].startswith('whisper'):
        from faster_whisper import download_model
        download_model(m['id'].replace('whisper-', ''))
    elif m['id'] in ('parakeet-v3', 'silero-vad'):
        import onnx_asr
        onnx_asr.load_vad('silero', providers=['CPUExecutionProvider'])
        if m['id'] == 'parakeet-v3':
            onnx_asr.load_model('nemo-parakeet-tdt-0.6b-v3', quantization='int8', providers=['CPUExecutionProvider'])
    elif 'ollama' in m:
        subprocess.run(['ollama', 'pull', m['ollama']], check=True)
    else:
        raise SystemExit(f'{m["nome"]} non si scarica da qui')
    print('fatto', flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) >= 3 and sys.argv[1] == 'scarica':
        scarica(sys.argv[2])
    else:
        print(json.dumps(elenco(), ensure_ascii=False))
