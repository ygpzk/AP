// ─────────────────────────────────────────────────────────────────────────────
//  SICUREZZA — /sicurezza/
//  Tre rischi (bot e phishing, attacchi DDoS, recupero dati): come si
//  riconoscono e cosa faccio io per i clienti. Poi le protezioni già attive su
//  questo sito, i limiti che restano e le domande frequenti.
//
//  Le tre tavole sono generate da src/art/sicurezza.js (`art: 'sicurezza'`,
//  varianti `phishing`, `ddos`, `recupero`), come le altre illustrazioni del
//  sito: SVG in linea, animazioni CSS, nessun file da scaricare.
//
//  Regole dei testi (26.11.2026): si parla al cliente, non agli addetti ai
//  lavori; si scrive solo quello che è vero e verificabile; niente promesse al
//  100%. Le protezioni di `applied` sono controllate su vercel.json e
//  api/contatti.js: se cambiano lì, cambiano qui.
// ─────────────────────────────────────────────────────────────────────────────

export const sicurezza = {
  path: '/sicurezza/',
  title: 'Sicurezza — phishing, attacchi DDoS e recupero dati',
  description:
    'Come riconoscere una truffa, reggere un attacco e riavere i dati: cosa faccio per i siti, i computer e gli account dei miei clienti, con le protezioni già attive su questo sito e i limiti scritti.',

  head: {
    label: 'Sicurezza',
    title: 'Cosa faccio davvero per la sicurezza.',
    accent: ['davvero'],
    lead: 'Riconoscere una truffa, reggere un attacco, riavere i dati. Per il tuo sito, il tuo computer e i tuoi account: controlli che si fanno, non promesse.',
    meta: 'Siti, computer e account',
  },

  intro: {
    label: 'Tre rischi',
    lead: 'Tre modi in cui un sito, un computer o un account si fanno male. Per ognuno: come si riconosce e cosa faccio io.',
  },

  // I tre rischi, ognuno con la sua tavola animata.
  rischi: [
    {
      n: '01',
      key: 'bot-phishing',
      title: 'Bot e phishing',
      head: 'Il link sembra giusto. Non lo è.',
      art: {
        art: 'sicurezza',
        variant: 'phishing',
        alt: 'Tavola sul phishing: una finta pagina di accesso e la chat di un bot, con i dettagli della truffa numerati; il link sbatte contro lo scudo e prende il timbro «bloccato».',
      },
      text: 'Il phishing non buca il computer: convince la persona. Un messaggio che mette fretta, un indirizzo quasi uguale a quello vero, una pagina che chiede la password. Ti mostro come riconoscerli e chiudo le porte che restano aperte, così anche un clic sbagliato fa meno danni.',
      points: [
        'Verifica in due passaggi su email, social e account importanti',
        'Un gestore di password al posto del foglietto sotto la tastiera',
        'Come si riconosce un messaggio falso, con esempi veri',
        'Moduli del tuo sito chiusi ai bot',
      ],
    },
    {
      n: '02',
      key: 'attacchi-ddos',
      title: 'Attacchi DDoS',
      head: 'Tante richieste insieme. Il sito resta su.',
      art: {
        art: 'sicurezza',
        variant: 'ddos',
        alt: 'Tavola sugli attacchi DDoS: le richieste false si fermano contro il filtro davanti al server, mentre i visitatori veri passano e il sito resta online.',
      },
      text: 'Un attacco DDoS manda migliaia di richieste false tutte insieme, per far cadere un sito. I siti che costruisco di solito sono statici e pubblicati su Vercel: non c’è un database da far crollare e il traffico passa da un filtro che riconosce e assorbe gli attacchi. Le poche parti che rispondono davvero, come il modulo dei contatti, hanno limiti e controlli propri.',
      points: [
        'Sito statico: niente database da far crollare',
        'Filtro contro gli attacchi già compreso in Vercel',
        'Limiti di invio sul modulo dei contatti',
        'Aggiornamenti e controlli nella manutenzione',
      ],
    },
    {
      n: '03',
      key: 'recupero-dati',
      title: 'Recupero dati',
      head: 'Prima la copia, poi il resto.',
      art: {
        art: 'sicurezza',
        variant: 'recupero',
        alt: 'Tavola sul recupero dati: i file cancellati tornano nel computer dalla copia di ieri sul disco esterno, con la regola 3-2-1 e il ripristino completato.',
      },
      text: 'Prima di toccare un computer copio foto, documenti e posta, e cancello la copia solo quando hai controllato che c’è tutto. Poi imposto i backup automatici con la regola 3-2-1: tre copie, su due supporti diversi, una fuori casa. Se è già tardi, recupero i file cancellati da dischi, chiavette e schede SD, finché il supporto risponde.',
      points: [
        'Copia dei tuoi dati prima di ogni intervento',
        'Backup automatico su disco esterno e nel cloud',
        'Una prova di ripristino: un backup mai aperto non è una copia',
        'Il sito torna alla versione di prima in un minuto',
      ],
    },
  ],

  // Le protezioni attive su questo sito adesso (verificate su vercel.json e api/contatti.js).
  appliedHead: {
    label: 'Su questo sito',
    title: 'Le uso prima io.',
    lead: 'Queste protezioni sono attive su questo sito adesso. Chi se ne intende può controllarle una per una: non sono promesse.',
  },
  applied: [
    {
      title: 'Solo il mio codice',
      text: 'Ogni script del sito ha la sua impronta digitale e il browser rifiuta tutto il resto (Content Security Policy). Niente codice di altri: l’unica eccezione prevista è il controllo anti-bot di Cloudflare, solo nella pagina dei contatti e solo se è attivo.',
    },
    {
      title: 'Connessione sempre cifrata',
      text: 'HTTPS obbligatorio anche alla prima visita (HSTS). Il sito non si lascia mostrare dentro le pagine di altri, e fotocamera, microfono e posizione restano spenti.',
    },
    {
      title: 'Un modulo che i bot non usano',
      text: 'Un campo nascosto che compilano solo i bot, un tempo minimo di compilazione e un limite di invii. Al bot il modulo risponde «inviato», ma il messaggio non arriva: così non impara ad aggirarlo.',
    },
    {
      title: 'Il modulo risponde solo a queste pagine',
      text: 'Accetta richieste solo da questo sito, tiene le chiavi in variabili segrete e non mostra mai i suoi errori interni a chi lo usa.',
    },
    {
      title: 'Nessuno che ti segue',
      text: 'Caratteri, immagini e script arrivano da questo dominio: aprire una pagina non chiama Google, reti pubblicitarie o social. Nessuna statistica di terzi, nessun pixel, nessun cookie di profilazione.',
    },
    {
      title: 'Ogni versione resta',
      text: 'Il codice ha la storia di ogni modifica e ogni pubblicazione resta salvata. Se un aggiornamento rompe qualcosa, si rimette online la versione di prima, già pronta, in un minuto.',
    },
  ],

  limitsHead: {
    label: 'I limiti',
    title: 'Quello che non prometto.',
    lead: 'Anche la sicurezza ha un confine. Qui c’è scritto dov’è.',
  },
  limits: [
    {
      title: 'Nessuno è sicuro al 100%',
      text: 'Chi promette la sicurezza totale vende una sensazione. Cambiano i programmi e cambiano gli attacchi: la sicurezza è un controllo che si ripete, non un interruttore.',
    },
    {
      title: 'Contro i grandi attacchi difende Vercel',
      text: 'Il filtro che assorbe gli attacchi DDoS è di Vercel, non mio. Io scelgo dove pubblicare il sito, lo configuro e chiudo le parti che rispondono.',
    },
    {
      title: 'Un backup solo non è un backup',
      text: 'Va tenuto in due posti, controllato e provato. Un disco che non hai mai aperto non è una copia: è una speranza.',
    },
    {
      title: 'Il punto debole è la fretta',
      text: 'Se la password è la stessa ovunque, o il codice arriva a chi telefona fingendosi la banca, nessuna protezione regge. Per questo spiego, oltre a configurare.',
    },
  ],

  faq: [
    {
      q: 'Ho cliccato un link di phishing: cosa faccio?',
      a: 'Se hai scritto una password, cambiala subito da un altro dispositivo, anche negli altri account dove usavi la stessa, e attiva la verifica in due passaggi. Se hai dato i dati della carta, chiama la banca e falla bloccare. Se hai scaricato e aperto un file, scollega il computer da internet e chiamami: prima si controllano accessi e dati, poi si pulisce.',
    },
    {
      q: 'Il mio sito è protetto dagli attacchi DDoS?',
      a: 'Se l’ho costruito io, di solito è statico e pubblicato su Vercel, che filtra e assorbe gli attacchi; il modulo dei contatti ha limiti propri. Se l’ha fatto qualcun altro, lo guardo e ti dico com’è messo. Il 100% non lo può promettere nessuno.',
    },
    {
      q: 'E se un aggiornamento rompe il sito?',
      a: 'Si torna alla versione di prima in un minuto: ogni pubblicazione resta salvata, quindi si rimette online quella che funzionava, senza ricostruire niente. Poi si cerca con calma cosa non andava.',
    },
    {
      q: 'Recuperi i file cancellati?',
      a: 'Spesso sì, da dischi, chiavette e schede SD, finché il supporto risponde. Fermati subito e non salvare altro: ogni file nuovo può finire sopra quelli da recuperare. Se il disco fa rumore o non viene riconosciuto, non insistere e spegnilo.',
    },
    {
      q: 'Serve un antivirus a pagamento?',
      a: 'Quasi sempre no: Microsoft Defender, aggiornato e configurato bene, basta per il computer di casa o di un piccolo ufficio. Contano di più gli aggiornamenti, le password e un backup provato.',
    },
    {
      q: 'Che fine fanno i dati che scrivo nel modulo?',
      a: 'Servono solo a risponderti. Il sito non ha statistiche di terzi e non carica risorse da altri domini. I dettagli sono nella pagina Privacy.',
    },
  ],

  cta: {
    title: 'Vuoi che controlli il tuo sito o il tuo computer?',
    accent: ['controlli'],
    text: 'Guardo com’è adesso: accessi, password, backup, aggiornamenti e, se c’è, il sito. Ti dico cosa cambierei e quanto costa prima di cominciare, e alla fine ti lascio un riepilogo scritto e i codici di recupero. Senza allarmismi e senza abbonamenti che non servono.',
    // La voce del modulo di contatto da preselezionare (src/data/site.js → form.projectTypes).
    tipo: 'Assistenza informatica',
  },
}
