// pzkko.it: tutto quello che si cambia senza toccare il codice.

export const CONFIG = {
  // L'ID utente Discord. I dati dal vivo (avatar, decorazione, stato, Spotify,
  // giochi, stato personalizzato) arrivano da Lanyard: bisogna restare nel server
  // https://discord.gg/lanyard.
  discordId: '459791358899519498',

  // Il profilo pubblico (banner, tema, bio, badge, collegamenti) arriva da
  // dcdn.dstn.to; se non risponde si usano i valori qui sotto, presi il 17.11.2026.
  profileApi: 'https://dcdn.dstn.to/profile/',
  profile: {
    username: 'pzkko',
    displayName: 'pzkko',
    avatar: 'd4c872e1182f1e7ed9ef6d54cf17666b',
    banner: 'c80cfe7ab2c618a7ced2e688fdfc80ff',
    bannerColor: '#110f10',
    theme: ['#ccff00', '#9d00ff'],
    bio: 'alberto, from italy. trained surveyor, now studying construction & land management on a dual degree between italy and san marino. i also design and build websites and brand identities, hand-written code, no frameworks. building with claude code daily: custom skills, tools and too many side projects.',
    decoration: 'a_820da11285b1a68ad94c18fd9dcf8ca8',
    guild: { tag: 'NODE', id: '425824580918181889', badge: 'de1a71e54518bf5b4b1e271f823093a0' },
    badges: [
      { id: 'premium', icon: '7294f50817c5fe9fd98631d230ac2e5d', description: 'Subscriber since 11/11/26', link: 'https://discord.com/settings/premium' },
      { id: 'guild_booster_lvl1', icon: '51040c70d4f20a921ad6674ff86fc95c', description: 'Server boosting since 11/11/26', link: 'https://discord.com/settings/guild-boosting' },
      { id: 'hypesquad_house_3', icon: '3aa41de486fa12454c3761e8e223442e', description: 'HypeSquad Balance' },
      { id: 'legacy_username', icon: '6de6d34650760ba5551a79732e98ed60', description: 'Originally known as Pzkko#1631' },
    ],
    connections: [
      { type: 'domain', name: 'pzkko.it', id: 'pzkko.it' },
      { type: 'github', name: 'ygpzk', id: '254122358' },
      { type: 'steam', name: 'ygpzk', id: '76561198971719489' },
      { type: 'twitch', name: 'pzkko', id: '502284033' },
    ],
  },

  // Il sito principale, quello serio.
  mainSite: { url: 'https://www.albertopecchini.it', label: 'albertopecchini.it' },
  domain: 'pzkko.it',

  // Contatore delle visite con GoatCounter (gratis, senza cookie): scrivi qui il
  // codice del sito, es. 'pzkko'. Vuoto = niente contatore e niente script.
  goatcounter: '',

  updated: '2026-11-17',
}

const SI = 'https://cdn.simpleicons.org'

// I social. `icon` è lo slug di simpleicons.org; `dark` il colore del marchio
// col tema scuro quando quello normale è nero, `light` col tema chiaro.
export const SOCIALS = [
  { key: 'discord', name: 'Discord', handle: 'pzkko', url: 'https://discord.com/users/459791358899519498', icon: 'discord' },
  { key: 'instagram', name: 'Instagram', handle: 'albertoxpecchini', url: 'https://www.instagram.com/albertoxpecchini/', icon: 'instagram' },
  { key: 'instagram2', name: 'Instagram', handle: 'pzkko', url: 'https://www.instagram.com/pzkko/', icon: 'instagram' },
  { key: 'tiktok', name: 'TikTok', handle: 'albertoxpecchini', url: 'https://www.tiktok.com/@albertoxpecchini', icon: 'tiktok', dark: 'ffffff' },
  { key: 'x', name: 'X', handle: 'ygpzk', url: 'https://x.com/ygpzk', icon: 'x', dark: 'ffffff' },
  { key: 'youtube', name: 'YouTube', handle: 'alberto-h7y3h', url: 'https://www.youtube.com/@alberto-h7y3h', icon: 'youtube' },
  { key: 'threads', name: 'Threads', handle: 'albertoxpecchini', url: 'https://www.threads.net/@albertoxpecchini', icon: 'threads', dark: 'ffffff' },
  { key: 'twitch', name: 'Twitch', handle: 'pzkko', url: 'https://www.twitch.tv/pzkko', icon: 'twitch' },
  { key: 'kick', name: 'Kick', handle: 'albertoxpecchini', url: 'https://kick.com/albertoxpecchini', icon: 'kick', light: '3a9b0e' },
  { key: 'steam', name: 'Steam', handle: 'ygpzk', url: 'https://steamcommunity.com/profiles/76561198971719489', icon: 'steam', dark: 'ffffff' },
  { key: 'spotify', name: 'Spotify', handle: 'pzkko', url: 'https://open.spotify.com/user/qeefs44bv4bpoa7dk8epagrxf', icon: 'spotify' },
  { key: 'reddit', name: 'Reddit', handle: 'u/yungpzkko', url: 'https://www.reddit.com/user/yungpzkko/', icon: 'reddit' },
  { key: 'pinterest', name: 'Pinterest', handle: 'albertoxpecchini', url: 'https://www.pinterest.com/albertoxpecchini/', icon: 'pinterest' },
  { key: 'snapchat', name: 'Snapchat', handle: 'albertoxpecchini', url: 'https://www.snapchat.com/add/albertoxpecchini', icon: 'snapchat', light: 'd4b800' },
  { key: 'telegram', name: 'Telegram', handle: 'albertopecchini', url: 'https://t.me/albertopecchini', icon: 'telegram' },
  { key: 'github', name: 'GitHub', handle: 'ygpzk', url: 'https://github.com/ygpzk', icon: 'github', dark: 'ffffff' },
]
export const iconUrl = (s, dark) => `${SI}/${s.icon}${dark && s.dark ? '/' + s.dark : !dark && s.light ? '/' + s.light : ''}`

// I progetti per svago. `cover` è un'immagine in /media/ oppure il nome di una
// copertina disegnata in covers.js. I testi stanno in i18n.js sotto `projects`.
const GH = 'https://github.com/ygpzk/AP/tree/main'
export const PROJECTS = [
  { key: 'matricios', title: 'MatriciOS', cover: 'matricios', tags: ['C#', 'Windows', 'Terminal'], code: `${GH}/MatriciOS` },
  { key: 'lezioni', title: 'Lezioni', cover: '/media/lezioni.webp', tags: ['Python', 'Whisper', 'LaTeX'], code: `${GH}/albertopecchini.it/tools/lezioni` },
  { key: 'zero', title: 'Cercapersone zero', cover: 'zero', tags: ['three.js', 'JavaScript', 'LCD 1-bit'] },
  { key: 'giochini', title: 'Giochini', cover: '/media/giochini.webp', media: ['/media/giochini-manifesto.webp'], tags: ['three.js', 'chiptune', '$pzk'] },
  { key: 'serranda', title: 'La serranda', cover: '/media/serranda.webp', media: ['/media/serranda-intera.webp'], tags: ['HTML', 'CSS', 'gpt-image-2'] },
  { key: 'wrapped', title: 'Wrapped 5BT', cover: 'wrapped', tags: ['Node.js', 'WhatsApp'], url: 'https://www.albertopecchini.it/wrapped5BT/', code: `${GH}/albertopecchini.it/tools/wrapped` },
  { key: 'email', title: 'Email', cover: 'email', tags: ['Node.js', 'HTML email'], code: `${GH}/albertopecchini.it/tools/email-generator` },
  { key: 'pulizia', title: 'Pulizia', cover: 'pulizia', tags: ['Node.js', 'PowerShell'] },
  { key: 'parole', title: 'Parole', cover: 'parole', tags: ['React', 'TypeScript'] },
  { key: 'trivia', title: 'Trivia', cover: 'trivia', tags: ['React', 'TypeScript'] },
]

const DV = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'
// Gli strumenti, in pillole come i ruoli di Discord.
export const TOOLS = [
  { title: 'HTML', icon: `${DV}/html5/html5-original.svg` },
  { title: 'CSS', icon: `${DV}/css3/css3-original.svg` },
  { title: 'JavaScript', icon: `${DV}/javascript/javascript-original.svg` },
  { title: 'TypeScript', icon: `${DV}/typescript/typescript-original.svg` },
  { title: 'React', icon: `${DV}/react/react-original.svg` },
  { title: 'Node.js', icon: `${DV}/nodejs/nodejs-original.svg` },
  { title: 'Vite', icon: `${DV}/vitejs/vitejs-original.svg` },
  { title: 'three.js', icon: `${SI}/threedotjs`, dark: `${SI}/threedotjs/ffffff` },
  { title: 'C#', icon: `${DV}/csharp/csharp-original.svg` },
  { title: 'Python', icon: `${DV}/python/python-original.svg` },
  { title: 'PowerShell', icon: `${DV}/powershell/powershell-original.svg` },
  { title: 'Claude Code', icon: `${SI}/claude` },
  { title: 'AutoCAD', icon: `${SI}/autocad`, dark: `${SI}/autocad/ffffff` },
  { title: 'Figma', icon: `${DV}/figma/figma-original.svg` },
  { title: 'FFmpeg', icon: `${SI}/ffmpeg` },
  { title: 'Vercel', icon: `${SI}/vercel`, dark: `${SI}/vercel/ffffff` },
  { title: 'Git', icon: `${DV}/git/git-original.svg` },
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
