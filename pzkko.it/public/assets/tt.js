// TikTok in bacheca: la stessa dashboard della scheda Instagram (il motore
// comune è scheda-social.js), con i colori di TikTok (.igc--tt in site.css) e i
// suoi sfondi (tt-sfondi.js). I dati sono quelli che il raccoglitore sul pc
// scrive in /media/tt/index.json: qui non si chiama TikTok e non si chiede
// nessun account a chi guarda. L'account si legge sempre dai dati: in questo
// file non c'è (scripts/guard.mjs lo vieterebbe).
//
// Le tessere sono come le evidenze di Instagram: le storie di oggi (se ci
// sono), i video e i repost. I video «solo qui» su TikTok non sono pubblici:
// il proprietario li ha scelti per il sito, quindi il loro collegamento porta
// al profilo. I repost sono video di altri: nel sito c'è solo la copertina,
// con l'autore e il collegamento all'originale.

import { ICONS } from './icons.js'
import { crea, glifo, relativo, anni, ultimaFoto, storieBuone, corto } from './scheda-social.js'

const ora2 = (h) => `${String(h).padStart(2, '0')}:00`

const TESTI = {
  it: {
    profilo: 'TikTok',
    profili: 'Profili TikTok',
    follower: 'follower',
    seguiti: 'seguiti',
    miPiace: 'mi piace',
    video: 'video',
    evidenze: 'Video e repost',
    nessunaEvidenza: 'Ancora niente da mostrare.',
    storia: 'Storia',
    storie: (n) => (n === 1 ? '1 storia' : `${n} storie`),
    videoTitolo: 'Video',
    videoN: (n) => `${n} video`,
    repostTitolo: 'Repost',
    repostN: (n) => `${n} repost`,
    visto: (n) => `${n} visualizzazioni`,
    soloQui: 'solo qui',
    guarda: 'Guarda su TikTok',
    apri: 'Apri su TikTok',
    controllato: 'controllo automatico ogni ora',
    aggiornato: 'aggiornato',
    errore: 'TikTok non risponde adesso. Riprovo più tardi.',
    vuoto: 'In attesa del primo aggiornamento.',
    privacy: 'Solo conteggi e video scelti da me. Nessun elenco di follower.',
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
    senzaStoria: 'Non disponibile.',
    storieDi: (u) => `Storie di @${u}`,
    evidenzaDi: (u, t) => `${t} di @${u}`,
    privato: 'profilo privato',
    cambiaSfondo: 'Cambia sfondo',
    sfondoOra: (h, n) => `Sfondo delle ${ora2(h)}–${ora2((h + 2) % 24)} · ${n}`,
    sfondoCaso: (n) => `Sfondo a caso · ${n}`,
  },
  en: {
    profilo: 'TikTok',
    profili: 'TikTok profiles',
    follower: 'followers',
    seguiti: 'following',
    miPiace: 'likes',
    video: 'videos',
    evidenze: 'Videos and reposts',
    nessunaEvidenza: 'Nothing to show yet.',
    storia: 'Story',
    storie: (n) => (n === 1 ? '1 story' : `${n} stories`),
    videoTitolo: 'Videos',
    videoN: (n) => (n === 1 ? '1 video' : `${n} videos`),
    repostTitolo: 'Reposts',
    repostN: (n) => (n === 1 ? '1 repost' : `${n} reposts`),
    visto: (n) => `${n} views`,
    soloQui: 'only here',
    guarda: 'Watch on TikTok',
    apri: 'Open on TikTok',
    controllato: 'automatic check every hour',
    aggiornato: 'updated',
    errore: 'TikTok is not answering right now. I’ll try again later.',
    vuoto: 'Waiting for the first update.',
    privacy: 'Only counts and videos I chose. No follower list.',
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
    senzaStoria: 'Not available.',
    storieDi: (u) => `Stories by @${u}`,
    evidenzaDi: (u, t) => `${t} by @${u}`,
    privato: 'private profile',
    cambiaSfondo: 'Change backdrop',
    sfondoOra: (h, n) => `${ora2(h)}–${ora2((h + 2) % 24)} backdrop · ${n}`,
    sfondoCaso: (n) => `Random backdrop · ${n}`,
  },
}

// un video del profilo diventa uno o più elementi del mazzo: il filmato (o la
// copertina, se il filmato era troppo grande), oppure le foto di un post di foto
function elementiVideo(v, lang, t) {
  const nota = [t.visto(corto(v.stats?.views, lang)), v.solo_qui ? t.soloQui : ''].filter(Boolean).join(' · ')
  const link = v.solo_qui ? null : v.url
  const base = { at: v.at, nota, link, linkTesto: t.guarda }
  if (v.type === 'photo') {
    return [{ src: v.cover, w: v.w, h: v.h }, ...(v.photos || [])]
      .filter((f) => f.src)
      .map((f, k) => ({ ...base, id: `${v.id}-${k + 1}`, type: 'photo', src: f.src, w: f.w, h: f.h }))
  }
  const src = v.src || v.cover
  return src ? [{ ...base, id: v.id, type: v.src ? 'video' : 'photo', src, w: v.w, h: v.h, durata: v.durata }] : []
}

// un repost: la copertina, l'autore e il collegamento al video originale
const elementoRepost = (r, lang, t) => (r.cover ? {
  id: r.id, type: 'photo', src: r.cover, w: r.w, h: r.h, at: r.at,
  chi: r.author ? `@${r.author}` : '',
  nota: t.visto(corto(r.stats?.views, lang)),
  link: r.url, linkTesto: t.guarda,
} : null)

// i mazzi: le storie di oggi (se ci sono), i video, i repost
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
  const video = (acc.videos || []).flatMap((v) => elementiVideo(v, lang, t))
  if (video.length) {
    const n = (acc.videos || []).length
    out.push({
      items: video, n: video.length, viva: false,
      titolo: t.videoTitolo, voce: t.evidenzaDi(acc.username, t.videoTitolo),
      meta: [t.videoN(n), anni(video)].filter(Boolean),
      faccia: acc.videos[0].cover || '',
    })
  }
  const repost = (acc.reposts || []).map((r) => elementoRepost(r, lang, t)).filter(Boolean)
  if (repost.length) {
    out.push({
      items: repost, n: repost.length, viva: false,
      titolo: t.repostTitolo, voce: t.evidenzaDi(acc.username, t.repostTitolo),
      meta: [t.repostN(repost.length), anni(repost)].filter(Boolean),
      faccia: repost[0].src,
    })
  }
  return out
}

// il quadratino in cima alla colonna: il marchio sdoppiato ciano e rosso sul nero, come l'icona dell'app
const marchio = () => `<span class="igc__home" aria-hidden="true"><span class="igc__tt">${glifo(ICONS.tiktok[1], 22).repeat(3)}</span></span>`

const scheda = crea({
  id: 'tt',
  nome: 'TikTok',
  classe: 'igc--tt',
  base: '/media/tt',
  glifo: ICONS.tiktok[1],
  marchio,
  testi: TESTI,
  mazzi,
  numeri: (acc, lang, t) => {
    const s = acc.stats || {}
    return [[s.following, t.seguiti], [s.likes, t.miPiace], [Math.max(Number(s.videos) || 0, (acc.videos || []).length), t.video]]
  },
  link: (acc) => acc.url,
  sfondi: () => import('./tt-sfondi.js'),
})

export const monta = scheda.monta
export const apri = scheda.apri
export const stato = scheda.stato
