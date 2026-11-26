// Studio / Chi sono: biografia breve, fatti, timeline, approccio, valori, strumenti.
// I contenuti biografici derivano dal curriculum dell'autore: verificarli e aggiornarli.

export const bio = {
  headline: 'Faccio rilievi, siti e grafica. Spesso nello stesso giorno.',
  paragraphs: [
    'Mi chiamo Alberto Pecchini. Ho fatto il geometra all’I.T.T. «Carlo d’Arco», poi tre anni nell’ufficio tecnico di un’azienda che costruisce strutture in legno. Adesso studio Costruzioni e gestione del territorio a Modena, con il doppio titolo a San Marino.',
    'I siti web li ho imparati da solo, prima per curiosità e poi perché qualcuno ha cominciato a pagarmi. La grafica è arrivata di conseguenza: ogni tavola e ogni pagina hanno bisogno di qualcuno che decida dove mettere le cose.',
    'Non li considero tre lavori separati. Cambia il materiale, ma il modo di lavorare è lo stesso: prima capisco, poi misuro, poi faccio. E alla fine consegno qualcosa che si capisca anche senza di me.',
  ],
}

// Fotografie reali in public/media/studio/. Dal 12.11.2026 ritratto e avatar vengono
// dal selfie allo specchio in bianco e nero (mirror, qui sotto), non più dalla
// fototessera (Alberto: «togli anche la foto e metti quella b&w nuova»): il ritratto
// è specchio-1600 portato a 1000 di larghezza e appoggiato in fondo a un 1000×1250
// trasparente, così sopra la testa resta il margine per la parallasse (7%); l'avatar
// è il quadrato del volto (740 px da x 140, y 30) ridotto a 192. La fototessera resta
// nel repository ma non va online (VIA in tools/privacy.mjs).
export const photos = {
  portrait: { src: '/media/studio/ritratto-bn.webp', width: 1000, height: 1250, alt: 'Alberto Pecchini si fa un selfie allo specchio, in bianco e nero', caption: 'FIG. 01 — Ritratto' },
  // Il volto dello stesso selfie, in un quadrato, per il saluto in cima alla home.
  avatar: { src: '/media/studio/ritratto-bn-avatar.webp', width: 192, height: 192, alt: '' },
  // Scontornate (fondo trasparente). Le misure sono della versione grande; `small`
  // è la variante per i telefoni.
  // Il selfie allo specchio, in bianco e nero: in /studio/ esce dal riquadro scuro
  // sotto «Prima per curiosità, poi per mestiere». Foto del 10.11.2026 (6048×8064),
  // ritagliata dalla cima dei capelli a sotto la bandiera e scontornata con
  // tools/scontorna.mjs; testa e mano rifatte su ritagli stretti per avere la
  // maschera a piena risoluzione, il telefono ripulito dalle staffe del muro.
  mirror: {
    src: '/media/studio/specchio-1600.webp',
    small: '/media/studio/specchio-900.webp',
    width: 1600,
    height: 1735,
    alt: 'Alberto Pecchini si fa un selfie allo specchio, in bianco e nero, con una felpa nera con la scritta Scotland',
  },
  // Il manifesto della home. Fino al 12.11.2026 era la foto a colori con l'iPhone bianco
  // (curioso-1600, resta nel repository ma non va online: VIA in tools/privacy.mjs); ora è lo
  // stesso selfie in bianco e nero, tagliato al petto nello stesso formato (1600×1130).
  curious: {
    src: '/media/studio/ritratto-bn-banner-1600.webp',
    small: '/media/studio/ritratto-bn-banner-900.webp',
    width: 1600,
    height: 1130,
    alt: 'Alberto Pecchini si fa un selfie allo specchio, in bianco e nero',
  },
}

export const facts = [
  { label: 'Base', value: 'Italia' },
  { label: 'Attivo dal', value: '2023' },
  { label: 'Formazione', value: 'Diploma CAT, laurea in corso' },
  { label: 'Lingue', value: 'Italiano, inglese C1 (IELTS)' },
  { label: 'Lavoro', value: 'In sede e da remoto' },
]

export const timeline = [
  { year: '2021', title: 'I.T.T. «Carlo d’Arco»', text: 'Inizio Costruzioni, Ambiente e Territorio: disegno tecnico, topografia, estimo, gestione del cantiere.', tag: 'Formazione' },
  { year: '2023', title: 'Ufficio tecnico, reparto legno', text: 'Primo dei tre PCTO in Caem Group: modellazione 3D di tettoie, preventivi, archivio tecnico. Strutture in lamellare e X-LAM.', tag: 'Tecnico' },
  { year: '2024', title: 'Dublino, inglese C1', text: 'Corso intensivo al CES di Dublino e certificazione IELTS. La documentazione tecnica e i manuali di sviluppo sono in inglese: meglio leggerli bene.', tag: 'Formazione' },
  { year: '2026', title: 'Primi siti per clienti', text: 'Online il sito dello studio dell’ing. Dario Donelli; in proprio, quello di Cascina Fontana, l’azienda agricola di famiglia. React, Vite, TypeScript, JavaScript vanilla.', tag: 'Web' },
  { year: '2026', title: 'Diploma CAT', text: 'Diploma di Costruzioni, Ambiente e Territorio, dopo cinque anni di AutoCAD, rilievi ed estimo.', tag: 'Tecnico' },
  { year: '2026', title: 'Università di Modena e Reggio Emilia', text: 'Mi iscrivo a Costruzioni e gestione del territorio, Dipartimento di Ingegneria «Enzo Ferrari».', tag: 'Formazione' },
  { year: '2026', title: 'Collaborazione con Gabriele Lucia', text: 'Al dipartimento conosco Gabriele Lucia, che studia Ingegneria Informatica: sviluppatore e grafico come me, con lui collaboro su progetti web.', tag: 'Web' },
  // 11.11.2026: certificato di iscrizione UNIRSM e piano di studi approvato (programma di mobilità studenti UNIMORE)
  { year: '2026', title: 'Doppio titolo con l’Università di San Marino', text: 'Iscrizione all’Università di San Marino nel programma a doppio titolo: Analisi matematica e geometria, Fisica e Disegno sono nel piano di studi di entrambi gli atenei.', tag: 'Formazione' },
]

export const approach = [
  { n: '01', title: 'Prima di disegnare, misuro', text: 'Che sia un edificio, un sito o un logo, prima raccolgo i dati. Senza misura si progetta a caso.' },
  { n: '02', title: 'Pochi lavori, seguiti fino in fondo', text: 'Preferisco dire di no a un incarico che tenere aperte le pratiche di tutti. Chi mi scrive parla con me, non con un assistente.' },
  { n: '03', title: 'Consegno file che si aprono', text: 'Layer nominati, codice commentato, istruzioni di una pagina. Se dopo un anno devi cambiare qualcosa senza di me, devi poterlo fare.' },
]

export const values = [
  { title: 'Gli errori si dichiarano', text: 'Ogni misura ha un margine, ogni preventivo un imprevisto, ogni sito un limite. Meglio dirlo prima che scoprirlo dopo.' },
  { title: 'Se non serve, si toglie', text: 'Una linea in più su una tavola, un’animazione in più su un sito, un colore in più in un marchio: se non hanno un motivo, non ci devono stare.' },
  { title: 'Le date si rispettano', text: 'Concordiamo le scadenze all’inizio. Se qualcosa va storto te lo dico subito, non alla scadenza.' },
  { title: 'Formati che non ti chiudono in gabbia', text: 'Consegno i sorgenti e uso formati standard. Se un giorno vuoi cambiare fornitore, il lavoro te lo porti dietro.' },
]

// 26.11.2026: la stessa lista, con gli stessi nomi, della scheda «Strumenti» di
// pzkko.it (public/assets/config.js): le due pagine sono la stessa persona e non
// possono raccontare due cassette degli attrezzi diverse. Se cambia una voce,
// cambia in tutte e due.
//
// Qui i 42 strumenti stanno in sei gruppi da 4-10 voci, così la griglia a tre
// colonne resta piena anche sotto (con tre gruppi la colonna Web faceva 27 righe
// e le altre due restavano vuote). `fig` è la figurina già ritagliata: i nomi
// nuovi non avrebbero un disegno in public/media/figurine/.
export const tools = [
  {
    group: 'Web',
    fig: 'strumenti-web',
    items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Astro', 'Svelte', 'Tailwind CSS', 'GSAP'],
  },
  {
    group: 'Runtime e linguaggi',
    fig: 'computer-codice',
    items: ['Node.js', 'Bun', 'Vite', 'C#', 'Rust', 'Python', 'PowerShell'],
  },
  {
    group: '3D e calcolo',
    fig: 'tecnico-modellazione-3d',
    items: ['three.js', 'Babylon.js', 'WebGPU', 'WebAssembly'],
  },
  {
    group: 'AI e infrastruttura',
    fig: 'computer-stack',
    items: ['Claude Code', 'Ollama', 'Docker', 'PostgreSQL', 'Vercel', 'Git'],
  },
  {
    group: 'Tecnica e disegno',
    fig: 'strumenti-rilievo-e-disegno',
    items: ['AutoCAD', 'cadwork', 'Archicad', 'QGIS', 'CloudCompare', 'Agisoft Metashape', 'Pregeo e Docfa', 'Blender', 'Figma'],
  },
  {
    group: 'Grafica e media',
    fig: 'strumenti-grafica',
    items: ['Illustrator', 'InDesign', 'Photoshop', 'DaVinci Resolve', 'FFmpeg', 'OBS Studio'],
  },
]

// Curriculum sintetico per la pagina /studio/profilo/
// `detail` (facoltativo) elenca le voci puntate sotto la riga: cosa è stato
// fatto davvero nell'incarico. Senza `detail` la voce resta su una riga sola.
export const profile = {
  summary:
    'Diplomato in Costruzioni, Ambiente e Territorio e studente di Costruzioni e gestione del territorio all’Università di Modena e Reggio Emilia, con doppio titolo a San Marino. Ho la formazione tecnica di chi progetta, rileva e disegna, e in più sviluppo siti e mi occupo di grafica. Rilievo, disegno e metto online senza passare il lavoro a qualcun altro.',
  education: [
    {
      period: '2026 — oggi',
      title: 'Università di Modena e Reggio Emilia',
      role: 'Corso di laurea in Costruzioni e gestione del territorio, Dip. di Ingegneria «Enzo Ferrari»',
      detail: [
        'Laurea professionalizzante, classe L-P01: Professioni tecniche per l’edilizia e il territorio.',
        'Primo anno: Analisi matematica e geometria, Fisica, Disegno, Topografia, Elementi di diritto privato e agrario, Inglese; laboratori di Informatica e statistica, di Chimica e materiali da costruzione, di Topografia.',
      ],
    },
    {
      period: '2026 — oggi',
      title: 'Università degli Studi della Repubblica di San Marino',
      role: 'Doppio titolo UNIMORE-UNIRSM, Costruzioni e gestione del territorio, Dip. di Economia, Scienze, Ingegneria e Design',
      detail: ['Dall’11 novembre 2026 nel programma di mobilità per gli studenti UNIMORE: Analisi matematica e geometria, Fisica e Disegno nel piano di studi.'],
    },
    {
      period: '2021 — 2026',
      title: 'I.T.T. «Carlo d’Arco»',
      role: 'Diploma di Costruzioni, Ambiente e Territorio',
      detail: [
        'Disegno tecnico e progettazione architettonica in AutoCAD, dal rilievo alle tavole esecutive.',
        'Topografia e rilievo strumentale con stazione totale, livello e GPS; restituzione e calcolo delle poligonali.',
        'Estimo, costruzioni, gestione del cantiere e sicurezza; tre percorsi PCTO in ufficio tecnico.',
      ],
    },
    {
      period: 'ago 2024',
      title: 'Centre of English Studies, Dublino',
      role: 'General English Intensive, livello in uscita Advanced C1',
      detail: ['Grammatica e struttura, sviluppo lessicale, comunicazione e consapevolezza linguistica; scuola riconosciuta ACELS, accreditata Eaquals e IALC.'],
    },
    {
      period: 'dic 2023',
      title: 'Formazione generale e specifica dei lavoratori — rischio basso',
      role: 'ForMa Formazione, 4 ore, e-learning',
      detail: ['Accordo Stato-Regioni 21 dicembre 2011, art. 37 D.lgs. 81/08: rischio elettrico, cadute dall’alto, microclima e illuminazione, videoterminali, organizzazione del lavoro, primo soccorso, antincendio ed esodo.'],
    },
  ],
  experience: [
    {
      period: '2023 — 2026',
      title: 'Caem Group S.p.A.',
      role: 'Ufficio tecnico, reparto strutture in legno — tre percorsi PCTO',
      detail: [
        'Modellazione 3D di tettoie e coperture in lamellare e X-LAM con AutoCAD e cadwork.',
        'Computi e supporto alla preventivazione: estrazione delle quantità dai modelli e verifica degli abachi.',
        'Riordino dell’archivio tecnico e delle tavole di commessa, con criteri di denominazione dei file.',
      ],
    },
    {
      period: '2026',
      title: 'Ing. Dario Donelli — sito dello studio tecnico',
      // 10.11.2026: il sito è diventato l'archivio dei lavori dello studio (repository dariodonelli-)
      role: 'Progetto, design e sviluppo. React, Vite, PDF.js',
      detail: [
        'Sito in bianco e nero costruito sulla targa dello studio: in apertura nome, recapiti e un carosello di undici lavori.',
        'Archivio di 34 lavori dal 2010 nelle tre categorie dello studio, ognuno con la sua pagina, le tavole PDF originali e le fotografie.',
        'Dati personali sfumati dentro i PDF e nelle foto, metadati rimossi; online sul dominio dello studio, dariodonelli.com.',
      ],
    },
    // 12.11.2026: tolto l'atlante digitale del paese (dice dove abito); il progetto è nascosto anche
    // dal portfolio (NASCOSTI in projects.js)
    {
      period: '2026',
      title: 'Cascina Fontana — sito dell’azienda agricola di famiglia',
      role: 'Contenuti, fotografia, design e sviluppo. Vite, HTML, CSS, JavaScript',
      detail: [
        'Cinque pagine in HTML, CSS e JavaScript vanilla, senza dipendenze a runtime né cookie.',
        'Testi scritti con mio padre, fotografie mie; sei produzioni con il calendario dei dodici mesi.',
        'Rifatto a settembre 2026 al posto di un’applicazione React in quattro lingue.',
      ],
    },
    {
      period: '2019 — oggi',
      title: 'Fotografia commerciale e vendita online',
      role: 'In proprio, fotografia di prodotto, schede e assistenza clienti',
      detail: ['Set, scatto e post-produzione dei prodotti; redazione delle schede, gestione degli ordini e rapporto diretto con l’acquirente.'],
    },
  ],
  skills: [
    { group: 'Area tecnica', items: ['AutoCAD 2D/3D', 'cadwork', 'Archicad', 'Topografia e rilievo strumentale', 'Estimo', 'Disegno tecnico', 'Pratiche edilizie e catastali', 'QGIS', 'Excel avanzato'] },
    { group: 'Sviluppo web', items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Astro', 'Tailwind CSS', 'GSAP', 'Accessibilità e performance', 'SEO tecnica', 'Git', 'Vite', 'Vercel'] },
    { group: 'Design', items: ['UI/UX', 'Figma', 'Design system', 'Identità visiva', 'Impaginazione', 'Motion', 'Illustrator, InDesign, Photoshop', 'Fotografia di prodotto'] },
    { group: 'Informatica', items: ['Windows da XP a 11, LTSC, ARM64, Server', 'Microsoft 365 e Office (Click-to-Run, ODT, MSI)', 'Office per Mac', 'Linux', 'Rimozione malware', 'Driver e periferiche', 'Backup e recupero dati', 'Reti domestiche', 'Aggiornamento hardware', 'Impaginazione e conversione di documenti'] },
  ],
  languages: [
    { name: 'Italiano', level: 'Madrelingua' },
    { name: 'Inglese', level: 'C1, CES Dublino 2024' },
  ],
  certifications: [
    { title: 'English Advanced C1', issuer: 'Centre of English Studies, Dublino', year: '2024' },
    { title: 'Sicurezza dei lavoratori, rischio basso, 4 ore', issuer: 'ForMa Formazione', year: '2023' },
  ],
  extra: ['Patente A1 e B, automunito', 'Disponibile a trasferte', 'Volontariato educativo 2024 - 2025'],
}
