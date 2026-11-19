// pzkko.it: tutto quello che si cambia senza toccare il codice.

export const CONFIG = {
  // L'ID utente Discord. I dati dal vivo (avatar, decorazione, stato, Spotify,
  // giochi, stato personalizzato, stile del nome) arrivano da Lanyard: bisogna
  // restare nel server https://discord.gg/lanyard.
  discordId: '459791358899519498',

  // Il profilo pubblico (banner, tema, bio, badge, collegamenti, effetto e cornice)
  // arriva da dcdn.dstn.to; se non risponde si usano i valori qui sotto, presi il 18.11.2026.
  profileApi: 'https://dcdn.dstn.to/profile/',
  profile: {
    username: 'pzkko',
    displayName: 'pzkko',
    avatar: 'd4c872e1182f1e7ed9ef6d54cf17666b',
    banner: 'a_ec2559d3be64aa2b509c96f456b28d19',
    bannerColor: '#110f10',
    theme: ['#ccff00', '#9d00ff'],
    bio: 'alberto, from italy. trained surveyor, now studying construction & land management on a dual degree between italy and san marino. i also design and build websites and brand identities, hand-written code, no frameworks. building with claude code daily: custom skills, tools and too many side projects.',
    decoration: 'a_820da11285b1a68ad94c18fd9dcf8ca8',
    // lo stile del nome: carattere 17 (Pricedown), effetto 1 (tinta unita)
    nameStyle: { font_id: 17, effect_id: 1, colors: [] },
    // gli oggetti da collezione (SKU di Discord): effetto del profilo, cornice, decorazione
    effectSku: '1341506443978735616',
    frameSku: '1509183144786657413',
    decorationSku: '1466993897333985337',
    guild: { tag: 'NODE', id: '425824580918181889', badge: 'de1a71e54518bf5b4b1e271f823093a0' },
    badges: [
      { id: 'premium', icon: '7294f50817c5fe9fd98631d230ac2e5d', description: 'Subscriber since 11/11/26', link: 'https://discord.com/settings/premium' },
      { id: 'guild_booster_lvl1', icon: '51040c70d4f20a921ad6674ff86fc95c', description: 'Server boosting since 11/11/26', link: 'https://discord.com/settings/guild-boosting' },
      { id: 'hypesquad_house_3', icon: '3aa41de486fa12454c3761e8e223442e', description: 'HypeSquad Balance' },
      { id: 'legacy_username', icon: '6de6d34650760ba5551a79732e98ed60', description: 'Originally known as Pzkko#1631' },
    ],
    connections: [
      { type: 'domain', name: 'pzkko.it', id: 'pzkko.it', verified: true },
      { type: 'github', name: 'ygpzk', id: '254122358', verified: true },
      { type: 'steam', name: 'ygpzk', id: '76561198971719489', verified: true },
      { type: 'twitch', name: 'pzkko', id: '502284033', verified: true },
    ],
  },

  // Dove Discord dà nome, immagini e misure di effetto, cornice e decorazione.
  collectiblesApi: 'https://discord.com/api/v9/collectibles-products/',

  // Il sito principale, quello serio.
  mainSite: { url: 'https://www.albertopecchini.it', label: 'albertopecchini.it' },
  domain: 'pzkko.it',

  // Contatore delle visite con GoatCounter (gratis, senza cookie): scrivi qui il
  // codice del sito, es. 'pzkko'. Vuoto = niente contatore e niente script.
  goatcounter: '',

  updated: '2026-11-18',
}

// Gli oggetti da collezione come li dà Discord, di riserva se la sua API non risponde
// (presi il 18.11.2026). La cornice ha due livelli, dietro e davanti alla scheda.
const CDN = 'https://cdn.discordapp.com'
export const COLLECTIBLES = {
  '1341506443978735616': {
    name: 'Dreamy (Green)', type: 1,
    thumb: `${CDN}/assets/content/ca21f227ee69461169d762514ab0a6406d03274e4c01e970b8de7a491f19e9f1`,
    still: `${CDN}/assets/content/3c169ebbea33e4e9af70624b4ca6bf7962ca2529c157e61d40431872718d0828`,
    width: 450, height: 880,
    layers: [
      { src: `${CDN}/assets/content/1be63b5afd7e3c4b91563697c1dd41f753d5805529938c5613770979a936242e`, loop: false, duration: 2880, start: 0, loopDelay: 0 },
      { src: `${CDN}/assets/content/be21b3b0c5cf9260db3d3daefe555011863dec60a7935edc9d73ac7d96deddd9`, loop: true, duration: 2880, start: 3280, loopDelay: 4000 },
    ],
  },
  '1509183144786657413': {
    name: 'Crystals (Peridot)', type: 3, inner: 1200, top: 304, bottom: 0, side: 56,
    layers: [{ id: '1514423455905349705', order: 'front' }, { id: '1514423458833109165', order: 'back' }],
  },
  '1466993897333985337': { name: 'Neon Glow (Amethyst)', type: 0 },
}

// I caratteri dei nomi di Discord (display name styles): id → famiglia, peso, spaziatura.
// Presi dal client di Discord; l'11 è gg sans, quello di tutti.
export const NAME_FONTS = {
  3: ['Sakura', 400, '.04em'], 4: ['Jellybean', 400, '0'], 6: ['Modern', 500, '.01em'], 7: ['Medieval', 400, '.02em'],
  8: ['8Bit', 400, '.02em'], 10: ['Vampyre', 400, '.01em'], 12: ['Tempo', 600, '.03em'], 13: ['Monkey Bars', 700, '0'],
  14: ['Mainframe', 700, '.03em'], 15: ['Headbang', 400, '0'], 16: ['Journal', 700, '0'], 17: ['Pricedown', 700, '0'],
}

// I social. `icon` è il nome dell'icona in icons.js; `dark` il colore col tema scuro
// quando quello del marchio è nero, `light` col tema chiaro quando è troppo chiaro.
export const SOCIALS = [
  { key: 'discord', name: 'Discord', handle: 'pzkko', url: 'https://discord.com/users/459791358899519498', icon: 'discord' },
  { key: 'instagram', name: 'Instagram', handle: 'albertoxpecchini', url: 'https://www.instagram.com/albertoxpecchini/', icon: 'instagram' },
  { key: 'instagram2', name: 'Instagram', handle: 'pzkko', url: 'https://www.instagram.com/pzkko/', icon: 'instagram' },
  { key: 'tiktok', name: 'TikTok', handle: 'albertoxpecchini', url: 'https://www.tiktok.com/@albertoxpecchini', icon: 'tiktok', dark: 'ffffff' },
  { key: 'x', name: 'X', handle: 'ygpzk', url: 'https://x.com/ygpzk', icon: 'x', dark: 'ffffff' },
  { key: 'youtube', name: 'YouTube', handle: 'alberto-h7y3h', url: 'https://www.youtube.com/@alberto-h7y3h', icon: 'youtube' },
  { key: 'threads', name: 'Threads', handle: 'albertoxpecchini', url: 'https://www.threads.net/@albertoxpecchini', icon: 'threads', dark: 'ffffff' },
  { key: 'twitch', name: 'Twitch', handle: 'pzkko', url: 'https://www.twitch.tv/pzkko', icon: 'twitch' },
  { key: 'kick', name: 'Kick', handle: 'albertoxpecchini', url: 'https://kick.com/albertoxpecchini', icon: 'kick', light: '2f9b0e' },
  { key: 'steam', name: 'Steam', handle: 'ygpzk', url: 'https://steamcommunity.com/profiles/76561198971719489', icon: 'steam', dark: 'ffffff' },
  { key: 'spotify', name: 'Spotify', handle: 'pzkko', url: 'https://open.spotify.com/user/qeefs44bv4bpoa7dk8epagrxf', icon: 'spotify', light: '169c46' },
  { key: 'reddit', name: 'Reddit', handle: 'u/yungpzkko', url: 'https://www.reddit.com/user/yungpzkko/', icon: 'reddit' },
  { key: 'pinterest', name: 'Pinterest', handle: 'albertoxpecchini', url: 'https://www.pinterest.com/albertoxpecchini/', icon: 'pinterest' },
  { key: 'snapchat', name: 'Snapchat', handle: 'albertoxpecchini', url: 'https://www.snapchat.com/add/albertoxpecchini', icon: 'snapchat', light: 'b89f00' },
  { key: 'telegram', name: 'Telegram', handle: 'albertopecchini', url: 'https://t.me/albertopecchini', icon: 'telegram' },
  { key: 'github', name: 'GitHub', handle: 'ygpzk', url: 'https://github.com/ygpzk', icon: 'github', dark: 'ffffff' },
]

// I progetti per svago. Immagini e filmati sono catture vere dei progetti in funzione:
// stanno in /media/p/<key>/ e le elenca media.js (lo riscrive `npm run media`).
// `kind`: game (giochi), tool (programmi), site (siti). `tags`: [nome, icona di icons.js
// oppure colore]. I testi stanno in i18n.js sotto `projects`.
const GH = 'https://github.com/ygpzk/AP/tree/main'
// Posta OS e Pulizia OS stanno nel ramo del sito, accanto a pzkko.it
const OS = 'https://github.com/ygpzk/AP/tree/albertopecchini.it', RAW = 'https://github.com/ygpzk/AP/raw/albertopecchini.it'
// `play`: le cose che girano dentro il sito, [etichetta, indirizzo] (si aprono in una finestra sopra il profilo).
// `art`: la miniatura, [colore 1, colore 2, carattere della scritta, motivo dello sfondo].
export const PROJECTS = [
  { key: 'zero', title: 'PZK Zero', kind: 'game', featured: true, art: ['#ff8a1a', '#7a2d00', 'Mainframe', 'griglia'], tags: [['three.js', 'threejs'], ['JavaScript', 'javascript'], ['LCD 1-bit', '#ff8a1a']],
    play: [['PZK Zero', '/serranda/?apri=zero'], ['Chat', '/serranda/?apri=chat']] },
  { key: 'giochini', title: 'Casinò $pzk', kind: 'game', art: ['#0f7a3a', '#052612', 'Pricedown', 'rombi'], tags: [['three.js', 'threejs'], ['chiptune', '#9d00ff'], ['$pzk', '#7cc400']],
    play: [['Roulette', '/serranda/?apri=roulette'], ['Blackjack', '/serranda/?apri=blackjack'], ['Mine', '/serranda/?apri=mine'], ['Dado', '/serranda/?apri=dado'], ['Testa o croce', '/serranda/?apri=moneta'], ['Virtual', '/serranda/?apri=virtual']] },
  { key: 'serranda', title: 'Il Muro', kind: 'site', art: ['#8d9499', '#2f3336', 'Headbang', 'lamiera'], tags: [['HTML', 'html5'], ['CSS', 'css'], ['gpt-image-2', '#10a37f']],
    play: [['Il Muro', '/serranda/']] },
  { key: 'matricios', title: 'Matrici OS', kind: 'tool', art: ['#0d3b1e', '#020a05', '8Bit', 'righe'], tags: [['C#', 'csharp'], ['Windows', '#0078d4'], ['Terminal', '#3fb950']], code: `${GH}/MatriciOS`, download: 'https://github.com/ygpzk/AP/raw/main/MatriciOS/MatriciOS.exe' },
  { key: 'lezioni', title: 'pzk$meeting', kind: 'tool', art: ['#ffd60a', '#b88700', 'Tempo', 'punti'], tags: [['Python', 'python'], ['Whisper', '#10a37f'], ['LaTeX', 'latex']], code: `${GH}/albertopecchini.it/tools/lezioni`,
    play: [['pzk$meeting', '/tools/lezioni/']] },
  { key: 'parole', title: 'Parole', kind: 'game', art: ['#e8501c', '#3b0f24', 'Jellybean', 'tessere'], tags: [['React', 'react'], ['TypeScript', 'typescript']] },
  { key: 'trivia', title: 'Trivia', kind: 'game', art: ['#16c05a', '#062b16', 'Medieval', 'colonne'], tags: [['React', 'react'], ['TypeScript', 'typescript']] },
  { key: 'wrapped', title: '5BT Wrapped', kind: 'tool', art: ['#1f6feb', '#0a0f1e', 'Modern', 'barre'], tags: [['Node.js', 'nodejs'], ['WhatsApp', '#25d366']], url: 'https://www.albertopecchini.it/wrapped5BT/', code: `${GH}/albertopecchini.it/tools/wrapped` },
  { key: 'email', title: 'Posta OS', kind: 'tool', art: ['#9d00ff', '#2a0047', 'Monkey Bars', 'buste'], tags: [['C#', 'csharp'], ['Windows', '#0078d4'], ['HTML email', 'html5']], code: `${OS}/PostaOS`, download: `${RAW}/PostaOS/PostaOS.exe` },
  { key: 'pulizia', title: 'Pulizia OS', kind: 'tool', art: ['#ccff00', '#5d7a00', 'Vampyre', 'scintille'], tags: [['C#', 'csharp'], ['Windows', '#0078d4'], ['Terminal', '#3fb950']], code: `${OS}/PuliziaOS`, download: `${RAW}/PuliziaOS/PuliziaOS.exe` },
]

// Gli strumenti, in pillole come i ruoli di Discord: [nome, icona di icons.js].
export const TOOLS = [
  ['HTML', 'html5'], ['CSS', 'css'], ['JavaScript', 'javascript'], ['TypeScript', 'typescript'], ['React', 'react'], ['Node.js', 'nodejs'],
  ['Vite', 'vite'], ['three.js', 'threejs'], ['C#', 'csharp'], ['Python', 'python'], ['PowerShell', 'powershell'], ['Claude Code', 'claude'],
  ['AutoCAD', 'autocad'], ['Figma', 'figma'], ['FFmpeg', 'ffmpeg'], ['Vercel', 'vercel'], ['Git', 'git'],
]

export const LANGS = [
  { code: 'it', name: 'Italiano', flag: 'it', locale: 'it-IT' },
  { code: 'en', name: 'English', flag: 'us', locale: 'en-US' },
  { code: 'es', name: 'Español', flag: 'es', locale: 'es-ES' },
  { code: 'fr', name: 'Français', flag: 'fr', locale: 'fr-FR' },
  { code: 'de', name: 'Deutsch', flag: 'de', locale: 'de-DE' },
  { code: 'pt', name: 'Português', flag: 'pt', locale: 'pt-PT' },
  { code: 'ru', name: 'Русский', flag: 'ru', locale: 'ru-RU' },
  { code: 'ja', name: '日本語', flag: 'jp', locale: 'ja-JP' },
  { code: 'zh', name: '中文', flag: 'cn', locale: 'zh-CN' },
]
