#!/usr/bin/env node
// Deutschland 4 (10.11.2026, Alberto: «ricrea esattamente quello sfondo e questa macchinetta al posto di quell'inizio
// orribile e triste, analizza qualsiasi dettaglio, tutto identico, i miei design di sigarette al posto di quelle da
// selezionare, usa replicate come se fossi dio»; al piano: adesivi e loghi TUTTI INVENTATI, sfondo TUTTA LA VIA, la
// password su un foglietto attaccato al muro, la gialla anche sulla serranda, «metti altri volantini inventati,
// raddoppia il numero di roba»).
// La macchinetta vera sta a Stoccarda vicino a Fangelsbachstraße (foto dell'8.11.2026 alle 14:14, img-6354…6361 del
// catalogo, 48 MP in C:\pzkko-server\deutschland\dati\o\: MAI nel repo). Da lì:
//
//   node tools/pzkko/deutschland/via.mjs rif
//       i riferimenti in tools/pzkko/lavoro/deutschland/via/rif/ (ignorata da Git): la macchinetta di img-6355
//       RADDRIZZATA frontale con un'omografia sui quattro angoli del frontale (presi a mano qui sotto, ANGOLI_6355), così
//       il modello copia la geometria vera invece di inventarla; gli adesivi da vicino (6358), la colonna d'acciaio (6359),
//       il campo da basket (6354), il muro largo (6356), la posta (6360), il lato di fronte (6361), ridotti a 2048 px
//   node tools/pzkko/deutschland/via.mjs genera <automat-nb|automat-gpt|via-nb|…|tutti> [--volte=2]
//       disegna in tools/pzkko/lavoro/deutschland/via/<nome>/ (PNG + JSON dell'input, come immagini.mjs). «nb» =
//       google/nano-banana-pro a 4K (modifica fedele della foto), «gpt» = openai/gpt-image-2 high (a confronto)
//   node tools/pzkko/deutschland/via.mjs recupera <nome> <id-predizione>
//   node tools/pzkko/deutschland/via.mjs contatto
//       il foglio di contatto di tutte le prove (lavoro/deutschland/via-v1.png): da GUARDARE prima di scegliere
//
// Le immagini scelte le prepara per la pagina `automat.mjs` (chiave, vetrinette, pacchetti, misure in muro-dati.js).
// Ogni generazione costa ≈ 0,15–0,30 $; i prompt stanno QUI così ogni immagine si rifà uguale.
import { mkdir, readdir, readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { ROOT, die, predict, prediction, salva, upload } from '../../replicate.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/deutschland/via')
const RIF = join(LAVORO, 'rif')
const ORIGINALI = process.env.PZKKO_DEUTSCHLAND_O || 'C:\\pzkko-server\\deutschland\\dati\\o'
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const ce = (f) => access(f).then(() => true, () => false)
const NB = 'google/nano-banana-pro', GPT = 'openai/gpt-image-2'

// ── i riferimenti ──────────────────────────────────────────────────────────────────────────────────────────────────
/** Gli angoli del frontale giallo+acciaio in img-6355 (frazioni della foto, da in alto a sinistra in senso orario):
 *  sopra il bordo del coperchio, sotto il fondo della fascia d'acciaio della bocchetta. L'altezza vera sta alla
 *  larghezza come 1,35 (provato sulle proporzioni degli adesivi visti di fronte in 6358). */
const ANGOLI_6355 = [[0.125, 0.248], [0.705, 0.288], [0.7, 0.79], [0.13, 0.893]]
const ALTO_SU_LARGO = 1.35

/** Raddrizza il quadrilatero `quad` di `src` in un rettangolo W × W·asp, con i margini [l, t, r, b] in frazioni di W
 *  (fuori dalla foto: magenta). Omografia dal quadrato unitario, campionamento bilineare. */
async function raddrizza(src, out, quad, asp, W, [ml, mt, mr, mb], scala = 3024) {
  const { data, info } = await sharp(src).resize({ width: scala }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const SW = info.width, SH = info.height, H = Math.round(W * asp)
  const OW = Math.round(W * (1 + ml + mr)), OH = Math.round(H + W * (mt + mb))
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad.map(([x, y]) => [x * SW, y * SH])
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3
  const den0 = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den0, h = (dx1 * sy - sx * dy1) / den0
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3
  const o = Buffer.alloc(OW * OH * 3)
  for (let Y = 0; Y < OH; Y++) for (let X = 0; X < OW; X++) {
    const u = (X - W * ml) / W, v = (Y - W * mt) / H, den = g * u + h * v + 1
    const x = (a * u + b * v + x0) / den, y = (d * u + e * v + y0) / den, i = (Y * OW + X) * 3
    if (x < 0 || y < 0 || x >= SW - 1 || y >= SH - 1) { o[i] = 255; o[i + 1] = 0; o[i + 2] = 255; continue }
    const xa = Math.floor(x), ya = Math.floor(y), fx = x - xa, fy = y - ya
    for (let k = 0; k < 3; k++) {
      const p = (yy, xx) => data[(yy * SW + xx) * 3 + k]
      o[i + k] = (p(ya, xa) * (1 - fx) + p(ya, xa + 1) * fx) * (1 - fy) + (p(ya + 1, xa) * (1 - fx) + p(ya + 1, xa + 1) * fx) * fy
    }
  }
  await sharp(o, { raw: { width: OW, height: OH, channels: 3 } }).jpeg({ quality: 90 }).toFile(out)
  return [OW, OH]
}

const RIDOTTE = { adesivi: 6358, colonna: 6359, campo: 6354, muro: 6356, posta: 6360, fronte: 6361 }

async function rif() {
  await mkdir(RIF, { recursive: true })
  // 2:3 esatto (come l'uscita del modello): 1600 × 2160 il frontale, più i margini (sotto c'è il piede fino a terra)
  const [w, h] = await raddrizza(join(ORIGINALI, 'img-6355.jpg'), join(RIF, 'automat-frontale.jpg'), ANGOLI_6355, ALTO_SU_LARGO, 1600, [0.09, 0.05, 0.09, 0.37])
  console.log(`✓ rif/automat-frontale.jpg (${w}×${h})`)
  for (const [nome, id] of Object.entries(RIDOTTE)) {
    await sharp(join(ORIGINALI, `img-${id}.jpg`)).resize({ width: 1536 }).jpeg({ quality: 88 }).toFile(join(RIF, `${nome}.jpg`))
    console.log(`✓ rif/${nome}.jpg (img-${id})`)
  }
}

// ── i prompt ───────────────────────────────────────────────────────────────────────────────────────────────────────
const MAGENTA = 'Everything that is not the machine and its stand is a perfectly flat, solid, uniform pure magenta (#FF00FF), edge to edge: no wall, no pavement, no shadow on the background, no gradient, no vignette.'

// Ogni adesivo vero → il suo gemello inventato (stessa forma, misura, colore e posto; scritte e marchi nuovi)
const SOSTITUZIONI = [
  'top-left, the white Mastercard sticker → a white sticker of the same size with an invented card logo: a teal circle overlapping a yellow square, the word "kartix" under it',
  'below it, the white VISA sticker → a white sticker with the invented word "NOVAPAY" in heavy dark-blue italic capitals',
  'the brown rectangular club sticker with the round red-and-white bell badge on top of it → same brown rectangle with "JMA · AUSWÄRTS" in cream letters, and the round badge with a black-and-white beer stein instead of the bell, ring text "WASEN KURVE 26"',
  'the round dark-burgundy sticker with a small portrait and political text → same round burgundy sticker with the small portrait drawing and the harmless text "MONTAG IST ZWANG · KAFFEE IST PFLICHT"',
  'the lime-green payment sticker with the arrow and steps 1–2 and the black contactless card reader → keep the sticker and the reader exactly (the reader is a real device), but its logos become an invented blue square logo "kartix", texts "Karte hin!", "1 Karte 3 Sekunden hinhalten", "2 Packung wählen", "kontaktlos zahlen"',
  'the big white panel with the vending company name "GENGENBACH", the brown and teal underlines, "KAFFEE HYGIENE" and the black stylised head on its right → same white panel and same thin geometric capitals but the invented company "LINDENBACH" and "AUTOMATEN SERVICE", the black emblem on the right becomes a stylised black stag head; keep the big grey spray-paint tag scribbled across the top of the panel',
  'the small pink-bordered "Bezahlung auch mit Smartphone möglich" sticker → same sticker, same text, its three little logos become invented ones',
  'the tilted burgundy/pink photo-collage sticker "Gegen Krieg & Kapital – Jugend zum Kampf!" → same tilted collage sticker with fireworks photos reading "MÜNCHEN – STUTTGART · JMA TOUR 2026"',
  'the long black diagonal strip sticker "SÜDBANDE" with a white horse at its end → same black strip with white letters "NECKARBANDE" and the white horse',
  'the coiled green-and-yellow cobra sticker with a woman\'s face → keep a similar coiled cobra illustration sticker',
  'the light-blue event poster sticker "Der goldene Gaul" with a QR code → same light-blue poster sticker reading "DER SILBERNE ESEL · 08.11.26 · BAD CANNSTATT" with a fake QR',
  'the "girocard" sticker with a blue keypad pictogram → same sticker, the word becomes "kartengeld"',
  'the crossed-out coins pictogram, and the dark grey panel "Sicher und hygienisch bargeldlos bezahlen!" → keep them as they are (generic text)',
  'the round black-and-red antifascist flag sticker → a round white sticker with a black ring and a red pretzel in the middle, ring text "BREZN AKTION"',
  'the small black photo sticker "Antifa heißt…" → a small photo sticker of a Currywurst with the text "Currywurst heißt Liebe!"',
  'the red-and-white bar sticker with the round bell badge and a yellow-black crest → same red-and-white bar with a round beer-stein badge and a plain yellow shield with three black antlers',
  'the black spray tags in the middle and the big silver tag "WENDI" at the bottom of the yellow front → the same strokes and size, invented letters "JONNI"',
  '"Karte drauf, Packung raus!" with the contactless icon and the small line under it → "Karte drauf, Schachtel raus!" and "Bezahlung an diesem Automaten nur mit Karte!"',
  'on the steel column, the white company sticker with a phone number → "Automaten JMA GmbH · Stuttgart · 0711 260 11 08"',
  'the big black loopy marker tag across the top edge of the yellow front and the silver tags on the top steel box → same strokes, invented letters',
]
// Il doppio della roba: altrettanti pezzi nuovi, inventati, nello stile da strada (mai sopra vetrinette, display, cartello)
const AGGIUNTE = [
  'a small yellow sticker with the black letters "JMA" and a red and a black diagonal stripe, slightly peeled, near the top-left payment stickers',
  'a round green sticker of the East German traffic-light man (Ampelmännchen) on the left side panel',
  'a white sticker with a Currywurst in a paper tray, half torn, on the yellow below the club sticker',
  'a glossy pretzel (Brezel) sticker overlapping the edge of the white panel',
  'a blue square "U" metro sign sticker on the left side panel, lower',
  'a blue motorway-sign sticker (white road-and-bridge pictogram) on the yellow at the right of the black sheet',
  'two stacked German number-plate stickers "M · JMA 2026" and "S · PZK 56" on the yellow, lower middle',
  'a black-and-white band sticker "DIE KIPPEN · LIVE IM KELLER" slightly crooked',
  'a neon-pink party sticker "TECHNO IM WASEN · FR 23 UHR"',
  'a small paper note "Zu verschenken: Sofa" with a row of tear-off phone-number strips, some already torn off, taped on the yellow under the payment stickers',
  'the white remains of three scraped-off stickers (paper fibres and glue rectangles) on the yellow front',
  'a tiny round "pzkko" sticker, black with white lowercase letters',
  'a small orange "Bildschirm" sticker with a pixel screen icon on the left side panel',
  'a small dark-green "Schwarzwald" sticker with fir trees, corner curling',
  'a red "Südkurve 1900" sticker with a stadium silhouette, half covered by a tag',
  'two small stickers on the steel column only in the free metal areas: a white "Bitte nicht treten" and a yellow smiley',
  'one more thin black marker tag on the top steel box',
  'a sticker of a cat\'s face with "Wo ist Mausi?" on the lower yellow front',
]

const AUTOMAT = `Image 1 is a perspective-corrected photo of a real yellow German cigarette vending machine on a travertine wall in Stuttgart; images 2 and 3 show its stickers and its steel selection column close up and straight on. Recreate THIS EXACT machine as a perfectly frontal, orthographic, photorealistic product photograph: identical proportions, identical layout, identical colours and wear, every element in the same place and at the same size, same soft daylight of an autumn afternoon (light from the upper left), the same scratches, dents, stains, peeling paint and dirt. Keep the whole thing: the melon-yellow painted steel body with its slightly protruding lid and the left side panel visible in a thin strip; the brushed stainless steel selection column on the right with its top box, the card slot and the small LCD display with the small light square window next to it, the small round button, the 4 columns × 5 rows of pack windows, the mandatory EU warning sign at the right of the windows (keep its German text exactly: "Packungen im Automaten tragen den aktuellen, grafischen Warnhinweis. Beispiel siehe unten.", "Rauchen verursacht 9 von 10 Lungenkarzinomen" with the photo of the sick man in bed, "ZIGARETTEN-MARKE", "Rauchen ist tödlich", "Tabakrauch enthält über 70 Stoffe, die erwiesenermaßen krebserregend sind."), the round hole, the big lock cylinder and the angled steel chute at the lower right; the wide stainless steel band across the bottom with the long dispensing slot (yellow edge inside), the screws, the small round lock, the square coin opening, the green "Störung am Automat?" QR sticker (number "26110"); under it the galvanised steel wall stand made of perforated panels with square holes, down to the ground; the big plain black sheet of paper glued at the lower left of the yellow front (keep it matte black and empty).
The 20 pack windows: each one is a PERFECTLY UNIFORM SOLID PURE BLUE (#0000FF) rectangle with sharp edges, exactly where the cigarette packs are: no packs, no price tags, no reflections inside. The small LCD display is a PERFECTLY UNIFORM SOLID PURE GREEN (#00FF00) rectangle. Nowhere else use pure blue or pure green.
NO real brand, logo or political sign may remain. Replace every sticker and logo with its invented twin, same shape, size, colours, tilt, position and wear:
- ${SOSTITUZIONI.join('\n- ')}
Then ADD these new invented street stickers and flyers, so the machine carries about twice as many things, overlapping and weathered like real street stickers (never on the pack windows, the LCD, the EU warning sign, the dispensing slot or the black sheet):
- ${AGGIUNTE.join('\n- ')}
All writing in German, spelled exactly as given and perfectly legible. No people, no hands. ${MAGENTA}`

const VIA = `Create one wide photorealistic street panorama of a single street in Stuttgart on an autumn afternoon (8 November, about 2 pm, sun between big white clouds in a blue sky, soft light from the left), photographed perfectly frontally from the opposite pavement with a long lens, so all facades are flat and parallel to the image, no perspective convergence, camera at eye height. It is a continuous scene, from left to right, recreated faithfully from the reference photos:
1) LEFT THIRD (image 1): a sports court behind a tall dark-green welded wire mesh fence with dark poles; a big maple tree with yellow-orange leaves overhangs the fence from the top-left; through the fence the asphalt court with white lines, a small football goal and an angled grey basketball hoop pole; behind it a sports hall with a pale green glass facade, a flat canopy and a red pillar at its entrance, light apartment blocks with a rounded tower behind, orange autumn trees; fallen leaves on the ground; a few faded flyers stuck on the fence poles ("Flohmarkt Sa 10 Uhr", "Nachhilfe Mathe", "Hund entlaufen") and stickers on the hoop pole.
2) MIDDLE THIRD (images 2 and 3): the ground floor of an old building clad in large porous beige-grey travertine slabs with thin joints, heavily tagged with graffiti exactly in this style: a huge black tag at the top, white scribbles and drips at the left, a blue tag, a black tag with a cross, red letters lower right, thin black tags; at the right edge of this section the corner of the building with a window frame reflecting the sky. In the CENTRE of this middle section the wall has a clean empty area about 1.0 m wide and 1.9 m high, from the pavement up, where a vending machine would hang: DO NOT draw any vending machine, box or object there, only the travertine wall with a few faint graffiti strokes and a slightly darker clean rectangle of stone where something hung for years. Around it, on the wall, add many invented paper flyers and posters pasted or taped on the stone, some torn off with older layers underneath: "Zimmer frei – ab sofort", "Katze vermisst: Mausi", "Deutschkurs A1–B2 abends", "Konzert im Keller: DIE KIPPEN", "JMA Abschiedsparty 8.11.", and small stickers on the joints.
3) RIGHT THIRD (image 4): the same building continues with a small parcel shop: travertine pillars and plinth, two large shop windows covered from inside by white posters with a big navy-blue lower band and the invented logo "NECKARPOST+" in dark blue and light-blue italic letters with a small blue plus badge, and the line "Regional. Deutschlandweit. Weltweit."; the ochre spray letters "TSBAF GLM" painted along the stone lintel above the windows; red, blue, purple and green tags on the stone between and below the windows, a small ventilation grille; above, cream plaster with white windows of the first floor; a few more invented flyers taped on the pillars ("Umzugshelfer gesucht", "Yoga im Park").
Along the whole bottom: the same grey square concrete pavement slabs and a granite edge, fallen yellow leaves. No people, no cars in front, no real brands. Everything spelled exactly as given.`

// Il secondo giro sulla macchinetta scelta (automat-nb/9ae5aj.png del 10.11 sera: fotografica e fedele, ma con alcuni
// marchi e segni politici veri rimasti e qualche scritta storpiata). Ritoccarla tutta intera non va (il modello incolla
// gli adesivi nuovi dove capita, sul foglio nero, e lascia quelli vecchi): si ritaglia un riquadro attorno a OGNI pezzo
// da cambiare, si ritocca solo il ritaglio, e lo si rimette al suo posto sfumando l'orlo (il resto resta identico al
// pixel). I riquadri sono in pixel della 3392 × 5056.
const SORGENTE = 'automat-nb/9ae5aj.png'
const CROP = 'This is a close-up crop of a weathered yellow cigarette vending machine covered in street stickers. Keep the framing, the scale, the light, the photographic texture, the scratches and every other sticker exactly as they are; change ONLY this: '
const RITOCCHI = {
  tondo: { box: [1990, 1700, 2320, 2050], prompt: 'the round sticker with the thick black ring and the red-and-black flag becomes a round white sticker with a thick black ring, a glossy red-brown pretzel in the middle and the ring text "BREZN AKTION · STUTTGART", same size and position. Do not add or change any other text.' },
  foto: { box: [1990, 2140, 2280, 2380], prompt: 'the small dark photo sticker (a flag and blue handwriting) becomes a small photo sticker of a Currywurst in a paper tray with the white handwritten text "Currywurst heißt Liebe!", same size and position. Do not add or change any other text.' },
  testa: { box: [1780, 1015, 2290, 1360], prompt: 'the big black graphic emblem on the white panel (a stylised human profile with a feathered headdress, drawn as flat black shapes with white cuts) must be COMPLETELY replaced by a black stylised fox head in profile looking left, in the same flat black-and-white graphic style and the same size. Nothing of the old emblem may remain.' },
  volpe: { box: [1700, 860, 2320, 1480], prompt: 'the large black graphic emblem in the middle of this crop (a stylised human profile wearing a feathered headdress, flat dark-grey shapes with white cuts, printed on the white panel) is replaced by a large stylised FOX HEAD in profile looking left, printed in the same flat dark-grey colour with white cut lines, same size and position, on the same white panel. The pink-bordered sticker at the top left, the grey spray tag, the letters at the left and the stickers at the bottom stay exactly as they are.' },
  giro: { box: [820, 1860, 1250, 2200], prompt: 'on the white sticker with the blue keypad pictogram, the blue word "girocard" becomes the single word "kartengeld" in the same blue rounded font, same size; there is no other text on this sticker.' },
  verde: { box: [1600, 140, 2340, 760], prompt: 'the lime-green payment sticker and the black card reader get crisp, perfectly legible texts, exactly: at the top "kartix" with the contactless waves and "Karte hin!"; next to "1" on the left "Karte 3 Sekunden hinhalten bis zum Piep"; next to "2" "Packung wählen"; on the black bar at the bottom "kontaktlos zahlen"; on the card reader the small yellow lines "1 Karte 3 Sekunden hinhalten" and "2 Packung wählen". No girocard logo: a small white square with "kartix" instead.' },
  ditta: { box: [2440, 790, 2760, 990], prompt: 'only the text on the small white sticker with the thin red border changes: it becomes crisp and legible, exactly three lines: "Automaten JMA GmbH", "Fangelsbachstr. 8 · Stuttgart", "Tel. 0711 260 11 08".' },
  gatto: { box: [2850, 470, 3120, 760], prompt: 'the text under the cat face sticker reads exactly "Wo ist Mausi?".' },
}

const ORTO = `Image 1 is a yellow German cigarette vending machine on a magenta background; images 2 and 3 are real close-up photos of the same kind of machine for material and wear reference. Redraw the machine of image 1 as a PERFECTLY ORTHOGRAPHIC FRONT ELEVATION: the camera is exactly perpendicular to the front face and centred on it, zero perspective, zero tilt: every horizontal edge perfectly horizontal and every vertical edge perfectly vertical, the left and right outer edges of the box are straight vertical lines, NO side panel visible at all (no thin strip of the left side), the top lid seen exactly edge-on (only its front edge), the steel band at the bottom and the galvanised perforated stand straight below, centred, down to the bottom of the machine. Keep EVERYTHING on the front exactly as in image 1, same positions and proportions: every sticker, flyer, tag and their texts (kartix, NOVAPAY, JMA · AUSWÄRTS / WASEN KURVE 26, MONTAG IST ZWANG, the lime-green kartix sticker with the black card reader, LINDENBACH AUTOMATEN SERVICE with the fox head, the stag, U, the cobra, NECKARBANDE strip, MÜNCHEN – STUTTGART JMA TOUR 2026, DER SILBERNE ESEL, Sicher und hygienisch, the round BREZN AKTION · STUTTGART sticker, the Currywurst and beer mug stickers, kartengeld, M · JMA 2026, JONNI, Karte drauf, Schachtel raus!, the black sheet of paper, S · PZK 56, Zu verschenken: Sofa, Störung am Automat? QR, Südkurve 1900, Schwarzwald, Bildschirm, Bitte nicht treten, the cat stickers "Wo ist Mausi?", the white "Automaten JMA GmbH" plate), the brushed steel selection column with the 20 pack windows in 4 columns × 5 rows, the EU warning sign next to them, the lock, the angled chute at the lower right, the dispensing slot. The 20 pack windows stay PERFECTLY UNIFORM SOLID PURE BLUE (#0000FF) rectangles, the small display stays a PERFECTLY UNIFORM SOLID PURE GREEN (#00FF00) rectangle; nowhere else pure blue or green. Photorealistic, soft even daylight from the upper left, same wear, scratches and dirt. ${MAGENTA}`

// Il muro da vicino (10.11 notte, Alberto: «rifai il muro con replicate da zero»): con la macchinetta grande al centro il
// panorama si vedeva ingrandito oltre la sua risoluzione; questo è solo il pezzo di muro intorno a lei, di fronte, a 4K,
// col posto vuoto al centro (la macchinetta ci va sopra: automat.mjs MURO_POSTO)
const MURO = `Create one photorealistic photograph of a wall in Stuttgart, recreated faithfully from the reference photos: the ground floor of an old building clad in large porous beige-grey TRAVERTINE slabs (big rectangular slabs, thin joints, holes and pores, weathered, slightly dirty at the bottom), photographed PERFECTLY FRONTALLY (camera exactly perpendicular to the wall, no perspective, joints perfectly horizontal and vertical), soft daylight of an autumn afternoon from the upper left. The frame shows about 4.5 m of wall in width; at the very bottom (the lowest 13% of the image) the grey square concrete pavement slabs seen from slightly above with a few yellow fallen leaves, the wall standing on it.
EMPTY CENTRE: the central part of the wall, from 37% to 63% of the width and from 18% of the height down to the pavement, is clean travertine with NOTHING on it: no graffiti, no poster, no object, no shadow (a vending machine will be placed there later). Do not draw any vending machine.
Around the empty centre, the wall is covered exactly in the spirit of the reference photos, densely, about twice as much as a normal wall: huge black spray tags across the top (big loopy letters like "DOS" and "TOSS"), white drippy scribbles and tags on the left, a big blue tag "COAK" on the upper right, a black tag "OT" with a cross on the right, big red letters "BOY" lower right, thin black marker tags everywhere; many invented paper flyers and posters pasted or taped on the stone, some torn with older layers underneath, some wet and wrinkled: "Zimmer frei – ab sofort", "Katze vermisst: Mausi" with a cat photo, "Deutschkurs A1–B2 abends", "Konzert im Keller: DIE KIPPEN", "JMA Abschiedsparty 8.11.", "Flohmarkt Sa 10 Uhr", "Nachhilfe Mathe", "Umzugshelfer gesucht", "Yoga im Park", a gig poster "TECHNO IM WASEN", tear-off phone number strips; small stickers on the joints. At the far right edge, the corner of the building with part of a grey metal window frame reflecting the sky. All writing in German, spelled exactly as given. No people, no brands, no political symbols. Everything sharp and detailed.`

/** Le immagini: nome → modello, riferimenti (in rif/), input. */
const IMMAGINI = {
  'automat-nb': { modello: NB, rif: ['automat-frontale.jpg', 'adesivi.jpg', 'colonna.jpg'], input: { prompt: AUTOMAT, aspect_ratio: '2:3', resolution: '4K', output_format: 'png', safety_filter_level: 'block_only_high' } },
  'automat-gpt': { modello: GPT, rif: ['automat-frontale.jpg', 'adesivi.jpg', 'colonna.jpg'], input: { prompt: AUTOMAT, aspect_ratio: '1024x1536', quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' } },
  // Deutschland 4 bis (10.11 notte, Alberto: «crea la macchinetta da zero frontalmente perfettamente in vista
  // perpendicolare»): la stessa macchinetta finita (automat-finale, coi suoi adesivi inventati), ridisegnata come un
  // prospetto: fotocamera esattamente perpendicolare, nessun fianco, nessuna fuga
  'automat-orto': { modello: NB, rif: ['automat-finale.jpg', 'adesivi.jpg', 'colonna.jpg'], input: { prompt: ORTO, aspect_ratio: '2:3', resolution: '4K', output_format: 'png', safety_filter_level: 'block_only_high' } },
  'muro-nb': { modello: NB, rif: ['automat-frontale.jpg', 'muro.jpg', 'posta.jpg', 'adesivi.jpg'], input: { prompt: MURO, aspect_ratio: '16:9', resolution: '4K', output_format: 'png', safety_filter_level: 'block_only_high' } },
  'via-nb': { modello: NB, rif: ['campo.jpg', 'muro.jpg', 'adesivi.jpg', 'posta.jpg', 'fronte.jpg'], input: { prompt: VIA, aspect_ratio: '21:9', resolution: '4K', output_format: 'png', safety_filter_level: 'block_only_high' } },
}
const quale = (n) => IMMAGINI[n] || die(`nessuna immagine «${n}»: ${Object.keys(IMMAGINI).join(', ')}`)

const caricati = new Map()
async function carica(f) {
  if (!caricati.has(f)) caricati.set(f, upload(join(RIF, f)))
  return caricati.get(f)
}

async function genera(nome) {
  const im = quale(nome)
  for (const f of im.rif) if (!(await ce(join(RIF, f)))) die(`manca rif/${f}: prima «via.mjs rif»`)
  const urls = await Promise.all(im.rif.map(carica))
  const input = { ...im.input, [im.modello === NB ? 'image_input' : 'input_images']: urls }
  console.log(`→ ${nome} (${im.modello}, ${im.rif.length} riferimenti), attendo…`)
  const p = await predict(input, `node tools/pzkko/deutschland/via.mjs recupera ${nome}`, im.modello)
  await salva(p, join(LAVORO, nome), { immagine: nome, modello: im.modello, rif: im.rif })
}

async function contatto() {
  const voci = []
  for (const n of Object.keys(IMMAGINI)) for (const f of (await readdir(join(LAVORO, n)).catch(() => [])).filter((f) => f.endsWith('.png')).sort()) voci.push([`${n}/${f}`, join(LAVORO, n, f)])
  if (!voci.length) die('nessuna prova: prima «genera»')
  const W = 900, H = 900, C = Math.min(4, voci.length), R = Math.ceil(voci.length / C), strati = []
  for (const [i, [nome, file]] of voci.entries()) {
    const x = (i % C) * W, y = Math.floor(i / C) * H
    const b = await sharp(file).resize({ width: W - 20, height: H - 50, fit: 'inside' }).png().toBuffer({ resolveWithObject: true })
    strati.push({ input: b.data, left: x + Math.round((W - b.info.width) / 2), top: y + 10 })
    strati.push({ input: Buffer.from(`<svg width="${W}" height="40"><text x="${W / 2}" y="28" font-family="Arial" font-size="22" fill="#eee" text-anchor="middle">${nome}</text></svg>`), left: x, top: y + H - 40 })
  }
  const out = join(ROOT, 'tools/pzkko/lavoro/deutschland/via-v1.png')
  await sharp({ create: { width: W * C, height: H * R, channels: 4, background: { r: 40, g: 40, b: 40, alpha: 1 } } }).composite(strati).png().toFile(out)
  console.log(`✓ ${out}`)
}

/** Ritocca i ritagli (tutti, o quelli nominati) in parallelo: ritocchi/<nome>/<…>.png */
async function ritocca(nomi) {
  const scelti = nomi.length ? nomi : Object.keys(RITOCCHI)
  const src = join(LAVORO, SORGENTE)
  await Promise.all(scelti.map(async (n) => {
    const r = RITOCCHI[n] || die(`nessun ritocco «${n}»: ${Object.keys(RITOCCHI).join(', ')}`)
    const [x0, y0, x1, y1] = r.box, f = join(RIF, `ritaglio-${n}.png`)
    await sharp(src).extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).png().toFile(f)
    const input = { prompt: CROP + r.prompt, image_input: [await upload(f)], aspect_ratio: 'match_input_image', resolution: '2K', output_format: 'png', safety_filter_level: 'block_only_high' }
    console.log(`→ ritocco ${n}`)
    const p = await predict(input, `node tools/pzkko/deutschland/via.mjs recupera ritocchi/${n}`, NB)
    await salva(p, join(LAVORO, 'ritocchi', n), { ritocco: n, box: r.box })
  }))
}

// La macchinetta finita (10.11 sera, guardata pezzo per pezzo): sulla 9ae5aj, nell'ordine, i ritocchi riusciti, ognuno
// incollato SOLO dentro la sua maschera (rettangoli in pixel della sorgente, orlo sfumato), poi i pezzi disegnati qui
// (testo esatto garantito, dove il modello storpiava): il tondo «BREZN AKTION», gli sticker del viaggio sopra il
// vecchio adesivo con la bandiera, «kartengeld», la targhetta della ditta.
const FINALE = [
  { file: 'verde/20261110-203955-p8bvds-1.png' },
  { file: 'gatto/20261110-203955-10bd15-1.png' },
  { file: 'volpe/20261110-204317-h5t4s1-1.png', maschera: [[1800, 1015, 2300, 1338], [2040, 950, 2300, 1020]] },
  { file: 'testa/20261110-204006-agbhm9-1.png', maschera: [[1688, 765, 2058, 1030]] }, // (il rosa «Bezahlung auch mit Smartphone»)
]
const ART_DE = join(ROOT, 'pzkko/art/deutschland')
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/** Una scritta in cerchio (librsvg non sa fare textPath): una lettera alla volta, ruotata, in senso orario. */
function anello(testo, cx, cy, r, px) {
  const larga = (c) => (c === ' ' ? 0.3 : c === '·' ? 0.4 : /[MW]/.test(c) ? 0.86 : /[IJ1]/.test(c) ? 0.34 : 0.7) * px
  const tot = [...testo].reduce((a, c) => a + larga(c), 0), scala = (2 * Math.PI * r) / tot
  let ang = -Math.PI * 0.85
  return [...testo].map((c) => {
    const d = (larga(c) * scala) / r, a = ang + d / 2
    ang += d
    if (c === ' ') return ''
    const x = (cx + r * Math.cos(a)).toFixed(1), y = (cy + r * Math.sin(a)).toFixed(1), g = ((a * 180) / Math.PI + 90).toFixed(1)
    return `<text x="${x}" y="${y}" transform="rotate(${g} ${x} ${y})" text-anchor="middle" dy="0.35em" font-family="Arial" font-weight="700" font-size="${px}" fill="#f4f2ec">${esc(c)}</text>`
  }).join('')
}

/** Un pezzo disegnato in SVG (coordinate della sorgente) → strato per sharp, un filo sfocato come la foto. */
async function disegno(x0, y0, w, h, corpo, sfoca = 0.6) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${x0} ${y0} ${w} ${h}">${corpo}</svg>`
  return { input: await sharp(Buffer.from(svg)).blur(sfoca).png().toBuffer(), left: x0, top: y0 }
}

/** Uno sticker del viaggio (art/deutschland/sticker/<nome>.webp) largo w, ruotato, con un filo d'ombra. */
async function sticker(nome, cx, cy, w, gradi) {
  const img = await sharp(join(ART_DE, 'sticker', `${nome}.webp`)).resize({ width: w }).rotate(gradi, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).modulate({ brightness: 0.96, saturation: 0.9 }).png().toBuffer({ resolveWithObject: true })
  const ombra = await sharp(img.data).ensureAlpha().linear([0, 0, 0, 0.35], [0, 0, 0, 0]).blur(4).png().toBuffer()
  const left = Math.round(cx - img.info.width / 2), top = Math.round(cy - img.info.height / 2)
  return [{ input: ombra, left: left + 3, top: top + 5 }, { input: img.data, left, top }]
}

async function componi() {
  const strati = []
  for (const { file, maschera } of FINALE) {
    const meta = JSON.parse(await readFile(join(LAVORO, 'ritocchi', file.replace(/-1.png$/, '.json')), 'utf8'))
    const [x0, y0, x1, y1] = meta.box, w = x1 - x0, h = y1 - y0, F = 14
    const zone = (maschera ?? [[x0 + 24, y0 + 24, x1 - 24, y1 - 24]]).map(([a, b, c, d]) => `<rect x="${a - x0}" y="${b - y0}" width="${c - a}" height="${d - b}" fill="#fff"/>`).join('')
    const m = Buffer.from(`<svg width="${w}" height="${h}"><defs><filter id="s"><feGaussianBlur stdDeviation="${F / 2.5}"/></filter></defs><g filter="url(#s)">${zone}</g></svg>`)
    // (in due passi: nella stessa catena sharp toglie l'alfa DOPO joinChannel, e lo strato tornava opaco)
    const rgb = await sharp(join(LAVORO, 'ritocchi', file)).resize({ width: w, height: h, fit: 'fill' }).removeAlpha().raw().toBuffer()
    const alfa = await sharp(m).extractChannel(3).raw().toBuffer()
    const px = Buffer.alloc(w * h * 4)
    for (let i = 0; i < w * h; i++) { px[i * 4] = rgb[i * 3]; px[i * 4 + 1] = rgb[i * 3 + 1]; px[i * 4 + 2] = rgb[i * 3 + 2]; px[i * 4 + 3] = alfa[i] }
    const pezzo = await sharp(px, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
    strati.push({ input: pezzo, left: x0, top: y0 })
    console.log(`  ${file}`)
  }
  // il tondo «BREZN AKTION» al posto di quello con la bandiera (che arriva fino a y 2057: centro 2124, 1884; raggio 176)
  const brezel = (await sharp(join(ART_DE, 'sticker', 'brezel.webp')).resize({ width: 220 }).png().toBuffer()).toString('base64')
  strati.push(await disegno(1940, 1700, 372, 372, `
    <defs><path id="giro" d="M 2124 1884 m -150 0 a 150 150 0 1 1 300 0 a 150 150 0 1 1 -300 0"/></defs>
    <circle cx="2126" cy="1888" r="178" fill="#000" opacity=".22"/>
    <circle cx="2124" cy="1884" r="176" fill="#f1efe9"/>
    <circle cx="2124" cy="1884" r="168" fill="#17181a"/>
    <circle cx="2124" cy="1884" r="130" fill="#f4f2ec"/>
    ${anello('BREZN AKTION · STUTTGART · SEIT 2026 · ', 2124, 1884, 149, 30)}
    <image xlink:href="data:image/png;base64,${brezel}" x="2014" y="1774" width="220" height="220"/>`))
  // sopra il vecchio adesivo con la bandiera (2005–2250 × 2075–2440): la Currywurst e la Maß del viaggio
  strati.push(...(await sticker('currywurst', 2128, 2190, 300, -6)), ...(await sticker('mass', 2140, 2370, 230, 7)))
  // «girocard» → «kartengeld» (la parola sta in 885–1190 × 2140–2210)
  strati.push(await disegno(860, 2112, 360, 104, `<rect x="868" y="2120" width="344" height="92" fill="#eef0f1"/>
    <text x="1040" y="2200" text-anchor="middle" font-family="Segoe UI, Arial" font-weight="600" font-size="78" letter-spacing="-1" fill="#22408f">kartengeld</text>`, 0.7))
  // la targhetta della ditta (dentro il bordo rosso: 2472–2712 × 800–962)
  strati.push(await disegno(2470, 798, 244, 166, `<rect x="2472" y="800" width="240" height="162" rx="6" fill="#eceeee"/>
    <g font-family="Arial" text-anchor="middle" fill="#1d1d1d">
    <text x="2592" y="836" font-weight="700" font-size="21">${esc('Automaten JMA GmbH')}</text>
    <text x="2592" y="866" font-size="17">${esc('Fangelsbachstraße 8')}</text>
    <text x="2592" y="889" font-size="17">${esc('70180 Stuttgart')}</text>
    <text x="2592" y="926" font-weight="700" font-size="23">${esc('☎ 0711 260 11 08')}</text>
    <text x="2592" y="952" font-size="12">${esc('www.pzkko.it · Störung? Anrufen!')}</text></g>`, 0.55))
  const out = join(LAVORO, 'automat-finale.png')
  await sharp(join(LAVORO, SORGENTE)).composite(strati).png().toFile(out)
  console.log(`✓ ${out}`)
}

// Il cartello obbligatorio a destra delle vetrinette (il modello ne storpiava le scritte piccole): i suoi testi veri,
// disegnati sopra nei riquadri della foto (pixel della 3392 × 5056; la foto del malato, «ZIGARETTEN-MARKE» e «Rauchen
// ist tödlich» restano quelli della foto, leggibili)
const righe_ = (x, y, passo, testi, attr) => testi.map((t, i) => `<text x="${x}" y="${y + i * passo}" ${attr}>${t}</text>`).join('')
const CARTELLO_UE = `<svg xmlns="http://www.w3.org/2000/svg" width="3392" height="5056">
  <rect x="2929" y="1528" width="174" height="100" fill="#f4f4f2"/>
  ${righe_(2933, 1546, 18.5, ['Packungen im Automa-', 'ten tragen den aktuel-', 'len, grafischen Warn-', 'hinweis. Beispiel siehe', 'unten.'], 'font-family="Arial" font-weight="700" font-size="14.6" fill="#2a2a2a"')}
  <rect x="2931" y="1634" width="160" height="68" fill="#141414"/>
  ${righe_(2936, 1660, 20, ['Rauchen verursacht 9 von', '10 Lungenkarzinomen'], 'font-family="Arial" font-weight="700" font-size="13" fill="#fff"')}
  <rect x="2931" y="1702" width="160" height="23" fill="#f1df3a"/>
  ${righe_(2934, 1711, 9, ['Wollen Sie aufhören? Die BZgA hilft:', 'Tel.: 0800 8 31 31 31 (kostenfrei), www.rauchfrei-info.de'], 'font-family="Arial" font-size="6.4" fill="#222"')}
  <rect x="2936" y="2044" width="158" height="81" fill="#f4f4f2" stroke="#1a1a1a" stroke-width="3"/>
  ${righe_(3015, 2065, 18.5, ['Tabakrauch enthält', 'über 70 Stoffe, die', 'erwiesenermaßen', 'krebserregend sind.'], 'font-family="Arial" font-weight="700" font-size="14.4" fill="#1a1a1a" text-anchor="middle"')}
</svg>`

// ── Deutschland 4 bis: la macchinetta frontale (automat-orto, la 6w6ayd: un prospetto vero, senza fianco né fuga) ──
// Ridisegnandola, il modello ha storpiato di nuovo le scritte piccole: qui si rifanno tutte in SVG sui riquadri misurati
// a occhio (pixel della 3392 × 5056, griglie in lavoro/deutschland/via/g-o-*.jpg), e il cartello UE si riprende dalla
// macchinetta di prima (automat-finale.png, dove era già giusto) col suo testo vero sopra.
const ORTO_SCELTA = 'automat-orto/20261110-210828-6w6ayd-1.png'
const VERDE_LIME = '#cacf10', NERO_CARTA = '#2e2b32'
const ORTO_SCRITTE = `
  <rect x="1205" y="590" width="397" height="62" fill="#80354e"/>
  <text x="1218" y="640" font-family="Impact, Arial Narrow" font-size="47" letter-spacing="1" fill="#f3ece6">· KAFFEE IST PFLICHT</text>
  <rect x="1667" y="414" width="157" height="126" fill="${NERO_CARTA}"/>
  ${righe_(1673, 440, 27, ['Karte 3 Sek.', 'hinhalten', 'bis zum', 'Piep'], 'font-family="Arial" font-weight="700" font-size="21" fill="#f4f4f4"')}
  <rect x="1726" y="612" width="168" height="41" fill="${VERDE_LIME}"/>
  <text x="1731" y="641" font-family="Arial" font-weight="700" font-size="22" fill="#1a1a1a">Packung wählen</text>
  <rect x="1660" y="686" width="282" height="49" fill="#151418"/>
  <text x="1801" y="719" text-anchor="middle" font-family="Arial" font-weight="700" font-size="27" fill="#fff">kontaktlos zahlen</text>
  <rect x="1996" y="543" width="200" height="99" fill="${NERO_CARTA}"/>
  ${righe_(2000, 566, 25, ['Karte 3 Sekunden', 'hinhalten'], 'font-family="Arial" font-weight="700" font-size="19" fill="#e6c34a"')}
  <text x="2000" y="630" font-family="Arial" font-weight="700" font-size="19" fill="#e6c34a">Packung wählen</text>
  <rect x="1712" y="896" width="316" height="56" fill="#f6f4f4"/>
  ${righe_(1870, 920, 25, ['BEZAHLUNG AUCH MIT', 'SMARTPHONE MÖGLICH'], 'font-family="Arial" font-weight="700" font-size="19" fill="#222" text-anchor="middle"')}
  <rect x="1793" y="960" width="234" height="42" fill="#f6f4f4"/>
  <text x="1803" y="990" font-family="Arial" font-weight="700" font-size="22" fill="#2b2b2b">NOVAPAY</text>
  <rect x="1916" y="966" width="3" height="30" fill="#444"/>
  <text x="1930" y="990" font-family="Arial" font-weight="700" font-size="23" fill="#2b2b2b">kartix</text>
  <rect x="2062" y="1535" width="228" height="37" fill="#2b85ba"/>
  <text x="2176" y="1563" text-anchor="middle" font-family="Arial" font-weight="700" font-size="25" fill="#fff">BAD CANNSTATT</text>
  <rect x="2477" y="795" width="251" height="161" rx="4" fill="#eceeee"/>
  <g font-family="Arial" text-anchor="middle" fill="#1d1d1d">
    <text x="2602" y="832" font-weight="700" font-size="23">Automaten JMA GmbH</text>
    <text x="2602" y="862" font-size="18">Fangelsbachstraße 8</text>
    <text x="2602" y="885" font-size="18">70180 Stuttgart</text>
    <text x="2602" y="921" font-weight="700" font-size="25">☎ 0711 260 11 08</text>
    <text x="2602" y="946" font-size="13">www.pzkko.it · Störung? Anrufen!</text></g>
  <path d="M 2120 1888 m -168 0 a 168 168 0 1 0 336 0 a 168 168 0 1 0 -336 0 Z M 2120 1888 m -123 0 a 123 123 0 1 1 246 0 a 123 123 0 1 1 -246 0 Z" fill="#17181a" fill-rule="evenodd"/>
  ${anello('BREZN AKTION · STUTTGART · SEIT 2026 · ', 2120, 1888, 146, 30)}`

/** La macchinetta frontale con le scritte rifatte e il cartello UE → automat-orto-finale.png (quella che usa automat.mjs). */
async function componiOrto() {
  // il cartello UE di prima (2920–3112 × 1515–2145 in automat-finale.png) col testo vero, portato sul riquadro nuovo
  const vecchio = await sharp(join(LAVORO, 'automat-finale.png')).composite([{ input: Buffer.from(CARTELLO_UE), left: 0, top: 0 }]).png().toBuffer()
  const cartello = await sharp(vecchio).extract({ left: 2920, top: 1515, width: 192, height: 630 }).resize({ width: 192, height: 636, fit: 'fill' }).png().toBuffer()
  const scritte = await disegno(0, 0, 3392, 5056, ORTO_SCRITTE, 0.55)
  const out = join(LAVORO, 'automat-orto-finale.png')
  await sharp(join(LAVORO, ORTO_SCELTA)).composite([{ input: cartello, left: 2949, top: 1517 }, scritte]).png().toFile(out)
  console.log(`✓ ${out}`)
}

const [cosa, ...resto] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (cosa === 'rif') await rif()
else if (cosa === 'genera') {
  const nomi = (resto.length ? resto : ['tutti']).flatMap((n) => (n === 'tutti' ? Object.keys(IMMAGINI) : [n]))
  const volte = Math.max(1, Math.min(4, Number(opz('volte', 1)) || 1))
  const coda = nomi.flatMap((n) => Array(volte).fill(n)), errori = []
  await Promise.all(Array.from({ length: Math.min(4, coda.length) }, async () => {
    while (coda.length) { const n = coda.shift(); try { await genera(n) } catch (e) { errori.push(`${n}: ${e.message}`); console.error(`✗ ${n}: ${e.message}`) } }
  }))
  if (errori.length) die(`non riuscite:\n  ${errori.join('\n  ')}`)
} else if (cosa === 'recupera') { const [n, id] = resto; if (!n || !id) die('recupera <nome> <id>'); quale(n); await salva(await prediction(id), join(LAVORO, n), { immagine: n }) }
else if (cosa === 'contatto') await contatto()
else if (cosa === 'ritocca') await ritocca(resto)
else if (cosa === 'componi') await componi()
else if (cosa === 'orto') await componiOrto()
else { console.log('uso: via.mjs rif | genera <nome…|tutti> [--volte=N] | recupera <nome> <id> | contatto | ritocca [nome…] | componi'); process.exit(2) }
