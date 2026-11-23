// Diretta OS · le scene nuove: il nome che hanno in regia è lo stesso che hanno in onda e nel loro
// indirizzo (/o/dovevivo, /o/azienda, /o/surf). Le posizioni sono per le due lenti: 0,5× (05) e 1,0× (10).
// Stanno al centro, un po' sfalsate, perché sono grandi: si accendono una alla volta e si spostano dalla regia.

export const SCENE = ['dovevivo', 'azienda', 'surf']

export const SCENE_NOMI = {
  dovevivo: 'Dove vivo',
  azienda: 'Azienda di Giugnoh',
  surf: 'Surf con lei',
}

export const SCENE_DICE = {
  dovevivo: 'la mappa SVG di casa, dalle geometrie OpenStreetMap: bussola, meteo, ora, luci e trattore, senza indirizzi',
  azienda: 'l’azienda di famiglia: un montaggio di foto e zoom, in loop (senza link e senza nome)',
  surf: 'il mare al tramonto, il longboard e noi due: una scena illustrata e animata',
}

export const SCENE_POSTI = {
  '05': {
    dovevivo: [24, 360, .78],
    azienda: [40, 380, .68],
    surf: [360, 548, .64],
  },
  10: {
    dovevivo: [30, 352, .8],
    azienda: [48, 372, .7],
    surf: [40, 640, .5],
  },
}
