// Metodo di lavoro: sette fasi, identiche per un rilievo, un sito o un marchio.
// `gon` è la lettura del cerchio graduato nella pagina Metodo (400 gon = giro completo).

export const methodIntro = {
  title: 'Come lavoro, passo per passo',
  lead: 'Che sia un rilievo, un sito o un marchio, il percorso è lo stesso: prima ascolto e misuro, poi progetto, poi realizzo. Alla fine resto a disposizione.',
}

export const steps = [
  {
    n: '01',
    key: 'ascolto',
    title: 'Ascolto',
    text: 'Ci vediamo o ci sentiamo, e mi racconti cosa ti serve. A volte la richiesta iniziale («mi serve un sito», «devo fare una pratica») nasconde un problema diverso, magari più semplice o più urgente. Serve capirlo subito.',
    output: 'Verbale dell’incontro con obiettivi, vincoli e domande aperte',
    time: '1 incontro',
    gon: 0,
  },
  {
    n: '02',
    key: 'analisi',
    title: 'Analisi',
    text: 'Sopralluogo, rilievo, visure, concorrenti, dati che ci sono già. È la parte che il cliente non vede, ma è quella che decide se il resto viene bene: se misuro male, disegno male.',
    output: 'Stato di fatto documentato e preventivo dettagliato',
    time: '2 — 7 giorni',
    gon: 57,
  },
  {
    n: '03',
    key: 'progettazione',
    title: 'Progettazione',
    text: 'Ti presento due o tre ipotesi, non una sola. Planimetrie arredate, wireframe o bozzetti: meglio cambiare idea sulla carta, quando costa poco.',
    output: 'Ipotesi a confronto e soluzione scelta insieme',
    time: '1 — 3 settimane',
    gon: 114,
  },
  {
    n: '04',
    key: 'sviluppo',
    title: 'Sviluppo',
    text: 'L’ipotesi scelta diventa il lavoro vero: tavole e pratica, codice e testi, file vettoriali e stampa. Ti aggiorno a scadenze fisse, non quando capita.',
    output: 'Elaborati esecutivi e versione di prova',
    time: '2 — 6 settimane',
    gon: 171,
  },
  {
    n: '05',
    key: 'revisione',
    title: 'Revisione',
    text: 'Rivediamo tutto con una lista scritta. Due giri di correzioni sono compresi nel preventivo; di solito bastano, se l’analisi è stata fatta bene.',
    output: 'Lista di controllo condivisa e correzioni fatte',
    time: '3 — 5 giorni',
    gon: 229,
  },
  {
    n: '06',
    key: 'consegna',
    title: 'Consegna',
    text: 'Deposito la pratica, metto online il sito, mando i file in tipografia. Con il lavoro finito consegno sempre i sorgenti e un foglio che spiega come sono organizzati.',
    output: 'Lavoro finito, sorgenti e nota di consegna',
    time: '1 — 2 giorni',
    gon: 286,
  },
  {
    n: '07',
    key: 'assistenza',
    title: 'Assistenza',
    text: 'Resto raggiungibile. Un’integrazione chiesta dal Comune, un testo da cambiare sul sito, un formato del logo che manca: i primi trenta giorni sono inclusi.',
    output: '30 giorni inclusi, poi manutenzione su richiesta',
    time: 'Continuativa',
    gon: 343,
  },
]

export const principles = [
  { title: 'Il preventivo è scritto', text: 'Sai cosa paghi e cosa puoi togliere, voce per voce.' },
  { title: 'Le scadenze le decidiamo prima', text: 'Se una slitta, lo vieni a sapere subito.' },
  { title: 'Parli sempre con me', text: 'Non c’è un ufficio a cui rimandarti: il lavoro lo faccio io.' },
  { title: 'I file sono tuoi', text: 'Alla fine ti lascio tutto, nei formati che servono.' },
]
