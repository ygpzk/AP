# La regia di Claude

La finestra dove Alberto vede quello che Claude sta facendo, in qualsiasi lavoro. È nata il
3 novembre 2026 come cruscotto della macchina del tempo; poi Alberto: «mostra quel cmd e impara
per qualsiasi task di aprirlo, poi mentre che è aperto tu lavora per migliorarlo al massimo per
i miei bisogni».

```sh
powershell -File tools\cruscotto\cruscotto.ps1   # la apre al centro del 24", o la riporta davanti
powershell -File tools\cruscotto\cruscotto.ps1 -Riavvia   # la chiude e la riapre (se cambia il guscio)
node tools/cruscotto/diretta.mjs "testo"         # la nota di Claude
node tools/cruscotto/diretta.mjs --piano "a|b|c" # i passi del lavoro
node tools/cruscotto/diretta.mjs --passo 2       # il passo in corso (--passo fine)
node tools/cruscotto/diretta.mjs --barra id "Nome" 3 10 "testo"   # una barra qualsiasi
node tools/cruscotto/diretta.mjs --log "testo"   # una riga nel log
node tools/cruscotto/account.mjs                 # limiti del piano e token (stampa)
```

## Si apre dall'icona (11.11.2026)

Alberto: «crea icona desktop per aprirla manualmente e disattiva avvio automatico». Sul desktop c'è
**Regia di Claude** (`Desktop\Regia di Claude.lnk` → `cruscotto.ps1`, icona `regia.ico`, disegnata
da `regia.png`: una finestra col titolo blu #007acc, un prompt e tre barre). I ganci non la aprono
più da soli ma continuano a scrivere tutto, così quando la apri vedi già lo stato vero.
`:automatica si` nella regia (o `{"apriDaSola": true}` in `~/.cruscotto/impostazioni.json`) la
riaccende, `:automatica no` la rispegne.

La console parte da `regia-console.lnk` (lo rifà `cruscotto.ps1` ogni volta): una console aperta da
un collegamento ne prende l'icona, e così la barra di Windows ha quella della regia. La barra di
Windows è chiesta scura (`DwmSetWindowAttribute` 20). Avviata da un collegamento, anche la console
di PowerShell si chiamava «Regia di Claude» e lo script trovava sé stesso: ora si rinomina.

In cima alla regia c'è una barra a schede, una per finestra, con quella in primo piano accesa: i
finti `─ □ ×` di prima ripetevano quelli veri di Windows.

## A finestre (11.11.2026)

Alberto: «fai regia di claude come una cmd più controllabile e tech», «più forma di finestra»,
«statistiche account». Sotto una barra del titolo (stato, progetto, ramo, pc acceso da quanto,
orologio) le finestre col bordo e il numero:

| | finestra | cosa |
|---|---|---|
| 1 | CLAUDE | richiesta, nota, strumento in corso o fine del turno, sessione, piano |
| 2 | AGENTI | le sessioni e i loro agenti; in primo piano ↑↓ ne sceglie una e Invio la fissa |
| 3 | ACCOUNT | il piano, i limiti veri (sessione 5h, settimana, settimana per modello) col reset, la ripartizione Claude Code/chat, i token di oggi e dei 7 giorni, i modelli, il grafico delle ultime 24 ore; ingrandita anche i 7 giorni uno per riga |
| 4 | SISTEMA | grafici di CPU e RAM degli ultimi due minuti, dischi |
| 5 | RETE | server di casa, sito e tunnel, tutto quello che Alberto ospita (`hosting.json`), git, strumenti e file della sessione |
| | LAVORI | le barre, solo quando ce ne sono |
| 6 | LOG | il log in diretta, coi filtri nel bordo e la posizione nel piede |
| 7 | FREELLM | i modelli gratis di FreeLLMAPI: chi sta rispondendo adesso, server, fornitori, ultime richieste; ingrandita anche le 24 ore, i modelli di oggi, i fornitori saltati e quelli in pausa |

Quella in primo piano ha il bordo doppio. `Tab`/`⇧Tab` o `1`…`7` la cambiano, `z` la ingrandisce,
`Esc` toglie una cosa alla volta (aiuto, zoom, ricerca, sessione fissata), `?` l'aiuto.

**La riga di comando** in fondo, come vim: `:` e il comando (Tab completa, ↑↓ ripescano quelli di
prima), `/` cerca nel log. `:filtro`, `:cerca`, `:sessione <sigla>|tutte`, `:finestra`, `:zoom`,
`:apri sito|pzkko|regia|tempo|vite|uso|tunnel|log|cartella` (browser o Esplora risorse),
`:nota <testo>` (una riga di Alberto nel log), `:pausa`, `:aggiorna`, `:pulisci`, `:riavvia`, `:esci`.
L'elenco intero è nell'aiuto, scritto da `COMANDI` in `vista.mjs`.

**I limiti dell'account** vengono da `~/.claude.json` (`cachedUsageUtilization`): li aggiorna Claude
Code quando li chiede al server, e la finestra dice di quanto sono vecchi. **I token** li conta
`account.mjs --conta` dalle trascrizioni (`~/.claude/projects/**/*.jsonl`, più di un GB): lo lancia
il guscio ogni minuto in un processo a parte, legge solo la parte nuova di ogni file e tiene le
somme ora per ora degli ultimi 8 giorni in `~/.cruscotto/account.json` (la prima volta ~3 s, poi
decine di millisecondi). Una risposta scritta su più righe si conta una volta.

Le emoji e i caratteri larghi nelle richieste diventano «?»: prendono due colonne e spostavano il
bordo destro. I grafici sono alti due righe con `▄` e `█`: gli altri ottavi (`▁▂▃▅▆▇`) Consolas non li ha.

## FREELLM, i modelli gratis (11.11.2026)

Alberto: «in regia di claude lo voglio una dashboard fatta da te». FreeLLMAPI è il router locale che
mette insieme i piani gratuiti di tanti fornitori (`C:UsersAlbertoprogetti-esternireellmapi`,
porta 3001, solo 127.0.0.1; si comanda anche con la skill utente `freellmapi`). `modelli.mjs` legge
il suo SQLite in sola lettura col sqlite di Node, al massimo una volta al secondo: `requests` (ogni
richiesta col fornitore e il modello che ha risposto), `request_attempts` (i fornitori saltati),
`api_keys`, `rate_limit_cooldowns`; e prova la porta ogni 5 secondi. `node modelli.mjs` stampa i dati.

La finestra sta sopra il LOG (solo se FreeLLMAPI è installato, lasciando al LOG le sue 8 righe):
in cima **Usa ►** fornitore / modello dell'ultima risposta, poi lo stato del server, i fornitori
(verdi se sani), le richieste di oggi; sotto, le ultime richieste a sinistra e i fornitori di oggi a
destra. `7` e `z` (o `:freellm`) la ingrandiscono.

`:freellm avvia` / `ferma` accendono e spengono il server (lo script della skill, senza la sua
finestra cmd); `:freellm chiedi <testo>` fa una domanda e la risposta arriva nel LOG come righe
`freellm`, con la riga «Modello usato». `:apri freellm` apre la dashboard web di FreeLLMAPI.

## Cosa mostra

Dall'alto:

- lo stato: **LAVORA** (verde), **TOCCA A TE** (giallo, ha finito il turno), **TI ASPETTA**
  (rosso, un permesso o una domanda); il progetto e il ramo; con più sessioni, la sigla di
  quella in cima;
- la richiesta di Alberto, la nota di Claude, lo strumento in corso con da quanto e il numero
  nel turno; a fine turno quanto ci ha messo, con quanti strumenti, e l'inizio della risposta;
- **AGENTI** (9.11.2026): tutte le sessioni di Claude che lavorano, aspettano o hanno finito
  nelle ultime tre ore, ognuna col suo colore e il ► su quella in cima: progetto, stato, **da
  quanto lavora** (dal primo messaggio del giro, non da quelli mandati a lavoro in corso), la
  **richiesta di Alberto** (quella vera: le notifiche `<task-notification>` dei lavori in
  background non la sostituiscono, il testo incollato sì), cosa sta facendo o cosa ha risposto;
  sotto ognuna, con `└─`, gli agenti che ha mandato a lavorare (strumento Agent, ganci
  `SubagentStart`/`SubagentStop`): tipo, da quanto, cosa gli è stato chiesto, lo strumento in
  corso, e per dieci minuti quelli finiti con quanto ci hanno messo;
- il piano dei passi, con quello in corso (i fatti si riassumono quando non ci stanno);
- le barre: i download, i siti della macchina del tempo, le barre di qualsiasi lavoro;
- sistema (CPU, RAM, dischi), server di casa (pzkko 8787, regia 8788, tempo 8789, Vite 5173),
  il sito pubblico e il tunnel della macchina del tempo, git (ramo, avanti e indietro, file
  cambiati, ultimo commit), la sessione (quanti strumenti e quali, gli ultimi file toccati, gli
  errori);
- il log in diretta: con più sessioni, ogni riga di Claude ha a sinistra il segno colorato della
  sua.

In cima va la sessione a cui Alberto ha chiesto qualcosa per ultima fra quelle che lavorano (o
aspettano): così non salta a ogni strumento quando ne lavorano due insieme. Se nessuna lavora,
l'ultima che si è mossa.

Suona quando Claude ha finito il turno o aspetta, in qualsiasi sessione. Tasti (oltre a quelli
delle finestre, sopra): `a` tutto, `c`
solo Claude, `l` solo i lavori, `e` solo gli errori, `s` fissa una sessione (e poi la prossima,
e di nuovo tutte: il log mostra solo le sue righe), `p` pausa, `↑` `↓` (e pagina su/giù) per
scorrere, `x` toglie le barre dei lavori finiti e le sessioni chiuse, `q` esce. Un clic dentro
non la blocca più (la «modifica rapida» è spenta).

## Come funziona

- `diretta.mjs`: chi lavora scrive in `C:\Users\Alberto\.cruscotto` (`CRUSCOTTO` per un'altra
  cartella): `stati/<chi>.json`, `log.txt` (oltre 4 MB ricomincia, il vecchio in `log-1.txt`),
  `sessioni/<sigla>.json`, `piano-<sigla>.json`, `finestra.json`. Scritture atomiche. I comandi
  di Claude ereditano `CLAUDE_CODE_SESSION_ID`: la nota (`stati/claude-nota-<sigla>.json`), il
  piano e le righe `claude#<sigla>` del log sono della sessione che li scrive. La sigla sono i
  primi quattro caratteri dell'id della sessione.
- `gancio.mjs`: lo lanciano i ganci di Claude Code in `~/.claude/settings.json` (a livello
  utente, quindi in qualsiasi progetto e in tutte le sessioni aperte), in background:
  `SessionStart` e `UserPromptSubmit` aprono la regia se è chiusa, ma solo con l'apertura
  automatica accesa (dall'11.11.2026 è spenta: vedi «Si apre dall'icona»; via WMI,
  `Win32_Process.Create`: un figlio del gancio moriva con lui) e scrivono la richiesta;
  `PreToolUse` lo strumento in corso; `PostToolUseFailure` gli errori; `Notification` lo stato
  e il suono; `Stop` lo stato, il suono, la durata del turno e l'inizio della risposta (dalla
  coda della trascrizione); `SessionEnd` chiude la sessione; `SubagentStart` e `SubagentStop`
  gli agenti (l'Agent chiesto in `PreToolUse` si lega al primo `SubagentStart` del suo tipo; gli
  strumenti con `agent_id` vanno sotto l'agente). Il log tiene solo l'ora: la regia ricostruisce il
  giorno andando indietro dall'ultima modifica del file, così dopo mezzanotte resta in ordine. Ogni sessione nel suo file, perché
  i ganci arrivano da tutte. Una sessione vista per la prima volta a metà (ganci nuovi,
  compattazione) ripesca la richiesta dalla trascrizione. Le sessioni ferme da tre giorni si
  cancellano. Non blocca mai e esce sempre con 0 (`CRUSCOTTO_DEBUG=1` per vedere gli errori).
- `cruscotto.mjs`: il guscio (il tasto `q`, il battito ogni secondo in `finestra.json`, le misure
  del pc, dei server, di git e dei siti pubblici); `vista.mjs`: il disegno, gli altri tasti e la
  scelta della sessione in cima, che il guscio ricarica da solo quando il file cambia: la regia
  si migliora mentre è aperta. Un cambio del guscio vuole `cruscotto.ps1 -Riavvia`.
- `cruscotto.ps1`: trova lo schermo con la diagonale più vicina ai 24 pollici (dalle misure EDID
  del monitor), apre `conhost` con `cmd` e `node`, la centra, spegne la modifica rapida; se la
  regia è già aperta la riporta davanti. `-Nuova` ne apre un'altra, `-Riavvia` chiude quella che
  c'è e la riapre.

Per fotografarla (per controllare il disegno) si usa `PrintWindow` sulla finestra «Regia di
Claude», mai una foto dello schermo: Windows non lascia portare davanti una finestra mentre
Alberto ne usa un'altra, e la foto dello schermo prendeva quella.

Solo simboli che Consolas ha davvero (√ × ● • ∙ ► █ ░): ✓ e i puntini braille uscivano come
quadratini. La macchina del tempo (`tools/tempo/diretta.mjs`, `cruscotto.*`) usa questa.
