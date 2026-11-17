# pzkko.it

Il profilo per svago di Alberto Pecchini, fatto come il suo profilo di Discord:
tema `#ccff00 → #9d00ff` sotto il velo di Discord (bianco all’80 % col tema chiaro,
nero al 60 % con quello scuro), banner, avatar con la decorazione, stato,
stato personalizzato, tag NODE, badge, bio e collegamenti, tutti dal vivo.
L’effetto del profilo (i cristalli verdi e la vampata con la falce di luna) è
ridisegnato da zero in SVG e CSS. Il sito principale resta
[albertopecchini.it](https://www.albertopecchini.it).

## Da dove arrivano i dati

- **Lanyard** (`api.lanyard.rest`, WebSocket): avatar, decorazione, stato,
  dispositivi, stato personalizzato, Spotify, giochi, tag del server. Serve
  restare nel server <https://discord.gg/lanyard>.
- **Profilo pubblico** (`dcdn.dstn.to/profile/<id>`): banner, colori del tema,
  bio, badge e collegamenti; si ricarica ogni 10 minuti. Se non risponde valgono
  i valori in `config.js`. Il campo dei pronomi non viene mai letto né mostrato.

## Cosa c’è

- `public/index.html`: la cornice (scheda a sinistra, schede a destra).
- `public/assets/config.js`: **il file da toccare**. ID Discord, profilo di
  riserva, social, progetti, strumenti, lingue, contatore delle visite.
- `public/assets/i18n.js`: i testi in nove lingue (it, en, es, fr, de, pt, ru, ja, zh).
- `public/assets/app.js`: scheda, Bacheca / Progetti / Attività / Social,
  scheda del progetto, menu, tema chiaro e scuro, Lanyard e profilo.
- `public/assets/effect.js`: l’effetto del profilo.
- `public/assets/covers.js`: le copertine disegnate dei progetti senza immagine.
- `public/media/`: le immagini della serranda (numero di telefono ed email
  sfocati), del manifesto della roulette e del volantino di Lezioni.
- `public/.well-known/discord`: la verifica del dominio per Discord.
- `src/site.css`: Tailwind v4 e i componenti in stile Discord.

## Comandi

```sh
npm install
npm run build   # genera public/assets/site.css
npm run dev     # lo rigenera a ogni modifica
```

Vercel esegue `npm run build` e pubblica `public/` (vedi `vercel.json`).
