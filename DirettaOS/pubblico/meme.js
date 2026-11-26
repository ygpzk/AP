// Diretta OS: i meme di pzkko (fine settembre → 19.11.2026) che girano nel pezzo «Meme di pzkko», /o/meme (i progetti
// di config.json hanno il loro, /o/adv), mescolati a ogni giro. Si aggiungono e si tolgono qui, senza riavviare:
// basta ricaricare il livello in Camo.
//   titolo, testo   corti: il titolo si stringe da solo se non ci sta, il testo sta su due righe
//   arte            un'immagine di pzkko.it/public/art (si vede con /art/…); i manifesti del muro vanno un po' storti
//   simboli         tre simbolini di pzkko che saltano fuori attorno all'immagine (nomi di art/chat-stati e art/chat-slot)
//   da              da dove viene il meme, scritto in piccolo in cima
//   {rb}            nel testo diventa il numero di Red Bull di stasera
// Niente posti veri oltre a Mantova: il manifesto dello Starlink (manifesti3/starlink) ha scritto il paese, qui non si usa.
export const MEME = [
  { titolo: 'red bull ti mette le ali', testo: 'alla lumaca. io sono a quota {rb} e le ali ancora niente', arte: '/art/manifesti5/redbull.webp', simboli: ['fulmine', 'stella', 'chiocciola-oro'], da: 'dal muro' },
  { titolo: 'unimore ≥ unibo', testo: 'singola a 350 €, parcheggio sotto casa. dibattito chiuso', arte: '/art/manifesti3/unimore.webp', simboli: ['trofeo', 'fuoco', 'si'], da: 'dal muro' },
  { titolo: 'lyca vs tim', testo: 'l’incontro del secolo: 100 giga contro 7', arte: '/art/manifesti3/lyca-tim.webp', simboli: ['fulmine', 'sirena', 'teschio'], da: 'dal muro' },
  { titolo: 'non sono ufo', testo: 'è starlink: una fila di luci sopra mantova', arte: '/art/chat-slot/stella.webp', simboli: ['sirena', 'stella', 'fulmine'], da: 'dal muro' },
  { titolo: 'MONCLER', testo: 'il piumino rosso costa più del mio pc', arte: '/art/manifesti3/moncler.webp', simboli: ['diamante', 'eur', 'fuoco'], da: 'dal muro' },
  { titolo: 'brat', testo: 'brat summer. a novembre. con la stufa accesa', arte: '/art/manifesti4/brat.webp', simboli: ['fuoco', 'cuore', 'fulmine'], da: 'dal muro' },
  { titolo: 'saluti da milano', testo: 'piazza tre torri, sosta valida fino alle 18:40, 3 €', arte: '/art/manifesti4/tre-torri.webp', simboli: ['clessidra', 'eur', 'stella'], da: 'dal muro' },
  { titolo: 'frisk con lo scotch', testo: 'attaccate al muro. l’alito resta fresco lo stesso', arte: '/art/manifesti4/frisk.webp', simboli: ['si', 'stella', 'diamante'], da: 'dal muro' },
  { titolo: 'estathé crocifisso', testo: 'il brick al limone tenuto su con lo scotch', arte: '/art/manifesti5/estathe.webp', simboli: ['limone', 'cuore', 'xp'], da: 'dal muro' },
  { titolo: 'built to resist', testo: 'l’eastpak scarabocchiato: 4ever, maturità 2025', arte: '/art/manifesti5/eastpak.webp', simboli: ['trofeo', 'cuore', 'stella'], da: 'dal muro' },
  { titolo: 'mirtilli assicurati', testo: 'fragole, mirtilli, lamponi: 3 € la vaschetta. con la polizza', arte: '/art/manifesti5/frutti.webp', simboli: ['ciliegia', 'uva', 'eur'], da: 'dal muro' },
  { titolo: 'OFFERTA epson', testo: 'EcoTank ET-2825 a 169,90 €. l’inchiostro non finisce mai (dicono)', arte: '/art/manifesti6/epson.webp', simboli: ['eur', 'si', 'fulmine'], da: 'dal muro' },
  { titolo: 'iPhone Duo', testo: 'da 3625 $. non esiste. lo vogliamo lo stesso', arte: '/art/manifesti7/iphone.webp', simboli: ['diamante', 'cuore', 'eur'], da: 'dal muro' },
  { titolo: 'scontrino tecnomat', testo: '2 stufe a legna da 9 kW: 1.803,10 €. la legna la metto io', arte: '/art/manifesti7/scontrino.webp', simboli: ['fuoco', 'eur', 'clessidra'], da: 'dal muro' },
  { titolo: 'corso di bonsai', testo: '4 giovedì sera. e in chat il bonsai ti salva dalla morte (−25 %)', arte: '/art/manifesti7/bonsai.webp', simboli: ['teschio', 'cuore', 'trifoglio'], da: 'dal muro' },
  { titolo: 'verona e l’arena tour', testo: 'gita in pullman, pranzo incluso, 45 €. posti limitati!', arte: '/art/manifesti7/verona.webp', simboli: ['stella', 'regalo', 'campana'], da: 'dal muro' },
  { titolo: 'MODENA', testo: 'e l’assalto al supermercato. prossimamente al cinema', arte: '/art/manifesti8/modena.webp', simboli: ['sirena', 'fuoco', 'eur'], da: 'dal muro' },
  { titolo: 'la vie est trop chère', testo: 'il carovita, ma in francese. tous dans la rue, samedi 14h', arte: '/art/manifesti8/francia.webp', simboli: ['fulmine', 'eur', 'no'], da: 'dal muro' },
  { titolo: 'auguri @~matti', testo: 'la torta la offri tu. sparita da sola il 18.10 alle 20:30', arte: '/art/auguri.webp', simboli: ['regalo', 'cuore', 'stella'], da: 'dal muro' },
  { titolo: 'la petizione', testo: '«pzkko.it è un bel sito?» firme vere, bic legate con lo spago', arte: '/art/chat-pzk/petizione.webp', simboli: ['si', 'cuore', 'stella'], da: 'dal muro' },
  { titolo: 'better call pekko', testo: 'hello my name is pekko. computer guy at law. SI PARLA ITALIANO', arte: '/art/adesivi/hello.webp', simboli: ['si', 'stella', 'trofeo'], da: 'dagli adesivi' },
  { titolo: 'lumaca catodica', testo: 'pzkko 3.0: il cercapersone si spegne come un tubo catodico', arte: '/art/chat-pzk/pager.webp', simboli: ['fulmine', 'xp', 'livello'], da: 'dalle versioni' },
  { titolo: 'chiocciola zero', testo: 'la 4.0.0: lo zero per tutti, il nero eliminato per sempre', arte: '/art/chat-pzk/zero.webp', simboli: ['no', 'trofeo', 'stella'], da: 'dalle versioni' },
  { titolo: 'la lumachina', testo: 'decide lei cosa fare coi tuoi $pzk. ogni giorno. tu zitto', arte: '/art/chat-slot/chiocciola-oro.webp', simboli: ['cuore', 'pzk', 'clessidra'], da: 'dal cercapersone' },
  { titolo: 'niente commit?', testo: 'allora i $pzk perdono il 2 % al giorno. se lavoro, +3 %', arte: '/art/chat-stati/pzk.webp', simboli: ['eur', 'fulmine', 'livello'], da: 'dalla borsa' },
  { titolo: 'il pomodoro', testo: 'il caricamento: matura, scoppia, ti sporca la telecamera', arte: '/art/chat-cibo/pomodoro.webp', simboli: ['clessidra', 'fuoco', 'stella'], da: 'dalla scena 3D' },
  { titolo: 'pzkkonet', testo: 'il tombino in mezzo alla scena 3D. internet passa da lì', arte: '/art/chat-pzk/tombino.webp', simboli: ['fulmine', 'si', 'stella'], da: 'dalla scena 3D' },
  { titolo: 'zanzare tigre', testo: 'novembre. ci sono ancora. anche nella scena 3D', arte: '/art/chat-animali/zanzara.webp', simboli: ['teschio', 'sirena', 'fulmine'], da: 'dalla scena 3D' },
  { titolo: 'grissin pzk', testo: 'gusto pizza, 60 $pzk: +10 % xp. anche se sono per terra', arte: '/art/chat-cibo/grissini.webp', simboli: ['xp', 'cuore', 'stella'], da: 'dallo shop' },
  { titolo: 'pzk-kola', testo: 'la bibita ufficiale di pzkko. la ricetta è segreta', arte: '/art/chat-cibo/pzk-kola.webp', simboli: ['fulmine', 'cuore', 'stella'], da: 'dallo shop' },
  { titolo: 'tortelli di zucca', testo: 'sbrisolona, mostarda, tortelli: lo shop parla mantovano', arte: '/art/chat-cibo/tortelli.webp', simboli: ['cuore', 'stella', 'trofeo'], da: 'dallo shop' },
  { titolo: 'landini L 25 · 1957', testo: 'testacalda: per accenderlo serve la fiamma. davvero', arte: '/art/chat-roba/landini.webp', simboli: ['fuoco', 'trofeo', 'livello'], da: 'dallo shop' },
  { titolo: 'vendo il ciao', testo: 'piaggio ciao. tratto solo con gente seria', arte: '/art/chat-roba/ciao-px.webp', simboli: ['eur', 'si', 'stella'], da: 'dal muro' },
  { titolo: 'il cornetto rosso', testo: 'muori: −20 % dei $pzk. il cornetto si crepa al posto tuo', arte: '/art/chat-attrezzi/cornetto.webp', simboli: ['teschio', 'cuore', 'trifoglio'], da: 'dalla chat' },
  { titolo: 'la rapina', testo: 'almeno in due, al massimo in quattro. poi la lavatrice', arte: '/art/chat-app3/app-rapina.webp', simboli: ['sirena', 'banconota', 'lucchetto'], da: 'dalla chat' },
  { titolo: 'la lavatrice', testo: 'soldi sporchi puliti in 10 minuti. commissione 2.000 $pzk', arte: '/art/chat-app3/app-lavatrice.webp', simboli: ['banconota', 'pzk', 'si'], da: 'dalla chat' },
  { titolo: 'spazzino di uffici', testo: 'sul nastro passa di tutto. rischio 4 %: due ore di galera', arte: '/art/chat-mestieri/spazzino.webp', simboli: ['lucchetto', 'clessidra', 'teschio'], da: 'dalla chat' },
  { titolo: 'rider', testo: 'consegni pizze in bici col freddo. 120 $pzk a turno', arte: '/art/chat-mestieri/rider.webp', simboli: ['pzk', 'clessidra', 'fulmine'], da: 'dalla chat' },
  { titolo: 'la nutria golosa', testo: 'mascotte per 15 giorni, poi licenziata. è tornata la tartaruga', arte: '/art/chat-animali/nutria.webp', simboli: ['no', 'cuore', 'teschio'], da: 'dalle mascotte' },
  { titolo: 'chiuso per monaco', testo: 'due giorni senza pzkko: io in germania, il server spento', arte: '/art/chat-stati/lucchetto.webp', simboli: ['clessidra', 'no', 'sirena'], da: 'dalla manutenzione' },
]

// i simbolini: prima quelli degli stati della chat, poi quelli della slot
const STATI = ['banconota', 'clessidra', 'cuore', 'eur', 'fulmine', 'fuoco', 'livello', 'lucchetto', 'no', 'pzk', 'regalo', 'si', 'sirena', 'teschio', 'trofeo', 'xp']
export const simbolo = (n) => `/art/${STATI.includes(n) ? 'chat-stati' : 'chat-slot'}/${n}.webp`

// i colori dei titoli, a giro: tutti chiari, perché sopra hanno il contorno scuro
export const SFUMATURE = [['#ccff00', '#f0b3ff'], ['#ffe14d', '#ff8a3d'], ['#5ef0ff', '#b3a6ff'], ['#ff7a9c', '#ffc46b'], ['#2dff7a', '#ccff00'], ['#f0b3ff', '#c77dff'], ['#ffffff', '#5ef0ff']]
