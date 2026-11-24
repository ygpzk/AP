"""Legge la lavagna con un modello che vede, sul PC (Ollama): niente chiave, niente cloud, niente costo.

    python leggi.py <cartella_lezione> [--frame frames/t_000205.jpg] [--ogni 120] [--modello qwen3-vl:4b]

Con --frame legge quel fotogramma e basta (il tasto «Leggi» della galleria); senza, passa la
lezione prendendo un fotogramma ogni --ogni secondi fra quelli non ancora letti. Legge la lavagna
già ripulita (nitida/ o pulita/, se la lezione è stata sviluppata), che è molto più facile del
fotogramma con la persona davanti. Scrive ocr/ocr_NNN.json nello stesso formato della lettura con
Claude ({"frame", "lavagna"}), così grezzo.md e gli appunti la trovano dove se l'aspettano.

Provato il 24.11.2026 con qwen3-vl:4b su una RTX 3060 Ti: quando risponde, titoli e formule semplici
giusti e qualche simbolo sbagliato (f letta come y, «o piccolo» come delta), due-tre minuti a lavagna.
Ma è un modello che ragiona, e Ollama non glielo spegne: a volte finisce i gettoni senza scrivere la
risposta, e quella lavagna resta da leggere (sperimentale).
Per le formule fa fede Claude (ocr_claude.py o Claude Code); questa è la lettura di riserva.
Il modello si scarica una volta con «ollama pull qwen3-vl:4b» e si scarica dalla memoria video
da solo dopo l'ultima lettura.
"""
import argparse
import base64
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import cv2

from comune import (a_bassa_priorita, configurazione, da_fare, hms, leggi_immagine, leggi_json, leggi_jsonl, prossimo_ocr,
                    scrivi_json, scrivi_pid)
import componi

CONSEGNA = ('Questa è la lavagna di una lezione universitaria{materia}. Trascrivi fedelmente tutto quello che c\'è scritto '
            'sulla lavagna, in Markdown, con le formule in LaTeX fra $...$. Solo la trascrizione, nessun commento. '
            'Se una parte non si legge scrivi [illeggibile].')


class Muto(Exception):
    """Il modello ha ragionato fino a finire i gettoni senza scrivere la risposta (a qwen3-vl capita: Ollama non
    gli spegne il ragionamento). La lavagna resta da leggere."""


def immagine_di(cart, file):
    """La versione più leggibile che c'è di quel fotogramma: nitida, pulita, il ritaglio del video, il fotogramma."""
    nome = Path(file).stem
    for p in (cart / 'nitida' / f'{nome}.webp', cart / 'pulita' / f'{nome}.webp'):
        if p.exists():
            return leggi_immagine(p)
    im = leggi_immagine(cart / file)
    box = ((leggi_json(cart / 'lavagna.json', {}) or {}).get('fotogrammi') or {}).get(file, {}).get('box')
    return im[box[1]:box[3], box[0]:box[2]] if im is not None and box else im


def leggi(im, modello, indirizzo, materia):
    if max(im.shape[:2]) > 1400:  # più grande non legge meglio, ci mette solo di più
        f = 1400 / max(im.shape[:2])
        im = cv2.resize(im, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
    _, buf = cv2.imencode('.jpg', im, [cv2.IMWRITE_JPEG_QUALITY, 90])
    corpo = {'model': modello, 'stream': False, 'think': False, 'keep_alive': '90s',
             'options': {'temperature': 0, 'num_ctx': 12288, 'num_predict': 7000},  # (ragiona a lungo prima di rispondere)
             'messages': [{'role': 'user', 'images': [base64.b64encode(buf).decode()],
                           'content': CONSEGNA.format(materia=f' di {materia}' if materia else '')}]}
    r = urllib.request.urlopen(urllib.request.Request(indirizzo.rstrip('/') + '/api/chat', json.dumps(corpo).encode(),
                                                      {'Content-Type': 'application/json'}), timeout=600)
    testo = json.loads(r.read())['message']['content'].strip()
    if not testo:
        raise Muto()
    return '' if testo.lower().strip('().') in ('vuota', 'lavagna vuota') else testo


def main():
    conf = configurazione().get('lettura') or {}
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--frame', default='')
    ap.add_argument('--ogni', type=int, default=120, help='secondi fra una lavagna letta e la successiva')
    ap.add_argument('--modello', default=conf.get('modello') or 'qwen3-vl:4b')
    ap.add_argument('--indirizzo', default=conf.get('indirizzo') or 'http://127.0.0.1:11434')
    a = ap.parse_args()
    cart = Path(a.cartella)
    a_bassa_priorita()
    scrivi_pid(cart, 'leggi')
    materia = (leggi_json(cart / 'meta.json', {}) or {}).get('materia', '')
    if a.frame:
        fare = [f for f in leggi_jsonl(cart / 'frames.jsonl') if f['file'] == a.frame]
    else:
        fare, ultimo = [], -1e9
        for f in da_fare(cart):
            if f['t'] - ultimo >= a.ogni:
                fare.append(f)
                ultimo = f['t']
    stato = cart / 'lettura.json'
    fatte, dest, mute = [], prossimo_ocr(cart), 0
    for i, f in enumerate(fare):
        scrivi_json(stato, {'stato': 'in corso', 'fatto': i, 'totale': len(fare), 'frame': f['file'], 'modello': a.modello})
        im = immagine_di(cart, f['file'])
        if im is None:
            continue
        t = time.time()
        try:
            testo = leggi(im, a.modello, a.indirizzo, materia)
        except Muto:
            mute += 1
            print(f'{hms(f["t"])} {Path(f["file"]).name}: il modello ha ragionato {time.time() - t:.0f} s senza rispondere, la salto', flush=True)
            continue
        except (urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError) as e:
            scrivi_json(stato, {'stato': 'errore', 'errore': f'Ollama non risponde su {a.indirizzo} ({e}). È acceso? Il modello c\'è (ollama pull {a.modello})?'})
            raise SystemExit(2)
        fatte.append({'frame': f['file'], 'lavagna': testo, 'da': a.modello} if testo else {'frame': f['file'], 'uguale': True, 'da': a.modello})
        scrivi_json(dest, fatte)
        print(f'{hms(f["t"])} {Path(f["file"]).name} letta in {time.time() - t:.0f} s', flush=True)
        try:
            componi.componi(cart)
        except Exception as e:
            print('grezzo.md non aggiornato:', e, flush=True)
    if mute and not fatte:
        scrivi_json(stato, {'stato': 'errore', 'errore': f'{a.modello} ha ragionato senza rispondere su {mute} lavagn{"a" if mute == 1 else "e"}: riprova, o usa Claude.'})
        raise SystemExit(3)
    scrivi_json(stato, {'stato': 'finito', 'fatto': len(fatte), 'mute': mute, 'totale': len(fare), 'modello': a.modello})


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
