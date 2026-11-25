# Istruzioni per gli agenti

## L'archivio è su D:

L'archivio personale di Alberto **non sta nel repository**: vive su `D:`. La mappa completa, con la struttura e le regole di salvataggio, è in:

- `D:\LEGGIMI.md` (fonte principale)
- `ARCHIVIO-D.local.md` nel repo (copia locale, ignorata da git)

**Prima di cercare o salvare qualcosa nell'archivio, leggi `D:\LEGGIMI.md`.** Se non c'è, usa `ARCHIVIO-D.local.md`; se mancano entrambi, chiedi all'utente invece di indovinare.

## Regole fisse (SEMPRE)

### Prima di esportare o salvare

1. **Leggi il file** che stai per salvare (o almeno controllane tipo, contenuto e contesto): non esportare alla cieca.
2. **Rileggi `D:\LEGGIMI.md`**, in particolare la tabella «Dove salvare». Sempre, anche se pensi di ricordarla.
3. Scegli la destinazione e il nome `AAAA-MM-GG - TIPO - Controparte - Oggetto.ext`.
4. Salva.

### Dopo aver salvato

1. Verifica che il file esista e che il percorso sia quello giusto.
2. Apri Esplora risorse nella cartella, con il file selezionato:
   `explorer.exe /select,"<percorso completo>"`
   (se è una cartella: `explorer.exe "<cartella>"`).
3. Nel messaggio finale dai **sempre** un link cliccabile:
   `[Apri il file](file:///D:/percorso/file.ext)`
   con gli spazi codificati come `%20`.

Queste due cose si fanno **sempre**, senza eccezioni.

## Quando l'utente dice «salvalo in D»

1. Deduci il tipo: documento finito, sorgente, email, PDF da inviare, foto, musica, sito, pratica di famiglia, documento personale…
2. Deduci il contesto: Alberto, famiglia Pecchini, Cascina Fontana, cliente, evento…
3. Scegli la cartella con la tabella «Dove salvare» di `D:\LEGGIMI.md`.
4. Nomina il file `AAAA-MM-GG - TIPO - Controparte - Oggetto.ext`.
5. Se il contesto non basta, **chiedi**: non salvare nella radice di `D:` e non inventare una nuova area.

Regola pratica: i sorgenti (HTML, script, JSON) restano nella pratica in `06 Claude`; i PDF pronti da inviare vanno in `03 Documenti da inviare`. Non mettere tutto nella stessa cartella.

## Le destinazioni più comuni

| Cosa | Dove |
|---|---|
| Documento di famiglia, società, immobile, veicolo, lavoro di Primo | `D:\pecchini\<area>\<anno>\<categoria>\` |
| Pratica preparata da Claude per la famiglia | `D:\pecchini\06 Claude\...` |
| Email Proton / PEC | `D:\pecchini\06 Claude\01 Email Proton\...` / `02 Email PEC\...` |
| PDF finito da inviare | `D:\pecchini\06 Claude\03 Documenti da inviare\` |
| Documento personale di Alberto | `D:\a\documenti personali\` |
| Scuola o università | `D:\a\scuola\...` |
| Sito web | `D:\a\website\materiale <CLIENTE>\` o `D:\a\claude\03 Siti web\...` |
| Grafica, banner, meme | `D:\a\claude\04 Grafica` o la cartella del cliente |
| Foto e video generici | `D:\disco immagini\Rullino\Anno YYYY\MM\` |
| Foto e video di un evento | `D:\disco immagini\rullino con etichetta\<evento>\` |
| Screenshot, meme, export social | `D:\disco immagini\rullino con etichetta\<fonte>\` |
| Musica / font | `D:\disco documenti\MUSICA\...` / `D:\disco documenti\FONT` |
| File che non sai classificare | `D:\disco documenti\` (e dillo all'utente) |
| Dati di pzkko.it | `D:\pzkko-server\dati\` solo tramite il server |

## Il repository

Il repository contiene siti e programmi, non l'archivio. Non copiare file da `D:` nel repository e non committare documenti personali, foto o dati dell'archivio.
