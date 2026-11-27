# AP

I siti e i programmi di Alberto Pecchini, in un repository solo. Ogni cartella ha il suo
README (o il suo `LEGGIMI.txt`).

```
AP/
├─ albertopecchini.it/   il portfolio: sito statico generato da dati e template (Vite)
├─ pzkko.it/             il profilo Discord dal vivo, con la chat, i tavoli, le app e gli esperimenti
├─ DirettaOS/            la regia della diretta: camere, scene, installer
├─ LezioniOS/            registra, trascrive e impagina le lezioni
├─ PostaOS/              la posta
├─ PuliziaOS/            la pulizia dei registri
├─ MatriciOS/            le matrici
├─ esperimenti/          prove grafiche fuori dai siti (il preventivo Allianz per i mirtilli)
├─ package.json          scorciatoie per i comandi del portfolio dalla radice
├─ .github/workflows/    build.yml: il portfolio a ogni push; catture.yml: le catture dei siti ogni ora
└─ .vscode/              F5 in VS Code avvia il portfolio e apre Edge
```

## Avvio

### Portfolio

```bash
cd albertopecchini.it
npm install
npm run dev       # http://localhost:5173
npm run build     # genera albertopecchini.it/dist/
npm run check     # controllo di riservatezza su dist/
```

Richiede Node 20.19 o superiore. Gli stessi comandi (`npm run dev`, `npm run build`,
`npm run email`) funzionano anche dalla radice: il `package.json` qui sopra li inoltra alla
cartella del sito, che è spiegato per intero in
[albertopecchini.it/README.md](albertopecchini.it/README.md).

### pzkko.it

```bash
cd pzkko.it
npm install
npm run serve     # http://localhost:5080, con le funzioni di api/
npm run build     # controllo di sicurezza (CSP, segreti) + CSS
npm run check     # solo il controllo di sicurezza
```

Tutto il resto — le schede, le app, gli esperimenti, i raccoglitori di Instagram e TikTok —
è in [pzkko.it/README.md](pzkko.it/README.md).

## Pubblicazione

Due progetti Vercel:

| Progetto | Root Directory | Sito | Ramo di produzione |
|---|---|---|---|
| `albertopecchini.it` | `albertopecchini.it` | <https://www.albertopecchini.it> | `main` |
| `pzkko.it` | `pzkko.it` | <https://pzkko.it> | `albertopecchini.it` |

`pzkko.it` è ancora agganciato al ramo `albertopecchini.it`: una modifica a `pzkko.it/` che sta
solo su `main` è un'anteprima, non va in produzione. Dopo il push su `main` si porta lo stesso
commit sul ramo (`git cherry-pick`) e si pusha quello. Su `main`
scrive anche GitHub Actions: **build.yml** costruisce il portfolio a ogni push, **catture.yml**
ogni ora controlla Rivalta, Cascina Fontana, Dario Donelli, questo sito e pzkko.it e, se uno è
cambiato, fa un commit con le catture nuove (vedi
[albertopecchini.it/tools/catture](albertopecchini.it/tools/catture/README.md)). Prima di un
push conviene un `git pull --rebase`.

## Storia

Fino a settembre 2026 il repository ospitava il sito precedente (React); il portfolio è stato
azzerato e ricostruito da capo come sito statico. La storia dei commit è conservata, insieme a
quella di pzkko.it e degli altri programmi.
