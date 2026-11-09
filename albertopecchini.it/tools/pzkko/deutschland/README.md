# La pipeline di Deutschland (tools/pzkko/deutschland)

Le foto e i video del viaggio a Monaco e Stoccarda con Mikas, Jonny e Jella (6–9 novembre 2026) per la galleria
`pzkko.it/deutschland/` (la macchinetta delle sigarette che chiede la password). Gli originali stanno su D: (la
cartella «originali» di `C:\pzkko-server\config\deutschland.json`, **solo in lettura**: l'importazione dall'iPhone è
ancora in corso), il catalogo che se ne ricava sta in `C:\pzkko-server\deutschland\` (fuori da GitHub), e lo serve
`C:\pzkko-server\deutschland\server.mjs` dietro il Funnel di Tailscale col biglietto che dà la banca a chi sa la
password (`LEGGIMI.md` lì). Niente di tutto questo entra nel repo: qui c'è solo il codice.

```
D:\…\Viaggio a Munchen e Stuttgard con JMA\   (HEIC 48 MP + _convertiti\*.JPG, DNG, MOV HDR, PNG, JPG) — letti UNA volta
   │ cataloga.mjs (incrementale; le derivate hanno una versione, DERIVATE in comune.mjs)
   ▼
C:\pzkko-server\deutschland\catalogo\cache.json  + dati\s\ (360 webp q62)  dati\m\ (480 webp)  dati\g\ (1400 jpeg q80)
                                                   dati\p\ (poster 720)  dati\v\ (h264)  dati\o\ (TUTTI gli originali: JPEG q85)
   │ posti.mjs → catalogo\posti.json (Nominatim, nomi corretti a mano con fisso: true)
   │ riconosci.py → catalogo\volti-emb.npz, volti-gruppi.json, fogli in tools\pzkko\lavoro\deutschland\volti\gruppo-N.jpg
   │                Alberto → catalogo\volti.json { "1": "pekko", … }
   │ categorie.mjs → catalogo\clip.json (somiglianze), clip-auto.json (tag)
   │ descrivi.mjs → catalogo\didascalie.json (didascalia, persone, tag del VLM) + didascalie-conto.json (la spesa)
   │ a mano → catalogo\tag-mano.json { piu: { id: [tag] }, meno: { id: [tag] } }
   ▼ manifesto.mjs (v2: s, fascio, didascalia, persone)
C:\pzkko-server\deutschland\dati\foto.json (il contratto della galleria) + dati\origini.json (privato: id → DNG su D: per /raw)
   ▼ fasci.mjs
C:\pzkko-server\deutschland\dati\f\<n>.bin (40 miniature s per fascio, nell'ordine del manifesto)
   ▼ carica.mjs
Backblaze B2, bucket privato «pzkko-deutschland» (EU): foto.json, f/ s/ g/ p/ v/ o/ con gli stessi percorsi
```

Dal 9.11 sera **le foto le serve Backblaze B2**, non più il pc di casa: la banca dà a chi sa la password un token di
download di B2 (`C:\pzkko-server\deutschland\b2.mjs`, `cdn: 'b2'`), e la galleria chiede i file dritti al bucket con
`?Authorization=<token>` (`pzkko/deutschland/comune.js`, `indirizzo()`; la coda a 6, la Cache Storage e i fasci sono in
`pzkko/deutschland/rete.js`). Il server di casa su 8790 resta per lo sviluppo in locale e come ripiego (`cdn: 'casa'`,
se `config\b2.json` manca). **I master su D: si leggono una volta sola**: `dati\` e `foto.json` bastano da soli (anche
gli originali scaricabili stanno in `dati\o\`), e dopo il caricamento su B2 Alberto può spostare D: dove vuole; solo
`/raw/<id>.dng` (il DNG, dal server di casa) legge ancora da D: attraverso `origini.json`.

## I comandi, nell'ordine

Dalla cartella `albertopecchini.it`:

```
node tools/pzkko/deutschland/cataloga.mjs            # quello che manca; --solo=5506,5478 per provare; --prova; --rifai; --niente-video; --solo-video; --paralleli=3; --q=85
node tools/pzkko/deutschland/posti.mjs               # i gruppi GPS (≤150 m) coi nomi bozza da Nominatim; --senza-nomi; --raggio=200
%LOCALAPPDATA%\Lezioni\venv\Scripts\python.exe tools\pzkko\deutschland\riconosci.py   # i volti; --soglia=0.45; --fogli; --solo=…
node tools/pzkko/deutschland/categorie.mjs           # CLIP su Replicate (pochi centesimi); --soglia=0.22 rifà solo i tag
node tools/pzkko/deutschland/descrivi.mjs            # le didascalie col VLM (dopo manifesto.mjs: legge foto.json); --solo=20; --rifai=5506,5522; --conta
node tools/pzkko/deutschland/manifesto.mjs           # scrive dati\foto.json (v2); --prova; --pulisci (via i file finti)
node tools/pzkko/deutschland/fasci.mjs --verifica    # dati\f\<n>.bin dalle s\ nell'ordine del manifesto, e li rilegge
node tools/pzkko/deutschland/carica.mjs              # su B2 quello che manca o è cambiato (sha1); --prova; --solo=s,f,foto.json; --max=5; --elenco; --senza-cors
```

## Il caricamento su B2 (`carica.mjs`) e i fasci (`fasci.mjs`)

API nativa B2 via fetch, niente SDK. Le credenziali le legge SOLO `C:\pzkko-server\deutschland\b2.mjs` da
`C:\pzkko-server\config\b2.json` (`{ keyId, key, bucketId, bucket }`, scritto da Alberto): non si stampano mai, né in
console né nei log. `b2_list_file_names` (una chiamata per cartella, `maxFileCount` 10000) per sapere cosa c'è già:
si salta ciò che ha lo stesso sha1 e la stessa dimensione, quindi **dopo un errore si rilancia e riprende**; 4
caricamenti in parallelo (`b2_get_upload_url` uno per lavoratore, `b2_upload_file` con `X-Bz-Content-Sha1`; a un 5xx o
a un errore di rete indirizzo nuovo e fino a 5 tentativi); `Content-Type` giusto, `b2-content-disposition: inline;
filename="IMG_5506.JPG"` su originali e video (il nome col quale il telefono salva), `b2-cache-control` private 24 h
(`foto.json` no-cache); le regole CORS del bucket (`b2_update_bucket`: pzkko.it, anteprime Vercel, localhost; solo
`b2_download_file_by_name`; expose Content-Length e compagnia) a ogni giro. I file che il manifesto non nomina non si
caricano. ~5,4 GB a 1 MB/s ≈ 1,5 ore, in sottofondo; inizio e fine nel log della regia.

Tetti gratuiti di B2: 10 GB, 2.500 download al giorno (classe B) e 2.500 chiamate di classe C (elenchi, indirizzi di
upload, token di download): per questo le miniature viaggiano in **fasci** e gli originali si scaricano solo su «salva».

Il fascio `dati\f\<n>.bin`: 4 byte big-endian = lunghezza L della testa; L byte di JSON `{ "<file s>": [offset, len], … }`
(offset dall'inizio dei dati, dopo la testa); poi i webp in fila. 40 per fascio nell'ordine delle foto del manifesto
(`fascio: n` su ogni voce, `manifesto.fasci = { n, per }`). `fasci.mjs` e `rete.js` devono restare d'accordo su questo.

Misure (9.11, 20 foto): originale JPG 48 MP 9,5 MB → `o` q85 3,06 MB (q90 4,15), `g` 1400 q80 178 KB, `s` 360 q62 10,9 KB,
`m` 480 q72 20,5 KB. Totale stimato su B2: o 4,13 GB + video 1,04 + g 0,17 + s 0,01 + p 0,005 ≈ **5,35 GB**.

## Le didascalie (`descrivi.mjs` → `catalogo\didascalie.json`)

Un modello che guarda la foto, `lucataco/qwen2-vl-7b-instruct` su Replicate (Nvidia L40S, 0,000975 $/s: ~1,5 s a
foto, **tutto l'album ≈ 1,5 $**), scrive per ogni voce del manifesto una didascalia in italiano da album dei ricordi
(≤ 12 parole, mai nomi di persona, mai date né ore: quelle le sa già l'album), conta le persone e sceglie i tag da un
**elenco chiuso**: `gruppo selfie cibo birra notte stadio chiesa strada auto treno hotel natura panorama negozio`, più
`screenshot` e `video` che mette il tipo del file, non il modello. Al modello va la miniatura `m\` (480 px) per le
foto, il poster `p\` per i video, la media `g\` ridotta a 1280 px per gli screenshot (lì conta il testo), come data URL
dentro la richiesta: niente indirizzi pubblici, niente file lasciati su Replicate. Legge `dati\foto.json`, quindi va
dopo un primo `manifesto.mjs`; poi `manifesto.mjs` lo rilancia per unire. Sono stati provati anche `zsxkib/molmo-7b`
(lento, 4–8 s, inventa posti e tagga tutto) e `lucataco/moondream2` (non risponde in JSON): il nome del modello sta
nel campo `modello`, così si distinguono se un giorno se ne cambia.

```json
{ "img-5750": { "didascalia": "Tre amici posano davanti all'Allianz Arena a Monaco", "persone": 3,
                "tag": ["gruppo", "stadio"], "sicuro": ["stadio"], "modello": "qwen" } }
```

- `tag` = quello che il modello dice di vedere (già filtrato sull'elenco; i sinonimi tipo «ristorante» → `cibo`,
  «piazza» → `strada` sono tradotti; `gruppo` resta solo con `persone ≥ 2`); `sicuro` ⊆ `tag`, quelli di cui è certo.
- **Come li unisce `manifesto.mjs`**: un tag di contenuto entra se lo dicono sia CLIP (`clip-auto.json`) sia il VLM
  (`tag`), oppure se il VLM lo ha in `sicuro`; `screenshot` e `video` vengono dal tipo; `persone` va nel manifesto
  com'è (i nomi li danno i volti, `volti.json`); `didascalia` va nel manifesto com'è (il visore la mostra sotto la foto).
- Incrementale: scrive ogni 20 voci e alla fine (Ctrl+C salva e esce), al giro dopo fa solo quello che manca;
  `--rifai=5506,5522` rifà quelle; `--ids=… --prova --secco` stampa la risposta grezza senza salvare (per provare un
  prompt o un modello, `--modello=molmo|moondream`); `--paralleli=6` richieste in volo (al massimo 6; sotto i 10 $ di
  credito Replicate ne accetta 5 di fila e il 429 si riprova da solo). Una risposta senza JSON si ritenta 3 volte, un
  errore di rete 4; gli id che restano fuori si vedono con `--conta` («mancano n voci»).
- `--ripulisci` riapplica gratis la pulizia delle didascalie (via date, ore, «Ricordo di viaggio:», «Viaggio:», nomi,
  oltre 12 parole) a quelle già salvate, dopo un ritocco di `didascaliaPulita`.
- La spesa sta in `catalogo\didascalie-conto.json` (secondi di GPU per modello × prezzo); `--conta` la stampa con la
  distribuzione dei tag.

Per sviluppare la galleria senza le foto vere: `node tools/pzkko/deutschland/finto.mjs` (60 voci finte, 8 posti,
6 video, quadrati colorati) e poi il server aperto:

```
DEUTSCHLAND_APERTO=1 node C:/pzkko-server/deutschland/server.mjs      # bash;  PowerShell: $env:DEUTSCHLAND_APERTO='1'; node C:\pzkko-server\deutschland\server.mjs
```

→ `http://127.0.0.1:8790/foto.json`, `/s/<id>.webp`, `/f/<n>.bin`, `/m/<id>.webp`, `/g/<id>.jpg`, `/o/<id>.jpg`, `/v/<id>.mp4`, `/p/<id>.jpg`, senza
biglietto (solo per le richieste che arrivano dritte dal pc; `pzkko/deutschland/comune.js` lo sa: in locale `stato.url`
è quello). Il manifesto vero, quando c'è, sostituisce quello finto nello stesso file.

## Il manifesto (`dati\foto.json`)

```json
{ "v": 2, "generato": "…", "viaggio": { "titolo": "Monaco e Stoccarda con JMA", "da": "2026-11-06", "a": "2026-11-09" },
  "tag": ["pekko","mikas","jonny","jella","cibo","paesaggi","natura","strada","auto","screenshot","hotel","mezzi","alcool","foto","video", "…i tag nuovi del VLM che compaiono (gruppo, birra, notte, stadio…)"],
  "fasci": { "n": 25, "per": 40 },
  "posti": [{ "id": "p03", "nome": "Marienplatz", "nomeAuto": "Marienplatz, Altstadt-Lehel, München", "lat": 48.13743, "lon": 11.57549, "n": 42 }],
  "tappe": [{ "posto": "p03", "da": 61, "a": 102 }],
  "foto": [{ "id": "img-5506", "tipo": "foto", "nome": "IMG_5506.HEIC", "t": "2026-11-06T21:10:51+01:00", "giorno": "2026-11-06", "ora": "21:10",
             "tStimato": false, "lat": 48.151853, "lon": 11.537111, "gpsStimato": false, "posto": "p01", "w": 6048, "h": 8064,
             "s": "img-5506.webp", "fascio": 1, "m": "img-5506.webp", "g": "img-5506.jpg", "o": "img-5506.jpg", "peso": 3064000, "blur": "data:image/webp;base64,…",
             "col": "#6a5a4a", "tag": ["pekko","cibo","foto"], "volti": 2, "persone": 2, "didascalia": "Brezn e birra all'Hofbräuhaus" }] }
```

- `foto` in ordine di tempo; `tappe` = file consecutive dello stesso posto (indici in `foto`).
- v2 (9.11 sera): `s` la miniatura piccola (360 px) e `fascio` il numero del fascio che la contiene (`rete.js` li
  spacchetta; una voce senza `s` — derivate vecchie — non ha `fascio` e la galleria usa `m`); `persone` (dal VLM, se no
  i volti) e `didascalia` (dal VLM, quando `catalogo\didascalie.json` c'è). `peso` è quello dell'originale servito (`o`).
- Video: `tipo: "video"`, `v` (mp4 h264 ≤1080p, tone-map dall'HDR), `p` (poster), `durata`; `live: true` se è il
  filmato di una Live Photo (stesso numero di una foto: id `img-nnnn-v`, 2-3 secondi). Il MOV originale non si serve;
  la sorgente è il gemello di `_convertiti\` quando c'è, se no l'originale.
- Una voce per numero `IMG_nnnn` (dal 9.11 sera la cartella ha 977 originali e i 353 JPG + 46 MOV convertiti dal
  telefono stanno in `_convertiti\`): il gemello `_convertiti\IMG_nnnn.JPG` è la sorgente di `s`, `m`, `g` e `o` (il
  JPEG a 48 MP risalvato q85 mozjpeg, ruotato e senza metadati, in `dati\o\`: ~3 MB invece di 9,5); il DNG resta `raw`
  (`/raw/<id>.dng`, `pesoRaw`, solo dal server di casa); l'HEIC dà solo data e GPS.
- Senza gemello: DNG → `o` è il JPEG Apple incorporato (4032 px) così com'è, ruotato e ripulito dai metadati, in
  `dati\o\` (niente sviluppo del RAW: deciso da Alberto il 9.11); HEIC → il JPEG q95 decodificato da ffmpeg, in
  `dati\o\`; PNG → copiato com'è; JPG → q85. Il campo `oDa` della cache dice da dove viene (`convertito`, `dng`, `heic`,
  `png`, `jpg`), `ver` la versione delle derivate.
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
