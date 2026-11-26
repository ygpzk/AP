# Diretta OS

La regia delle sovrimpressioni per le dirette: i pezzi stanno in pagine web trasparenti da
1920 × 1080 (livelli web di Camo Studio, o sorgenti browser di OBS) e si accendono da un
pannello sul pc. Stile di Discord, colori e caratteri di pzkko.it (`#ccff00 → #9d00ff`,
gg sans, ABC Ginto Nord, Pricedown), oggetti presi da `pzkko.it/public/art`. Stile sospeso:
niente riquadri, le cose galleggiano sopra la webcam con un contorno scuro che le fa leggere sul
muro bianco come sulla tv.

## Installazione (Windows 10/11)

Scarica **`DirettaOS-Setup.exe`** da <https://pzkko.it/direttaos/> e aprilo: copia tutto
nella tua cartella (`%LOCALAPPDATA%\Programs\Diretta OS`), crea le scorciatoie, la voce
in *App e funzionalità* e, se vuoi, l’avvio con Windows. Non serve l’amministratore.
Node.js 20+ è obbligatorio, ffmpeg è consigliato (webcam, lente, volti).

Il setup lascia anche **`DirettaOS.exe`**, il gestore con tutti i comandi:

```bat
DirettaOS.exe                 :: menu
DirettaOS.exe start           :: avvia il server in background
DirettaOS.exe open            :: apre la regia
DirettaOS.exe stop            :: chiude anche la webcam, con le buone
DirettaOS.exe restart         :: dopo un aggiornamento
DirettaOS.exe status          :: stato e pezzi accesi
DirettaOS.exe commands        :: tutti i comandi e gli indirizzi
DirettaOS.exe doctor          :: diagnostica
```

La guida completa, passo per passo, è in **`GUIDA-INSTALLAZIONE.md`** (e sul sito,
<https://pzkko.it/direttaos/>). Il codice dell’installer è in `installer/` e si ricompila
con `powershell -ExecutionPolicy Bypass -File installer\build.ps1`.

## Come si usa

1. Il server **parte da solo all'accensione**, senza finestre (attività pianificata «Diretta OS», che lancia
   `servizio.cmd`; se si ferma riparte in tre secondi; quello che scrive finisce in `diretta.log`). Doppio clic su
   `avvia.cmd` apre la regia, <http://localhost:2350/> (e accende il server, se per caso è spento).
   Dopo un aggiornamento: doppio clic su **`riavvia.cmd`**, poi ricarica i livelli in Camo.
2. In Camo Studio aggiungi un livello web a tutto schermo (1920 × 1080) con
   `http://localhost:2350/o/tutto` (la pagina va a 60 fotogrammi al secondo, come la webcam che vede Discord;
   `?fps=30`, `?gpu=0` o il tasto **risparmio GPU** in regia sono la modalità risparmio). Oppure un livello per pezzo,
   anche tutti insieme: ogni pagina disegna solo il suo pezzo, sempre allo stesso posto.
3. **La regia** è l'anteprima grande, e i pezzi si toccano lì appena la apri (vedi «La regia»).
   In Camo tieni **un livello web solo**: ogni livello in più (anche invisibile, con l'opacità a zero) è un browser
   intero che gira e mangia memoria.

### Chromium per la regia locale

Chromium (build Hibbiki 158) è installato per l'utente con `winget install --id Hibbiki.Chromium --exact`. La regia si
apre lì, con un profilo suo in `cache/chromium-profilo` (non tocca il Chromium normale):

- `avvia.cmd` usa Chromium se c'è, altrimenti il browser di default;
- sul Desktop e nel menu Start ci sono **Diretta OS (Chromium)** e **Diretta OS (Chromium senza GPU)** (quest'ultimo usa `--disable-gpu`);
- gli stessi due si possono lanciare da `chromium-diretta.cmd` e `chromium-diretta-senza-gpu.cmd`.

Il livello web dentro Camo resta WebView2: Chromium non può sostituirlo. Il tasto **risparmio GPU** in regia resta il
modo per alleggerire anche quel livello.

## La regia

<http://localhost:2350/>, con l'aspetto di Discord (tema verde chiaro; da **Configurazione → Aspetto** si passa a quello
scuro, e la pagina dei muri segue la stessa scelta). **Quattro zone fisse**, ognuna fa una cosa sola (rifatta il
23.11.2026; la regia di prima è in `copie/regia-prima-zone-2026-11-23-b.html`):

1. **Sorgenti** (a sinistra): l'elenco di tutti i pezzi, per gruppo (Overlay, Scene, Sorgenti remote, Telemetria
   hardware, Podcast), col led e la leva **on air**. Resta sempre lì; «Cerca sorgente» lo filtra; l'etichetta dice a
   quale muro è ancorata, `FX` che ha una rotazione o delle regolazioni. La colonna delle icone porta ai gruppi (il
   numero: quante on air), ai muri e alla tv.
2. **Monitor** (al centro): l'uscita di Camo (**Live**) o il fotogramma di riferimento (**Riferimento**, cioè la foto
   della stanza), l'**ottica** (la lente), le cose veloci (countdown, Red Bull +1); sotto, la riga di stato con
   **Annulla**.
3. **Controlli** (sotto il monitor, a schede, una alla volta): **Pausa** (i «torno subito»), **Podcast** (la puntata),
   **Uscita TV** (la schermata della tv). Il pallino rosso sulla scheda dice che lì c'è qualcosa in corso.
4. **Proprietà** (a destra): la sorgente selezionata, in sezioni che si aprono e si chiudono:
   - **Trasformazione**: ancoraggio (libera o su quale muro), **X** e **Y** in pixel, **scala**, **rotazione**
     (−180…180°; doppio clic: 0°), **Flip H / Flip V**, **−90° / +90°**, «Ripristina posizione», «Scala consigliata».
   - **Regolazioni**, come il pannello di Camo: ogni parametro ha la leva (acceso/spento: spento, il cursore resta
     dov'è) e il cursore (doppio clic: neutro). **Opacità, luminosità, contrasto, saturazione, vividezza, tinta,
     temperatura, gamma, nitidezza, sfocatura**, più un **filtro** (monocromatico, seppia, negativo) e un **effetto**
     (ombra portata, bagliore lime o viola). La freccia tonda le ripristina tutte.
   - **Parametri**: quello che è solo suo (l'ora del countdown, i follower, la ROI del tracking, il catalogo delle
     bandiere, gli argomenti del podcast…).
   - **Sorgente browser**: il suo indirizzo `/o/…` da copiare in Camo.
   Senza selezione: «Scala consigliata · tutte», «Ripristina posizioni predefinite» e l'elenco dei comandi.

In basso a sinistra lo stato del server e del tracking (l'occhio), **Rilascia camera**, **GPU ridotta** e
l'ingranaggio della **Configurazione**, a pagine: Ottica, Fotogramma di riferimento, Piani prospettici (i muri), URL
sorgenti, Uscita TV, Aspetto.

I **nomi** in regia sono tecnici (`pubblico/nomi-tecnici.js`: «Nametag · head tracking», «Stato dispositivi I/O»,
«Input overlay», «Resoconto PC · schede»…); in onda e negli indirizzi `/o/…` restano quelli di sempre.

- **Clic** su una sorgente nel monitor (o sul nome nell'elenco): la selezioni. Clic sul vuoto o Esc: nessuna.
  Passando col mouse sul monitor si vedono i contorni di tutte, anche di quelle nascoste nel live.
- **Trascina** per spostarla. Una sorgente **ancorata a un muro resta sul muro**, in prospettiva (passando sopra un
  altro muro ci si ancora tenendo la sua grandezza vera); con **Alt** la sganci, e una libera con Alt si ancora al
  muro sotto. **Rotella**: scala; **Shift + rotella**: rotazione (sul muro, quella sul muro; libera, attorno al suo
  centro); gli **angoli** della selezionata si tirano; le **frecce** la spostano di un pixel (Shift: dieci); **doppio
  clic**: posizione predefinita. **Ctrl+Z** (o «Annulla») rimette com'era l'ultimo gesto, regolazioni comprese.
  Posizione, scala e ancoraggio valgono per l'ottica attiva (0,5× e 1,0× hanno i loro); rotazione libera, specchio e
  regolazioni sono della sorgente, uguali per le due ottiche.
- **Le regolazioni, come sono fatte** (`pubblico/regola.js`, `stato.regola`): rotazione e specchio stanno nelle
  proprietà CSS `rotate` e `scale` del pezzo, opacità e filtro in due variabili (`--op`, `--reg`). Luminosità,
  contrasto, saturazione, tinta e sfocatura sono filtri CSS (li compone la scheda video); gamma, nitidezza,
  temperatura e vividezza passano da un filtro SVG creato solo per chi li usa (la vividezza è una saturazione dolce,
  non quella di Camo). Niente acceso = niente filtro, niente costo. Mentre muovi un cursore la regia manda al server
  al massimo sei valori al secondo, e alle pagine arriva solo quello (evento `regola`), non tutto lo stato. Col
  **profilo GPU ridotto** i filtri in onda non si applicano (restano opacità, rotazione e specchio). Perché le
  regolazioni si vedano in Camo, il livello web va ricaricato una volta dopo l'aggiornamento.
- **Scala consigliata** porta le sorgenti on air troppo grandi o troppo piccole a una grandezza che si legge in una
  webcam dentro Discord (`GIUSTA` in `regia.html`): chi rimpicciolisce resta dov'è, chi cresce cresce solo finché non
  esce dallo schermo e non finisce sopra un vicino. Si annulla come gli altri gesti.
- **Rilascia camera**: Diretta OS smette di leggere la webcam «Camo» (il tracking, il sensore dell'ottica, il
  fotogramma di riferimento), così in Camo si può cambiare profilo. Finché è rilasciata il nametag non segue la testa
  e sul monitor c'è l'avviso con «Riacquisisci». Non resta: a ogni riavvio la webcam si legge di nuovo.
- **GPU ridotta**: toglie ombre, filtri, bagliori e livelli dalla pagina, ferma le animazioni CSS e porta il giro a
  **30 fps**; il fuoco WebGL passa al fuoco a pixel. Resta acceso anche dopo un riavvio. Le pagine già aperte lo
  prendono subito; per applicarlo al livello dentro Camo va ricaricato il livello web.
- Il monitor è la stessa pagina di Camo, ma a 15 fotogrammi; in Live le sorgenti sono nascoste e ferme (sono già
  nell'immagine di Camo), si vede solo quella che stai trascinando: per vedere bene rotazione e regolazioni mentre le
  cambi, passa a **Riferimento**.

| Pagina | Cosa mostra |
| --- | --- |
| `/o/tutto` | tutti i pezzi in una pagina sola (la più leggera) |
| `/o/cornice` | il bordo sottile che gira; `cornice.gif` è la stessa cosa come immagine |
| `/o/nome` | «Giugnoh» in Pricedown, il carattere del nome su Discord, **sopra la tua testa** (la segue, vedi «L'occhio»; spento «segue la testa», sta al suo posto): otto numeri in fila (onda, rimbalzo, arcobaleno, capriole, gelatina, glitch, viaggio, battito) che cambiano anche colore; `giugnoh.gif` è la stessa cosa come immagine |
| `/o/spie` | microfono, cuffie, webcam iPhone: verdi se vanno, rosse e lampeggianti se no; attorno al microfono un anello che segue la voce e fa le onde quando alzi la voce |
| `/o/conto` | il conto alla rovescia verso l'ora di andare a letto (02:35, si cambia dalla regia) |
| `/o/meteo` | il tempo di adesso, da Open-Meteo, in grande: l'icona, i gradi e la città sulla prima riga, il tempo e la minima/massima sotto; tre animali dei tuoi adesivi ci camminano sotto, reagiscono al tempo e parlano coi fumetti di Discord |
| `/o/tasti` | le foto vere della G413 SE col G502, oppure del DualSense: quello che stai usando, coi tasti premuti che si accendono di verde |
| `/o/meme` | i 40 meme di pzkko (`pubblico/meme.js`), mescolati, coi simbolini che saltano fuori, 9 s l'uno |
| `/o/adv` | i progetti di pzkko.it (`adv` in `config.json`), mescolati, 9 s l'uno; sta sotto ai meme, così si possono tenere accesi tutti e due |
| `/o/adigeo` | «lui è Adigeo», con la freccia disegnata sul dinosauro (la punta cambia con la lente: `FRECCIA` in `pezzi.js`) |
| `/o/redbull` | le Red Bull bevute oggi, accanto alla lattina, con l'ultima di quanto tempo fa |
| `/o/social` | i follower: ci sono tutti i social di pzkko.it (`SOCIALS` in `pzkko.it/public/assets/config.js`, con le sue icone). In regia accendi quelli da mettere in onda e scrivi i numeri (senza accesso non li danno); Twitch si aggiorna anche da solo, ogni dieci minuti |
| `/o/puff` | il cartellino che segue la puff: gusto, batteria, quale pod (1–4), scritti dalla regia |
| `/o/bandiera` | una bandiera di stoffa appesa al muro dietro con lo scotch, con la luce vera della stanza: la scegli dal catalogo nella sua scheda (vedi «La bandiera») |
| `/o/cavi` | la zona cavi: una macchia scura e sfocata presa dalla foto della stanza, da mettere dietro ai monitor (vedi «La zona cavi») |
| `/o/esterna` | la webcam di un portatile sulla stessa wifi, dentro una finestra (vedi «La vista esterna») |
| `/o/dovevivo` | «Dove vivo»: la casa in 3D (Babylon.js), rifatta dalle foto, con il sole, la luna, la stagione e il meteo veri, senza indirizzi (vedi «Dove vivo in 3D») |
| `/o/azienda` | «Azienda di Giugnoh»: il montaggio in loop delle foto dell’azienda di famiglia, con zoom e crossfade. Il nome vero e il link non compaiono mai |
| `/o/surf` | «Surf con lei»: il tramonto, l’onda, il longboard e noi due; il medaglione delle espressioni cambia ogni quattro secondi |
| `/o/legna`, `/o/pipi`, `/o/bere`, `/o/mangiare`, `/o/sistemo` | «torno subito»: le scritte in alto col tempo che passa, e sotto una scena dal vivo che copre tutta la webcam (vedi «Le scene dei torno subito») |

`/o/tasti?solo=pad` tiene sempre il controller, `?solo=tastiera` sempre la tastiera.
`/dualsense.html` è il DualSense da solo, grande.

## Leggera: 60 fotogrammi al secondo, non 164

Il monitor va a 164 Hz, e il browser (anche quello dentro Camo) ridisegnava tutto 164 volte al secondo, mentre Camo ne
manda in onda al massimo 60 e il device che Discord vede da Camo è 1080p60: il livello web deve stare a 60, non a 164. Adesso:

- **Un giro solo** (`pubblico/giro.js`) per tutto quello che si muove a mano (Giugnoh, l'anello del microfono, le
  bestioline, chi segue, i pezzi del pc, la cornice), a **60 al secondo** (`?fps=30` o il tasto **risparmio GPU** in regia;
  `?fps=15` è l'anteprima della regia, che è piccola e serve solo a prendere i pezzi). Prima misura chi deve misurare,
  poi scrive chi deve scrivere: il browser rifà l'impaginazione una volta per giro, non dopo ogni scrittura.
- **Le animazioni CSS infinite** (i pezzi che galleggiano, le tacche che girano, i pallini che pulsano) le mette in pausa
  e le fa avanzare lui, a ogni giro: anche una sola teneva tutta la pagina a 164 fotogrammi.
- Le ombre (`filter: drop-shadow`) stanno solo sulle cose ferme, che si disegnano una volta; quello che si muove sta in
  un livello suo, e i bagliori sono tratti larghi e trasparenti. La cornice sono quattro tele sottili, non uno schermo
  intero ridisegnato a ogni fotogramma. La barra dei meme si riempie con `transform`, non con `width`.
- **Giugnoh** non ha più nove ombre per lettera rifatte a ogni fotogramma: il contorno è un `-webkit-text-stroke` fermo,
  disegnato una volta dalla scheda video; si animano solo il colore e un bagliore.
- **`will-change`** ce l'ha solo il pezzo in onda, non tutti i trenta (ognuno teneva un livello della scheda video).
- **Risparmio GPU** (tasto in regia): toglie ombre, filtri, bagliori e animazioni CSS, porta il giro a **30 fps** e
  spegne il fuoco WebGL (usa quello a pixel). È la via più veloce per abbassare la scheda video senza cambiare la
  risoluzione: la webcam resta 1080p, cala la fluidità. Resta acceso anche dopo un riavvio; per Camo va ricaricato il
  livello web.

Misurato su `/o/tutto` con lo stesso stato (Edge, RTX 3060 Ti, monitor a 164 Hz, prima del 22 novembre 2026): il processo
della scheda video da **128% a 62%** di un core e da **~380 a ~265 MB**; prima la pagina saltava fotogrammi (fino a
164 ms fermi), adesso nessuno sopra i 25 ms. Il pezzo più pesante, l'SSD, da 49% + 74% a 12% + 12%. La regia aperta: la
scheda video da 136% a 64%, la sua memoria da 655 a 369 MB.

### Meno peso: la mitigazione del 22 novembre 2026

Il 22 novembre 2026 il PC aveva tre costi grossi: `ffmpeg` per l'occhio, il modello dei volti in PowerShell e il
browser che disegnava `/o/tutto` a 60 fotogrammi. Misurato sul PC acceso, con la webcam a 60 fps:

| Chi | Prima | Dopo |
| --- | --- | --- |
| `ffmpeg` dell'occhio | 38% di un core, 172 MB | **10–15%**, 112 MB |
| `volti.exe` (C# + Windows ML) | 23% di un core, 80 MB | **3–4%**, **50–65 MB** (stessa CPU, metà memoria: niente più PowerShell/Add-Type) |
| `node server.mjs` | 24% di un core, 160 MB | **4–5%**, 80 MB |
| `macchina.exe` (cpu, ram, dischi, app) | fino a **225 MB** | **~22–25 MB** (i componenti veri stanno in `macchina-info.ps1`, che poi esce) |
| `sensori.exe` (tasti, audio, controller) | **82 MB** | **~30 MB** (stessa CPU, ~0,8% di un core) |
| livello web in Camo (la pagina) | ~25% + ~23% del processo GPU, 155 MB | resta a 60 (Discord legge 60), ma il contorno di Giugnoh non si ridisegna più e i pezzi spenti non tengono livelli; `?fps=30` se vuoi risparmiare |
| **totale backend** (senza Camo) | **~87% di un core, ~470 MB** | **~22% di un core, ~310 MB** |

Le quattro cose che pesavano di più:

1. **L'occhio leggeva a 960 × 540 e chiedeva il modello a ogni foto.** Adesso legge a **640 × 360**, chiede i volti
   **4 volte al secondo** (e la puff 5), e fra una richiesta e l'altra la testa la segue l'immagine. In più il filtro
   `fps=10` tiene il conto giusto anche quando Camo manda 60 fotogrammi (prima «una ogni tre» ne faceva 20): il modello
   non parte più 20 volte al secondo quando la faccia non c'è. I volti ora girano in un `.exe` C# con Windows ML
   (`volti.cs` → `cache/volti.exe`), non più in PowerShell: metà memoria e niente Add-Type a ogni avvio (la CPU del
   modello è la stessa, il guadagno è memoria e avvio).
2. **La pagina si ridisegnava 60 volte al secondo con nove ombre per lettera.** Il giro resta a **60**, perché è il
   massimo che Discord legge, ma il contorno di Giugnoh non è più composto da nove ombre rifatte a ogni fotogramma e i
   pezzi spenti non tengono un livello della scheda video. `?fps=30` resta per quando vuoi risparmiare.
3. **Le misure del pc erano troppo frequenti.** `macchina.exe` e `nvidia-smi` passano da 5 e 4 volte al secondo a
   **2**; lo speedtest da **30 MB al minuto** a **15 MB ogni cinque minuti**; la foto della stanza, se non riesce, non
   riapre più la webcam ogni cinque minuti (riprova fra mezz'ora). La webcam si apre e si chiude meno, che è anche il
   modo per non rischiare il driver di Camo.
4. **Il processo delle misure si teneva appesi i moduli WMI.** `Get-CimInstance`, `Get-PhysicalDisk` e `Get-NetAdapter`
   costano ~150 MB: adesso li usa `macchina-info.ps1` una volta sola e poi esce, mentre il giro è un `.exe` C#
   (`macchina.cs` → `cache/macchina.exe`) da ~22 MB, non più un processo PowerShell da 76 MB.

Quello che resta da fare per rifarlo meglio: con Camo non si può leggere la webcam a 720p (espone solo 1920 × 1080;
provato, ffmpeg a 1280 × 720 non si apre). L'alternativa è Media Foundation o un'altra virtual cam, invece di decodificare
1080p per farci un 640 × 360. Poi: far scendere la pagina a 15 fps quando niente si muove, per tornare a 60 solo durante
le animazioni; e, se serve altro margine, spostare l'inferenza dei volti su DirectML/GPU. I tre aiutanti (volti, macchina,
sensori) sono già `.exe` C# da ~56, ~25 e ~30 MB; non c'è più un PowerShell fisso. Il grosso del costo rimasto è però
Camo stesso (circa 740 MB e un terzo di un core per la sua pipeline), che Diretta OS non può tagliare.

### I pezzi spenti fuori dal disegno (23 novembre 2026)

`/o/tutto` monta tutti i pezzi, e quelli spenti restavano trasparenti ma dipinti: il browser teneva **366 livelli**
della scheda video (168 MB di texture), 300 dei quali di pezzi non in onda (il quadro hardware, i titoli di coda, «Dove
vivo», surf, azienda…). In più ogni pezzo che ruota mosso dal giro (le lettere di Giugnoh, le icone delle app, la corona
di tacche) fa ricostruire al browser l'albero dei livelli a ogni fotogramma: un `transform` che cambia di rotazione, e
non solo di posto o di scala, non passa dalla via veloce. Da soli costano poco; con 366 livelli erano circa 2 ms a
fotogramma, il 13% di un core.

Adesso un pezzo spento esce dal disegno: `visibility: hidden` su `.aria`, un secondo e mezzo dopo lo spegnimento
(quando l'uscita è finita), e torna subito all'accensione. Lo stesso per la cornice e per lo sfondo dei «torno subito».
Le misure restano quelle (`visibility` non tocca l'impaginazione), quindi posti, muri e regia lavorano come prima. La
copertura dei muri adesso è un confronto di colore in memoria (`occhio.mjs`): niente maschere da disegnare sulla tela.

Misurato su `/o/tutto` con nome, tasti, follower, Red Bull, app e wifi in onda (Chromium senza finestra, RTX 3060 Ti):

| | Prima | Dopo |
| --- | --- | --- |
| livelli della scheda video | 366 | **63** |
| texture | 168 MB | **26 MB** |
| filo principale della pagina | 31% di un core | **16%** |
| di cui ricostruire i livelli | 13,6% | **2,1%** |

Per chi aggiunge pezzi: dentro un pezzo niente `visibility: visible` (lo farebbe disegnare anche da spento), e un
`will-change` messo su un pezzo vale solo finché è in onda. Dentro Camo il livello web va ricaricato perché lo prenda.

### Discord: il massimo che legge

Dal log di Discord (`%APPDATA%\discord\logs\discord_media_rCURRENT.log`) la webcam «Camo» risulta così:

- `camera_default_max_width: 1920`, `camera_default_max_height: 1080`;
- `camera_default_all_sample_formats: ["YUY2"]` (4:2:2, non un formato compresso);
- in `%APPDATA%\Reincubate\Camo\Presets\DEFAULT.config`: `DesiredResolution` 1920 × 1080 e `DesiredFPS` 60.

Quindi il massimo che Discord può leggere da questa webcam è **1080p**, non 4K; e Camo sta già chiedendo 1080p60. Nelle
chiamate normali Discord non ha un selettore di risoluzione o fotogrammi per la webcam: negozia da solo e può trasmettere
più basso (spesso 720p, 1080p quando account, canale e rete lo permettono). Camo consiglia comunque di dare in pasto il
segnale più alto possibile: l'encoding parte da lì e la resa migliore anche se l'app trasmette a 720p.

- Il livello web resta **1920 × 1080 a 60 fps**, come il device che vede Discord; `?fps=30` è solo la modalità risparmio.
  All'avvio `diretta.log` scrive `camo: 1920×1080 60 fps`: se lì vedi altro, il profilo di Camo è sceso.
- Il 4K non serve: Discord non lo legge dalla webcam e Camo lo sconsiglia per le videochiamate.
- In un server, la qualità video del canale può essere alzata dal proprietario; in DM non c'è un selettore per la webcam.
- **Misurato il 23 novembre 2026** sui log WebRTC di Discord (`discord-webrtc_*`, nella stessa cartella, circa un'ora di
  chiamate): da Camo arrivano **60,0 fotogrammi al secondo a 1920 × 1080**, fissi (un solo calo in un'ora). È Discord
  che per la webcam imposta il codificatore a **1280 × 720, 30 fps al massimo, 2,5 Mbit/s** (NVENC), mentre lo schermo
  condiviso dallo stesso account va a 1440p o 1080p a 60 fps, fino a 9 Mbit/s. Le discese (896 × 504, 20 fps) le decide
  il suo controllo di qualità: nel log non c'è mai una riduzione per carico del pc (`cpu:0`). Quindi alleggerire
  Diretta OS non alza quello che Discord manda della webcam: dentro Discord, 1080p a 60 passa solo dalla condivisione
  schermo (Go Live) di una finestra che mostra la webcam.

## Resoconto del mio PC e pezzi singoli: app aperte, cpu, gpu, ram, dischi, temperatura, wi-fi

Otto pezzi a sé più il **resoconto** `/o/quadro`, ognuno col suo link, fatti per stare bene da soli (insieme vanno
sistemati a mano dalla regia). Si accendono uno per uno: «tutti» della regia non li tocca, e all'inizio sono spenti. Ognuno ha il suo colore, il **nome vero
del componente** (al massimo 20 caratteri) e solo la percentuale; non stanno mai fermi: l'anello si riempie e ci corre
sopra una scintilla, la tacca bianca è il picco degli ultimi secondi, sotto scorre la storia degli ultimi 12 secondi, e il
disegno del componente si muove con quello che fa. Sopra il 90% (85° per la temperatura) l'anello pulsa e il numero trema.

| Pagina | Cosa mostra |
| --- | --- |
| `/o/quadro` | «Resoconto del mio PC»: otto schede automatiche e manuali con la macchina e le foto prodotto, processore, scheda video, RAM/SSD/cache, schermi/casse/TV/PC secondario, software e driver con le date, sensori live e colori. Include assorbimento stimato, ore di accensione e cache; i numeri arrivano solo quando è acceso |
| `/o/app` | le icone vere dei programmi aperti (quelli della barra delle applicazioni), in un **rettangolo fisso** di 720 × 132: più app, icone più piccole, stesso spazio. Quella in primo piano ha l'alone lime e il pallino verde di Discord, quelle ridotte a icona sono più spente. Un gioco di Steam prende la sua parte a sinistra col **logo vero** (dalla cache di Steam), «IN GIOCO» e da quanto ci giochi. `?w=400&h=300` cambia il rettangolo |
| `/o/cpu` | l'uso del processore come in Gestione attività; nel chip i 20 thread, ognuno acceso quanto lavora |
| `/o/gpu` | l'uso della scheda video (nvidia-smi), con la ventola che gira più forte col carico |
| `/o/ram` | la memoria usata; i due banchi si riempiono come bicchieri |
| `/o/ssd` | l'attività dell'SSD (la «percentuale di attività» di Gestione attività); le celle si accendono e i bit corrono |
| `/o/hdd` | l'attività del disco a piatti; il piatto gira sempre, la testina cerca quando lavora |
| `/o/temp` | la temperatura del processore (la zona termica di Windows, si legge senza amministratore), in °C; `?di=gpu` quella della scheda video |
| `/o/wifi` | la velocità del wi-fi in Mbps: uno speedtest ogni cinque minuti (Cloudflare/Hetzner/OVH, solo download, al massimo 2 s o 15 MB); il numero in mezzo è finto, oscilla attorno all'ultima misura e scivola piano verso la nuova |

I nomi li trova da solo (`Intel Core i7-12700F`, `GeForce RTX 3060 Ti`, `Micron DDR4 16 GB`, `Intel 670p 512 GB`,
`WD Elements 4 TB`, `Realtek RTL8822CE`); per cambiarli, in `config.json`: `"pc": { "nomi": { "ram": "…" } }`. Sempre
lì, sotto `pc`: `ssd` e `hdd` (il numero del disco da mostrare), `nascoste` (app da non mostrare, espressioni regolari
sul nome o sul percorso) e `giochi` (eseguibili da trattare come giochi, oltre a quelli di Steam, Epic, Riot, Battle.net…).

Si misura solo quello che serve: `macchina.exe` (cpu, ram, dischi, temperatura, app) parte quando uno di quei pezzi è
acceso **e** una pagina lo mostra, e si spegne 15 secondi dopo; lo stesso per nvidia-smi e per lo speedtest. Misura due
volte al secondo (prima cinque), così costa meno. I componenti veri li legge `macchina-info.ps1` una volta sola in un
processo che poi esce (i moduli CIM/Storage/NetAdapter sono grandi: ~150 MB che non restano appesi). Le icone le salva
una volta sola in `cache/app/` (resta sul pc); delle finestre non legge i titoli, solo il programma.

## Le scene nuove (23 novembre 2026)

In regia c’è una sezione **Scene**, con lo stesso nome che hanno in onda e nel loro indirizzo: `/o/dovevivo`,
`/o/azienda`, `/o/surf`. Si accendono **una alla volta**, così non si pestano; ognuna ha il suo posto per la lente
0,5× e per la 1,0× e si sposta come tutti gli altri pezzi. Il **Resoconto del mio PC** sta invece nella
sezione dei componenti e si accende da solo, come gli altri pezzi del pc; è grande anche lui, quindi **scene e
resoconto si escludono**: accendere uno spegne l'altro.

- **Dove vivo**: la casa in 3D, rifatta da capo il 25 novembre 2026 con **Babylon.js** al posto di three.js e con
  gli edifici presi dalle foto del cantiere (vedi «Dove vivo in 3D», qui sotto). La mappa SVG del 23 e la prima
  versione three.js del 24 non ci sono più: le copie stanno in `copie/dove-three-prima-babylon-2026-11-25/`.
- **Azienda di Giugnoh**: nove foto dell’azienda di famiglia, nove schede da 3–4 secondi, zoom e crossfade in loop;
  il nome vero dell’azienda e il link **non compaiono mai**. La card finale chiude su «Azienda di Giugnoh · dal 2007 ·
  in pianura». Le foto sono quelle vere del sito, tenute a 1200 px per non pesare; la grafica della card e il
  montaggio sono di OpenCode.
- **Surf con lei**: l’illustrazione al tramonto è di Claude Code (con Replicate); OpenCode ha fatto lo zoom lento,
  i raggi, la schiuma, gli spruzzi, il cuore e il medaglione in basso a destra, che alterna le espressioni illustrate
  di Alberto e di lei (anche quelle fatte con Replicate). Sono illustrazioni, non foto ritoccate: le foto di lei non
  sono state caricate su Replicate.
- **Resoconto del mio PC** (`/o/quadro`): una tavola a **otto schede automatiche e manuali** (8 s l'una, con
  pallini, frecce e pausa) che racconta tutto il PC: la macchina con le foto prodotto, il processore, la scheda
  video, RAM/SSD/cache, gli schermi, le casse, la TV e il PC secondario (`Pavillion`), i software e i driver con le
  date, i sensori di adesso (CPU, GPU, RAM, SSD, temperatura, ventola, VRAM, rete) e la palette dei colori.
  In più: assorbimento stimato in W/A/€-ora, ore di accensione, cache shader NVIDIA, cache del browser e di
  Windows, processi in memoria e numero di driver firmati. I dati arrivano da `macchina-info.ps1` (una volta sola)
  e da `macchina.mjs` (live, 4 volte al secondo); le foto sono in `pubblico/scene/pc/`.

File: `pubblico/scene.js` (disegno e animazione), `pubblico/scene.css`, `pubblico/scene-nomi.js` (nomi e posti),
`pubblico/scene/dove-osm.js` (solo geometrie OSM: nessun nome, indirizzo o operatore), `riferimenti/osm/mappa.osm`
(l’estratto OSM grezzo da cui sono nate le geometrie), `pubblico/scene/dove/` (la casa in 3D, vedi sotto),
`pubblico/scene/` (surf, nove foto dell’azienda, gli otto
ritratti delle espressioni, `trattore.webp` e `ufficio.webp` fatti con Replicate),
`riferimenti/claude-lavoro/` (brief, scelte, revisione e originali di Claude). Il resoconto del PC sta in
`pubblico/pc.js` (`creaQuadro`), le foto in `pubblico/scene/pc/`, il componente vero in `macchina-info.ps1`
(`report`) e i sensori live in `macchina.mjs`; il server lo aggiunge a `PEZZI` e a `DA_SOLI`.

La revisione grafica di Claude è in `riferimenti/claude-lavoro/out/REVISIONE.md` (prima passata) e
`REVISIONE-2.md` (controllo finale): le note che valevano sono state applicate — foto dell’azienda senza
numero civico né marca della macchina, raggi del surf tolti, quadro con i nomi della regia, posizioni
più piccole a 1,0×, cuori e medaglione con le espressioni che si alternano, cornice a mano anche per
l’azienda. La mappa di «Dove vivo» è stata poi rifatta in SVG nativo da OpenStreetMap, quindi le note
grafiche della prima revisione sulla vecchia mappa non valgono più.

## Dove vivo in 3D (25 novembre 2026)

Alberto ha chiesto di rifare la scena 3D «completamente, con un programma diverso per disegnare», e ha passato sette
foto del cantiere (`D:\disco immagini\rullino con etichetta\HPIM M417\HPIM09F93 (22–28).JPG`). Il programma nuovo è
**Babylon.js 9.37** (Apache-2.0): un pacchetto su misura di 2,2 MB in `pubblico/scene/lib/babylon/babylon.js`, fatto
con esbuild prendendo solo i pezzi che servono (niente WebGPU), più earcut (ISC) per i muri con le aperture. three.js è
stato tolto: non lo usava nient'altro.

- **I fabbricati dal CAD** (25 novembre 2026, sera: «faceva cagare… intanto disegnamo solo i fabbricati come poligoni
  3d dandoti le misure su cad»): `fabbricati.js` li costruisce come poligoni a tinta unita, senza texture, con le misure
  della «Pianta dei fabbricati per l'IMU, pulita.dwg» (`D:\pecchini\01 Cascina Fontana (società)\2025\Disegni`, copia
  in `riferimenti/lotto/pulita.dxf`, in centimetri). Nel file i numeri sono quelli del CAD, portati nel telaio da `U()`
  e `V()`: corpo centrale 16,00 × 17,80 m col portico (tre arcate fra i pilastri 50 × 50, un arco per lato fino alle
  spalle da 70 cm), facciata sotto il portico con finestra–portone–finestra e sopra il piano primo aperto (nel CAD lì
  non c'è muro), retro con portone da 4,08 m e tre finestre da 3 m sopra; ali da 6,00 × 10,00 m (ovest due piani, est
  uno) con le finestre e le porte del CAD; rimessa 16,00 × 10,00 m aperta verso la casa fra quattro pilastri 40 × 40,
  tre lunette verso i campi, tetto dalla sezione del CAD (colmo 5,08 m a 3,70 m dal lato casa, gronde 4,05 e 3,32 m,
  falde al 27,94 %). Le sagome a terra del CAD prendono il posto di quelle della planimetria (`IMPRONTE`). Le altezze della
  casa il CAD non le ha: stanno in `ALTEZZE` (gronde 6,5 / 5,9 / 3,6 m, solaio 3,1 m, falde a 18°, dal modello di
  prima). Rispetto a prima non ci sono più la scala di ferro, il comignolo, il casotto, gronde e pluviali (nel CAD non
  ci sono). La versione di prima, dalle foto, è ancora in `edifici.js` (basta rimetterla nell'import di `dove.js`):
- **Gli edifici, dalle foto** (la versione di prima): cemento a vista grigio con le riprese dei pannelli, pilastri e davanzali in mattoni,
  coppi, persiane verde scuro, modiglioni sotto le gronde, gronde e pluviali marrone scuro. Il corpo centrale ha
  davanti il **portico a tutta altezza** (tre archi sul fronte e uno per lato, pilastri d'angolo in mattoni fino
  all'imposta, pavimento in cotto, la **scala di ferro** che sale al pianerottolo), dietro due piani con il portone;
  il **comignolo** in mattoni sul timpano est. L'ala ovest ha due piani e i pilastri d'angolo in mattoni, con il
  **pergolato** e la vite sul lato corto; l'ala est è bassa, con la porta ad arco. Il **capannone** ha le lunette ad
  arco, il grande arco verso la casa e **24 pannelli** sulla falda a sud; accanto c'è il casotto. Le sagome sono
  quelle del rilievo (`dati.js`), le altezze e le aperture sono lette dalle foto.
- **Fuori**: la **piscina** rialzata col bordo in cotto, l'acqua azzurra, due getti e due aironi; le reti con i pali,
  il **cancello** a lance in fondo al viale, il **Landini** grigio con le ruote arancioni, i vasi di cotto.
- **Il verde, con la stagione vera**: platani del viale (corteccia chiara a chiazze), gelsi capitozzati a file sul
  prato, pioppi cipressini lungo i campi, alberelli a filari nel bosco nuovo, siepi lungo le reti. Rami veri e foglie a
  ciuffi: quante ne restano e di che colore dipende dal giorno dell'anno (a fine novembre i platani sono gialli e mezzi
  spogli, i pioppi quasi nudi, le siepi verdi; d'inverno solo rami). Le foglie cadute stanno sul prato.
- **La luce vera**: il sole e la luna (con la fase) per l'ora vera, ombre morbide, occlusione ambientale, cielo con le
  nuvole che vanno col vento e si chiudono col coperto, stelle, foschia della bassa. Il **meteo** del server accende
  pioggia, neve, nebbia e lampi. La sera si accendono le finestre e le lanterne accanto alle porte.
- **Il terreno**: una mappa dipinta in canvas (prato rasato a strisce, ghiaia del cortile e del viale, campi arati a
  novembre, strade bianche, fossi con l'acqua che specchia il cielo) e oltre la campagna fino a 3 km, a campi lunghi,
  con i filari lontani. Nessun dato geografico: tutto è in metri locali, la latitudine generica sta in `luce.js`.
- **Comandi e regia**: come prima (trascina = sposta, destro o Ctrl = ruota, rotella = zoom, doppio clic = vola lì,
  frecce, `N` o la bussola = nord in alto). La camera si scambia con la regia nello stesso formato di prima
  (`{ c: [x, y, distanza, rotta, inclinazione] }`), quindi la posizione salvata vale ancora; adesso si può scendere
  fino a 6° e vedere l'orizzonte. Dopo 20 s fermi parte la visita guidata (portico, piscina, pergolato, retro, viale,
  capannone, dall'alto).
- **Il peso**: la prima accensione dipinge le texture e costruisce tutto in circa 1,5 s (la tela compare quando è
  pronta), le volte dopo in 0,7 s. In prova: 60 fotogrammi al secondo, 2,5 ms di processore a fotogramma,
  ~480 000 triangoli. Le ombre si calcolano solo quando il sole si sposta (ogni 20 s). Spenta da un minuto, la scena
  butta via il contesto WebGL e libera la scheda video. Con «risparmio GPU» (`niente-gpu`) niente ombre, niente
  occlusione e niente MSAA. Senza WebGL resta la pianta del lotto in SVG (e alla riaccensione si riprova, al massimo
  una volta ogni 15 s: prima restava la pianta finché non si ricaricava la pagina).
- **Senza GPU** (25 novembre 2026, sera: «mappa 3d è rotto»): la regia aperta con **Diretta OS (Chromium senza GPU)**
  fa disegnare il WebGL al Microsoft Basic Render Driver, cioè al processore, e la mappa intera lì andava a **2,9 fps**
  (65 con la RTX 3060 Ti). Adesso la scena se ne accorge (chiede a una tela minuscola chi disegna) e:
  - nell'**anteprima Live** con l'immagine di Camo sotto (non nera: con Camo chiuso la sua camera manda fotogrammi neri)
    non disegna niente: si vede la mappa di Camo, che la disegna con la scheda video, e questa pagina fa da
    **telecomando** (il mouse funziona uguale, la camera si manda anche mentre trascini, la bussola è cliccabile dove
    sta nell'immagine). In alto c'è la scritta «Questa finestra è senza GPU: vedi la mappa di Camo, la guidi da qui»;
  - senza l'immagine di Camo (chiuso, camera rilasciata, «Riferimento») la disegna **piccola**: 960 × 540, senza
    ombre, occlusione, bagliore e vignetta. Misurata col suo Chromium senza GPU: **11 fps** invece di 2,9.
  Per provarlo: `?gl=software` nella prova fa finta di non avere la GPU.

File, tutti in `pubblico/scene/dove/`: `dove.js` (il modulo della scena: motore, materiali, luci, resa, comandi,
visita), `luce.js` (sole, luna, stagione, tavolozza), `tele.js` (le texture dipinte in canvas), `geo.js` (muri con
aperture, tetti, tubi), `fabbricati.js` (casa e rimessa dal CAD, quella in uso), `edifici.js` (casa e capannone dalle
foto, la versione di prima), `esterni.js` (piscina, pergolato, reti, cancello, trattore),
`verde.js` (alberi e siepi), `terra.js` (terreno vicino e lontano), `cielo.js` (la cupola), `dati.js` (il rilievo).
**Per provarla**: `/scene/prova.html?scena=dovevivo&vista=portico&ora=17:30&meteo=pioggia&tour=0` (viste: `tre`,
`alto`, `portico`, `casa`, `retro`, `fontana`, `pergolato`, `capannone`, `viale`, `campi`, `orizzonte`; `tour=1` fa
partire subito la visita; `nogl` mostra il ripiego). Il pacchetto si rifà con esbuild da un elenco di import di
`@babylonjs/core` (vedi la riga in cima a `babylon.js`).

## La vista esterna: la webcam di un portatile, in wifi

La **vista esterna** è la webcam di un altro pc della stessa rete dentro una finestra della diretta: serve,
per esempio, per mettere un portatile alla finestra dell’ufficio e avere quella vista dentro Camo, senza cavi.
Un portatile alla volta, solo video (niente microfono), niente cloud: i fotogrammi passano dal wifi al pc e
restano in memoria, l’ultimo soltanto.

### Collegarla

1. In regia, **In rete → collega un pc**. Compare solo l’indirizzo: **non c’è più nessun codice**.
2. Sul portatile apri quell’indirizzo (`https://…:2371`, lo stesso della rete del pc; se il nome del pc non si
   apre, nella scheda c’è anche l’indirizzo IP). La prima volta il browser dice che la connessione non è privata:
   è il certificato fatto in casa dal pc, non un sito. **Avanzate → Procedi** (in Firefox: **Accetta il rischio
   e continua**), una volta.
3. Consenti la fotocamera. La pagina **si collega da sola**: niente codice, niente pulsanti da premere. La
   finestra si accende da sola in Camo (`/o/esterna`, dentro `/o/tutto`).
4. Dalla scheda della vista esterna puoi **spegnere/accendere**, **specchiare**, **adattare tutta** l’inquadratura,
   rinominare il portatile o **staccarlo**. Si sposta e si ingrandisce come tutti gli altri pezzi.

Sul portatile la pagina è diventata un piccolo studio: **solo l’inquadratura e una barra di icone**, nessuna
scritta. L’ingranaggio apre le **regolazioni**, con dentro tutto quello che serve: obiettivo e cambio webcam,
messa a fuoco (automatica, continua o manuale), sfondo (nessuno, sfocato, scuro, nero), riflettori, ritocco,
filtri ed effetti, inquadratura con zoom e formato (16:9, 4:3, 1:1, 9:16), esposizione con velocità otturatore
e ISO, bilanciamento del bianco con temperatura e tinta, livello flash, luminosità, tinta, saturazione,
vividezza, contrasto, gamma e nitidezza. In più: specchia, griglia, schermo intero, torcia (se la webcam ce
l’ha), rotazione, salvataggio di un fotogramma e **fluidità** (30 fps di partenza, poi 25, 24, 20, 15, 10 o 5)
con **qualità** alta, media o bassa. Se colleghi una **seconda webcam**, l’elenco si aggiorna da solo e la
scegli da «Obiettivo»; la scelta resta anche dopo un ricaricamento.

Il collegamento **non scade più** e non si stacca da solo: se il portatile si addormenta o perde la wifi,
la regia tiene l’ultimo fotogramma nell’anteprima e il collegamento resta aperto; quando i fotogrammi
tornano, la vista torna in onda da sola. Anche lo schermo del portatile resta acceso (se il browser lo
permette), così non va in blocco dopo dieci minuti. Se la regia preme **stacca**, quel portatile non rientra
da solo per cinque minuti: sulla sua pagina compare **Ricollega**. Chiudendo la scheda, il posto resta libero
per un altro portatile dopo un minuto.

### Come è fatta

- `esterna.mjs`: il server della pagina del portatile (porta **2371** di tutte le reti) e il flusso MJPEG per
  Camo. La porta si cambia in `config.json` → `esterna.porta`, o con `DIRETTA_VISTA_PORTA`; `--senza-vista`
  non la apre.
- `vista.html`, `vista.css`, `vista.js`: la pagina del portatile (collegamento automatico, anteprima,
  regolazioni della webcam). È servita **solo** da quel server: non è la regia e non può comandare niente.
- `pubblico/esterna.js`, `pubblico/esterna.css`: il pezzo `/o/esterna`, con i suoi stati (in attesa, in diretta,
  segnale perso). La finestra sta sotto agli altri pezzi, quindi le scritte e Giugnoh restano davanti.
- `pubblico/sorveglianza.js`, `pubblico/sorveglianza.css`: la scritta da telecamera di sicurezza sopra la finestra
  (data e ora in alto a sinistra, «● REC» / «SEGNALE PERSO» / «NO VIDEO» in alto a destra, «CAM 02 ESTERNO» in
  basso a destra). Prende il posto del «LIVE» e della pillola dello stato; il cartellino della luce scende in basso
  a sinistra. Un timer ogni mezzo secondo, fermo quando il pezzo è spento. Il nome si cambia in `pezzi.js`
  (`sorveglianza(creaEsterna(), { cam: 'CAM 02', dove: 'ESTERNO' })`).
- `cache/vista.pfx` e `cache/vista-cert.json`: il certificato HTTPS, fatto una volta con PowerShell. Quando
  cambia la rete, riavvia Diretta OS: il certificato si rifà con i nuovi indirizzi (e il browser chiede di
  nuovo «Procedi»). Non va nel repository.
- **L’aspetto (22.11)**: la regia, i muri e la pagina del portatile tengono il **layout di Claude Code**
  (striscia, rail, colonna dei pezzi, banco, scheda a due colonne) e il **tema di casa**: nero `#0b090e`,
  lime `#ccff00`, viola `#9d00ff`, Pricedown per «Giugnoh». Il tema sta in fondo al CSS di `regia.html` e
  `muri.html`; `vista.css` è tornato scuro come prima. **Dal 23.11** la regia è a zone (vedi «La regia») e parte col
  tema Discord verde chiaro; il tema scuro si sceglie da Configurazione → Aspetto, e in `muri.html` è il foglio
  `#tema-scuro`, acceso solo con quella scelta. La pagina del portatile (`vista.css`) resta scura.

### Il radar e la luce della stanza (23.11)

La finestra della vista esterna è una webcam al fosforo: verde radar, con la trama, le righe di scansione e il
fascio che gira. Il verde non è fisso: la tinta si scalda con la luce calda e diventa verde-acqua con quella
fredda, e la luminosità segue il fotogramma. `esterna.js` legge la webcam in piccolo (48 × 27) una volta ogni
1,6 s e ricava il colore delle superfici illuminate, quanta luce c'è e da che parte arriva. Con quella misura
tinge i widget (pillola, LIVE, cartellino, nome) e sposta i loro riflessi e le ombre, come `bandiera.js` fa
con il muro dietro di sé; la stessa lettura compare nella scheda della regia («Luce della scena: ...»).
La lettura è solo in memoria e non tocca il flusso: i fotogrammi restano 15 fps (5 da ferma).

### Se non va

| Cosa | Cosa guardare |
| --- | --- |
| La pagina del portatile non si apre | porta 2371 libera? pc e portatile sulla stessa rete? Windows Firewall: consenti Node.js sulle reti private |
| Il browser non fa accendere la webcam | l’indirizzo deve cominciare con `https://`; la prima volta «Avanzate → Procedi»; poi permesso Fotocamera |
| «La webcam è occupata» | Zoom, Teams, Discord o un’altra app la stanno usando: chiudila e riprova |
| La webcam sfarfalla sotto le luci | la pagina la chiede a 25/30 fps proprio per questo; se resta, allontanala dalle luci a LED o usa la webcam del telefono |
| La finestra dice «segnale perso» | il portatile ha chiuso la scheda, è andato in standby o ha perso la wifi; la pagina continua a riprovare da sola: quando torna, la vista torna con lei. Se hai premuto «stacca» in regia, sulla pagina del portatile c’è «Ricollega» |
| Il nome del pc non si risolve | usa l’indirizzo IP che compare sotto quello principale nella scheda |
| La porta è già in uso | cambia `esterna.porta` in `config.json` (e riavvia), oppure chiudi chi la occupa |

La webcam del portatile viaggia **a 30 fotogrammi al secondo di partenza** (si sceglie fra 30, 25, 24, 20, 15,
10 e 5 nella pagina), a **960 px di larghezza** di partenza (qualità alta 1280, media 960, bassa 640), in JPEG
dentro un flusso MJPEG: niente file su disco, niente registrazioni. La webcam viene chiesta a **30 fps** e il
portatile tiene lo schermo acceso (se il browser lo permette). Nella regia e nella scheda le foto
dell’anteprima si caricano su **due strati** e si scambiano solo quando la nuova è pronta: la finestra non
lampeggia più a ogni aggiornamento. Il token nel cookie e il fatto che ci sia un solo portatile alla volta
tengono la pagina separata dalla regia: da lì non si possono leggere la webcam del pc né comandare i pezzi.

## Giugnoh's Cast: il podcast, in diretta e sulla tv

Sotto l'anteprima della regia c'è la fila **Giugnoh's Cast**: «inizia puntata», «argomento a caso», «fine puntata»
(poi «chiudi»). Il numero della puntata cresce da solo a ogni inizio (si corregge nella scheda dell'argomento). Tutto sta
in `podcast.mjs` (lo stato `podcast`, salvato: la puntata resta in onda anche se il server riparte).

| Pagina | Cosa mostra |
| --- | --- |
| `/o/argomento` | l'argomento a caso: «Giugnoh's Cast · EP. n», il rullo che gira forte e frena con le frecce che scattano a ogni voce, lo scatto sulla voce scelta (lampo, tremolio, coriandoli), poi l'argomento grande col tempo che ci stai sopra |
| `/o/fine` | la fine puntata: le strisce lime e viola passano davanti a tutto lo schermo, «Giugnoh's Cast» lettera per lettera, i saluti, quanto è durata, quanti argomenti, gli argomenti che scorrono come i titoli di coda; sta al centro |
| `/tv` | **solo per la tv, 4K** (sotto) |

- L'estrazione la fa il server: mai un argomento già fatto nella puntata; rifatto entro 15 secondi, quello di prima torna
  nel cappello. Il server manda il rullo e l'ora, e ogni pagina calcola da lì dov'è (`pubblico/cast.js`): Camo, la regia
  e la tv vedono lo stesso rullo nello stesso istante, anche ricaricate a metà.
- Gli argomenti si scrivono nella scheda dell'argomento, uno per riga («salva»); «rimetti quelli di partenza» torna ai
  48 di `PRIMI` in `podcast.mjs`.
- I due pezzi si accendono dai tasti del podcast («tutti» non li tocca). Accendere «Argomento a caso» dalla lista ne
  estrae uno; accendere «Fine puntata» chiude la puntata.

**La tv.** È un altro apparecchio in rete, e il server delle sovrimpressioni ascolta solo su questo pc: per lei c'è un
secondo server sulla porta **2360** di tutte le reti del pc (`podcast.tvPorta` in `config.json` per cambiarla), che
serve solo la pagina della tv, i suoi caratteri e adesivi e il flusso del podcast (`/api/tv`), in sola lettura: niente
regia, niente azioni, niente webcam né foto della stanza. Il canale è **`http://<ip del pc>:2360/`** (oppure `/canale`,
che porta a `/tv`). Gli indirizzi sono in **impostazioni → La tv del podcast**; il pallino «tv» nella fila del podcast
diventa verde quando la tv è collegata. La prima volta, OK sul telecomando per lo schermo intero.
- **La porta è aperta solo in rete locale**: la regola del firewall «Diretta OS TV (porta 2360)» lascia passare
  `LocalSubnet`; si rifà con `strumenti/firewall-tv.ps1` (serve l'UAC). Il Wi-Fi di casa è spesso classificato «Pubblico»,
  e senza quella regola il browser della tv non arriva al pc.
- **Trova la tv e apri il canale da solo**: in **impostazioni → La tv del podcast** ci sono «trova la tv» e «apri il
  canale sulla tv». `tv.mjs` cerca la TV con Google Cast/eureka (nome e IP), poi usa il protocollo LG webOS (SSAP) per
  far aprire `/tv` nel browser. La chiave di accoppiamento resta in `cache/tv-lg-key.json`.
- Se compare «La TV non lascia comandare il browser», sul televisore va acceso **Impostazioni → Rete → LG Connect Apps**
  (una volta sola). Senza, la TV si fa trovare ma risponde `404` a tutti i comandi. Dopo il tentativo la regia riprova
  da sola ogni 20 secondi per dieci minuti: appena accendi l'opzione, il canale si apre senza premere altro.
- Sul pc di casa la TV è stata trovata: **[LG] webOS TV QNED756RA, `10.1.12.106`**. Il canale è
  `http://10.1.114.45:2360/` (Wi-Fi) oppure `http://10.1.114.45:2360/canale`.
- **Se la TV va in standby da sola**, non è l’Energy Saving: sono i timer della TV. Spegni
  **Impostazioni → Tutte le impostazioni → Generale → Sistema → Data e ora → Timer**:
  **Timer di spegnimento** (Power Off Timer), **Sleep Timer** e **Spegnimento automatico dopo 4 ore**
  (e, se c’è, **Spegnimento senza segnale**). La pagina `/tv` chiede anche la **Screen Wake Lock** al browser della TV:
  se il browser la supporta, la tv non si spegne per inattività mentre il canale è in onda; un timer impostato sul
  televisore resta però più forte.
- 4K vero: la pagina è disegnata su 3840 × 2160 e misurata in rem, che si ricalcolano sullo schermo, così il browser
  della tv usa i pixel veri del pannello. Scura di fondo (la tv si vede in webcam e cambia la foto della stanza).
- ON AIR che si accende e si spegne come un neon, l'ora e il tempo in onda, le cuffie di pzkko sopra «Giugnoh's Cast»,
  le barre che ballano con la voce del microfono, la lumaca al neon che attraversa lo schermo, il nastro in basso con la
  puntata e gli argomenti; lo stesso rullo e la stessa fine della diretta, in grande. JavaScript «vecchio» (`tv.js`,
  niente moduli né `?.`): il browser delle tv è spesso indietro.
- **Dritta in diretta** (impostazioni): Camo specchia la webcam, quindi la tv in diretta si legge al contrario; acceso,
  la pagina si gira e in diretta si legge dritta.
- **Sulla tv non si tocca niente**: cosa fa vedere si sceglie in regia, dalla fila **Sulla tv** sotto quella del podcast.
  Sette schermate, a tutto schermo e quasi senza bordi, che si danno il cambio con una dissolvenza: **Podcast** (la
  puntata com'è sopra), **Logo** (solo le cuffie e «Giugnoh's Cast»), **Ora** (le cifre giganti e il giorno),
  **Giugnoh** (il nome in Pricedown, le lettere che ondeggiano e cambiano colore), **Chi parla** (l'etichetta «sta
  parlando» e il nome gigante, che batte con la voce del microfono; i nomi restano in una lista, uno nuovo si scrive e
  Invio, «togli» lo leva), **Testo** (quello che scrivi va sulla tv mentre lo scrivi, grande quanto ci sta, anche su più
  righe) e **Meteo** (Mantova in grande: icona, gradi, il tempo, minima, massima, percepiti e vento, con la pioggia, la
  neve o le stelle che cadono dietro). Quando la puntata parte, esce un argomento o finisce, la tv torna da sola al
  podcast. La schermata scelta resta anche dopo un riavvio (`stato.podcast.schermo`).
- **Si aggiorna da sola**: quando il server riparte o cambiano `tv.html`, `tv.css`, `tv.js` o `cast.js`, la tv si ricarica
  da sola (il server le manda una «versione»; `podcast.mjs` la controlla ogni 3 secondi).

## Non si pestano e non coprono chi è in webcam

Ogni pezzo ha un posto per ciascuna lente (`POSTI` in `pubblico/pezzi.js`), scelto sulle due
foto in `riferimenti/` (`05.jpg` e `10.jpg`): tutto sta sui bordi. Le scritte dei «torno subito» stanno in alto, fra
il meteo e le spie, e si danno il cambio. I posti spostati dalla regia
vincono su questi. Accensioni, spegnimenti e cambio di lente sono
dissolvenze e spostamenti morbidi.

## Le scene dei «torno subito»

Ogni tasto «torno subito» copre tutta la webcam con una scena dal vivo, sotto ai pezzi (`pubblico/via/`), e **spegne
da solo tutti gli altri link** (anche i pezzi del pc): resta la scena con la scritta grande al centro.
Quelli che erano accesi il server se li ricorda (`viaPrima` nello stato, salvato: anche se il server riparte a metà) e
**li riaccende quando torni**. Passare da un «torno subito» all'altro non riaccende niente; un pezzo che tocchi a mano
mentre sei via resta come l'hai messo tu; «spegni tutti» mentre sei via vuol dire che al ritorno non torna niente.
Finché sei via l'occhio si spegne e il sensore a immagine della lente non vota (la webcam fa vedere la scena, non la
stanza).

**La scritta al centro** (`scritta.js`) è viva: lettera per lettera, ognuna col suo passo, e segue quello che succede
nella scena in quel momento (la scena lo dice a ogni fotogramma). Sotto il titolo una riga racconta cosa sta succedendo,
e il «via da» batte i secondi. Entrano a onda (ognuna a modo suo) e quando torni volano via, prima che la scena sparisca.
- stufa: lettere di fuoco che sfarfallano, le scintille che salgono; quando cade un ciocco la scritta sobbalza, si
  accende e schizzano scintille («dentro il ciocco!», «ciocco n. 2 dentro!», «crepita…», «fuori 4°, qui si sta bene»);
- pipì: arrivano di corsa da sinistra, saltellano («scappa!!»), si guardano attorno («nessuno guarda?»), poi
  ondeggiano rilassate («psssss…», «ahhh…» con la scritta che si abbassa), «fatto!» con le stelline; sul ceppo
  respirano, di notte le lucciole lime ci girano attorno e accendono le lettere, di giorno cadono le foglie della
  stagione, con la pioggia le gocce schizzano sulle lettere;
- bere / mangiare: cadono dall'alto e rimbalzano; camminano a passi con l'omino («verso casa · 28 m»), il frigo le
  illumina di freddo («meh, niente»), «ho trovato i tortelli di zucca!» coi coriandoli, il microonde le fa vibrare
  («ding!»), a tavola masticano con le briciole (o ondeggiano come un bicchiere, con le bollicine) e il vapore se è caldo;
- postazione: colori RGB che girano (più veloci sul pc e sulle luci); camminando le lettere si stortano, nel lavoro
  tornano dritte una a una con lo scatto e i pixel; pendono coi cavi, si battono come la tastiera, «mi vedete?» le storce;
- Red Bull: blu come la lattina; dopo il sorso alla scritta spuntano le ali (bianche, sbattono, cadono le piume), si
  alza e resta su, carica, tremolando; «è la numero 3 di oggi»;
- telefono: squilla (vibrano a scatti), poi quando parla saltano come un equalizzatore con gli archi della voce,
  quando ascolta stanno quiete e annuiscono a ogni «mh mh», quando ride si piegano; «in chiamata da 3:12»;
- legna: color legno; mentre alza l'ascia si tirano su in tensione, al colpo la scritta si spacca a metà (sinistra a
  sinistra, destra a destra) e si richiude, con le schegge; «ciocchi spaccati: 7»;
- riavvio: si spegne con lo schermo (si schiaccia in una riga bianca), si riscrive a macchina col cursore nel BIOS, si
  riempie di lime con la percentuale dell'aggiornamento (e al 99% freme), salta a ogni tasto della password, va in
  pezzi col glitch e con lo schermo viola.
Sta al centro dello schermo; se la sposti dalla regia resta dove la metti (doppio clic: torna al centro). Le lettere si
costruiscono solo quando il tasto si accende e si smontano quando sono volate via: spente non costano niente.

- **Legna nella stufa** (`fuoco.js`): il fuoco vero dal vetro di una stufa di ghisa, calcolato dalla scheda video
  (WebGL): fiamme, ciocchi con le crepe accese, brace, scintille. Al primo secondo cade dentro un ciocco nuovo e la
  fiamma si alza; poi uno ogni 50 secondi. Senza WebGL c'è un fuoco a pixel più semplice.
- **Pipì** (`bosco.js`): l'omino arriva di corsa nel bosco, controlla che nessuno guardi, la fa contro l'albero grande
  (si vede appena), poi si siede sul ceppo a guardare il cielo e le lucciole lime.
- **Qualcosa da mangiare / da bere** (`casa.js`), tutto in due minuti: esce dall'ufficio, fa i 50 metri fino a casa
  (1,4 m al secondo, con i metri che mancano sopra la testa) tra i pioppi, il campanile, la barchessa, l'orto e il
  trattore; dentro cerca nel frigo, nel pensile, nello sportello in basso, trova qualcosa e si siede a mangiare o a
  bere. Quello che trova è un oggetto vero di pzkko, secondo l'ora (il cornetto la mattina, i tortelli a pranzo e a
  cena, la sbrisolona a merenda, il ramen di notte; da bere pzk-kola, estathé o una lattina), e va nel microonde se va
  scaldato. Dopo i due minuti resta lì a mangiare.
- **Sistemo la postazione** (`postazione.js`): la stanza in pixel art (il mobile con la TV e il casco, il cono col
  peluche, l'orologio dorato, la cassetta verde, il microfono bianco) con la scrivania in mezzo, il PC da gaming e i due
  schermi. L'omino ci gira attorno senza fermarsi: schermi storti, cavi sotto la scrivania, i colori del PC e delle luci,
  la sedia, «mi vedete?» con la scena che si storce. Sullo schermo di destra c'è la scena stessa, piccola.
- **Una Red Bull** (`casa.js`, la stessa strada fino a casa): in cucina sa dov'è. Dritto al frigo (la fila di lattine
  blu), la lattina di pzkko con l'ala, «PSST!», un sorso lungo a testa in su, «CARICO!» e gli spuntano le ali (si alza
  da terra); poi al tavolo. **Quando torni il contatore «Red Bull di oggi» fa +1 da solo** (se sei stato via almeno 8
  secondi: un tasto premuto per sbaglio non conta).
- **Al telefono** (`telefono.js`): l'aia davanti a casa (la porta verde, la tettoia, la panchina, la bici, il gatto nero
  sullo scalino, i pioppi e il campanile). Esce col telefono che squilla, «PRONTO?», poi avanti e indietro sulla ghiaia
  parlando e ascoltando, si ferma a gesticolare, si siede sulla panchina, ride, annuisce; le battute sono scelte col
  seme. Di sera le finestre e il lampione accesi e il telefono che gli illumina la faccia; col freddo il fiato; con la
  pioggia cammina sotto la tettoia.
- **Spacco la legna** (`spacco.js`): la barchessa coi pilastri di mattoni e i due archi (la legna vecchia, la catasta che
  cresce), il ceppo davanti, la campagna a destra. Un ciocco alla volta: lo prende dal mucchio, lo mette sul ceppo, alza
  l'ascia… «TOC!», le metà volano, le schegge restano per terra, le metà finiscono sulla catasta. Ogni tanto l'ascia
  resta piantata («BLOCCATA!» e lo sbatte di nuovo), ogni tanto «PFF»; pioggia e neve cadono fuori, non sotto il portico.
- **Riavvio il pc** (`riavvio.js`): lo schermo del pc, a pixel, come un vecchio monitor. Si spegne, il BIOS di pzkko
  (conta la memoria), la lumaca di pzkko con la rotellina, l'aggiornamento che corre, rallenta, salta e si pianta al 99%,
  il login con il cielo di adesso, l'ora vera e la tua faccia a pixel, il desktop che apre le app… poi «:(» e si riavvia
  di nuovo (e l'aggiornamento dopo è «2 di 3», poi «3 di 3», poi «4 di 3»). Le cose dello schermo stanno sopra e sotto
  la scritta, non dietro.

Le scene fuori hanno **il cielo di adesso**: il sole e la luna sopra Mantova calcolati per l'ora vera (con la fase
della luna), le stelle di notte, il tramonto; **il tempo che fa** (pioggia, neve, nebbia, nuvole, dal meteo o dalla
prova del meteo in regia); **la stagione** (le foglie d'autunno che cadono, i rami nudi d'inverno) e, quando fa freddo,
il fiato e il fumo del camino. L'omino sei tu in pixel art (capelli castani, maglione grigio scuro con la zip, jeans,
scarpe bianche: `omino.js`), con il contorno scuro come gli oggetti di pzkko; le scene a pixel si disegnano a 480 × 270
(dentro casa e in postazione a 240 × 135) e il browser le ingrandisce senza sfumare. Il tempo della scena parte da
quando premi il tasto, e le cose a caso hanno quel momento come seme: regia e Camo, anche ricaricati a metà, vedono la
stessa scena. **Per provarle** senza essere via: `/via/prova.html?scena=bosco&ora=22:30&meteo=nebbia&gradi=4&t=20`
(`scena` = `fuoco`, `bosco`, `casa-mangiare`, `casa-bere`, `casa-redbull`, `telefono`, `spacco`, `postazione`, `riavvio`; `fermo` la tiene ferma; `foglio=12&passo=4`
fa vedere 12 momenti insieme).

## La webcam «Camo»: una lettura alla volta, chiusa con le buone

Il 21 novembre 2026 il PC è andato più volte in **schermata blu** usando la regia (0x50 PAGE_FAULT_IN_NONPAGED_AREA).
Il file del crash dice dove: dentro **`camodriver.sys`**, il driver di Camo (4.70.1.13063, del 2023), sempre allo stesso
punto (+0x2813). Scrive oltre la fine di un suo blocco di memoria quando la sua webcam viene aperta da un secondo
programma mentre altri la leggono (Discord, il sensore della lente), o chiusa di colpo e riaperta subito. L'anteprima dal
vivo della regia accendeva l'occhio, che apriva un secondo ffmpeg sulla webcam; e `riavvia.cmd` e «libera la cam» li
chiudevano di forza. Da allora (`cam.mjs`):
- la webcam la legge **un solo ffmpeg di Diretta OS alla volta**: il sensore della lente, oppure l'occhio, oppure la foto
  della stanza. Chi la vuole e conta di più (foto, poi occhio, poi lente) fa spostare chi ce l'ha; mentre c'è l'occhio,
  il sensore della lente guarda le foto dell'occhio invece di aprirla;
- si chiude **con le buone**: «q» a ffmpeg, che chiude la webcam ed esce da solo (in prova: 0,14 secondi). Di forza solo
  se dopo 5 secondi è ancora lì;
- fra uno che la lascia e il prossimo passano **almeno 3 secondi** (8 dopo l'accensione del server);
- l'occhio non si spegne appena chiudi l'anteprima: aspetta che non serva più da 20 secondi, così chiudere e riaprire la
  regia non apre e chiude la webcam ogni volta;
- `riavvia.cmd` prima chiede al server di chiudersi da solo (azione `spegniti`: chiude la webcam con le buone, poi esce);
  solo se dopo 12 secondi è ancora acceso lo chiude di forza.
**Nelle prove non si apre mai la webcam vera**: `--senza-camo` la lascia stare (anche l'occhio), con
`DIRETTA_OCCHIO_PROVA=<video>` l'occhio e la foto leggono il video. Se cambi profilo in Camo, prima «libera la cam».

## L'occhio: Giugnoh sopra la testa, la puff

`occhio.mjs` legge la webcam virtuale «Camo» 10 volte al secondo a **640 × 360**, **solo quando serve**: Giugnoh acceso
con «segue la testa», la puff accesa e già insegnata, o l'anteprima dal vivo aperta in regia. Spento tutto, si spegne.
Per non perdere tempo: il filtro `fps=10` prende una foto ogni tre (o ogni sei, se Camo manda 60), il buffer della webcam
è piccolo (se resta indietro butta le foto vecchie invece di accodarle), e manda alle pagine anche l'ora della foto.
Il modello dei volti gira **quattro volte al secondo**, non a ogni foto: in mezzo la testa la segue l'immagine
(`seguiTesta`), che costa quasi niente. L'anteprima della regia riceve un JPEG a 5 fotogrammi al secondo: si vede in una
finestrella, non va in onda.

- **La testa.** `volti.cs` fa girare Ultra-Light Face Detector (`modelli/volti-rfb-320.onnx`) con Windows ML, che c'è
  già in Windows 10: vede la faccia anche girata, inclinata o che guarda giù sulla tastiera (il riconoscimento dei volti
  di Windows vede solo quelle dritte). È un piccolo `.exe` compilato una volta con `csc` in `cache/volti.exe`; `volti.ps1`
  resta solo come ripiego se `csc` non c'è. Guarda un ritaglio attorno a dov'era la testa; se l'ha persa, la foto intera. Se
  per un attimo non la trova segue il pezzo d'immagine dell'ultima volta, ma non si attacca mai a un pezzo di muro.
  Giugnoh si centra sopra le cuffie; se lo trascini (o lo ingrandisci) mentre segue, resta lì rispetto alla testa.
- **Senza ritardo.** Quando ti muovi, i pezzi che seguono vanno dove sei adesso, non dove eri nella foto: la velocità per
  il tempo passato dalla foto, più 80 ms per Camo (`ANTICIPO` in `pubblico/pezzi.js`). Poi ci arrivano morbidi: svelti
  quando sono lontani, piano quando sono vicini (così da fermo non tremano). Sotto i 60 px al secondo non vanno avanti:
  è il tremolio del riconoscimento. Prima restavano indietro di circa 0,3 s; se ti fermi di colpo vanno un filo oltre e
  tornano (con meno `ANTICIPO` meno oltre, ma più ritardo).
- **La puff.** In regia «disegna la zona della puff» e un rettangolo sull'anteprima dal vivo, **solo sul pezzo di
  tavolo dove la appoggi** (una zona per lente): l'occhio cerca solo lì, e il colore lo prende da solo da quello che
  c'è dentro (mette da parte il colore del tavolo, poi prende la macchia piena che sta da sola). Fuori dalla zona
  hanno dell'azzurro anche la tastiera accesa, la luce del microfono e la felpa illuminata dal monitor: per questo la
  zona deve essere stretta. Il quadratino in regia è il colore imparato. «O cliccala» lo insegna col clic, come
  ripiego. Se la prendi in mano il cartellino resta dov'era, più tenue; quando non ce l'hai, spegni il pezzo «Puff».
  Il cartellino sta dalla parte della puff lontana dalla testa, e mai sopra la faccia.
- **La copertura.** Quando un pezzo acceso è appeso a un muro «dietro di me», l'occhio guarda il colore dell'anello
  attorno al suo riquadro e lo confronta con la foto della stanza (la **foto di inizio**): se qualcosa cambia — una
  persona, una mano, un oggetto — il pezzo si nasconde per un attimo, come se ci fosse passato davanti. Non si calcola
  più la sagoma del corpo: **MediaPipe è spento** e basta il colore, con una tolleranza per ombre e luci (cambia la
  luminosità ma non i colori, e non scatta). Ogni pezzo ha la sua casella in regia e nei muri per restare sempre davanti.
  Dettagli in «Il passaggio davanti ai muri».
- **La maschera.** Le pagine di Camo dicono al server ogni due secondi dove stanno disegnando: lì l'occhio non cerca e
  non impara (le nostre scritte lime, il «?» azzurro di un'immagine). Senza, una volta ha imparato il lime della scritta
  accanto alla puff e inseguiva «Adigeo».
- L'immagine di Camo **ha già sopra le sovrimpressioni**: per questo l'anteprima dal vivo della regia nasconde i pezzi
  (li vedi nell'immagine; si vede solo quello che stai trascinando, e intanto i loro movimenti sono fermi, così la regia
  resta leggera, e così le scene dei «torno subito»).
- **L'anteprima dal vivo** chiede la foto dopo l'ultima che ha (`/api/cam.jpg?dopo=n`): il server, che le foto le tiene
  in memoria, gliela manda appena c'è, e lei la richiede subito. Niente domande a vuoto, niente file su disco.
- Costo: ffmpeg più il modello, pochi ms per foto; la regia scrive quante foto al secondo fa e quanto ci mette.
- **La testa**: il modello dei volti prende per faccia anche il logo di Discord fra le app appese sulla tv. Per questo
  i volti dentro un pezzo in sovrimpressione non valgono, ogni due secondi l'occhio riguarda tutta la foto (la faccia
  più grande sei tu), e una faccia piccola e lontana non ti sostituisce nell'attimo in cui guardi giù.

## La foto della stanza, senza i pezzi

Lo sfondo «foto» dell'anteprima, la pagina dei muri, la luce sui muri e il sensore della lente usano una foto della
stanza per lente (`riferimenti/05.jpg` e `10.jpg`): un fotogramma vero di «Camo» a 1920 × 1080 (`foto.mjs`). L'inquadratura
cambia ogni giorno, quindi:

- **«Acquisisci ora»** (in regia o nei muri; una volta si chiamava «Scatta adesso») fa la foto da capo per la lente in
  onda e **cancella quella di prima** (anche le vecchie scorte `05-prima.jpg` / `10-prima.jpg`, che non si fanno più).
  Nell'immagine di Camo ci sono i pezzi: per questo, mentre scatta, il server dice a tutte le pagine di non disegnare
  niente (evento `nascondi`) e i pezzi spariscono per un secondo o due, **anche in diretta**; se il server tacesse,
  tornano da soli dopo 12 secondi. Non controlla che somigli alla foto vecchia: la lente è quella in onda (se il
  sensore sbaglia, forzala in regia prima di scattare). In più, quando la fai tu, ne tiene una copia
  `05-inizio.jpg` / `10-inizio.jpg`: è la **foto di inizio** per la copertura dei muri, e il rinnovo automatico non la
  cambia.
- **Da sola, ogni mezz'ora**, la rifà solo se l'inquadratura è ancora quella (somiglia alla sua foto almeno 0,7 e più
  che all'altra lente): lì dove ci sono i pezzi tiene la foto di prima, sfumata, così in diretta non sparisce niente. Se
  l'inquadratura è cambiata non la fa, e la regia (e i muri) dicono di scattarla.

Non la fa quando sei via o con Camo senza telefono; da sola, nemmeno con la lente cambiata da meno di un minuto.

Il modello non va nel repository (non è mio): è `version-RFB-320.onnx` di
<https://github.com/Linzaer/Ultra-Light-Fast-Generic-Face-Detector-1MB> (licenza MIT), in `models/onnx/`, salvato come
`modelli/volti-rfb-320.onnx`. Senza, Giugnoh resta al suo posto e la puff funziona lo stesso.

Il vecchio modello delle persone (MediaPipe Selfie Segmentation, Apache 2.0,
<https://chuoling.github.io/mediapipe/solutions/selfie_segmentation.html>) è ancora in `modelli/persone/` con
`persone.cs`, ma **non si usa più**: la copertura dei muri «dietro di me» ora è a confronto di colore con la foto di
inizio (vedi «Il passaggio davanti ai muri»). Si può togliere senza rompere niente.

## I muri: i pezzi appesi alle pareti, in prospettiva

<http://localhost:2350/muri.html> (dalla regia: l’icona dei muri nella colonna a sinistra, o impostazioni → «apri i muri»). Ha lo
stesso aspetto della regia: i comandi nella colonna a sinistra, la tela grande a destra, in alto la lente, foto / dal
vivo, «annulla» e «+ nuovo muro». I pezzi già appesi si spostano anche
direttamente dall'anteprima della regia; qui si segnano le pareti. Sulla foto della stanza di una lente si segnano le
pareti e ci si appendono i pezzi: in onda, nei soliti link di Camo, quei pezzi stanno sul muro come se ci fossero
attaccati (la tela resta 1920 × 1080 trasparente, cambia solo il transform del pezzo).

- **Un muro** sono 4 punti cliccati sugli angoli di un rettangolo vero della parete (spigoli, riga del soffitto,
  battiscopa, bordo di un quadro o della tv), come il punto di fuga di Photoshop: la griglia deve seguire le righe vere.
  Dai 4 punti e dal campo visivo della lente (`F_LENTE` in `pubblico/muri.js`: 0,5× ≈ 106°, 1,0× ≈ 67°; si corregge a mano
  o con «stima dai muri», che lo calcola dai punti di fuga) si ricava com'è girato il muro rispetto al telefono. Manca solo
  quanto è lontano: si scrive la distanza (o l'altezza vera del muro). Due muri con un angolo nello stesso punto si
  attaccano, e la distanza dell'altro la calcola da solo.
- **Un pezzo sul muro** ha una grandezza vera (millimetri di muro per pixel del pezzo): più piccolo dove il muro scappa
  via, più grande dove è vicino; portato su un muro più vicino diventa più grande. Si trascina da un muro all'altro, la
  rotella lo ingrandisce, Shift + rotella lo gira sul muro, doppio clic lo stacca (torna al suo posto in aria). Prende la
  **luce** della stanza (più scuro dove il muro è in ombra nella foto, «luce della stanza») e un filo di **sfocatura**
  quando è lontano («sfocatura lontano»).
- I muri sono per lente (`stato.json` → `muri`), e i pezzi appesi li seguono: dopo aver cambiato inquadratura, scatta la
  foto e riporta i muri sulle pareti (Shift + trascina li sposta tutti, Shift + rotella li ingrandisce, Ctrl + rotella li
  gira, poi gli angoli uno per uno). La pagina lo ricorda quando la foto è più nuova dei muri. Ctrl+Z annulla.
- Non va sui muri: la cornice e la puff. Giugnoh sul muro smette di seguire la testa.
- **«dietro di me»**: ogni muro ha la sua casella nella pagina dei muri (accesa di partenza), e ogni pezzo appeso ha la
  sua («si toglie se passo davanti»). Quello che ci è appeso si nasconde quando qualcosa gli passa davanti: non serve più
  la sagoma del corpo, basta il colore attorno al pezzo rispetto alla foto di inizio. Spegni la casella sul muro (o sul
  singolo pezzo) per lasciarlo sempre davanti. Vedi «Il passaggio davanti ai muri».

## Il passaggio davanti ai muri

La casella **«dietro di me»** di un muro mette i pezzi che ci sono appesi nello strato sotto agli altri (`.strato-muri`
in `pubblico/pezzi.js`): la finestra della vista esterna sulla tv, il meteo, la bandiera, i pezzi del pc. Quando qualcosa
passa davanti a un pezzo — una persona, una mano, un oggetto — il pezzo si nasconde per un attimo e sotto si vede la
webcam vera. Non si calcola più la sagoma del corpo: **MediaPipe è spento**, e basta il colore.

- **La foto di inizio.** Premi **«Acquisisci ora»** (Configurazione → Fotogramma di riferimento) con la stanza vuota:
  il server ne tiene una copia pulita in `riferimenti/<lente>-inizio.jpg`, e quella resta la base anche quando la foto
  della stanza si rinnova da sola ogni mezz'ora (il rinnovo serve alla luce, non alla copertura). Se non l'hai mai
  fatta, si usa la foto della stanza. L'occhio la riceve già a 640 × 360 (`foto.mjs` → `leggiPiccola`) e la tiene per
  la lente in onda. Per ogni pezzo acceso con «dietro di me» guarda l'anello appena fuori dal suo riquadro (le pagine
  lo mandano ogni due secondi, già con 28 px di margine) e conta quanti punti sono cambiati rispetto alla foto. Se ne
  cambia almeno il 18%, per due letture di fila, il pezzo sparisce; torna quando l'anello è pulito da quasi un secondo.
  La classe è `.coperto`.
- **Le ombre non contano.** Il confronto toglie la luce dal colore (guarda i rapporti fra i canali, non solo quanto è
  chiaro): un'ombra o una lampada accesa cambiano la luminosità ma non i colori, e il pezzo resta. Una persona, una mano
  o un oggetto cambiano il colore (o spengono il pixel) e il pezzo si toglie. La soglia e il margine stanno in
  `COPERTURA_SOGLIA` / `COPERTURA_MIN` in `occhio.mjs`, il confronto è `cambioSotto()`.
- **La casella sul pezzo.** Oltre alla casella del muro, ogni pezzo appeso ha la sua: **«si toglie se passo davanti»**
  (nei muri e nella scheda della regia, sotto «Passaggio davanti»). Toglila su quello che vuoi sempre davanti — per
  esempio i follower o una finestra che non deve sparire. Spenta sul muro, nessuno dei suoi pezzi si toglie.
- **Si accende da solo** solo quando serve: un pezzo acceso appeso a un muro con «dietro di me», nella lente in onda.
  Se spegni il pezzo, o togli la casella, l'occhio non guarda più. Costa poco: un anello di pixel per pezzo, qualche
  migliaio di confronti a fotogramma, niente modello e niente 90 MB.
- **Se l'occhio tace** (webcam libera, «torno subito», server appena riavviato), la pagina rimette davanti tutti i pezzi
  dopo 1,8 secondi: meglio un pezzo davanti che uno nascosto per sbaglio. La copertura è per la lente in onda: cambiando
  lente usa la foto di quell'altra.
- **Non è un ritaglio perfetto**, ma non lascia aloni: o il pezzo c'è tutto, o sparisce tutto. Se qualcosa passa solo
  al centro di un pezzo molto grande senza toccarne il bordo, può non accorgersene; in quel caso togli la spunta al
  pezzo (o usa un muro più stretto). La foto di inizio va fatta con la stanza vuota: se l'hai fatta con qualcosa
  davanti a un pezzo, rifalla da Configurazione → Fotogramma di riferimento («Acquisisci ora»).
- I vecchi file `persone.cs`, `modelli/persone/` e `cache/persone.exe` restano nel repository ma non vengono più usati.

## La bandiera: stoffa vera, appesa al muro dietro

Il pezzo «Bandiera» è una bandiera attaccata al muro con quattro pezzetti di scotch di carta. Clic su «Bandiera» nella
regia: nella scheda c'è il **catalogo** (35 bandiere, la prima è la Cina: Italia, Stati Uniti, Giappone, Regno Unito,
Corea del Sud, Francia, Germania… fino a Pace, Arcobaleno, Pirati e A scacchi). Clic su una e cambia subito, appesa
dov'è. Si sposta come gli altri pezzi sui muri (trascina, rotella, Shift + rotella).

- **La stoffa**: i colori e le proporzioni ufficiali (`pubblico/bandiere.js`, un SVG per bandiera), sopra la trama di
  `pubblico/tessuto-4k.jpg`, una tela da 4096 × 4096 che si ripete senza giunte (fili che passano sopra e sotto,
  ingrossamenti, peluria; la rifà `strumenti/tessuto.mjs`). Le **pieghe leggere** sono quelle di quando stava piegata
  (in piedi a un quarto, metà e tre quarti, di traverso a un terzo e due terzi, monte e valle alternati), più le grinze
  tirate dallo scotch agli angoli, l'orlo cucito e i bordi che fra uno scotch e l'altro calano di qualche millimetro.
- **La luce** la studia sulla foto della stanza della lente in onda (`pubblico/bandiera.js`): prende i punti del muro
  dove è appesa, butta via quelli che non sono muro (la tv, il cono, chi è seduto) e cerca il punto luce che spiega
  com'è chiaro il muro (più chiaro vicino alla lampada, più scuro lontano). Da lì: **quanta luce e di che colore** in ogni
  punto della bandiera (quella del muro proprio lì dietro, così una striscia bianca viene del colore caldo del muro
  accanto), **da che parte** si illuminano le pieghe (e il lucido della stoffa), e da che parte cade l'ombrina sul muro.
  Nella scheda c'è scritto cosa ha trovato. Se cambi le luci della stanza, rifai la foto («scatta adesso»).
- **Leggera**: è una tela ferma, disegnata una volta; si ridisegna solo quando la sposti, la cambi o cambia la foto, a
  pezzetti (al massimo 8 volte al secondo mentre la trascini), così gli altri pezzi non saltano fotogrammi. La trama 4K
  si scarica e si ricampiona alla grandezza che ha in onda: in memoria resta solo quella.
- In aria (staccata dal muro) è una bandiera piatta, senza scotch e senza la luce della stanza.

## La zona cavi: un blur scuro dietro ai monitor

Il pezzo **«Zona cavi»** (`pubblico/cavi.js`) copre la zona dei cavi dietro ai monitor con una macchia scura e sfocata.
Non è un rettangolo nero: prende dalla foto della stanza (la foto di inizio) la parte che ha sotto, la ridisegna con
`blur(12px) brightness(.26)` e un velo nero, e sfuma i bordi con una maschera ellittica. Così i cavi si vedono come
un'ombra e il colore di muro, legno e luce attorno resta quello vero.

- Si accende dalla regia come gli altri pezzi, si trascina e si ingrandisce con la rotella. Di partenza sta in basso a
  sinistra (la zona dei cavi delle due lenti), ma si sposta dove serve. Non va sui muri (`MAI_SUL_MURO`): è un ritocco
  2D dell'inquadratura, non una cosa appesa alla parete. Si aggiorna da solo quando cambia la foto della stanza o la
  lente.

## I sensori

- **Lente (0,5× o 1,0×).** Due letture: il file dove Camo Studio scrive la fotocamera scelta
  (`%APPDATA%\Reincubate\Camo\Presets\DEFAULT.config`, `built-in_video:5` è il grandangolo) e
  l'immagine della webcam virtuale «Camo», letta da ffmpeg una volta al secondo a 64 × 36 e
  confrontata con le due foto di riferimento. Comanda l'immagine quando è sicura (tre letture
  uguali di fila), altrimenti il file. Dalla regia si può forzare la lente o insegnare al
  sensore quella di adesso. Se cambi stanza o inquadratura, rifai le due foto.
- **Tasti, mouse e controller** (`sensori.cs` → `cache/sensori.exe`; `sensori.ps1` è il ripiego). I tasti arrivano da Windows anche a finestra
  non in primo piano; il controller da `Windows.Gaming.Input` (DualSense e DualShock 4, via
  cavo o Bluetooth); la rotella del mouse da un gancio di Windows (`W`). Passano alle pagine
  solo col pezzo «tasti» acceso. Con «tutti i tasti»
  spento passano solo quelli da gioco: quello che scrivi non arriva a nessuna pagina.
- **Spie.** Microfono: il dispositivo che contiene `mic` di `config.json` è attivo e non in
  muto su Windows; il livello arriva 25 volte al secondo (`V` in `sensori.cs`) e si muove
  solo quando un programma usa il microfono, cioè Discord in chiamata. Cuffie: l'uscita che contiene `cuffie` è
  attiva, non in muto e col volume sopra zero. iPhone: collegato via cavo, Camo Studio aperto
  e immagine non nera. Il muto di Discord non si può leggere da qui.

## Tastiera, mouse e controller: foto vere, vive

`pubblico/g413.js`, `g502.js` e `dualsense.js` sono tre file senza dipendenze: mettono in
pagina la foto del prodotto e ci accendono sopra, in verde, i tasti premuti nel punto esatto
(`creaG413()`, `creaG502()`, `creaDualSense()`). Le levette del controller sono quelle della
foto, ritagliate, che si spostano dove le spingi; L2 e R2, che di fronte non si vedono, sono
due barrette sopra la foto. Ognuno ha anche `daBrowser()`, per usarli in una pagina qualsiasi
leggendo tasti, clic e controller dal browser. La forma dei dati è scritta in testa a ogni file.

Le foto stanno in `foto/` e non vanno nel repository (sono di Logitech e di Sony):

| File | Da dove viene | Ritaglio |
| --- | --- | --- |
| `tastiera.png` 1294 × 440 | `resource.logitechg.com/w_1400,c_limit,q_auto,f_png/d_transparent.gif/content/dam/gaming/en/products/g413-se/g413-se-gallery-4.png` | `crop=1294:440:46:283` |
| `mouse.png` 552 × 1066 | `resource.logitechg.com/w_1400,c_limit,q_auto,f_png/d_transparent.gif/content/dam/gaming/en/non-braid/hyjal-g502-hero/2025/g502-hero-mouse-top-angle-gallery-1.png` | `crop=552:1066:420:31` |
| `pad.png` 836 × 574 | `gmedia.playstation.com/is/image/SIEPDC/DualsenseController-White01-16x9-01-28feb26$en?wid=1400&fmt=png-alpha` | `crop=836:574:283:116` |

La foto della tastiera è della versione americana: i codici dei tasti sono messi dove sta il
tasto sulla tastiera italiana (vedi in testa a `g413.js`). Per usare foto tue, scattale
dritte dall'alto, mettile al posto di queste con le stesse misure oppure ritocca le posizioni
dei tasti nei tre file.

## File

- `server.mjs`: il server (solo `127.0.0.1`, rifiuta le richieste di altri siti), lo stato,
  i sensori, il meteo.
- `pubblico/regola.js`: le regolazioni di ogni sorgente (rotazione, specchio, opacità, luminosità, contrasto…): l'elenco
  dei parametri, il controllo di quello che si salva (`stato.regola`) e il filtro CSS/SVG che ne esce. Lo usano la
  regia, `pezzi.js` e il server. `pubblico/nomi-tecnici.js`: i nomi tecnici delle sorgenti per la regia e i muri.
- `sensori.cs` (compilato in `cache/sensori.exe`), `sensori.ps1` (ripiego): tasti, controller, audio, iPhone.
- `macchina.mjs`, `macchina.cs` (compilato in `cache/macchina.exe`), `macchina.ps1` (ripiego), `macchina-info.ps1`, `pubblico/pc.js`, `pubblico/pc.css`: i pezzi del pc (vedi sopra). Le pagine li
  chiedono con `/api/flusso?pc`; in `?prova` le app si passano a mano: `import('/pc.js').then((m) => m.appArriva([…]))`.
- `tv.mjs` (trova la TV in rete e le apre il canale), `podcast.mjs`, `pubblico/cast.js` (i tempi, uguali per tutti), `cast-pezzi.js` + `cast.css` (i due pezzi della
  diretta), `tv.html` + `tv.css` + `tv.js` (la tv): Giugnoh's Cast. `--senza-tv` non apre la porta della tv,
  `DIRETTA_TV_PORTA` la cambia (per le copie di prova).
- `cam.mjs`: il turno per la webcam «Camo» (un lettore alla volta, chiuso con «q»: vedi «La webcam «Camo»»).
- `esterna.mjs`, `pubblico/vista.html`, `vista.css`, `vista.js`: la vista esterna (la pagina HTTPS del portatile,
  il collegamento automatico, le regolazioni e i fotogrammi); `pubblico/esterna.js`, `esterna.css`: il pezzo
  `/o/esterna` (vedi «La vista esterna»).
- `occhio.mjs`, `volti.cs` (compilato in `cache/volti.exe`), `volti.ps1` (ripiego), `modelli/`: l'occhio sulla webcam
  (la testa, la puff e la copertura dei muri «dietro di me», vedi sopra). Per provarlo senza Camo:
  `DIRETTA_OCCHIO_PROVA=un-video.mp4` al posto della webcam; `--senza-occhio` lo tiene spento. `persone.cs`,
  `modelli/persone/` e `cache/persone.exe` sono i resti del vecchio MediaPipe: non vengono più usati.
- `foto.mjs`: la foto della stanza senza i pezzi (vedi sopra). Una copia di prova deve usare foto sue,
  `DIRETTA_RIF=una-cartella`, se no rifà quelle vere.
- `pubblico/giro.js`: il giro di disegno a 60 al secondo (`?fps=30` per risparmiare) e il freno delle animazioni CSS (vedi «Leggera»).
- `pubblico/bandiere.js` (il catalogo), `pubblico/bandiera.js` (la stoffa, le pieghe, lo studio della luce),
  `pubblico/tessuto-4k.jpg` e `strumenti/tessuto.mjs` (la trama): la bandiera appesa (vedi «La bandiera»).
- `pubblico/cavi.js`: la zona cavi, la macchia scura e sfocata presa dalla foto della stanza (vedi «La zona cavi»).
- `pubblico/`: `regia.html` (il pannello), `pezzo.html` + `pezzi.js` + `pezzi.css` (i pezzi), `muri.html` + `muri.js`
  (i muri: la pagina, e la prospettiva che usano i pezzi e il server).
- `pubblico/via/`: le scene dei «torno subito» (vedi sopra): `via.js` le accende, `pixel.js` (pennelli, scritta a
  pixel, cielo, luce, tempo), `natura.js`, `omino.js`, una per scena, `scritta.js` (la scritta viva al centro: legge
  quello che ogni scena dice di sé da `disegna`), `prova.html` per guardarle.
- `strumenti/firewall-tv.ps1`: apre la porta 2360 solo in rete locale (serve l'UAC).
- `strumenti/cornice-gif.mjs` e `giugnoh-gif.mjs`: rifanno `cornice.gif` e `giugnoh.gif` dalle
  pagine vere (server acceso, Edge, ffmpeg).
- `servizio.cmd` (il server che riparte da solo, per l'attività pianificata), `riavvia.cmd`, `diretta.log`.
- `chromium-diretta.cmd` e `chromium-diretta-senza-gpu.cmd`: la regia in Chromium, col profilo suo, con o senza GPU.
- Per provare una copia accanto a quella accesa: `DIRETTA_PORTA=2351 DIRETTA_STATO=stato-prova.json
  DIRETTA_VISTA_PORTA=2372 node server.mjs --senza-camo --senza-sensori --senza-tv` (con `DIRETTA_OCCHIO_PROVA` anche `DIRETTA_RIF`); le pagine con `?prova` accettano tasti, livelli e
  fumetti finti da `window.__prova`. `--senza-vista` invece non apre affatto la pagina del portatile.
- `config.json`: porta, ora del letto, nomi dei dispositivi, pubblicità. `config.locale.json`
  (non va nel repository) lo corregge sul pc: lì sta il punto vero del meteo.
- `riferimenti/` e `stato.json` restano sul pc.

Servono Node 20 o più e .NET Framework 4.8 (il `csc` di Windows, per compilare gli aiutanti `.exe`); PowerShell resta
solo come ripiego, e ffmpeg serve per il sensore a immagine e per la GIF.
