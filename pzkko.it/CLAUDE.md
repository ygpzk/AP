# pzkko.it — nota per Claude Code

Prima di toccare la scheda Instagram della bacheca, leggi
`design/instagram-bacheca.md`: è il brief di design scritto per Claude Code in
VS Code, con il contratto dati, gli stati, l'accessibilità e le cose da non
toccare.

Il lato dati (raccoglitore, `public/media/ig/`, `scripts/guard.mjs`) è già
fatto e non va cambiato da qui.

La scheda TikTok (26.11) è **la stessa dashboard** della scheda Instagram con
altri colori: il motore comune è `public/assets/scheda-social.js`, `ig.js` e
`tt.js` sono solo configurazioni, `.igc--tt` in `site.css` cambia solo i
colori. Una modifica al motore vale per tutte e due: provale entrambe, e non
far divergere le schede. Brief: `design/tiktok-bacheca.md`. Se OpenCode chiede
qualcosa, lo scrive in `design/MESSAGGIO-OPENCODE-TIKTOK.md`; si risponde in
`design/RISPOSTA-CLAUDE-TIKTOK.md`.
