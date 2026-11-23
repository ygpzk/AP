# Diretta OS — guida all’installazione

Diretta OS è la regia delle sovrimpressioni per le dirette: una tela trasparente da
**1920 × 1080** da mettere sopra la webcam in **Camo Studio** o in **OBS**, e un pannello
da cui accendere, spostare e sistemare i pezzi. Il server gira **solo sul tuo PC**
(`127.0.0.1`) e la regia si apre nel browser su <http://localhost:2350/>.

Non serve un account, non serve il cloud: i dati, le foto e lo stato restano nella
cartella di installazione.

---

## 1. Cosa serve

| Cosa | Serve? | Note |
| --- | --- | --- |
| Windows 10 o 11 (64 bit) | sì | Windows 10 1809 o più nuovo |
| Node.js 20 o più nuovo | sì | <https://nodejs.org> — l’installer lo propone con winget |
| PowerShell 5 | sì | c’è già in Windows 10/11 |
| ffmpeg | consigliato | serve per la webcam «Camo», la lente e i volti; senza, il resto funziona |
| Camo Studio | consigliato | per la webcam del telefono e i livelli web |
| OBS Studio | alternativo | va bene anche una sorgente browser |
| Webcam | consigliato | la webcam virtuale «Camo» o una webcam normale |

L’installer non ha bisogno dei permessi di amministratore: installa nella tua cartella
utente (`%LOCALAPPDATA%\Programs\Diretta OS`).

---

## 2. Installazione, passo per passo

1. **Scarica** `DirettaOS-Setup.exe` da <https://pzkko.it/direttaos/> (o dal progetto
   nella scheda Progetti di pzkko.it).
2. **Doppio clic** su `DirettaOS-Setup.exe`. Se Windows SmartScreen chiede qualcosa:
   *Ulteriori informazioni* → *Esegui comunque* (il file non è firmato con un
   certificato a pagamento).
3. Scegli la cartella (Invio va bene) e premi **Invio**.
4. Se Node.js non c’è, l’installer propone di installarlo con **winget**: rispondi
   `S`. Se preferisci, installalo a mano da <https://nodejs.org> (versione **LTS**).
5. Se manca **ffmpeg**, l’installer propone di installarlo con winget (pacchetto
   `Gyan.FFmpeg`). Puoi anche farlo dopo, con `DirettaOS.exe extra`.
6. Rispondi alle due domande:
   - scorciatoia sul **Desktop**? (consigliato sì)
   - avvio automatico con **Windows**? (consigliato sì)
7. L’installer copia i file, crea le scorciatoie, la voce in *App e funzionalità* e
   il gestore `DirettaOS.exe`.
8. Alla fine puoi aprire subito la regia: rispondi `S`.

> Se hai già una versione installata, l’installer fa un **aggiornamento**: i file del
> programma vengono sostituiti, mentre `config.json`, `config.locale.json`,
> `stato.json`, le foto della stanza, i modelli e i backup **restano**.

### Installazione silenziosa

Per uno script o per reinstallare senza domande:

```bat
DirettaOS-Setup.exe install --silent
```

Con `--silent` l’installer usa la cartella predefinita, mette la scorciatoia sul
Desktop, accende l’avvio automatico e non apre nulla. Node.js non viene installato
in silenzio: deve già esserci.

Per un’installazione **portatile** (niente scorciatoie, niente registro, niente avvio
automatico), in una cartella tua:

```bat
DirettaOS-Setup.exe install "D:\Diretta OS" --silent --portable
```

---

## 3. Primo avvio

Apri **Diretta OS** dal menu Start (o dal Desktop). Si apre il terminale del gestore:


```text
1  Installa / aggiorna
2  Avvia il server
3  Apri la regia
4  Ferma il server
5  Stato
6  Comandi e indirizzi
7  Diagnostica
...
```

Scegli **2** (Avvia) e poi **3** (Apri la regia). In alternativa, dal terminale:

```bat
DirettaOS.exe start
DirettaOS.exe open
```

La regia è su <http://localhost:2350/>. Se il browser dice che non risponde, guarda
`DirettaOS.exe status` e `DirettaOS.exe logs`.

---

## 4. Camo Studio (o OBS): il livello web

### Camo Studio

1. Apri Camo Studio e collega il telefono.
2. Aggiungi un **livello web** a tutto schermo, **1920 × 1080**.
3. Indirizzo: `http://localhost:2350/o/tutto`
4. Metti il livello **sopra** la webcam.
5. Tieni **un solo livello web**: ogni livello in più è un browser intero che gira e
   consuma memoria. Se ti serve un pezzo solo, usa il suo indirizzo (sotto).

La pagina va a **30 fotogrammi al secondo**. Se vuoi i 60, aggiungi `?fps=60`:

```text
http://localhost:2350/o/tutto?fps=60
```

### OBS Studio

1. Aggiungi una sorgente **Browser**.
2. Larghezza **1920**, altezza **1080**.
3. URL `http://localhost:2350/o/tutto`.
4. Metti la sorgente sopra la webcam.

### La regia

La regia è l’anteprima grande con la scheda a destra. I pezzi si toccano
direttamente lì:

- **clic** su un pezzo: lo scegli e la scheda mostra solo le sue cose;
- **trascina**: lo sposti; un pezzo appeso a un muro resta sul muro, in prospettiva;
- **Alt + trascina**: stacchi/attacchi dal muro;
- **rotella**: grandezza; **Shift + rotella**: lo giri sul muro;
- **frecce**: un pixel (Shift: dieci); **doppio clic**: torna al suo posto;
- **Ctrl+Z**: annulla l’ultimo gesto.

---

## 4b. La vista esterna: un portatile in wifi

Se vuoi la webcam di un **portatile** dentro Camo (per esempio la vista fuori dall’ufficio), senza cavi:

1. Metti il portatile sulla **stessa rete** del pc (wifi; il pc può essere anche col cavo).
2. In regia: **In rete → collega un pc**. Compare un indirizzo `https://…:2371`. **Non c’è nessun codice.**
3. Apri quell’indirizzo nel browser del portatile. La prima volta il browser dice che la connessione non è
   privata: è il certificato del tuo pc, non un sito. Premi **Avanzate → Procedi** (in Firefox: **Accetta il
   rischio e continua**).
4. Consenti la fotocamera: la pagina **si collega da sola** e la finestra si accende da sola in Camo
   (`/o/esterna`, dentro `/o/tutto`).
5. Dalla regia puoi spegnerla, specchiarla, adattarla o staccarla. Sul portatile l’ingranaggio apre le
   regolazioni: webcam (anche una seconda), messa a fuoco, sfondo, filtri, inquadratura, esposizione, ISO,
   bianco, flash, luminosità, saturazione, contrasto, gamma, nitidezza, **30 fps** e qualità.

Il collegamento **non scade** e non si stacca da solo: se il portatile dorme o perde la wifi, la regia
tiene l’ultimo fotogramma nell’anteprima e la vista torna appena i fotogrammi riprendono. Si collega un
portatile alla volta; se la regia preme **stacca**, quel portatile non rientra da solo per cinque minuti
(sulla sua pagina compare **Ricollega**). Se cambi rete, il certificato si rifà e l’avviso del browser
torna: è normale. Per spegnere tutto: `DirettaOS.exe piece esterna off`, oppure *stacca* in regia.

Se Windows chiede il permesso del firewall per Node.js, **consenti sulle reti private**. La porta si cambia in
`config.json` → `esterna.porta`. La pagina del portatile non può comandare la regia e non vede la webcam del pc:
manda solo la sua immagine, e il pc tiene solo l’ultimo fotogramma in memoria.

---

## 5. Tutti i comandi

Tutti i comandi si scrivono in un terminale (PowerShell o Prompt dei comandi).
`DirettaOS.exe` si trova nella cartella di installazione; se non è nel `PATH`, usa il
percorso completo o apri il terminale lì.

### Installazione e server

| Comando | Cosa fa |
| --- | --- |
| `DirettaOS.exe` | apre il menu |
| `DirettaOS.exe install` | installa o aggiorna (solo `DirettaOS-Setup.exe`) |
| `DirettaOS.exe start` | avvia il server in background |
| `DirettaOS.exe start --foreground` | avvia il server e mostra i log nel terminale |
| `DirettaOS.exe stop` | ferma il server, chiudendo la webcam con le buone |
| `DirettaOS.exe restart` | ferma e riavvia |
| `DirettaOS.exe open` | apre la regia nel browser |
| `DirettaOS.exe status` | stato, porta, processo e pezzi accesi |
| `DirettaOS.exe logs` | le ultime righe di `diretta.log` |
| `DirettaOS.exe logs --follow` | il log dal vivo (Ctrl+C per uscire) |
| `DirettaOS.exe doctor` | diagnostica completa |
| `DirettaOS.exe config` | apre `config.json` nel Blocco note |
| `DirettaOS.exe configura` | porta, città, microfono, cuffie, webcam Camo |
| `DirettaOS.exe backup` | salva config, stato, foto e modelli in Documenti |
| `DirettaOS.exe extra` | scarica il modello dei volti e le foto di tastiera, mouse e pad |
| `DirettaOS.exe photo` | scatta la foto della stanza dalla webcam Camo |
| `DirettaOS.exe autostart on` | accende l’avvio con Windows |
| `DirettaOS.exe autostart off` | spegne l’avvio con Windows |
| `DirettaOS.exe uninstall` | disinstalla, tenendo i dati in Documenti |
| `DirettaOS.exe uninstall --purge` | disinstalla e cancella tutto |
| `DirettaOS.exe folder` | apre la cartella di installazione |
| `DirettaOS.exe guide` | apre questa guida |
| `DirettaOS.exe web` | apre la guida sul sito |
| `DirettaOS.exe version` | versione |

### La regia, dal terminale

| Comando | Cosa fa |
| --- | --- |
| `DirettaOS.exe pieces` | elenca i pezzi e quali sono accesi |
| `DirettaOS.exe piece <nome> on` | accende un pezzo |
| `DirettaOS.exe piece <nome> off` | spegne un pezzo |
| `DirettaOS.exe piece esterna on` / `off` | accende o spegne la vista esterna |
| `DirettaOS.exe all on` | accende tutti i pezzi (tranne PC e podcast) |
| `DirettaOS.exe all off` | spegne tutti i pezzi |
| `DirettaOS.exe via <scena>` | accende un «torno subito» |
| `DirettaOS.exe lens auto` | la lente torna automatica |
| `DirettaOS.exe lens 05` | forza la lente 0,5× |
| `DirettaOS.exe lens 10` | forza la lente 1,0× |
| `DirettaOS.exe letto 02:35` | cambia l’ora del letto |
| `DirettaOS.exe redbull +1` | una Red Bull in più |
| `DirettaOS.exe redbull -1` | una Red Bull in meno |
| `DirettaOS.exe redbull 0` | azzera il contatore di oggi |
| `DirettaOS.exe social <rete> <numero>` | scrive un numero (es. `social twitch 1234`) |
| `DirettaOS.exe social <rete> -` | toglie il numero scritto a mano |
| `DirettaOS.exe podcast inizia` | inizia una puntata |
| `DirettaOS.exe podcast argomento` | estrae un argomento |
| `DirettaOS.exe podcast fine` | chiude la puntata |
| `DirettaOS.exe podcast riprendi` | riprende dopo un «fine» sbagliato |
| `DirettaOS.exe tv podcast` | la TV torna alla puntata |
| `DirettaOS.exe tv logo` | la TV mostra il logo |
| `DirettaOS.exe tv ora` | la TV mostra l’ora |
| `DirettaOS.exe tv nome` | la TV mostra il nome |
| `DirettaOS.exe tv parla` | la TV mostra chi parla |
| `DirettaOS.exe tv testo` | la TV mostra il testo libero |
| `DirettaOS.exe tv meteo` | la TV mostra il meteo |

Le scene dei «torno subito»:

```text
legna  pipi  bere  mangiare  lattina  telefono  spacco  sistemo  riavvio
```

---

## 6. Tutti gli indirizzi

Sostituisci `http://localhost:2350` se hai cambiato la porta.

### I pezzi

| Indirizzo | Cosa mostra |
| --- | --- |
| `/o/tutto` | tutti i pezzi in una pagina sola (la più leggera) |
| `/o/cornice` | il bordo che gira |
| `/o/nome` | il nome animato, sopra la testa |
| `/o/spie` | microfono, cuffie, telefono |
| `/o/conto` | quanto manca al letto |
| `/o/meteo` | il tempo e gli animali |
| `/o/tasti` | tastiera, mouse e controller |
| `/o/meme` | i meme di pzkko |
| `/o/adv` | i progetti di pzkko.it |
| `/o/adigeo` | «lui è Adigeo» |
| `/o/redbull` | le Red Bull di oggi |
| `/o/social` | i follower |
| `/o/puff` | il cartellino della puff |
| `/o/bandiera` | la bandiera appesa al muro |

Per i tasti: `/o/tasti?solo=pad` tiene sempre il controller,
`/o/tasti?solo=tastiera` sempre la tastiera.

### I «torno subito»

`/o/legna` · `/o/pipi` · `/o/bere` · `/o/mangiare` · `/o/lattina` ·
`/o/telefono` · `/o/spacco` · `/o/sistemo` · `/o/riavvio`

Coprono tutta la webcam con una scena dal vivo e spengono da soli gli altri link.
Quando torni, riaccendono quelli che erano accesi.

### I pezzi del PC

`/o/app` · `/o/cpu` · `/o/gpu` · `/o/ram` · `/o/ssd` · `/o/hdd` ·
`/o/temp` (`?di=gpu` per la scheda video) · `/o/wifi`

### Podcast e TV

| Indirizzo | Cosa mostra |
| --- | --- |
| `/o/argomento` | il rullo dell’argomento a caso |
| `/o/fine` | la fine puntata |
| `/tv` | la TV 4K, anche dal browser del PC |
| `/muri.html` | i muri: appendere i pezzi in prospettiva |
| `/dualsense.html` | il DualSense da solo, grande |

La TV vera è un altro apparecchio in rete: apri sul suo browser
`http://<ip-del-pc>:2360/` (la porta si cambia in `config.json` → `podcast.tvPorta`).
La prima volta premi OK sul telecomando per lo schermo intero.

### Provare le scene senza essere via

```text
http://localhost:2350/via/prova.html?scena=bosco&ora=22:30&meteo=nebbia&gradi=4&t=20
```

`scena` = `fuoco`, `bosco`, `casa-mangiare`, `casa-bere`, `casa-redbull`,
`telefono`, `spacco`, `postazione`, `riavvio`; `fermo` la tiene ferma;
`foglio=12&passo=4` fa vedere 12 momenti insieme.

---

## 7. Configurazione

La configurazione sta in `config.json`, nella cartella `app`. Le cose che cambi tu
(porta, città, dispositivi) vanno in `config.locale.json`: così un aggiornamento
non le cancella.

Il comando più comodo:

```bat
DirettaOS.exe configura
```

Chiede porta, porta della TV, porta della vista esterna, città del meteo, latitudine,
longitudine, microfono, cuffie e nome della webcam virtuale di Camo, e scrive
`config.locale.json`.

A mano, in `config.json`:

```json
{
  "porta": 2350,
  "letto": "02:35",
  "podcast": { "tvPorta": 2360 },
  "esterna": { "porta": 2371 },
  "meteo": { "nome": "Mantova", "lat": 45.1564, "lon": 10.7914 },
  "mic": "Yeti",
  "cuffie": "Turtle Beach|Stealth|Cuffie|Headset",
  "camo": "Camo",
  "pc": {
    "ssd": 0,
    "hdd": 1,
    "nomi": { "ram": "Micron DDR4 16 GB" },
    "nascoste": ["Program Manager"],
    "giochi": ["starcraft"]
  }
}
```

- `porta`: la porta del server (2350 di solito). Se la cambi, cambia anche gli
  indirizzi in Camo/OBS.
- `letto`: l’ora del conto alla rovescia.
- `meteo`: città e coordinate; il punto vero lo prende da Open-Meteo.
- `mic`, `cuffie`: pezzi del nome del dispositivo; servono alle spie.
- `camo`: il nome della webcam virtuale di Camo.
- `pc`: `ssd`/`hdd` scelgono il disco da mostrare; `nomi` rinomina i componenti;
  `nascoste` è una lista di espressioni regolari per le app da non mostrare;
  `giochi` sono eseguibili da trattare come giochi.
- `podcast.tvPorta`: la porta della TV (2360).
- `adv`: i progetti che girano nel pezzo «Pubblicità».

Dopo una modifica: `DirettaOS.exe restart`.

---

## 8. Le cose facoltative (extra)

Il pacchetto non contiene le cose che non posso ridistribuire: il modello dei volti
(MIT) e le foto ufficiali di Logitech e Sony. Le scarica il comando:

```bat
DirettaOS.exe extra
```

- `modelli\volti-rfb-320.onnx`: Ultra-Light Face Detector (MIT), per Giugnoh che
  segue la testa e per la puff. Senza, il nome resta al suo posto e la puff funziona
  lo stesso.
- `foto\tastiera.png`, `foto\mouse.png`, `foto\pad.png`: le foto di G413 SE, G502 e
  DualSense, ritagliate come servono a `/o/tasti`.

Il vecchio modello delle persone (`modelli\persone\model.onnx`, MediaPipe Selfie Segmentation, Apache 2.0) è ancora
nel pacchetto ma **non si usa più**: i muri «dietro di me» ora confrontano il colore attorno ai pezzi con la foto di
inizio. Puoi anche toglierlo, l'installazione funziona lo stesso.

### La foto della stanza

Le foto `riferimenti\05.jpg` e `riferimenti\10.jpg` sono tue: sono l’inquadratura
della stanza per le due lenti (0,5× e 1,0×). Non vanno nel repository.

1. Apri Camo Studio e scegli la lente **0,5×**.
2. `DirettaOS.exe photo` (o, in regia, *impostazioni → scatta adesso*).
3. Scegli la lente **1,0×** e ripeti.
4. Controlla che `riferimenti\05.jpg` e `10.jpg` ci siano.

Se cambi stanza o inquadratura, rifai le foto. La regia le rifà da sola ogni mezz’ora
se l’inquadratura è ancora quella.

---

## 9. Aggiornare, fare un backup, disinstallare

### Aggiornare

1. Scarica il nuovo `DirettaOS-Setup.exe`.
2. Chiudilo se è aperto, poi aprilo e scegli **Installa / aggiorna**.
3. I file del programma vengono sostituiti; `config.json`, `config.locale.json`,
   `stato.json`, `riferimenti`, `foto`, `modelli` e `impara` restano.
4. Se hai modificato `config.json` e la nuova versione ne ha una diversa, la trovi
   accanto come `config.json.nuovo`: confronta e prendi quello che ti serve.
5. `DirettaOS.exe restart`, poi ricarica i livelli in Camo.

### Backup

```bat
DirettaOS.exe backup
```

Crea `Documenti\Diretta OS\backup-AAAA-MM-GG-HHMM.zip` con configurazione, stato,
foto della stanza, modelli, lezioni e copie.

### Disinstallare

```bat
DirettaOS.exe uninstall
```

Ferma il server, toglie scorciatoie, avvio automatico e voce di Windows. I dati
vengono copiati in `Documenti\Diretta OS\backup-uninstall-…`. Con:

```bat
DirettaOS.exe uninstall --purge
```

viene cancellato tutto, senza backup.

---

## 10. Se qualcosa non va

| Problema | Cosa fare |
| --- | --- |
| «Node.js non c’è» | installa la LTS da <https://nodejs.org>, poi riapri il terminale |
| «la porta 2350 è occupata» | chiudi l’altro programma, o cambia `porta` con `DirettaOS.exe configura` |
| Il server non parte | `DirettaOS.exe logs --follow` e `DirettaOS.exe doctor` |
| La regia si apre ma i pezzi sono vuoti | mancano i caratteri o `art`: reinstalla con il setup |
| La webcam non si vede | ffmpeg installato? Camo aperto? webcam non usata da Discord? |
| La webcam dà problemi / schermata blu | in regia «libera la cam» prima di cambiare profilo in Camo |
| La lente sbaglia | forza `lens 05` o `lens 10`, poi «impara» dalla regia |
| Niente meteo | serve internet; controlla città e coordinate |
| La TV non si collega | stessa rete, porta 2360, firewall di Windows |
| Il nome non segue la testa | manca `modelli\volti-rfb-320.onnx`: `DirettaOS.exe extra` |
| I tasti non si vedono | mancano le foto in `foto\`: `DirettaOS.exe extra` |
| Voglio ripartire da zero | `DirettaOS.exe backup`, poi cancella `stato.json` e riavvia |

La diagnostica guarda: Windows, cartella, `server.mjs`, regia, caratteri, oggetti,
PowerShell, Node, ffmpeg, porta, server, avvio automatico, guardiano, foto della
stanza, modello dei volti, foto di tastiera/mouse/pad, Camo e permessi di scrittura.

---

## 11. Sicurezza e privacy

- Il server ascolta **solo su `127.0.0.1`**: non è raggiungibile dagli altri PC.
- Rifiuta le richieste che arrivano da altri siti (controlla `Origin` e `Host`).
- La TV ha un server separato, in rete, che serve **solo** la pagina della TV e il
  flusso del podcast, in sola lettura: niente regia, niente azioni, niente webcam.
- Le foto della stanza, lo stato e i modelli stanno nella tua cartella di
  installazione. Non vengono caricati da nessuna parte.
- L’installer non chiede permessi di amministratore e non installa servizi.
- L’unica connessione in uscita è per il meteo (Open-Meteo), i follower di Twitch e
  gli extra che chiedi tu.

---

## 12. Dove stanno i file

```text
%LOCALAPPDATA%\Programs\Diretta OS\
  DirettaOS.exe              il gestore e i comandi
  GUIDA-INSTALLAZIONE.md     questa guida
  LEGGIMI.txt                i primi passi
  avvio-nascosto.vbs         l’avvio senza finestra
  app\
    server.mjs               il server
    config.json              la configurazione
    config.locale.json       le tue modifiche (non si toccano negli aggiornamenti)
    stato.json               quello che è acceso, i posti, i muri
    diretta.log              il log
    pubblico\                la regia e le pagine dei pezzi
    pzkko.it\public\         caratteri e oggetti del sito
    riferimenti\             le foto della stanza (tue)
    foto\                    tastiera, mouse, pad (extra)
    modelli\                 il modello dei volti (extra)
    cache\                   le icone delle app
    impara\                  le lezioni «impara come bevo»
    copie\                   le copie di sicurezza
```

---

## 13. Crediti

- Idee, regia, server e scene: Alberto «pzkko» Pecchini.
- Caratteri: gg sans e gg mono (Discord), ABC Ginto Nord (Dinamo), Pricedown
  (Typodermic), e gli altri caratteri dei nomi di Discord. Non sono liberi: servono
  a rifare fedelmente il profilo.
- Ultra-Light Face Detector: Linzaer, licenza MIT.
- MediaPipe Selfie Segmentation: Google, licenza Apache 2.0 (il modello in `modelli/persone`).
- Foto di tastiera, mouse e pad: Logitech e Sony, scaricate dai loro siti con
  `DirettaOS.exe extra`; non sono nel pacchetto.
- Il resto delle immagini e delle scene è di pzkko.

Se ti serve una mano: <https://pzkko.it/direttaos/>.
