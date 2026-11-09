#!/usr/bin/env python
# I volti di Deutschland (9.11.2026): chi c'è in ogni foto (pekko = Alberto, mikas, jonny, jella). insightface buffalo_l
# (SCRFD per trovare i volti, ArcFace per l'embedding a 512) su onnxruntime CPU, nel venv delle lezioni
# (%LOCALAPPDATA%\Lezioni\venv, py3.12). Legge le grandi (C:\pzkko-server\deutschland\dati\g\, 1800 px) delle voci
# incluse nel catalogo (per i video il poster), tiene gli embedding in catalogo\volti-emb.npz (privato), raggruppa i
# volti per somiglianza (coseno, legame medio, scipy) e stampa i fogli di contatto
# tools\pzkko\lavoro\deutschland\volti\gruppo-N.jpg perché Alberto guardi e dica chi è chi: scrive lui
# catalogo\volti.json { "1": "pekko", "3": "mikas", … } e manifesto.mjs mette i tag. Il gruppo che somiglia alla foto
# «jager» di amici.mjs (Alberto con la bottiglia, agosto 2026) viene proposto come pekko.
# Scrive catalogo\volti-gruppi.json: { gruppi: { "1": { n, foto: [...], suggerito } }, perFoto: { id: { volti, gruppi } } }.
# Il riconoscimento è un'ipotesi: i nomi li conferma Alberto, e i volti piccoli o di sconosciuti restano senza nome.
#
#   %LOCALAPPDATA%\Lezioni\venv\Scripts\python.exe tools\pzkko\deutschland\riconosci.py            tutto (incrementale)
#   … riconosci.py --soglia=0.45     la somiglianza minima per stare nello stesso gruppo (coseno; 0.45 di base)
#   … riconosci.py --solo=5506,5507  solo quelle foto (prova)
#   … riconosci.py --fogli           rifà solo i gruppi e i fogli dagli embedding salvati (niente modello)
import json, os, sys, time, warnings
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding='utf-8')  # (la console di Windows è cp1252: le spunte e le «» non passerebbero)
warnings.filterwarnings('ignore', category=FutureWarning)  # (insightface su scikit-image 0.26: avvisi suoi, non nostri)

SERVER = Path(r'C:\pzkko-server\deutschland')
DATI, CATALOGO = SERVER / 'dati', SERVER / 'catalogo'
QUI = Path(__file__).resolve().parent
LAVORO = QUI.parent / 'lavoro' / 'deutschland' / 'volti'
EMB = CATALOGO / 'volti-emb.npz'
GRUPPI = CATALOGO / 'volti-gruppi.json'
# la foto di riferimento di Alberto (amici.mjs, «jager»: ritaglio [0, 0.27, 1, 1] della foto ruotata)
JAGER = Path(r'D:\disco immagini\Rullino\Caricamenti dalla fotocamera dal 26 dicembre 2025\2026-08-23 00.02.52.jpg')
MIN_LATO = 36  # un volto più piccolo di così (nella grande da 1800) non si riconosce
MIN_SCORE = 0.55

args = {a.split('=')[0].lstrip('-'): (a.split('=')[1] if '=' in a else True) for a in sys.argv[1:]}
SOGLIA = float(args.get('soglia', 0.45))
SOLO = {f"img-{s.strip().lower().removeprefix('img-').removeprefix('img_')}" for s in str(args['solo']).split(',')} if 'solo' in args else None


def leggi(p, altrimenti):
    try:
        return json.loads(Path(p).read_text('utf-8-sig'))
    except Exception:
        return altrimenti


def scrivi(p, dati):
    tmp = Path(str(p) + f'.{os.getpid()}.tmp')
    tmp.write_text(json.dumps(dati, ensure_ascii=False, indent=1), 'utf-8')
    os.replace(tmp, p)


cache = leggi(CATALOGO / 'cache.json', None)
if not cache or 'voci' not in cache:
    sys.exit('manca catalogo\\cache.json: prima node tools/pzkko/deutschland/cataloga.mjs')
voci = [v for v in cache['voci'].values() if not v.get('escluso') and not v.get('screenshot') and (not SOLO or v['id'] in SOLO)]
immagine_di = lambda v: DATI / ('p' if v['tipo'] == 'video' else 'g') / (v['p'] if v['tipo'] == 'video' else v['g'])

# ── gli embedding salvati: id → lista di volti [{ bbox, score, emb }] ──
salvati = {}
if EMB.exists():
    z = np.load(EMB, allow_pickle=False)
    meta = json.loads(str(z['meta']))
    embs = z['emb']
    for riga in meta['volti']:
        salvati.setdefault(riga['id'], []).append({'bbox': riga['bbox'], 'score': riga['score'], 'emb': embs[riga['i']]})
    impronte = meta.get('impronte', {})
else:
    impronte = {}

da_fare = [v for v in voci if v['id'] not in impronte or impronte[v['id']] != v.get('impronta')] if not args.get('fogli') else []
print(f"{len(voci)} immagini, {len(da_fare)} da passare al modello")

if da_fare or not EMB.exists() or ('jager' not in impronte and not args.get('fogli')):
    import cv2
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'], allowed_modules=['detection', 'recognition'])
    app.prepare(ctx_id=-1, det_size=(640, 640))

    def volti(path, ritaglio=None):
        img = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if img is None:
            return []
        if ritaglio:
            h, w = img.shape[:2]
            x0, y0, x1, y1 = ritaglio
            img = img[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)]
        out = []
        for f in app.get(img):
            x0, y0, x1, y1 = [float(x) for x in f.bbox]
            if min(x1 - x0, y1 - y0) < MIN_LATO or f.det_score < MIN_SCORE:
                continue
            e = f.normed_embedding.astype(np.float32)
            out.append({'bbox': [round(x0), round(y0), round(x1), round(y1)], 'score': round(float(f.det_score), 3), 'emb': e})
        return out

    t0 = time.time()
    for n, v in enumerate(da_fare, 1):
        p = immagine_di(v)
        if not p.exists():
            print(f"  ? {v['id']}: manca {p.name}")
            continue
        salvati[v['id']] = volti(p)
        impronte[v['id']] = v.get('impronta')
        if n % 10 == 0 or n == len(da_fare):
            print(f"  {n}/{len(da_fare)} ({time.time() - t0:.0f} s) — {v['id']}: {len(salvati[v['id']])} volti")
    # il riferimento di Alberto: la foto «jager» ruotata come fa amici.mjs (exif) e ritagliata
    if JAGER.exists() and 'jager' not in impronte:
        from PIL import Image, ImageOps
        im = ImageOps.exif_transpose(Image.open(JAGER)).convert('RGB')
        im.thumbnail((1800, 1800))
        tmp = LAVORO / '_jager.jpg'
        LAVORO.mkdir(parents=True, exist_ok=True)
        im.save(tmp, quality=92)
        rif = volti(tmp, (0, 0.27, 1, 1))
        tmp.unlink(missing_ok=True)
        if rif:
            salvati['jager'] = [max(rif, key=lambda f: (f['bbox'][2] - f['bbox'][0]))]
            impronte['jager'] = 'riferimento'
            print(f"  riferimento pekko: {len(rif)} volti nella foto jager, preso il più grande")
        else:
            print('  riferimento pekko: nessun volto nella foto jager')
    # si salva tutto (npz: gli embedding, e i metadati in JSON dentro)
    righe, lista = [], []
    for id_, lst in salvati.items():
        for f in lst:
            righe.append({'id': id_, 'bbox': f['bbox'], 'score': f['score'], 'i': len(lista)})
            lista.append(f['emb'])
    CATALOGO.mkdir(parents=True, exist_ok=True)
    np.savez(EMB, emb=np.array(lista, dtype=np.float32) if lista else np.zeros((0, 512), np.float32), meta=np.array(json.dumps({'volti': righe, 'impronte': impronte})))
    print(f"✓ {EMB}: {len(lista)} volti in {len(salvati)} immagini")

# ── i gruppi: legame medio sul coseno, taglio a 1 - SOGLIA ──
ids_foto = {v['id'] for v in voci}
tutti = [(id_, f) for id_, lst in salvati.items() if id_ in ids_foto for f in lst]
if not tutti:
    sys.exit('nessun volto: niente gruppi')
X = np.array([f['emb'] for _, f in tutti], dtype=np.float32)
X /= np.linalg.norm(X, axis=1, keepdims=True)
if len(tutti) > 1:
    from scipy.cluster.hierarchy import fcluster, linkage
    from scipy.spatial.distance import pdist
    Z = linkage(pdist(X, metric='cosine'), method='average')
    etichette = fcluster(Z, t=1 - SOGLIA, criterion='distance')
else:
    etichette = np.array([1])
# i gruppi numerati per grandezza (1 = il più frequente)
conteggio = {}
for e in etichette:
    conteggio[int(e)] = conteggio.get(int(e), 0) + 1
ordine = {e: i + 1 for i, (e, _) in enumerate(sorted(conteggio.items(), key=lambda kv: -kv[1]))}
gruppo_di = [ordine[int(e)] for e in etichette]

# il gruppo di Alberto: il centro più vicino al riferimento jager (se somiglia abbastanza)
suggeriti = {}
if 'jager' in salvati and salvati['jager']:
    r = salvati['jager'][0]['emb']
    r = r / np.linalg.norm(r)
    migliore = None
    for g in set(gruppo_di):
        centro = X[[i for i, gg in enumerate(gruppo_di) if gg == g]].mean(axis=0)
        s = float(np.dot(centro / np.linalg.norm(centro), r))
        if s >= 0.35 and (not migliore or s > migliore[1]):
            migliore = (g, s)
    if migliore:
        suggeriti[migliore[0]] = 'pekko'
        print(f"  il gruppo {migliore[0]} somiglia ad Alberto (coseno {migliore[1]:.2f}): proposto come pekko")

gruppi = {}
per_foto = {}
for (id_, f), g in zip(tutti, gruppo_di):
    gruppi.setdefault(g, {'n': 0, 'foto': [], 'suggerito': suggeriti.get(g)})
    gruppi[g]['n'] += 1
    if id_ not in gruppi[g]['foto']:
        gruppi[g]['foto'].append(id_)
    pf = per_foto.setdefault(id_, {'volti': 0, 'gruppi': []})
    pf['volti'] += 1
    if g not in pf['gruppi']:
        pf['gruppi'].append(g)
for v in voci:
    per_foto.setdefault(v['id'], {'volti': 0, 'gruppi': []})
scrivi(GRUPPI, {'generato': time.strftime('%Y-%m-%dT%H:%M:%S'), 'soglia': SOGLIA, 'gruppi': {str(g): gruppi[g] for g in sorted(gruppi)}, 'perFoto': per_foto})

# ── i fogli di contatto: fino a 30 volti per gruppo, tessere da 160 px, per i gruppi con almeno 2 volti ──
from PIL import Image, ImageDraw
LAVORO.mkdir(parents=True, exist_ok=True)
for vecchio in LAVORO.glob('gruppo-*.jpg'):
    vecchio.unlink()
TESSERA, COL = 160, 6
fogli = 0
for g in sorted(gruppi):
    membri = [(id_, f) for (id_, f), gg in zip(tutti, gruppo_di) if gg == g]
    if len(membri) < 2:
        continue
    membri = sorted(membri, key=lambda m: -m[1]['score'])[:30]
    righe = (len(membri) + COL - 1) // COL
    foglio = Image.new('RGB', (COL * TESSERA, righe * TESSERA + 28), (20, 20, 20))
    d = ImageDraw.Draw(foglio)
    d.text((8, 6), f"gruppo {g} · {gruppi[g]['n']} volti in {len(gruppi[g]['foto'])} foto" + (f" · proposto: {gruppi[g]['suggerito']}" if gruppi[g]['suggerito'] else ''), fill=(255, 212, 0))
    for k, (id_, f) in enumerate(membri):
        v = cache['voci'].get(id_)
        if not v:
            continue
        try:
            im = Image.open(immagine_di(v)).convert('RGB')
        except Exception:
            continue
        x0, y0, x1, y1 = f['bbox']
        lato = int(max(x1 - x0, y1 - y0) * 1.6)
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        ritaglio = im.crop((max(0, cx - lato // 2), max(0, cy - lato // 2), min(im.width, cx + lato // 2), min(im.height, cy + lato // 2))).resize((TESSERA, TESSERA))
        foglio.paste(ritaglio, ((k % COL) * TESSERA, 28 + (k // COL) * TESSERA))
        ImageDraw.Draw(foglio).text(((k % COL) * TESSERA + 4, 28 + (k // COL) * TESSERA + TESSERA - 14), id_.removeprefix('img-'), fill=(255, 255, 255))
    foglio.save(LAVORO / f'gruppo-{g}.jpg', quality=85)
    fogli += 1
print(f"✓ {len(gruppi)} gruppi ({sum(1 for g in gruppi.values() if g['n'] >= 2)} con almeno 2 volti), {fogli} fogli in {LAVORO}")
for g in sorted(gruppi):
    if gruppi[g]['n'] >= 2:
        print(f"  gruppo {g}: {gruppi[g]['n']} volti, {len(gruppi[g]['foto'])} foto{' · proposto ' + gruppi[g]['suggerito'] if gruppi[g]['suggerito'] else ''}")
print(f"→ Alberto scrive {CATALOGO / 'volti.json'} come {{ \"1\": \"pekko\", \"2\": \"mikas\", … }} e poi node tools/pzkko/deutschland/manifesto.mjs")
