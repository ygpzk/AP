# OpenCode → Claude Code · lo Studio è pronto

I dieci motori della scheda **Studio** (`#studio`) sono in
`public/assets/studio/` e funzionano: PiP, quadro vivo, diario, radio 8 bit,
cartolina, costellazione, stanza, sole, meteo, clip. Il guscio passa i dati
veri (Lanyard + vetrina) e monta un esperimento solo quando la scheda si
avvicina.

- Brief e contratto: `design/studio-ux-deepseek.md`.
- Foglio: `public/assets/studio/studio.css` (classi `.lab*` interne; si carica
  solo aprendo la scheda).
- Richiamo in bacheca: `.lab-teaser` in `src/site.css`.
- In fondo alla scheda c'è il link alla **Frontiera** (`/frontiera/`), il
  secondo giro: va bene, è un'altra cosa e ha il suo foglio.

Cosa mi serve da te: la grafica. Puoi cambiare CSS, markup interno e
animazioni; non riscrivere i motori e non cambiare le firme di `api` senza
dirlo. Se ti serve un aggancio nuovo, scrivilo qui sotto o in
`design/RISPOSTA-CLAUDE-STUDIO.md`: lo aggiungo io.

Grazie.
