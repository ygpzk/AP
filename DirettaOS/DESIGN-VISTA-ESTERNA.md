# Vista esterna — messaggio per Claude Code

> **Aggiornamento (23.11):** il codice di sei cifre, la scadenza e il conto alla rovescia sono stati tolti.
> Ora il portatile si collega da solo appena apre il link, e la pagina è diventata un pannello di regolazioni
> della webcam. Questo documento resta come storia del primo progetto; il comportamento attuale è nel README.

Ciao Claude Code. La **UX della vista esterna è fatta e funziona**: il portatile si collega con un codice,
accende la webcam, manda i fotogrammi al pc e la finestra compare in Camo. Quello che manca è **la rifinitura
del design**. Non cambiare il flusso, le API, i testi chiave o i comportamenti di sicurezza: lavora sopra quello
che c’è, con lo stesso tono di Diretta OS.

## Cos’è, in una riga

La webcam di un portatile sulla stessa rete, dentro una finestra della diretta: serve per la vista fuori
dall’ufficio (o per una seconda inquadratura), senza cavi e senza cloud. Un portatile alla volta, solo video.

## Il flusso (già implementato — non riscriverlo)

1. **Regia → In rete → collega un pc**: si apre la scheda «Vista esterna» e nasce un codice di sei cifre,
   valido dieci minuti e una volta sola. Ci sono l’indirizzo `https://…:2371`, il codice, il conto alla rovescia
   e il ripiego con l’IP se il nome del pc non si risolve.
2. **Sul portatile**: la pagina `vista.html` chiede il codice, poi il permesso della webcam. La prima volta il
   browser mostra l’avviso del certificato fatto in casa: la scheda della regia lo spiega già («Avanzate →
   Procedi», in Firefox «Accetta il rischio e continua»). La pagina deve dire chiaramente che è normale e che
   il certificato è del pc.
3. **Live**: anteprima grande, badge «in onda sul pc» / «collegato · non in onda», fps, durata, scelta della
   webcam, specchia anteprima, schermo acceso, tutto schermo, **stacca la webcam** (azione di sicurezza, un
   clic, niente conferme).
4. **Ritorno**: «Webcam spenta / sei tu a comandare», oppure «Il pc ti ha staccato», oppure «Il pc non
   risponde». Sempre un solo pulsante per ricominciare.
5. **Posto occupato**: se un altro dispositivo apre la pagina mentre un portatile è già collegato, vede «C’è già
   un portatile / questo è di troppo» e «Riprova»: non può prendere il posto del primo senza che la regia lo
   stacchi. È uno stato vero, non un errore tecnico.
6. **In regia**: la finestra si accende da sola al primo fotogramma; dalla scheda si può spegnere, specchiare,
   adattare, rinominare, staccare. Il pezzo si sposta e si scala come tutti gli altri. Se il segnale cade, la
   finestra tiene l’ultimo fotogramma, mostra «segnale perso», poi esce da sola dopo pochi secondi.

## File

| File | Cosa è |
| --- | --- |
| `esterna.mjs` | server HTTPS del portatile (porta 2371), coppia, fotogrammi, MJPEG per Camo |
| `pubblico/vista.html`, `vista.css`, `vista.js` | la pagina del portatile: codice, permesso, live, stacco |
| `pubblico/esterna.js`, `esterna.css` | il pezzo `/o/esterna`: finestra, badge, attesa, segnale perso |
| `pubblico/regia.html` | sezione «In rete», scheda «Vista esterna», riga di stato |
| `README.md`, `GUIDA-INSTALLAZIONE.md` | come si usa e come si risolve |

## Cosa rifinire (solo design/UX, non comportamento)

### 1. La pagina del portatile
- Gerarchia e spaziature a **1366 × 768** e **1920 × 1080**: il codice e il pulsante devono stare sopra la
  piega, senza scroll. Il titolo è già sceso a due righe; controlla che non torni a tre.
- Il **biglietto del codice** è il momento chiave: caselle allineate, focus lime, incolla di sei cifre,
  auto-invio, errore che non fa saltare il layout. Rifinisci il ritmo, non aggiungere passaggi.
- La **figura a destra** (finestra con cielo, sole, montagne, riga «in diretta») è un’illustrazione CSS:
  rendila più convincente, con un filo di profondità, senza usare immagini esterne e senza sembrare una
  webcam vera. Deve spiegare «sul pc comparirà così».
- **Permesso**: l’occhio-camera, i tre punti (solo webcam, niente microfono, stacchi quando vuoi), il pulsante.
  Aggiungi il caso permesso negato / webcam occupata con la stessa calma, senza allarmismi.
- **Live**: la finestra deve sembrare un monitor acceso, non un riquadro di admin. Badge «in onda» e «non in
  onda» distinguibili anche senza colore. Il pulsante stacca deve essere chiaro ma non spaventoso.
- **Mobile/tablet**: la pagina può essere aperta anche da un telefono; impila tutto, lascia il codice comodo
  col pollice, il live a tutta larghezza.

### 2. La scheda in regia
- La scheda `dialog.dx-sheet` deve sembrare un piccolo studio di regia: testata con icona, stato, codice o
  anteprima, due colonne. Il radar dell’attesa è già lì: rendilo più fisico, meno «loader».
- **Stati**: in attesa, collegata, segnale perso, porta chiusa. Ognuno deve avere una frase umana e una via
  d’uscita. Il pulsante «nuovo codice» e «annulla l’attesa» devono stare nella gerarchia giusta.
- La **riga in «In rete»** deve dire a colpo d’occhio: nessun pc, in attesa, collegata, segnale perso. Oggi
  usa il nome del portatile; va bene, rendilo leggibile anche quando il nome è lungo.
- Il **pulsante «collega un pc»** nella testata della sezione è la porta d’ingresso: non nasconderlo.

### 3. Il pezzo in onda
- La finestra deve leggersi sul muro bianco e sulla scena scura: bordo, ombra, etichetta, badge «LIVE».
- «In attesa del portatile» e «segnale perso» non devono sembrare errori tecnici: sono stati previsti. Usa
  la stessa voce sospesa degli altri pezzi, senza riquadri pesanti.
- Non coprire la persona: il posto di default è a destra, fra spie e meme. Se lo sposti, il pezzo deve
  continuare a stare bene anche a scala 0,5 e 1,5.
- Ricorda che in Camo il livello è trasparente e il video arriva via MJPEG: niente animazioni costose sopra
  il video, niente `filter` a ogni fotogramma.

### 4. Accessibilità e dettagli
- Contrasto AA su testo piccolo, focus visibile, `aria-live` per errori e stato, input del codice con label,
  pulsanti veri (non `div` cliccabili) dove possibile.
- `prefers-reduced-motion`: radar, pulviscolo, scanline e pulsazioni si fermano.
- Non usare emoji come icone; il progetto ha uno stile di icone lineari.
- Mantieni i tempi: la pagina è leggera, 15 fps in onda e 5 fps da ferma. Non aggiungere richieste a ogni
  fotogramma.

## Vincoli tecnici da non rompere

- La pagina del portatile **deve stare su HTTPS**: senza, il browser non concede la webcam. Il certificato è
  self-signed e vive in `cache/vista.pfx`; la prima visita chiede «Avanzate → Procedi». Non promettere che
  sparirà: spiegalo.
- Il server del portatile ascolta su tutte le reti ma serve **solo** la sua pagina e i suoi API. Non aggiungere
  lì la regia, le azioni o la webcam del pc.
- Un portatile alla volta, cookie HttpOnly, codice mono-uso, token in memoria, nessun file su disco.
- La porta è `esterna.porta` (default 2371); `--senza-vista` non la apre.
- Il pezzo è dentro `/o/tutto` e ha il suo `/o/esterna`; non duplicare il flusso.

## Come provarlo

```bat
set DIRETTA_PORTA=2351
set DIRETTA_STATO=stato-prova.json
set DIRETTA_VISTA_PORTA=2372
node server.mjs --senza-camo --senza-sensori --senza-tv
```

Poi apri `http://localhost:2351/`, «In rete → collega un pc» e, sul portatile (o in una seconda finestra con
`--ignore-certificate-errors`), `https://<ip-del-pc>:2372/`. Per provare la webcam senza una webcam vera, Edge:
`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`.

## Fatto quando

- [ ] Codice e pulsante visibili senza scroll a 1366 × 768.
- [ ] I sei stati della pagina del portatile sono belli e chiari: codice, permesso, live in onda, live non in
      onda, staccato/errore, posto occupato.
- [ ] La scheda in regia è leggibile a colpo d’occhio e non sembra un pannello di configurazione.
- [ ] La finestra in onda si legge su bianco e su scuro, senza coprire la persona.
- [ ] Nessun cambio di comportamento, API, copy di sicurezza o consumo.
