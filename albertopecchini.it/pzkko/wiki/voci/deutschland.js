// Le voci di pzkkopedia su Deutschland (9.11.2026): la macchinetta delle sigarette sul muro, la vernice che cola, la
// pagina pzkko.it/deutschland/ con la password, e (dagli altri cantieri) la galleria, i pacchetti, il server delle foto.
// Il formato e il wikitesto: tools/pzkko/wiki/README.md. wiki/voci.js le unisce. Niente apici inversi né ${ nei testi.

const INDEX = 'albertopecchini.it/pzkko/index.html'
const D = 'albertopecchini.it/pzkko/deutschland/'

export const VOCI = {
  'Deutschland': {
    data: '2026-11-09',
    fonti: [`${D}index.html`, `${D}accesso.js`, `${D}comune.js`, `${D}deutschland.css`, 'albertopecchini.it/pzkko/api/deutschland.mjs'],
    testo: `{{Infobox
| titolo = Deutschland
| immagine = deutschland.webp
| didascalia = la macchinetta da vicino che chiede la password, sul display a led «PASSWORT»
| dove = pzkko.it/deutschland/
| dal = 9 novembre 2026
| file = deutschland/index.html, accesso.js, comune.js, deutschland.css
| le foto = sul pc di Alberto (C:\\pzkko-server\\deutschland), mai su Vercel
| password = una sola, verificata a casa (scrypt), «jager» con qualunque maiuscola
| indicizzata = no (robots noindex,nofollow, niente canonical né sitemap)
}}
'''Deutschland''' è la pagina delle foto del viaggio di [[Alberto Pecchini|Alberto]] a Monaco e Stoccarda con Mikas (lituano), Jonny (filippino) e Jella (tedesca), '''JMA''', dal 6 al 9 novembre 2026: 452 file arrivati dall'iPhone (353 JPG da 48 megapixel, 50 video, 41 DNG, 5 screenshot). Ci si arriva dal [[Il muro|muro]] toccando [[La macchinetta delle sigarette|la macchinetta delle sigarette]]: cola [[La vernice|la vernice]], e in <code>/deutschland/</code> la macchinetta da vicino chiede la password. Dentro c'è [[La galleria di Deutschland|la galleria]]: la griglia 4 × 5, la mappa col percorso e la Mercedes GLA, il visore, «salva sul rullino» e i [[I pacchetti di sigarette|sedici pacchetti]] che fanno da filtri.

== La struttura sicura ==
Il repository è pubblico e Vercel non ha né le foto né la password. Il form manda <code>POST /api/deutschland/</code> (con la barra finale: senza, Vercel risponde 308) con <code>{ a: 'entra', password }</code>; la funzione di Vercel è solo [[Il ponte firmato|un ponte]] verso [[Il server dei dati in casa|il server di casa]] (<code>C:\\pzkko-server\\deutschland\\accesso.mjs</code>, dentro [[La banca sul server|la banca]] come <code>NOMI.deutschland</code>), che normalizza la password (NFKC, trim, minuscolo), la confronta con scrypt a tempo costante e la limita: 5 errori per indirizzo ogni 10 minuti, 40 tentativi all'ora in tutto, una pausa casuale di 400–900 ms a ogni errore, e non la scrive mai nel log.

Chi la sa riceve '''il biglietto''': <code>{ ok, url, biglietto, scade }</code>, dove <code>url</code> è [[Il server delle foto di Deutschland|il server delle foto]] dietro [[Il tunnel Tailscale|il Funnel di Tailscale]] e <code>biglietto</code> è <code>&lt;scade36&gt;.&lt;firma&gt;</code>, un HMAC-SHA256 del segreto di casa sulla scadenza, allineata a blocchi di 6 ore più 24: così gli indirizzi delle foto restano uguali tutta la giornata e il browser li tiene in cache. Ogni richiesta al server (<code>foto.json</code>, le miniature <code>m/</code>, le grandi <code>g/</code>, gli originali <code>o/</code> e <code>raw/</code>, i video <code>v/</code> e i poster <code>p/</code>) porta <code>?b=&lt;biglietto&gt;</code>; senza, scaduto o sbagliato il server risponde '''404 vuoto''', e lo stesso a un indirizzo incollato in una scheda (Sec-Fetch-Dest document) o chiesto da un altro sito (Referer e CORS a lista). Il biglietto resta in <code>localStorage['pzkko-deutschland']</code> (<code>comune.js</code>: <code>stato</code>, <code>leggi</code>, <code>salva</code>, <code>dimentica</code>, <code>indirizzo(tipo, file)</code>).

== Cosa fa accesso.js ==
Appena la pagina parte prova il biglietto salvato con <code>fetch(indirizzo('foto.json'))</code>: 200 → dentro (<code>#automat</code> sparisce, <code>#galleria</code> compare, si importa <code>galleria.js</code> e si manda l'evento <code>deutschland:accesso</code>); 404 → il biglietto si dimentica e si richiede la password. Il form sta '''proiettato sullo schermo della macchinetta''' con la stessa omografia (matrix3d) con cui [[Il cercapersone zero|lo zero]] mette l'lcd sul vetro ([[Il tasto sul muro]]), sugli angoli di <code>muro-dati.js</code>: il display a led verdi «PASSWORT», il campo (<code>type=password</code>, senza suggerimenti né maiuscole automatiche), la riga di stato; il tasto che manda è la manopola '''«ziehen»''' sulla fila delle manopole, che si vede tirata. Le risposte: 401 «non è quella · restano n», 429 «aspetta n s» col conto alla rovescia, 503 o rete muta «la macchinetta è spenta: il pc di Alberto è spento» (solo un <code>console.warn</code>: [[Il bot dei bug]] non deve trovare errori). Se il server risponde 404 a una foto, la galleria manda <code>deutschland:uscita</code> e si torna al form. In locale (<code>npm run dev:pzkko</code>) il server è quello aperto su <code>127.0.0.1:8790</code> senza password: se risponde si entra subito, se no «server locale spento».

== Com'è fatta la pagina ==
Nera (<code>#0e0d0c</code>), oro (<code>#ffd400</code>) e rosso (<code>#dd0000</code>) come la bandiera, il titolo in Anton con l'ombra rossa; [[La barra in alto|la barra]] in cima con INDIETRO. I contenitori sono un contratto fra i tre cantieri: <code>.telo</code> (il nero della vernice), <code>#automat</code> con <code>#accesso</code>, <code>#galleria[hidden]</code> con <code>#filtri</code> e <code>.scena</code> (<code>#griglia</code> e <code>#mappa</code>), il <code>&lt;dialog id="visore"&gt;</code>, <code>#scelte</code>; gli eventi fra i moduli sono <code>CustomEvent</code> su <code>document</code> col prefisso <code>deutschland:</code> (accesso, manifesto, filtro, foto, vai, apri, scelta, uscita). La pagina ha la [[La manutenzione di Monaco|guardia della manutenzione]] per prima, come tutte, e nel <code>&lt;head&gt;</code> uno stile e uno script piccoli che tengono il telo nero solo a chi arriva dal muro (la chiave <code>pzkko-vernice</code> da meno di 15 secondi): agli altri <code>html.senza-telo</code>.

{{Vedi anche|La macchinetta delle sigarette|La vernice|La galleria di Deutschland|I pacchetti di sigarette|Il server delle foto di Deutschland|Il server dei dati in casa|Il ponte firmato}}
[[Categoria:Il muro]]
[[Categoria:Deutschland]]`,
  },

  'La macchinetta delle sigarette': {
    data: '2026-11-09',
    fonti: [INDEX, `${D}muro.js`, `${D}muro.css`, `${D}muro-dati.js`, 'albertopecchini.it/tools/pzkko/disposizione.js', 'albertopecchini.it/tools/pzkko/deutschland/schermo.mjs', 'albertopecchini.it/tools/pzkko/deutschland/immagini.mjs'],
    testo: `{{Infobox
| titolo = La macchinetta delle sigarette
| immagine = macchinetta-muro.webp
| didascalia = la Zigarettenautomat sul muro, fra il wallet e la lamiera, con le tappe a pixel sullo schermo
| dove = #automat-muro, nel primo schermo della saracinesca, centrata (x 540, y 26, larga 200; sul telefono x 80, y 210, larga 230)
| dal = 9 novembre 2026
| file = deutschland/muro.js, muro.css, muro-dati.js; art/deutschland/automat.webp, schermo.webp
| porta a = [[Deutschland]], colando [[La vernice|la vernice]]
}}
'''La macchinetta delle sigarette''' è il pezzo del [[Il muro|muro]] che porta a [[Deutschland]]: una vecchia '''Zigarettenautomat''' tedesca a muro, di smalto grigio, con la fila delle manopole da tirare, la fessura delle monete, la vaschetta in fondo, e in alto uno schermo che invece dei pacchetti mostra '''le tappe del viaggio a pixel''', come fossero le marche. Alberto, 9.11.2026: «una vecchia macchinetta tedesca delle sigarette con uno schermo che mostra miniature pixelate delle tappe come fossero le marche, luce propria, rilievo 2D, nel primo schermo, centrata, un po' sotto la metà».

== Sul muro ==
È un <code>&lt;button class="it pezzo vivo automat" id="automat-muro" data-suono-no&gt;</code> dentro la parete, fra i commenti <code>&lt;!-- automat --&gt;</code> e <code>&lt;!-- /automat --&gt;</code> subito dopo lo script dello zero (così [[La 404|la 404]] e [[La storia del muro|la storia]], che si generano dalla home, lo scartano da sole), con la foto, lo schermo (<code>.am-schermo</code>) e la luce (<code>.am-luce</code>). Il posto è un pezzo <code>abs</code> di [[La disposizione|disposizione.js]]: su un 16:9 sotto l'insegna si vedono ~280 unità di parete nel primo schermo, e per starci intera la macchinetta è larga 200 unità (267 alta), centrata, nella riga del wallet e del cercapersone; sul telefono è larga 230 a metà del primo schermo, e [[I volantini|i volantini]] sparsi la evitano da soli. Rilievo come gli altri pezzi vivi: il doppio <code>drop-shadow</code>, <code>scale 1.03</code> al passaggio, <code>.96</code> premuta, il bordo giallo col fuoco della tastiera.

== Lo schermo e la luce ==
<code>muro.js</code> la veste appena letta (<code>veste(tasto)</code>, come lo zero): carica <code>muro.css</code>, toglie <code>hidden</code> allo schermo e alla luce e '''proietta lo schermo sui quattro angoli''' di <code>muro-dati.js</code> (frazioni della foto) con l'omografia di <code>telefono/zero/muro.js</code> (<code>proietta(contenitore, el, angoli)</code>, rifatta da un ResizeObserver quando il tasto cambia misura). Sullo schermo c'è lo '''sprite delle tappe''' <code>art/deutschland/schermo.webp</code>: 4 × 3 mattonelle di 12 × 9 pixel, dodici miniature prese a passo regolare lungo il viaggio, ingrandite sei volte a pixel netti e sfumate di un pixel (<code>tools/pzkko/deutschland/schermo.mjs sprite</code>): irriconoscibili, per questo possono stare nel repository pubblico; finché il manifesto vero non c'è, dodici colori e forme astratte (<code>--finto</code>). La luce è un alone verde con un velo caldo, '''fermo''': niente animazioni infinite né fotogrammi a pagina ferma (la regola della [[Skill serranda|serranda]]: «leggera deve restare»).

== Il tocco ==
Al primo gesto verso il tasto (il puntatore sopra, il dito, il fuoco) si scalda <code>vernice.js</code> con un fetch a bassa priorità, una volta sola. Al clic: lo scatto meccanico (<code>tasto('meccanico')</code> di [[I suoni dell'interfaccia|interfaccia.js]], <code>data-suono-no</code> toglie il clic di plastica generico), poi <code>copri('/deutschland/')</code> di [[La vernice|vernice.js]]. Se la vernice non si carica si va alla pagina lo stesso.

== La foto ==
Prima il segnaposto <code>automat-segnaposto.svg</code> (una macchinetta grigia disegnata in SVG, lo schermo verde pieno agli angoli dichiarati), poi la foto vera di [[gpt-image-2]] su [[Replicate]] (<code>tools/pzkko/deutschland/immagini.mjs automat</code>): generata con lo schermo '''verde pieno #00FF00''' e fondo trasparente, così <code>schermo.mjs angoli</code> trova il verde (G alto e lontano da R e B), ne prende i quattro angoli, li scrive in <code>muro-dati.js</code> e riempie il verde di nero spento; <code>automat.webp</code> a 900 px per il muro (si vede al più a 290 px CSS) e <code>automat-grande.webp</code> a 957 px (la foto intera ritagliata ai suoi pixel) per la pagina. Le 16 immagini dei [[I pacchetti di sigarette|pacchetti]] nascono da un solo foglio 4 × 4 a 2048 px, tagliato lungo i vuoti fra i pacchetti; la Mercedes GLA della mappa (<code>gla.webp</code>, 160 px) e l'adesivo <code>jma.webp</code> dallo stesso strumento.

{{Vedi anche|Deutschland|La vernice|Il tasto sul muro|La disposizione|La serranda}}
[[Categoria:Il muro]]
[[Categoria:Deutschland]]`,
  },

  'La vernice': {
    data: '2026-11-09',
    fonti: [`${D}vernice.js`, `${D}index.html`, `${D}accesso.js`, 'albertopecchini.it/pzkko/barra/barra.js'],
    testo: `{{Infobox
| titolo = La vernice
| immagine = vernice.webp
| didascalia = la vernice a metà colata sulla home, con le gocce colorate sotto la nera
| dal = 9 novembre 2026
| file = deutschland/vernice.js
| dura = circa un secondo a coprire, 0,8 s a scoprire
| copiata da = la colata di barra/barra.js (caso, molla, NERO, COLORI, P = 4, goccia)
}}
'''La vernice''' è il passaggio dal [[Il muro|muro]] a [[Deutschland]]: toccata [[La macchinetta delle sigarette|la macchinetta]], dall'alto cola vernice nera a pixel che copre tutto, si cambia pagina, e in <code>/deutschland/</code> il telo nero scende via scoprendo la macchinetta da vicino. Alberto, 9.11.2026: «al click la vernice (stessa estetica della colata della barra) cola giù coprendo tutto di nero, si va a /deutschland/, e lì il telo nero scende via scoprendo la pagina». È la stessa estetica della colata di [[La barra in alto|barra.js]], che non si tocca: <code>vernice.js</code> ne copia dichiaratamente il caso col seme (mulberry32), la molla che arriva, passa di poco e torna, i colori (il nero <code>#0e0d0c</code> col riflesso <code>#4a4640</code>, il giallo, il verde, il rosso e il blu con le loro luci e ombre), un pixel della tela = 4 px dello schermo, e la forma della goccia: il menisco dove esce, la pancia in fondo, la punta, il riflesso a sinistra e l'ombra a destra.

== Coprire (copri) ==
Uno strato <code>position:fixed</code> sopra tutto (z-index 2147483000: sopra la barra, 80, e sotto l'iframe della [[La cornice|cornice]] della musica, che è a 2147483647), con una tela di <code>innerWidth/4 × innerHeight/4</code> pixel stirata al 100% a pixel netti. Ogni colonna ha un ritardo fra 0 e 0,25 s, a tratti (così il fronte scende a lingue), e scende in 0,75 s con la molla; sotto il fronte pendono le gocce, le colorate disegnate prima, sotto la nera. Quando il fronte è almeno al 92% dappertutto (circa un secondo) si scrive <code>sessionStorage['pzkko-vernice'] = Date.now()</code> e si va con <code>vai(url)</code> di <code>suono/cornice.js</code>: dentro la cornice se la musica suona, se no la pagina cambia. A copertura piena il <code>requestAnimationFrame</code> '''si ferma''': una scena che finisce, non un'animazione. Se la home si risveglia (la cornice si chiude, <code>pzkko-altrove</code> con <code>false</code>) o si torna indietro dalla bfcache (<code>pageshow</code> con <code>persisted</code>), <code>togli()</code> toglie lo strato e la macchinetta si può ritoccare. Mai due colate insieme.

== Scoprire (scopri) ==
In <code>/deutschland/</code> il telo (<code>.telo</code>) è già in pagina dal <code>&lt;head&gt;</code>: uno stile e uno script inline lo tengono nero solo se la chiave <code>pzkko-vernice</code> ha meno di 15 secondi, altrimenti <code>html.senza-telo</code> lo nasconde (e per sicurezza se ne va da solo dopo 4 s). Appena la pagina è pronta (DOM, caratteri e foto della macchinetta, al più 0,7 s) <code>accesso.js</code> chiama <code>scopri()</code>: il primo fotogramma è tutto nero come il telo (nessun lampo), poi il nero resta '''sotto il fronte''' che scende da 0 a H in 0,8 s accelerando, con le gocce rovesciate che pendono dall'alto dentro il nero, le colorate sopra; alla fine <code>telo.remove()</code> e la chiave si cancella.

== Con meno movimento ==
Con <code>prefers-reduced-motion</code> niente tela: una dissolvenza di 0,18 s a coprire e di 0,25 s a scoprire.

{{Vedi anche|La macchinetta delle sigarette|Deutschland|La barra in alto|La cornice}}
[[Categoria:Il muro]]
[[Categoria:Deutschland]]`,
  },

  // ── le voci dell'altro cantiere (la galleria), ricevute dall'orchestratore ──
  'La galleria di Deutschland': {
    data: '2026-11-09',
    fonti: [`${D}galleria.js`, `${D}griglia.js`, `${D}mappa.js`, `${D}visore.js`, `${D}condividi.js`, `${D}galleria.css`, `${D}lib/leaflet/leaflet.js`],
    testo: `{{Infobox
| titolo = La galleria di Deutschland
| immagine = deutschland-galleria.webp
| didascalia = la griglia 4 × 5 a sinistra, la mappa nero/oro con la GLA a destra, i pacchetti sopra
| dove = pzkko.it/deutschland/ (dopo la password)
| dal = 9 novembre 2026
| file = deutschland/galleria.js, griglia.js, mappa.js, visore.js, condividi.js, galleria.css, lib/leaflet/
| mappa = Leaflet 1.9.4 vendorizzato, tile di OpenStreetMap rovesciate
| colonne = sempre 4, con 5 righe in vista
}}
'''La galleria di Deutschland''' è quello che si vede in [[Deutschland]] dopo la password: le foto del viaggio a Monaco e Stoccarda con JMA in una griglia che scorre, una mappa con il percorso che si allunga e la macchinina che lo segue, un visore che carica l'originale da 48 megapixel senza farlo aspettare, e «salva sul rullino», che mette le foto scelte in Foto dell'iPhone senza zip e senza file di mezzo. Alberto l'ha chiesta così: «4 colonne di foto e 5 righe sempre visibili», «copia sistema waze map con la macchinina», «salva sul rullino diretto», «no file e no zip».

== Come parte ==
<code>accesso.js</code>, avuto il biglietto, importa <code>galleria.js</code>, che scarica il manifesto <code>foto.json</code> dal [[Il server delle foto di Deutschland|server di casa]] (<code>indirizzo('foto.json')</code> di <code>comune.js</code>), manda l'evento <code>deutschland:manifesto</code>, toglie <code>hidden</code> a <code>#galleria</code> e avvia i pezzi: i [[I pacchetti di sigarette|pacchetti]] (<code>filtri.js</code>), la griglia, il visore, la scelta; per ultimo carica Leaflet (<code>lib/leaflet/leaflet.css</code> e <code>leaflet.js</code>, con un import dinamico) e la mappa. Leaflet, i caratteri dei pacchetti e i fogli di stile della galleria li scarica solo chi è entrato: la pagina chiusa resta leggera (pzkko leggero: la regola della [[Skill serranda|serranda]]). Se il server risponde 404 (biglietto scaduto) o tace, manda <code>deutschland:uscita</code> e si torna alla macchinetta.

Il manifesto ha <code>foto[]</code> in ordine di tempo (id, tipo foto o video, nome del file, ora, giorno, GPS, posto, misure, i nomi dei file <code>m</code> miniatura 480, <code>g</code> grande 1800, <code>o</code> originale, <code>v</code> video, <code>p</code> poster, peso, una sfocatura webp da 16 pixel in base64, il colore medio, i tag, i volti), <code>posti[]</code> (le tappe con nome e GPS) e <code>tappe[]</code>.

== La griglia ==
<code>#griglia</code> è una griglia CSS a 4 colonne con le righe alte un quinto dello spazio (<code>grid-auto-rows: calc((100% - 12px) / 5)</code>), alta quanto resta sotto [[La barra in alto|la barra]] e i filtri: in vista ci sono sempre 4 × 5 celle, sul computer (mappa a destra, metà e metà) come sul telefono (mappa sopra, 38dvh, griglia sotto). Ogni cella è un <code>&lt;button&gt;</code> con il colore medio e la sfocatura della foto già come sfondo, così non ci sono mai riquadri grigi; la miniatura arriva pigra (<code>loading=lazy</code>, le prime 20 subito) e si dissolve sopra in un quarto di secondo. In un angolo l'ora, sui video il triangolo e la durata, un pallino d'oro su quelle con l'ora stimata (foto senza EXIF, arrivate via AirDrop). L'idea della cella viene dal visore di agosto per MiMa (<code>Shooting.tsx</code>, nella storia del repository).

Lo scorrimento muove la mappa senza mai girare a vuoto: a ogni evento <code>scroll</code> (passivo) parte un solo <code>requestAnimationFrame</code>, che legge quale riga sta a un terzo dello schermo e manda <code>deutschland:foto</code> con l'indice della foto; a pagina ferma non c'è nessun fotogramma. Il filtro (<code>deutschland:filtro</code> con tag e posto) non rifà le celle: nasconde quelle fuori e la griglia si ricompatta, con il contatore «n di 452» sullo scontrino. Un posto cliccato sulla mappa (<code>deutschland:vai</code>) porta alla sua prima foto con <code>scrollIntoView</code> e la evidenzia per un secondo.

== La mappa ==
<code>mappa.js</code> usa Leaflet 1.9.4 copiato in <code>deutschland/lib/leaflet/</code> (42 KB compressi, licenza BSD-2 conservata in testa; niente immagini dei marker: si usano solo <code>divIcon</code>). MapLibre era stato scartato perché pesa 290 kB. Le tile dovevano essere CARTO Dark Matter, ma dal 9 novembre 2026 escono con la scritta «API KEY REQUIRED»; quelle scure di Esri venivano marrone fango in città; si usano le tile normali di OpenStreetMap (gratuite, con l'attribuzione obbligatoria «© OpenStreetMap contributors» nel controllo in basso) '''rovesciate da un filtro CSS''' sul pannello delle tile: <code>invert(1) grayscale(1) contrast(1.6) brightness(.8) sepia(1) saturate(3.5) hue-rotate(-8deg)</code>, cioè fondo nero e strade e scritte d'oro, lo «swag tedesco» nero/oro, fino allo zoom 19.

Sotto c'è il percorso intero del viaggio tratteggiato grigio (<code>#3a3a3a</code>); sopra, il percorso '''fatto''', giallo <code>#ffd400</code> spesso 4 su un bordo nero spesso 7, che si allunga fino alla foto corrente: a ogni <code>deutschland:foto</code> una ricerca binaria trova l'ultimo punto con GPS fino a quella foto e <code>setLatLngs</code> ridisegna le due linee. La macchinina è la Mercedes GLA grigia di <code>art/deutschland/gla.webp</code> (prima che ci fosse, un svg di scorta dentro <code>mappa.js</code>) in un <code>divIcon</code>: <code>setLatLng</code> diretto, e la rotazione è il bearing dal punto prima a quello corrente, applicata con <code>style.rotate</code> per la via più corta (mai un giro intero da 350° a 10°) e una transizione CSS di 0,4 s. La mappa si sposta (<code>panTo</code> animato) solo se la macchinina esce dai bordi ridotti del 20%. I posti sono pallini rossi <code>#dd0000</code> con il nome in Anton su nero (tooltip fisso, nascosto sotto lo zoom 11 dove si accavallerebbero); il click manda <code>deutschland:vai</code>. Un <code>ResizeObserver</code> su <code>#mappa</code> chiama <code>invalidateSize</code> quando la misura cambia (telefono girato, galleria appena mostrata). Senza rete per le tile la pagina non va in errore: un solo <code>console.warn</code>.

== Il visore ==
<code>visore.js</code> riempie il <code>&lt;dialog id="visore"&gt;</code>. Si apre con <code>location.hash = '#f=' + id</code>: il tasto indietro lo chiude, un link con <code>#f=</code> apre direttamente quella foto; dentro, ← → cambiano foto con <code>replaceState</code> (una sola voce nella storia), Esc, × o il fondo chiudono. Compare subito la versione media <code>g</code> (1800 px, già in cache dalla griglia o quasi) e intanto parte in silenzio l'originale <code>o</code> in un <code>new Image()</code>; quando è pronto prende il posto nello stesso <code>&lt;img&gt;</code> senza un lampo (il browser l'ha appena scaricato) e l'etichetta in basso passa da «anteprima…» a «originale · 6048×8064 · 15,8 MB» (<code>peso()</code> di <code>comune.js</code>). I video sono un <code>&lt;video controls playsinline preload=metadata&gt;</code> col poster. Il contatore «12 / 452» conta sulla lista filtrata; le due foto vicine si precaricano. Swipe di 50 px (pointer events, <code>touch-action: pan-y</code>) per cambiare foto; un tocco ingrandisce 2,5 volte con l'origine nel punto toccato, un altro torna. Tutte le immagini hanno <code>crossorigin=anonymous</code>: così la risposta in cache ha l'intestazione CORS e vale anche per il <code>fetch</code> di «salva».

== Salva sul rullino ==
<code>condividi.js</code>. Si tiene premuta una cella per 400 ms (o si tocca «scegli» sullo scontrino) e si entra nella scelta: le celle si spuntano d'oro, le altre si scuriscono, in basso compare la barra <code>#scelte</code> «n scelte · prepara · annulla». Sono '''due passi''' per via del gesto fresco di Safari iOS (<code>navigator.share</code> vuole un tocco appena fatto, non uno di cinque secondi prima): «prepara» scarica in memoria gli originali (<code>o</code>, o il mp4 <code>v</code> per i video) con <code>fetch</code>, mostrando l'avanzamento in byte, e ne fa dei <code>File</code> col nome vero (IMG_5506.JPG; per i video il nome del mp4), con un tetto di 25 file o 250 MB per volta; poi il tasto diventa «salva sul rullino» e il clic chiama subito <code>navigator.share({ files })</code> (prima <code>canShare</code>): su iPhone si apre il foglio di condivisione e «Salva n immagini» le mette in Foto. Dove lo share coi file non c'è (computer, Firefox) il ripiego è un <code>&lt;a download&gt;</code> da <code>blob:</code> per file, cliccati in fila a 300 ms. Mai uno zip, mai un file scritto sul server; dopo si libera tutto (<code>revokeObjectURL</code>). Il tasto «salva» del visore fa lo stesso per una foto sola.

== Il collaudo ==
<code>tools/pzkko/lavoro/deutschland/prova-galleria.mjs</code> (cartella ignorata da git) apre la pagina in locale col browser senza finestra a 1440 × 900 e a 390 × 844, fa le foto (griglia, scroll con mappa, visore, video, scelta, filtro) e controlla: zero errori in console, niente «undefined» o «NaN» in pagina, 4 colonne e 5 righe, pagina mai più larga dello schermo. Il 9 novembre 2026, sui dati finti del server locale: «tutto a posto» a tutte e due le misure.

{{Vedi anche|Deutschland|I pacchetti di sigarette|La macchinetta delle sigarette|Il server delle foto di Deutschland|Skill serranda}}
[[Categoria:Deutschland]]`,
  },

  'I pacchetti di sigarette': {
    data: '2026-11-09',
    fonti: [`${D}filtri.js`, `${D}pacchi.css`, 'albertopecchini.it/pzkko/art/deutschland/pacchi/segnaposto.svg'],
    testo: `{{Infobox
| titolo = I pacchetti di sigarette
| immagine = deutschland-pacchi.webp
| didascalia = i sedici pacchetti in fila sopra la galleria: uno acceso, gli altri spenti
| dove = pzkko.it/deutschland/, in cima alla galleria
| dal = 9 novembre 2026
| file = deutschland/filtri.js, pacchi.css, art/deutschland/pacchi/
| quanti = 16: «alles» più i 15 tag del catalogo
| caratteri = 16 diversi, i woff2 di /fonts/
}}
'''I pacchetti di sigarette''' sono i filtri della [[La galleria di Deutschland|galleria di Deutschland]]: sedici marche inventate, come le marche nelle finestrelle di una [[La macchinetta delle sigarette|macchinetta tedesca]], in fila in <code>#filtri</code> a scorrere in orizzontale (la pagina non diventa mai più larga dello schermo). Ogni pacchetto è un tag del catalogo delle foto; sotto c'è uno '''scontrino''' con il contatore «452 foto», il tasto «scegli» e le tappe del viaggio, un'altra fila di filtri. Si accende un pacchetto e un posto alla volta: <code>filtri.js</code> manda <code>deutschland:filtro</code> con tag e posto, la griglia nasconde le foto fuori e il contatore dice «n di 452»; la mappa tiene il percorso di tutto il viaggio e la macchinina va alla foto corrente della lista filtrata. Lo stesso pacchetto toccato di nuovo si spegne (torna «alles»).

== Le sedici marche ==
La tabella <code>PACCHI</code> di <code>filtri.js</code>: tag → nome sul pacchetto → carattere → colore (tutti diversi).
* '''alles''' (tutto): «JMA», in Anton, oro <code>#ffd400</code>
* '''pekko''': «luckypzkko», Abril Fatface, rosso Lucky <code>#d0021b</code> (il pacchetto pzk che c'era già sulla [[La scena 3D|scena]]: <code>lucky.webp</code>)
* '''mikas''': «Mikas's Smoke», Permanent Marker, azzurro <code>#39a0ed</code>
* '''jonny''': «Jonny's Tobacco», Special Elite, verde mare <code>#2e8b57</code>
* '''jella''': «Jella Leicht», Caveat, rosa <code>#e75480</code>
* '''cibo''': «Brezn Gold», Alfa Slab One, arancio <code>#e08a1e</code>
* '''paesaggi''': «Alpenblick», Archivo Black, celeste <code>#7fb3d5</code>
* '''natura''': «Schwarzwald», Homemade Apple, verde bosco <code>#1f5f2a</code>
* '''strada''': «Autobahn 100», Rubik Mono One, asfalto <code>#8a8f98</code>
* '''auto''': «GLA Grau», Bungee, grigio GLA <code>#3c3f44</code>
* '''screenshot''': «Bildschirm», [[Il font Fake Receipt|Fake Receipt]], grigio chiaro <code>#b8c0cc</code>
* '''hotel''': «Nachtportier», Nothing You Could Do, viola <code>#5b2c83</code>
* '''mezzi''': «S-Bahn Blau», Black Ops One, blu S-Bahn <code>#0a3d91</code>
* '''alcool''': «Jäger Hirsch 56», Shrikhand, marrone Jäger <code>#5c3a21</code> con la scritta d'oro
* '''foto''': «Südkurve», Rock Salt, bordeaux <code>#7a0012</code> (la curva del Bayern e del 1860)
* '''video''': «Cannstatter», Reenie Beanie, bianco con la scritta rossa VfB <code>#e2001a</code>

== Com'è fatto un pacchetto ==
Un <code>&lt;button class="pacco" data-tag aria-pressed&gt;</code> largo 64 px (56 sul telefono) col colore della marca come sfondo, l'immagine <code>art/deutschland/pacchi/&lt;tag&gt;.webp</code> (generata con gpt-image-2, senza scritte: l'aquila sulla bandiera per JMA, il bersaglio per luckypzkko, il brezel, la chiave d'albergo…) e sopra il nome scritto dall'HTML nel suo carattere, su una fascia scura in basso. Se le immagini non ci sono (una richiesta HEAD sola su <code>alles.webp</code>, così la console non si riempie di 404) si usa <code>segnaposto.svg</code>: una scatola neutra col coperchio a scatto e il riquadro dell'avvertenza, trasparente così sotto si vede il colore, e il nome al centro. Il nome non va mai spezzato a metà parola: <code>adatta()</code> lo rimpicciolisce finché ci sta, e lo rifà quando arrivano i caratteri veri (<code>document.fonts.ready</code>) e quando la finestra cambia. Il pacchetto acceso si alza di 3 px con un bordo d'oro.

I sedici caratteri sono i woff2 interi di <code>/fonts/</code>, dichiarati in <code>pacchi.css</code> con <code>font-display: swap</code>: si caricano solo dopo l'accesso e solo quando un pacchetto li usa. Non si usano i sottoinsiemi di <code>fonts/sub/</code> né <code>caratteri.mjs</code>, che sono della [[La barra in alto|barra]] e dei volantini.

== Lo scontrino ==
Una striscia di carta <code>#f4efe2</code> col bordo a denti (una maschera CSS), in Special Elite: a sinistra il contatore in Anton, poi «scegli» (manda <code>deutschland:scegli</code>: la [[La galleria di Deutschland|scelta]] delle foto da salvare), poi i posti nell'ordine delle tappe del manifesto, ognuno col numero di foto, uno acceso alla volta.

{{Vedi anche|La galleria di Deutschland|Deutschland|La macchinetta delle sigarette|Il font Fake Receipt}}
[[Categoria:Deutschland]]`,
  },
  'Il server delle foto di Deutschland': {
    data: '2026-11-09',
    fonti: ['albertopecchini.it/pzkko/api/deutschland.mjs', 'albertopecchini.it/api/deutschland.js', 'albertopecchini.it/tools/pzkko/deutschland/cataloga.mjs', 'albertopecchini.it/tools/pzkko/deutschland/manifesto.mjs', 'albertopecchini.it/tools/pzkko/deutschland/posti.mjs', 'albertopecchini.it/tools/pzkko/deutschland/riconosci.py', 'albertopecchini.it/tools/pzkko/deutschland/categorie.mjs', 'albertopecchini.it/tools/pzkko/deutschland/comune.mjs', 'albertopecchini.it/tools/pzkko/deutschland/finto.mjs', 'albertopecchini.it/tools/pzkko/deutschland/README.md'],
    testo: `{{Infobox
| titolo = Il server delle foto di Deutschland
| dove = C:\\pzkko-server\\deutschland (il pc di Alberto), dietro il Funnel di Tailscale a /deutschland
| dal = 9 novembre 2026
| file = server.mjs, biglietto.mjs, accesso.mjs; tools/pzkko/deutschland/
}}
'''Il server delle foto di Deutschland''' è il pezzo di casa della galleria [[Deutschland]]: le 967 foto e video del viaggio a Monaco e Stoccarda con Mikas, Jonny e Jella (6–8 novembre 2026) non stanno su Vercel né su GitHub, ma su <code>C:\\pzkko-server\\deutschland\\</code>, e da fuori ci si arriva solo col Funnel di Tailscale e con un biglietto firmato. Pc spento = «la macchinetta è spenta».

== Il biglietto ==
Chi scrive la password nella [[La macchinetta delle sigarette|macchinetta]] manda <code>{ a: 'entra', password }</code> a <code>/api/deutschland</code>, un ponte di Vercel come <code>/api/wallet</code> (<code>pzkko/api/deutschland.mjs</code>), che la porta nella [[La banca sul server|banca]] di casa (<code>accesso.mjs</code>): la password si confronta con scrypt (in chiaro non è salvata da nessuna parte, la scrive <code>imposta.mjs</code>), con 5 errori per indirizzo ogni 10 minuti, 40 tentativi all'ora in tutto e una pausa a caso fra 400 e 900 ms a ogni errore. Chi la sa riceve l'indirizzo del server e un biglietto «scadenza.firma» (HMAC-SHA256 con una chiave derivata dal segreto del server, <code>biglietto.mjs</code>), valido da 24 a 30 ore e allineato a blocchi di 6 ore: così gli indirizzi delle foto restano uguali tutta la giornata e la cache del browser serve a qualcosa.

== Il server ==
<code>server.mjs</code> ascolta su 127.0.0.1:8790, solo Node, solo file statici: <code>/foto.json</code> (il manifesto), <code>/m/</code> miniature 480 px webp, <code>/g/</code> grandi 1800 px, <code>/o/</code> gli originali (i JPEG a 48 MP, letti da D: senza copie), <code>/raw/</code> i DNG, <code>/v/</code> i video h264 e <code>/p/</code> i poster, sempre con <code>?b=biglietto</code>. Chi non ce l'ha, o ce l'ha scaduto, riceve un 404 vuoto: da fuori lì non c'è niente. Un indirizzo incollato nella barra o messo in un iframe non apre niente (<code>Sec-Fetch-Dest</code>), e nemmeno da una pagina che non sia pzkko.it (Referer e Origin). Per il resto fa il server bravo: Range per i video, ETag, CORS, nome originale nel download (<code>IMG_5506.JPG</code>), niente metadati nei file. Con <code>DEUTSCHLAND_APERTO=1</code> serve senza biglietto le richieste che arrivano dritte dal pc, per sviluppare la galleria in locale e per il bot.

== La pipeline ==
Gli strumenti in <code>tools/pzkko/deutschland/</code> leggono la cartella del viaggio su D: (solo in lettura) e scrivono il catalogo: <code>cataloga.mjs</code> (incrementale: data dall'EXIF col fuso costruito a mano, GPS, miniature con sharp, i JPEG dentro i DNG, i video HDR dell'iPhone portati in SDR con ffmpeg), <code>posti.mjs</code> (le tappe come gruppi di foto entro 150 m, coi nomi da Nominatim che Alberto corregge), <code>riconosci.py</code> (i volti con insightface, raggruppati per somiglianza e stampati in fogli di contatto perché Alberto dica chi è chi), <code>categorie.mjs</code> (i tag cibo, paesaggi, natura, strada, auto, hotel, mezzi, alcool con CLIP su Replicate) e <code>manifesto.mjs</code>, che unisce tutto in <code>dati\\foto.json</code>. Le foto scattate nel riquadro di casa non entrano nel catalogo. Per sviluppare senza le foto vere c'è <code>finto.mjs</code>, sessanta quadrati colorati fra Monaco e Stoccarda.

{{Vedi anche|Deutschland|La macchinetta delle sigarette|La galleria di Deutschland|La banca sul server|Il server dei dati in casa}}
[[Categoria:Deutschland]]`,
  },
}
