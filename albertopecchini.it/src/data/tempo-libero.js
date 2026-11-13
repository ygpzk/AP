// /studio/, l’ultima sezione: le domande personali.
//
// Le risposte le scrive Alberto nel documento «Studio — tempo libero e FAQ
// personali (da compilare)» e si copiano qui così come sono. Una risposta vuota
// non compare; un gruppo tutto vuoto sparisce, e con lui la sezione. Finché ne
// mancano, la build le conta tra i segnaposto (vedi `tempoLiberoTodo`).
//
// Le domande personali, nell'ordine del documento. Si pubblicano solo le risposte scritte.
export const faqPersonali = {
  label: 'Domande personali',
  title: 'Quello che sanno gli amici',
  lead: 'Il lato che conoscono amici e parenti, in poche risposte.',
  gruppi: [
    {
      nome: 'Serie TV',
      voci: [
        { q: 'Oltre a Better Call Saul, cosa guardi?', a: '' },
        { q: 'La serie che consigli sempre?', a: '' },
        { q: 'Una puntata alla volta o tutta di fila?', a: '' },
        { q: 'E i film?', a: '' },
        { q: 'Quella che piace a tutti tranne a te?', a: '' },
      ],
    },
    {
      nome: 'Natura e animali',
      voci: [
        { q: 'Chi sono la chiocciola e la tartaruga?', a: '' },
        { q: 'Dove vai quando vuoi stare all’aperto?', a: '' },
        { q: 'Cosa fai all’aria aperta?', a: '' },
        { q: 'La stagione che preferisci?', a: '' },
        { q: 'Fotografi quello che vedi?', a: '' },
      ],
    },
    {
      nome: 'Veicoli',
      voci: [
        { q: 'Cosa guidi?', a: '' },
        { q: 'Le metti le mani sopra?', a: '' },
        { q: 'Il veicolo dei sogni?', a: '' },
        { q: 'Un giro che ricordi?', a: '' },
      ],
    },
    {
      nome: 'Vacanze',
      voci: [
        { q: 'Mare, montagna o città?', a: '' },
        { q: 'Il posto più bello dove sei stato?', a: '' },
        { q: 'Tutto organizzato o all’avventura?', a: '' },
        { q: 'Il prossimo posto che vuoi vedere?', a: '' },
      ],
    },
    {
      nome: 'Amici',
      voci: [
        { q: 'Cosa fate quando vi trovate?', a: '' },
        { q: 'Cosa ti chiedono sempre?', a: '' },
        { q: 'Come ti descriverebbero in tre parole?', a: '' },
        { q: 'Il tuo ruolo nel gruppo?', a: '' },
      ],
    },
  ],
}

const vuote = (voci) => voci.filter((v) => !v.a.trim()).length

/** Per la build: quante risposte mancano ancora (elenco dei segnaposto). */
export function tempoLiberoTodo() {
  const todo = []
  const faq = faqPersonali.gruppi.reduce((n, g) => n + vuote(g.voci), 0)
  if (faq) todo.push(`/studio/ · domande personali: ${faq} risposte da compilare (src/data/tempo-libero.js)`)
  return todo
}
