"""Controlla che Lezioni OS possa lavorare: scheda video, modelli, audio del PC, finestra della lezione, ffmpeg.

    python controlla.py

Lo lancia installa.ps1 alla fine; utile anche prima di una lezione se qualcosa non va.
"""
import os
import shutil
import sys

import cattura
import modelli
from comune import CASA, cartella_lezioni, configurazione, cuda_dll

cuda_dll()
import ctranslate2  # noqa: E402
import onnxruntime  # noqa: E402
import pyaudiowpatch as pa  # noqa: E402


def riga(etichetta, valore, ok=True):
    print(f'{"ok " if ok else "!! "} {etichetta:<24} {valore}')


def main():
    gpu = ctranslate2.get_cuda_device_count() > 0
    riga('scheda video per Whisper', 'sì (large-v3)' if gpu else 'no: CPU col modello small')
    riga('ONNX Runtime', f'{onnxruntime.__version__} · {", ".join(p.replace("ExecutionProvider", "") for p in onnxruntime.get_available_providers())}')
    for m in modelli.elenco():
        riga(m['nome'], 'presente' if m.get('presente') else (m.get('nota') or 'non presente'), bool(m.get('presente')) or m['id'] in ('whisper-large-v3-turbo', 'birefnet', 'claude'))
    p = pa.PyAudio()
    try:
        w = p.get_host_api_info_by_type(pa.paWASAPI)
        out = p.get_device_info_by_index(w['defaultOutputDevice'])
        lb = [d['name'] for d in p.get_loopback_device_info_generator() if out['name'] in d['name']]
        riga('audio registrato da', f'{out["name"]} (uscita predefinita)', bool(lb))
    finally:
        p.terminate()
    f = (configurazione().get('finestra') or {})
    scelta = cattura.trova(f.get('titolo') or cattura.TITOLO, f.get('programma') or '')
    riga('finestra della lezione', scelta['titolo'][:70] if scelta else 'adesso nessuna è aperta (va bene se la lezione non è cominciata)')
    riga('ffmpeg (Opus, ascolto)', shutil.which('ffmpeg') or 'manca: winget install Gyan.FFmpeg', bool(shutil.which('ffmpeg')))
    riga('lezioni in', cartella_lezioni())
    riga('Claude automatico', 'sì (ANTHROPIC_API_KEY)' if os.environ.get('ANTHROPIC_API_KEY') else 'no: si usa Claude Code')
    riga('dati di Lezioni OS', CASA)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
