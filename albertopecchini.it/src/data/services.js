// Servizi, organizzati in quattro macroaree. Ogni servizio ha una descrizione breve
// e ciò che viene consegnato (`output`), così il cliente sa cosa riceve.
//
// `footer`: le voci richiamate nel footer di ogni pagina. È una scelta esplicita,
// non le prime della lista: in vetrina vanno le competenze più solide, mentre
// le altre restano consultabili nella pagina Servizi.

export const serviceAreas = [
  {
    key: 'tecnico',
    letter: 'A',
    title: 'Tecnico',
    lead: 'Rilievi, disegni e pratiche.',
    footer: ['Rilievi', 'CAD', 'Modellazione 3D'],
    intro:
      'Rilievi e disegni tecnici, pratiche edilizie e catastali. Uso gli strumenti di oggi, ma il risultato deve essere quello di sempre: quote giuste e pratiche che passano.',
    art: { art: 'floorplan', variant: 'casa', bare: true, tone: 'tint', alt: 'Pianta architettonica al tratto' },
    portfolio: '/portfolio/tecnico/',
    services: [
      { title: 'Progettazione', text: 'Case, ampliamenti, ristrutturazioni e cambi d’uso. Parto da uno schema di distribuzione, poi arrivano le tavole esecutive.', output: 'Tavole di progetto e relazione tecnica' },
      { title: 'Rilievi', text: 'Rilievo topografico e architettonico con stazione totale, GNSS, laser scanner e drone. Tutto nello stesso sistema di riferimento, con l’errore dichiarato.', output: 'Nuvola di punti, restituzione CAD, ortofoto' },
      { title: 'CAD', text: 'Ridisegno tavole, digitalizzo disegni su carta, preparo elaborati per imprese e studi che hanno bisogno di un disegnatore.', output: 'DWG in layer ordinati, PDF in scala' },
      { title: 'Catasto', text: 'Tipi mappali e di frazionamento, accatastamenti, variazioni, volture e visure. Seguo la pratica Pregeo o Docfa fino all’approvazione.', output: 'Atti di aggiornamento approvati' },
      { title: 'Pratiche edilizie', text: 'CILA, SCIA, permesso di costruire, sanatorie e agibilità. Controllo la conformità all’inizio, non quando il Comune la contesta.', output: 'Pratica completa e protocollo' },
      { title: 'Modellazione 3D', text: 'Modelli di edifici, strutture in legno e dettagli costruttivi. Servono a decidere e a farsi capire da chi costruisce.', output: 'Modello 3D, viste e assonometrie' },
      { title: 'BIM', text: 'Modelli da cui tirare fuori piante, sezioni, abachi e quantità senza rifare i conti ogni volta. Il livello di dettaglio lo decido in base a cosa serve.', output: 'Modello IFC, abachi e computi' },
      { title: 'Rendering', text: 'Viste realistiche per presentare, viste neutre per scegliere. Ti dico quale delle due serve, invece di farle tutte e due.', output: 'Immagini ad alta risoluzione' },
    ],
  },
  {
    key: 'digitale',
    letter: 'B',
    title: 'Digitale',
    lead: 'Siti web, scritti a mano.',
    footer: ['Siti web', 'Landing page', 'Sviluppo frontend'],
    intro:
      'Progetto e sviluppo siti senza temi pronti. Prima capisco cosa deve dire il sito e a chi, poi decido come farlo. Il codice lo scrivo io.',
    art: { art: 'webpage', site: 'kinesi', device: 'desktop', tall: false, alt: 'Pagina principale di un sito web' },
    portfolio: '/portfolio/web/',
    services: [
      { title: 'Siti web', text: 'Siti per professionisti, aziende e attività del territorio. Struttura chiara, testi veri, pagine che si aprono in fretta.', output: 'Sito online, dominio e hosting configurati' },
      { title: 'Landing page', text: 'Una pagina con un obiettivo solo: un contatto, un’iscrizione, una vendita. Si misura da subito.', output: 'Pagina pubblicata e modulo collegato' },
      { title: 'UI/UX', text: 'Struttura dell’informazione, wireframe e prototipi navigabili in Figma. Prima di scrivere codice, provo il percorso con qualcuno.', output: 'Prototipo e design system' },
      { title: 'Sviluppo frontend', text: 'HTML semantico, CSS e JavaScript, oppure React e Next.js quando servono davvero. Le animazioni ci sono solo se hanno un motivo.', output: 'Codice versionato su Git' },
      { title: 'Responsive', text: 'Il telefono non è il desktop rimpicciolito. La versione mobile la progetto a parte, pensando al pollice.', output: 'Layout provati da 320 a 1920 px' },
      { title: 'Manutenzione', text: 'Aggiornamenti, correzioni, contenuti nuovi e backup. Risponde chi ha costruito il sito, non un call center.', output: 'Interventi entro 2 giorni lavorativi' },
      { title: 'Ottimizzazione', text: 'Velocità, accessibilità e SEO tecnica dei siti che ci sono già: immagini, font, markup, dati strutturati. Misuro prima e dopo con Lighthouse.', output: 'Report prima/dopo e interventi fatti' },
    ],
  },
  {
    key: 'grafica',
    letter: 'C',
    title: 'Grafica',
    lead: 'Loghi e stampati.',
    footer: ['Logo', 'Branding', 'Materiale aziendale'],
    intro:
      'Loghi disegnati sulla griglia, manuali brevi e stampati che arrivano in tipografia già a posto. Se un logo non funziona in bianco e nero, non funziona.',
    art: { art: 'brandmark', brand: 'tavolato', construction: true, alt: 'Costruzione geometrica di un marchio' },
    // Nessun rimando al portfolio: l'area Grafica è nascosta finché non c'è un
    // lavoro reale (`hidden` su allAreas.grafica). Il servizio resta offerto.
    portfolio: null,
    services: [
      { title: 'Logo', text: 'Marchio e logotipo disegnati su griglia, con versione positiva, negativa e a un colore, dimensione minima e area di rispetto.', output: 'File vettoriali e scheda d’uso' },
      { title: 'Branding', text: 'Palette, caratteri, tono di voce e applicazioni. Raccolgo tutto in un manuale breve, scritto per chi lo userà davvero.', output: 'Manuale d’identità e libreria file' },
      { title: 'Brochure', text: 'Pieghevoli, cataloghi e profili aziendali. Impagino su griglia, tratto le immagini allo stesso modo, consegno file pronti per la stampa.', output: 'PDF/X per la tipografia' },
      { title: 'Social', text: 'Modelli per post, storie e copertine che puoi aggiornare da solo, senza perdere coerenza dopo tre settimane.', output: 'Kit di modelli modificabili' },
      { title: 'Locandine', text: 'Manifesti e locandine per eventi, aperture e iniziative. Devono leggersi da lontano e capirsi subito.', output: 'File di stampa e versioni digitali' },
      { title: 'Materiale aziendale', text: 'Biglietti da visita, carta intestata, buste, insegne, targhe, modelli Word e PowerPoint, cartigli per le tavole.', output: 'File di stampa e modelli Office' },
    ],
  },
  {
    key: 'informatica',
    letter: 'D',
    title: 'Informatica',
    lead: 'Computer da sistemare.',
    footer: ['Pulizia da virus', 'Windows', 'Backup e recupero dati'],
    intro:
      'Assistenza per privati, famiglie e piccoli uffici. Prima di toccare il sistema copio i dati. Alla fine ti dico cosa ho trovato e cosa ho cambiato.',
    art: { src: '/media/servizi/informatica/copertina.webp', width: 1920, height: 1280, alt: 'Illustrazione in assonometria di un piccolo studio in ordine: una persona alla scrivania con monitor e portatile, accanto il computer fisso aperto e il suo pannello laterale in minio appoggiato alla gamba del tavolo; sul mobile basso la stampante, il router, il disco esterno e i raccoglitori' },
    portfolio: null,
    // Al posto del portfolio, la pagina dell'area: versioni di Windows e Office,
    // come si svolge un intervento, domande frequenti (src/data/informatica.js).
    page: { href: '/servizi/informatica/', label: 'L’assistenza informatica nel dettaglio' },
    // `group` raggruppa i servizi nella pagina dell'area (gruppi in src/data/informatica.js).
    services: [
      { group: 'sicurezza', title: 'Pulizia da virus', text: 'Virus, malware, pubblicità che si apre da sola, estensioni mai installate, programmi che partono all’avvio. Li tolgo, controllo che non tornino e lascio una protezione configurata, senza abbonamenti inutili.', output: 'Computer pulito ed elenco di cosa ho rimosso' },
      { group: 'sicurezza', title: 'Aggiornamento hardware', text: 'SSD al posto del disco meccanico, più RAM, pulizia dalla polvere e pasta termica nuova. Un computer di qualche anno torna veloce e silenzioso.', output: 'Computer più veloce e pezzi vecchi restituiti' },
      { group: 'sicurezza', title: 'Posta e account', text: 'Email su computer e telefono, accessi da recuperare, verifica in due passaggi e un gestore di password al posto del foglietto sotto la tastiera.', output: 'Accessi in ordine e codici di recupero' },
      { group: 'file', title: 'File doppioni', text: 'La stessa foto salvata quattro volte, «Copia di copia di». Confronto il contenuto, non il nome, e cancello solo quello che approvi.', output: 'Spazio liberato ed elenco dei doppioni' },
      { group: 'file', title: 'Riordino cartelle', text: 'Desktop pieno, Download che trabocca, foto sparse tra computer, chiavette e telefono. Metto su una struttura semplice, con nomi che si capiscono.', output: 'Archivio ordinato e schema delle cartelle' },
      { group: 'file', title: 'Backup e recupero dati', text: 'Copie automatiche su disco esterno o cloud, prima che servano. E se è tardi, recupero i file cancellati da dischi, chiavette e schede SD, finché il supporto risponde.', output: 'Backup configurato e file recuperati' },
      { group: 'file', title: 'Impaginazione documenti', text: 'Tesi, relazioni, curriculum, regolamenti, menù. Stili, indice automatico, numeri di pagina, immagini che restano dove devono.', output: 'Word e PDF, con modello riutilizzabile' },
      { group: 'file', title: 'Conversione di formati', text: 'DOC, DOCX, ODT, Pages, PDF, immagini, audio e video. PDF da rendere modificabili, scansioni da rendere ricercabili, file vecchi che nessun programma apre più.', output: 'File nel formato che serve' },
      { group: 'periferiche', title: 'Stampanti e scanner', text: 'La stampante che non stampa, la coda bloccata, lo scanner che non vede il computer, la Wi-Fi che sparisce. Installo, aggiorno i driver e collego tutto.', output: 'Pagina di prova e scansione verificata' },
      { group: 'periferiche', title: 'Audio e periferiche', text: 'Casse mute, microfono che gracchia, cuffie Bluetooth che non si collegano, webcam non riconosciuta. Capisco se è un’impostazione, un driver o il cavo.', output: 'Audio, microfono e webcam provati' },
      { group: 'periferiche', title: 'Driver', text: 'Scheda video, audio, rete, chipset: i driver li prendo dal produttore, non dai programmi che promettono di aggiornare tutto. Se un aggiornamento rompe qualcosa, torno indietro.', output: 'Driver aggiornati e punto di ripristino' },
      { group: 'periferiche', title: 'Rete e Wi-Fi', text: 'Router, ripetitori, stanze senza segnale, stampanti e dischi condivisi, la password del Wi-Fi che nessuno ricorda.', output: 'Rete funzionante e credenziali annotate' },
      { group: 'sistemi', title: 'Windows', text: 'Installazione pulita, aggiornamento e riparazione di Windows 11 e 10, delle edizioni LTSC, ARM64 e Server, e delle versioni più vecchie fino a XP per i computer che devono restare com’erano.', output: 'Sistema installato e aggiornato, dati al loro posto' },
      { group: 'sistemi', title: 'Microsoft Office', text: 'Microsoft 365 e Office dal 2010 al 2024, anche su Mac. Installo solo i programmi che usi e collego Outlook alla tua posta.', output: 'Office attivato con la tua licenza e posta configurata' },
      { group: 'sistemi', title: 'Ripristino del sistema', text: 'Il computer torna come il primo giorno senza perdere foto, documenti e posta: copio i dati, ripristino, rimetto programmi e stampante.', output: 'Sistema ripristinato e copia dei dati' },
      { group: 'sistemi', title: 'Cambio di sistema operativo', text: 'Da Windows 10 a 11, da Windows a Linux, su un disco nuovo. Prima controllo che programmi e periferiche funzionino, poi sposto dati, impostazioni e posta.', output: 'Nuovo sistema, dati e programmi trasferiti' },
      { group: 'sistemi', title: 'Computer nuovo', text: 'Configurazione, via i programmi di prova, trasferisco file, posta, preferiti e stampante dal vecchio. Il vecchio lo cancello in modo sicuro.', output: 'Computer pronto e dati trasferiti' },
    ],
  },
]

// Pacchetti trasversali: il motivo per cui i quattro mestieri stanno nello stesso studio.
export const bundles = [
  {
    code: 'A + C',
    title: 'Immobile pronto per la vendita',
    text: 'Rilievo, planimetrie arredate, controllo catastale e una scheda grafica dell’immobile. Chi vende ha i documenti in ordine, chi compra capisce cosa sta guardando.',
    parts: ['Rilievo', 'Planimetrie', 'Catasto', 'Scheda immobile'],
  },
  {
    code: 'B + C',
    title: 'Logo e sito nascono insieme',
    text: 'Marchio, colori e caratteri pensati già per lo schermo. Così il sito non deve adattare un logo disegnato per un biglietto da visita.',
    parts: ['Logo', 'Sistema visivo', 'Sito web', 'Materiale aziendale'],
  },
  {
    code: 'A + B',
    title: 'Il cantiere si segue online',
    text: 'Una pagina riservata per il committente con tavole, modello 3D navigabile, stato della pratica e avanzamento dei lavori. Basta allegati persi tra le email.',
    parts: ['Modello 3D', 'Tavole', 'Area riservata', 'Aggiornamenti'],
  },
  {
    code: 'B + D',
    title: 'Sito e computer dell’ufficio',
    text: 'Chi ha fatto il sito configura anche la posta sul dominio, la stampante di rete e i backup. Se qualcosa non va, non rimbalzi tra due tecnici.',
    parts: ['Sito web', 'Posta sul dominio', 'Rete e stampanti', 'Backup'],
  },
]

export const faq = [
  {
    q: 'Lavori anche da remoto?',
    a: 'Per rilievi, cantieri e pratiche devo esserci. Siti e grafica li seguo da remoto in tutta Italia, con videochiamate quando serve.',
  },
  {
    q: 'Come calcoli il preventivo?',
    a: 'Dopo un primo colloquio gratuito ti mando un preventivo scritto, con le voci separate: cosa faccio, cosa consegno, in quanto tempo e quanto costa. Se durante il lavoro serve qualcosa in più, te lo dico prima di farlo.',
  },
  {
    q: 'Posso affidarti solo una parte del lavoro?',
    a: 'Sì. Lavoro spesso con studi e imprese che hanno bisogno solo del rilievo, solo della restituzione CAD, solo del frontend o solo del marchio.',
  },
  {
    q: 'Di chi sono i file a lavoro concluso?',
    a: 'Tuoi. Consegno sempre i sorgenti: DWG, modelli, file vettoriali, repository del codice. Non uso formati o piattaforme che ti obbligano a passare da me.',
  },
  {
    q: 'Chi gestisce dominio e hosting del sito?',
    a: 'Li intesto a te e li configuro io. Se vuoi gestirli da solo ti lascio una guida di due pagine; altrimenti possiamo fare un contratto di manutenzione annuale.',
  },
]
