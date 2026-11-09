# La pipeline di Deutschland (tools/pzkko/deutschland)

Le foto e i video del viaggio a Monaco e Stoccarda con Mikas, Jonny e Jella (6–9 novembre 2026) per la galleria
`pzkko.it/deutschland/` (la macchinetta delle sigarette che chiede la password). Gli originali stanno su D: (la
cartella «originali» di `C:\pzkko-server\config\deutschland.json`, **solo in lettura**: l'importazione dall'iPhone è
ancora in corso), il catalogo che se ne ricava sta in `C:\pzkko-server\deutschland\` (fuori da GitHub), e lo serve
`C:\pzkko-server\deutschland\server.mjs` dietro il Funnel di Tailscale col biglietto che dà la banca a chi sa la
password (`LEGGIMI.md` lì). Niente di tutto questo entra nel repo: qui c'è solo il codice.

```
D:\…\Viaggio a Munchen e Stuttgard con JMA\   (HEIC 48 MP + _convertiti\*.JPG, DNG, MOV HDR, PNG, JPG)
   │ cataloga.mjs (incrementale)
   ▼
C:\pzkko-server\deutschland\catalogo\cache.json     + dati\m\ (480 webp)  dati\g\ (1800 jpeg)  dati\v\ (h264)  dati\p\  dati\o\ (DNG e HEIC senza JPG)
   │ posti.mjs → catalogo\posti.json (Nominatim, nomi corretti a mano con fisso: true)
   │ riconosci.py → catalogo\volti-emb.npz, volti-gruppi.json, fogli in tools\pzkko\lavoro\deutschland\volti\gruppo-N.jpg
   │                Alberto → catalogo\volti.json { "1": "pekko", … }
   │ categorie.mjs → catalogo\clip.json (somiglianze), clip-auto.json (tag)
   │ a mano → catalogo\tag-mano.json { piu: { id: [tag] }, meno: { id: [tag] } }
   ▼ manifesto.mjs
C:\pzkko-server\deutschland\dati\foto.json (il contratto della galleria) + dati\origini.json (privato: id → file su D:)
```

## I comandi, nell'ordine

Dalla cartella `albertopecchini.it`:

```
node tools/pzkko/deutschland/cataloga.mjs            # quello che manca; --solo=5506,5478 per provare; --prova; --rifai; --niente-video; --solo-video; --paralleli=3
node tools/pzkko/deutschland/posti.mjs               # i gruppi GPS (≤150 m) coi nomi bozza da Nominatim; --senza-nomi; --raggio=200
%LOCALAPPDATA%\Lezioni\venv\Scripts\python.exe tools\pzkko\deutschland\riconosci.py   # i volti; --soglia=0.45; --fogli; --solo=…
node tools/pzkko/deutschland/categorie.mjs           # CLIP su Replicate (pochi centesimi); --soglia=0.22 rifà solo i tag
node tools/pzkko/deutschland/manifesto.mjs           # scrive dati\foto.json; --prova; --pulisci (via i file finti)
```

Per sviluppare la galleria senza le foto vere: `node tools/pzkko/deutschland/finto.mjs` (60 voci finte, 8 posti,
6 video, quadrati colorati) e poi il server aperto:

```
DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs      # bash;  PowerShell: $env:DEUTSCHLAND_APERTO='1'; node C:\pzkko-server\deutschland\server.mjs
```

→ `http://127.0.0.1:8790/foto.json`, `/m/<id>.webp`, `/g/<id>.jpg`, `/o/<id>.jpg`, `/v/<id>.mp4`, `/p/<id>.jpg`, senza
biglietto (solo per le richieste che arrivano dritte dal pc; `pzkko/deutschland/comune.js` lo sa: in locale `stato.url`
è quello). Il manifesto vero, quando c'è, sostituisce quello finto nello stesso file.

## Il manifesto (`dati\foto.json`)

```json
{ "v": 1, "generato": "…", "viaggio": { "titolo": "Monaco e Stoccarda con JMA", "da": "2026-11-06", "a": "2026-11-09" },
  "tag": ["pekko","mikas","jonny","jella","cibo","paesaggi","natura","strada","auto","screenshot","hotel","mezzi","alcool","foto","video"],
  "posti": [{ "id": "p03", "nome": "Marienplatz", "nomeAuto": "Marienplatz, Altstadt-Lehel, München", "lat": 48.13743, "lon": 11.57549, "n": 42 }],
  "tappe": [{ "posto": "p03", "da": 61, "a": 102 }],
  "foto": [{ "id": "img-5506", "tipo": "foto", "nome": "IMG_5506.HEIC", "t": "2026-11-06T21:10:51+01:00", "giorno": "2026-11-06", "ora": "21:10",
             "tStimato": false, "lat": 48.151853, "lon": 11.537111, "gpsStimato": false, "posto": "p01", "w": 6048, "h": 8064,
             "m": "img-5506.webp", "g": "img-5506.jpg", "o": "img-5506.jpg", "peso": 16593835, "blur": "data:image/webp;base64,…",
             "col": "#6a5a4a", "tag": ["pekko","cibo","foto"], "volti": 2 }] }
```

- `foto` in ordine di tempo; `tappe` = file consecutive dello stesso posto (indici in `foto`).
- Video: `tipo: "video"`, `v` (mp4 h264 ≤1080p, tone-map dall'HDR), `p` (poster), `durata`; `live: true` se è il
  filmato di una Live Photo (stesso numero di una foto: id `img-nnnn-v`, 2-3 secondi). Il MOV originale non si serve;
  la sorgente è il gemello di `_convertiti\` quando c'è, se no l'originale.
- Una voce per numero `IMG_nnnn` (dal 9.11 sera la cartella ha 977 originali e i 353 JPG + 46 MOV convertiti dal
  telefono stanno in `_convertiti\`): il gemello `_convertiti\IMG_nnnn.JPG` è la sorgente di `m`, `g` e `o` (il JPEG a
  48 MP, servito da D:); il DNG resta `raw` (`/raw/<id>.dng`, `pesoRaw`); l'HEIC dà solo data e GPS.
- Senza gemello: DNG → `o` è il JPEG incorporato (48 MP nei ProRAW nuovi, 4032 px nei primi), ruotato e ripulito dai
  metadati, in `dati\o\`; HEIC → il JPEG q95 decodificato da ffmpeg, in `dati\o\`. Il campo `oDa` della cache dice da
  dove viene (`convertito`, `dng`, `heic`, `png`, `jpg`).
- Data e GPS dal master (DNG/HEIC/PNG/JPG); da gemello solo quello che al master manca.
- Una foto senza GPS prende quello della foto inclusa più vicina entro 30 minuti (`gpsStimato`); se non c'è, niente
  `lat`/`lon` e `posto: null`. Una foto senza data la stima dai vicini per numero (`tStimato`).
- Il riquadro di casa (`C:\pzkko-server\deutschland\privato.mjs`) esclude il file del tutto, e non presta il GPS.
- Le immagini prodotte non hanno metadati (sharp li toglie; i video con `-map_metadata -1`).

## I posti e i volti, con Alberto

- `catalogo\posti.json`: i nomi bozza sono di Nominatim; Alberto corregge `nome` e mette `fisso: true` (il posto
  tiene nome e id a ogni giro). I gruppi sono entro 150 m dal centro (le foto col GPS ereditato non spostano il centro).
- `riconosci.py` stampa i fogli `tools\pzkko\lavoro\deutschland\volti\gruppo-N.jpg` (fino a 30 volti per gruppo);
  Alberto guarda e scrive `catalogo\volti.json` (`{ "1": "pekko", "2": "mikas", "5": "jonny", "7": "jella" }`): i gruppi
  senza nome restano senza tag. Il gruppo che somiglia alla foto «jager» di `amici.mjs` è proposto come pekko.
- `catalogo\tag-mano.json`: `{ "piu": { "img-5506": ["alcool"] }, "meno": { "img-5510": ["auto"] } }`.
- Dopo ogni correzione: `node tools/pzkko/deutschland/manifesto.mjs`.

## Cose da sapere

- ffmpeg: `winget install Gyan.FFmpeg`; `comune.mjs` lo trova anche in `%LOCALAPPDATA%\Microsoft\WinGet\Packages\`.
  I MOV dell'iPhone sono HEVC 10 bit HLG con Dolby Vision: `zscale … tonemap=hable … yuv420p`, libx264 crf 22 (~1× la
  durata: 15 minuti di video, 15 minuti). Niente NVENC su questo pc.
- sharp non apre gli HEIC e exifr non li legge: il JPG di `_convertiti\` fa da sorgente; senza, ffmpeg per i pixel e
  il blocco Exif dentro l'HEIC per data e GPS (`exifDaHeic`).
- Python: il venv delle lezioni (`%LOCALAPPDATA%\Lezioni\venv`, py3.12) con `insightface` 2.1 (`python -m ensurepip`
  prima, il venv era senza pip), `opencv-python-headless`, onnxruntime CPU; buffalo_l si scarica da solo in
  `~\.insightface\models\` (280 MB) al primo giro.
- CLIP: `andreasjansson/clip-features` su Replicate, 24 miniature per predizione; le somiglianze restano in
  `catalogo\clip.json`, la soglia si ritocca gratis.
- Nominatim: 1 richiesta al secondo, `User-Agent: pzkko-deutschland (pzkko@yahoo.com)`.
