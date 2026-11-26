# Lezioni OS

La regia delle lezioni: registra la lezione che segui su Teams, la trascrive mentre va, e quando finisce la
**sviluppa** — toglie quello che lezione non era, pulisce la lavagna dalla persona davanti, mette l'audio in un file
solo — e la mette in **galleria**, con voce, lavagna e audio sugli stessi tempi. Sa l'**orario**, e se glielo dici
registra da sola.

È il rifacimento di «Lezioni» (pzk$meeting, ottobre 2026): il registratore e il trascrittore sono cresciuti da quelli,
la barra di tkinter ha lasciato il posto a una plancia fatta come quella di Diretta OS (stesse quattro zone, stessi
colori, stesso tema chiaro/scuro), e intorno ci sono i modelli nuovi. Gira tutto sul PC: niente cloud, tranne la
lettura della lavagna con Claude se la si usa.

```
avvia.cmd        apre la regia (http://localhost:2380/), accendendo il server se serve
lezione.cmd      avvia la registrazione e apre la regia        (collegamento «Lezione» sul desktop)
fine.cmd         ferma la registrazione e apre la galleria     (collegamento «Fine lezione»)
riavvia.cmd      dopo un aggiornamento: chiude il server e lo fa ripartire
installa.ps1     l'ambiente Python, i modelli che servono subito, i collegamenti; con -Avvio il server parte con Windows
```

## La regia

Quattro zone fisse, come in Diretta OS:

- **Sorgenti** (a sinistra): quello che Lezioni OS fa a una lezione, con l'interruttore.
  *Cattura*: audio del PC (c'è sempre), finestra della lezione. *Voce*: trascrizione, lessico della materia.
  *Lavagna*: lavagna senza prof, lettura delle formule. *Archivio*: audio in Opus, ascolto pulito.
- **Monitor** (al centro): la finestra della lezione com'è adesso (rifatta ogni due secondi), l'ultima frase sentita
  come sottotitolo, il livello dell'audio a destra. Sopra: la materia, il tempo, **Registra / Ferma**.
- **Controlli** (sotto, a schede): *Voce* (quello che viene detto, mentre viene detto), *Linea del tempo* (gli ultimi
  fotogrammi), *Oggi* (le lezioni di oggi dall'orario), *Registro* (cosa scrivono i programmi).
- **Proprietà** (a destra): la sorgente selezionata — quale modello, dove gira, i suoi parametri, la prova di cattura.

La colonna delle icone cambia vista: **Regia**, **Galleria**, **Orario**, **Modelli**. In basso a sinistra lo stato
del server, il lavoro in corso, la memoria della scheda video e lo spazio sul disco delle lezioni; il sole cambia tema.
`/#galleria`, `/#orario`, `/#galleria/2026-11-04` aprono direttamente lì.

## Cosa c'è di nuovo rispetto al vecchio Lezioni

**Si fotografa la finestra, non lo schermo.** Il vecchio registratore fotografava lo schermo intero: nelle lezioni
registrate c'erano dentro Fallout, WhatsApp, il desktop. Ora `motore/cattura.py` trova la finestra dal titolo
(«teams|riunione|meeting|lezione», si cambia dalla regia) e la fotografa con `PrintWindow` e
`PW_RENDERFULLCONTENT`: anche se sopra c'è un'altra finestra o un gioco. Se nel browser si cambia scheda il titolo non
è più quello di una lezione e i fotogrammi si fermano (l'audio no); ripartono quando si torna. Non funziona con la
finestra ridotta a icona. «Schermo intero» resta come scelta, per i casi strani.

**Tre motori per la voce**, provati il 24.11.2026 sugli stessi tre minuti di una lezione di Analisi (RTX 3060 Ti):

| motore | dove | velocità | com'è andato |
| --- | --- | --- | --- |
| Whisper large-v3 (faster-whisper) | scheda video, ~3 GB | 6–10× | il migliore: prende anche la domanda dello studente dal fondo |
| Whisper large-v3 turbo | scheda video, ~1,5 GB | — | non provato qui: si scarica al primo uso (1,6 GB) |
| Parakeet TDT 0.6B v3 (NVIDIA, via onnx-asr) | CPU | 11–16× (36–56× sulla GPU) | la scheda video resta libera; in aula sbaglia di più («Tanzia» per tangente) e sui rumori scrive paroline in inglese, che vengono scartate |

Il predefinito resta Whisper large-v3: in italiano, in un'aula, è ancora il più preciso. Il **lessico della materia**
(in `orario.json`, si scrive dalla regia) gli va in testa al contesto: «simbolo di Landau», «x con zero». Le frasi
troppo lunghe vengono tagliate ai punti fermi coi tempi delle parole, così in galleria la voce si segue frase per frase.

**La lavagna senza la persona davanti.** A lezione finita Robust Video Matting (15 MB, 0,1 s a fotogramma sulla CPU)
dice dov'è il docente; in quei punti resta la lavagna dell'ultima volta che si vedeva. Regole oneste: la memoria vale
due minuti e mezzo; se nel frattempo la lavagna è cambiata molto (cancellata) quello che c'era dietro non vale più; se
cambia l'inquadratura si ricomincia. Dove la lavagna non si è mai vista resta la persona: meglio lei che una lavagna
vecchia. Accanto esce la versione **nitida** (luce spianata, tratto rinforzato). BiRefNet lite c'è come alternativa: fa
lo stesso ritaglio, ma ci mette 13 s a fotogramma sulla CPU e sulla scheda video riempie tutti gli 8 GB — per la
lavagna non serve.

**Quello che lezione non è, fuori.** Per le lezioni vecchie (schermo intero) `sviluppa.py` riconosce i fotogrammi della
lezione dalla cornice viola di Teams e, quando manca, dal confronto con la barra di Teams degli altri fotogrammi.
Gli altri restano nella cartella ma non si vedono in galleria e non si leggono (`lavagna.json`).

**L'audio in Opus.** I pezzi WAV diventano un solo `audio.opus` a 40 kb/s: una lezione di 1 h 53 passa da 649 MB a
28 MB, e in galleria si scorre. Ogni pezzo viene riportato ai suoi dieci secondi esatti, così il secondo 3600
dell'Opus è il secondo 3600 dei fotogrammi. `ascolto.opus` è la copia per le orecchie: passa-alto, riduzione del
rumore a FFT, volume EBU R128 (la trascrizione si fa sempre sull'originale: la riduzione del rumore la peggiora).
I WAV non si toccano: li toglie **Libera spazio** dalla galleria, e solo se l'Opus è buono e la voce è tutta trascritta.

**La lettura della lavagna sul PC.** `motore/leggi.py` passa la lavagna ripulita a un modello che vede (Qwen3-VL 4B
su Ollama) e scrive `ocr/ocr_NNN.json` nello stesso formato della lettura con Claude. **Sperimentale**: quando
risponde, titolo e formule semplici sono giusti e qualche simbolo no (f letta come y, «o piccolo» come delta), in
due-tre minuti a lavagna; ma è un modello che ragiona, Ollama non glielo spegne, e a volte finisce i gettoni senza
scrivere la risposta (la lavagna resta da leggere, e la regia lo dice). Spenta di serie; dalla galleria si legge anche una lavagna sola. Per le formule fa fede Claude: `ocr_claude.py` e
`appunti_claude.py` (con `ANTHROPIC_API_KEY`) sono quelli di prima.

**La galleria.** Tutte le lezioni, per mese, con la materia (scritta alla registrazione, o dedotta dall'orario per
quelle vecchie: giorno e ora). La ricerca cerca in quello che è stato detto, in tutte. Una lezione si apre nel
visore: la lavagna (originale / senza prof / nitida), la voce che scorre in sincrono, l'audio (originale / pulito,
fino a 2×), la linea del tempo col volume e i fotogrammi, le miniature. `Spazio` suona, `←` `→` cinque secondi
(con `Shift` trenta), `↑` `↓` la lavagna prima e dopo, `Esc` torna.

**L'orario.** La settimana del semestre (da `orario.json`, partito dall'orario ufficiale CGT I anno), con le materie,
i docenti, le aule, quante lezioni registrate ha ogni blocco. Si cambia dalla regia. Con **Avvio automatico** acceso,
due minuti prima di ogni lezione Lezioni OS guarda se c'è una finestra col titolo da lezione: se c'è, registra, con
materia e lessico giusti; si ferma dieci minuti dopo la fine, o prima se la finestra è chiusa e c'è silenzio da dieci
minuti. Una lezione fermata a mano non riparte. Serve il server acceso (`installa.ps1 -Avvio`).

## Com'è fatto

`server.mjs` (Node, nessuna dipendenza, solo `127.0.0.1`) serve la regia, tiene lo stato e accende i programmi di
`motore/` (Python, in `%LOCALAPPDATA%\Lezioni\venv`). Tutto passa dai file nella cartella della lezione: registratore
e trascrittore vivono da soli, scrivono il loro numero di processo in `log/`, e il server li rilancia se cadono; se è
il server a riavviarsi, quando torna riprende la lezione in corso. I lavori di dopo (sviluppo, lettura, scarico dei
modelli) vanno uno alla volta, a bassa priorità, e mai mentre si registra.

```
motore/
  cattura.py     la finestra della lezione: trovarla, fotografarla anche coperta, il riquadro del video di Teams
  registra.py    audio (loopback WASAPI, pezzi da 10 s) + fotogrammi, sullo stesso orologio; vivo.jpg per la regia
  trascrivi.py   Whisper o Parakeet, a finestre che si sovrappongono; trascrizione.jsonl coi tempi di ogni parola
  componi.py     grezzo.md: voce e lavagna su una linea del tempo
  sviluppa.py    dopo la lezione: lezione/fuori, miniature, lavagna pulita e nitida, audio.opus, ascolto.opus, picchi
  leggi.py       la lettura della lavagna sul PC (Ollama)
  modelli.py     il catalogo dei modelli: se ci sono, come si scaricano
  controlla.py   la diagnosi in un colpo
  ocr_claude.py, appunti_claude.py, prepara.py, aspetta.py, unisci.py, impagina.py   la lettura e gli appunti con Claude
pubblico/        regia.html, regia.js, regia.css; base.css è lo stile di Diretta OS, pari pari
config.json      la porta, il titolo della finestra, i modelli di serie (config.locale.json lo copre, e non va nel repository)
orario.json      il semestre, le materie col loro lessico, le lezioni della settimana
```

Nella cartella di una lezione (`<LEZIONI_DIR>\2026-11-04\`):

```
meta.json  frames.jsonl  frames\t_000754.jpg  audio\c_00000.wav  trascrizione.jsonl  grezzo.md  log\     come prima
lavagna.json     per ogni fotogramma: il riquadro del video, se è fuori lezione, quanto copriva il docente
miniature\  pulita\  nitida\     le anteprime, la lavagna senza la persona, la stessa «scansionata» (webp)
audio.opus  ascolto.opus  picchi.json     l'audio archiviato, quello pulito, il volume secondo per secondo
sviluppo.json  lettura.json      a che punto sono i lavori
```

Le lezioni vecchie si aprono così come sono; **Sviluppa** aggiunge i file nuovi e non toglie niente.

## Limiti, onesti

- Si registra quello che esce dal PC: niente muto su Teams, niente cambio di uscita a metà.
- La finestra della lezione non deve essere ridotta a icona; se la lezione è una scheda del browser, deve essere la
  scheda attiva della sua finestra (la finestra può stare dietro a tutto il resto).
- La lavagna «senza prof» è una ricostruzione: sotto il docente c'è la lavagna di qualche secondo o minuto prima.
- Parakeet non ha una lingua da imporre: la riconosce da solo, e in aula a volte sbaglia.
- Il ritaglio del video di Teams si fida della cornice viola di chi parla; con altri programmi (Zoom, Meet) resta la
  finestra intera, che per la lavagna pulita va bene lo stesso.
- DeepFilterNet3 (riduzione del rumore con una rete) non c'è: l'ascolto pulito usa i filtri di ffmpeg.
- Registra solo le lezioni che hai il diritto di registrare, e tienile per te.

## Licenze

Il codice è di pzkko. Dentro, o scaricati al primo uso, ci sono: faster-whisper e i pesi di Whisper (MIT),
Parakeet TDT 0.6B v3 (CC BY 4.0) con onnx-asr (MIT), Silero VAD (MIT), Robust Video Matting (GPL-3.0), BiRefNet (MIT),
ONNX Runtime (MIT), OpenCV (Apache 2.0), ffmpeg con libopus, Qwen3-VL (Apache 2.0) con Ollama (MIT), KaTeX (MIT),
PyAudioWPatch, mss, pillow, numpy. I caratteri e il segno sono quelli di pzkko.it.
