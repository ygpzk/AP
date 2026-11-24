// Diretta OS · le scene: il nome che hanno in regia è lo stesso che hanno in onda e nel loro indirizzo
// (/o/dovevivo, /o/azienda, /o/surf). Sono sempre a schermo intero: non hanno un posto né una grandezza, e in
// regia sono tasti (premuto = in onda), una alla volta.

export const SCENE = ['dovevivo', 'azienda', 'surf']

export const SCENE_NOMI = {
  dovevivo: 'Dove vivo',
  azienda: 'Azienda di Giugnoh',
  surf: 'Surf con lei',
}

export const SCENE_DICE = {
  dovevivo: 'la mappa in 3D di dove vivo: i confini veri, i fabbricati, la campagna attorno. Si gira col mouse dal monitor della regia, come Google Earth; senza indirizzi',
  azienda: 'l’azienda di famiglia come un sito che si visita da solo, con le scritte grandi (senza link e senza nome)',
  surf: 'il mare al tramonto, il longboard e noi due: una scena illustrata e animata',
}

// come si usa col mouse quando è in onda (la riga di aiuto sotto il monitor della regia)
export const SCENE_MANI = {
  dovevivo: '<b>Trascina</b>: sposta · <b>rotella</b>: zoom · <b>tasto destro</b> o <b>Ctrl + trascina</b>: ruota e inclina · <b>doppio clic</b>: vola lì',
  azienda: '<b>Rotella</b>: scorri il sito · <b>mouse</b>: il puntatore · <b>clic</b>: entra ed esci',
  surf: 'Scena a schermo intero',
}

// (a tutto schermo: lo stesso posto per le due lenti. Resta per chi legge i posti di tutti i pezzi)
const PIENO = Object.fromEntries(SCENE.map((p) => [p, [0, 0, 1]]))
export const SCENE_POSTI = { '05': PIENO, 10: PIENO }
