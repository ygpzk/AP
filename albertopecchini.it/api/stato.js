// /api/stato: l'informatore dei sistemi (11.11.2026), se il pc di Alberto è acceso e connesso. La funzione sta in
// pzkko/api/stato.mjs, così va online anche quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko;
// finché la radice è qui, la pubblica questo file (come api/wallet.js). Su albertopecchini.it, che non ha le variabili del
// server di casa, gira la domanda a pzkko.it.
export { default } from '../pzkko/api/stato.mjs'
