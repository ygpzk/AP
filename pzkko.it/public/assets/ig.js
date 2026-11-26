// Instagram in bacheca: il profilo nativo (non uno screenshot), le storie in
// evidenza e il visualizzatore a tutto schermo. I dati sono quelli che il
// raccoglitore sul pc scrive in /media/ig/index.json: qui non si chiama
// Instagram e non si chiede nessun account a chi guarda.
//
// Regola dei tempi: il raccoglitore controlla i follower ogni ora, scarica
// una storia solo quando compare e confronta le evidenze ogni sei ore. La
// scheda mostra l'ultimo cambiamento vero, non un battito finto.
//
// Dal 26.11 la scheda è il motore comune scheda-social.js (lo stesso della
// scheda TikTok): qui restano solo i testi, i mazzi e i numeri di Instagram.

import { ICONS } from './icons.js'
import { crea, relativo, anni, ultimaFoto, storieBuone } from './scheda-social.js'

const TESTI = {
  it: {
    profilo: 'Instagram',
    profili: 'Profili Instagram',
    follower: 'follower',
    seguiti: 'seguiti',
    post: 'post',
    evidenze: 'Storie in evidenza',
    nessunaEvidenza: 'Nessuna storia in evidenza.',
    storia: 'Storia',
    storie: (n) => (n === 1 ? '1 storia' : `${n} storie`),
    apri: 'Apri su Instagram',
    controllato: 'controllo automatico ogni ora',
    aggiornato: 'aggiornato',
    errore: 'Instagram non risponde adesso. Riprovo più tardi.',
    vuoto: 'In attesa del primo aggiornamento.',
    privacy: 'Solo conteggi e storie scelte da me. Nessun elenco di follower.',
    sfoglia: 'Passa sopra per sfogliare, clic per aprire',
    tocca: 'Tocca una tessera per aprirla',
    chiudi: 'Chiudi',
    prima: 'Prima',
    dopo: 'Dopo',
    pausa: 'Metti in pausa',
    riprendi: 'Riprendi',
    inPausa: 'in pausa',
    attivaAudio: 'Attiva l’audio',
    disattivaAudio: 'Disattiva l’audio',
    conta: (i, n) => `${i} di ${n}`,
    settimana: 'negli ultimi 7 giorni',
    senzaStoria: 'Storia non disponibile.',
    storieDi: (u) => `Storie di @${u}`,
    evidenzaDi: (u, t) => `${t} di @${u}`,
    privato: 'profilo privato',
    cambiaSfondo: 'Cambia sfondo',
    sfondoOra: (h, n) => `Sfondo delle ore ${String(h).padStart(2, '0')}:00 · ${n}`,
    sfondoCaso: (n) => `Sfondo a caso · ${n}`,
  },
  en: {
    profilo: 'Instagram',
    profili: 'Instagram profiles',
    follower: 'followers',
    seguiti: 'following',
    post: 'posts',
    evidenze: 'Highlights',
    nessunaEvidenza: 'No highlights yet.',
    storia: 'Story',
    storie: (n) => (n === 1 ? '1 story' : `${n} stories`),
    apri: 'Open on Instagram',
    controllato: 'automatic check every hour',
    aggiornato: 'updated',
    errore: 'Instagram is not answering right now. I’ll try again later.',
    vuoto: 'Waiting for the first update.',
    privacy: 'Only counts and stories I chose. No follower list.',
    sfoglia: 'Hover to flip through, click to open',
    tocca: 'Tap a card to open it',
    chiudi: 'Close',
    prima: 'Previous',
    dopo: 'Next',
    pausa: 'Pause',
    riprendi: 'Resume',
    inPausa: 'paused',
    attivaAudio: 'Turn sound on',
    disattivaAudio: 'Turn sound off',
    conta: (i, n) => `${i} of ${n}`,
    settimana: 'in the last 7 days',
    senzaStoria: 'Story not available.',
    storieDi: (u) => `Stories by @${u}`,
    evidenzaDi: (u, t) => `${t} by @${u}`,
    privato: 'private profile',
    cambiaSfondo: 'Change backdrop',
    sfondoOra: (h, n) => `${String(h).padStart(2, '0')}:00 backdrop · ${n}`,
    sfondoCaso: (n) => `Random backdrop · ${n}`,
  },
}

const titoloEvidenza = (h) => h?.title || 'Highlights'

// i mazzi di un profilo: le storie di oggi (se ci sono) e poi le evidenze
function mazzi(acc, lang, t) {
  const out = []
  const storie = storieBuone(acc)
  if (storie.length) {
    out.push({
      items: storie, n: storie.length, viva: true,
      titolo: t.storia, voce: t.storieDi(acc.username),
      meta: [relativo(storie.at(-1).at, lang)],
      faccia: ultimaFoto(storie) || acc.avatar || '',
    })
  }
  for (const h of acc.highlights || []) {
    const items = h.items || []
    const n = items.length || Number(h.count) || 0
    out.push({
      items, n, viva: false,
      titolo: titoloEvidenza(h), voce: t.evidenzaDi(acc.username, titoloEvidenza(h)),
      meta: [t.storie(n), anni(items)].filter(Boolean),
      faccia: ultimaFoto(items) || h.cover || '',
    })
  }
  return out
}

const scheda = crea({
  id: 'ig',
  nome: 'Instagram',
  classe: '',
  base: '/media/ig',
  glifo: ICONS.instagram[1],
  testi: TESTI,
  mazzi,
  numeri: (acc, lang, t) => [[acc.stats?.following, t.seguiti], [acc.stats?.posts, t.post]],
  link: (acc) => `https://www.instagram.com/${acc.username}/`,
  sfondi: () => import('./ig-sfondi.js'),
})

export const monta = scheda.monta
export const apri = scheda.apri
