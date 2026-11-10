// I pacchetti di sigarette di Deutschland (9.11.2026, «Deutschland 2»; dalla notte, «Deutschland 3», solo i dati): i 16
// pacchetti inventati della macchinetta, uno per tag del catalogo più «JMA» (tutto). Prima stavano su una stecca in alto e
// filtravano l'album; adesso stanno SPARSI SUL TAVOLO fra le foto (tavolo.js, Alberto: «le sigarette voglio vederle meglio,
// mettile tra le foto») e ognuno apre il suo album in sovrapposizione (packung.js). Ogni pacchetto ha il suo nome swag
// tedesco, il suo carattere (pacchi.css, i woff2 di /fonts/) e il suo colore; l'immagine è /art/deutschland/pacchi/<tag>.webp
// («alles» per JMA) e se manca c'è segnaposto.svg col nome scritto sopra dall'HTML.

/** I 16 pacchetti: tag (null = tutto), nome sul pacchetto, carattere (pacchi.css), colore del pacchetto, colore della scritta. */
export const PACCHI = [
  { tag: null, nome: 'JMA', font: '"Anton", Impact, sans-serif', colore: '#ffd400', testo: '#111' },
  { tag: 'pekko', nome: 'luckypzkko', font: '"Abril Fatface", serif', colore: '#d0021b', testo: '#fff' },
  { tag: 'mikas', nome: 'Mikas\'s Smoke', font: '"Permanent Marker", cursive', colore: '#39a0ed', testo: '#111' },
  { tag: 'jonny', nome: 'Jonny\'s Tobacco', font: '"Special Elite", monospace', colore: '#2e8b57', testo: '#fff' },
  { tag: 'jella', nome: 'Jella Leicht', font: '"Caveat", cursive', colore: '#e75480', testo: '#fff' },
  { tag: 'cibo', nome: 'Brezn Gold', font: '"Alfa Slab One", serif', colore: '#e08a1e', testo: '#111' },
  { tag: 'paesaggi', nome: 'Alpenblick', font: '"Archivo Black", sans-serif', colore: '#7fb3d5', testo: '#111' },
  { tag: 'natura', nome: 'Schwarzwald', font: '"Homemade Apple", cursive', colore: '#1f5f2a', testo: '#fff' },
  { tag: 'strada', nome: 'Autobahn 100', font: '"Rubik Mono One", monospace', colore: '#8a8f98', testo: '#111' },
  { tag: 'auto', nome: 'GLA Grau', font: '"Bungee", sans-serif', colore: '#3c3f44', testo: '#fff' },
  { tag: 'screenshot', nome: 'Bildschirm', font: '"Fake Receipt", monospace', colore: '#b8c0cc', testo: '#111' },
  { tag: 'hotel', nome: 'Nachtportier', font: '"Nothing You Could Do", cursive', colore: '#5b2c83', testo: '#fff' },
  { tag: 'mezzi', nome: 'S-Bahn Blau', font: '"Black Ops One", sans-serif', colore: '#0a3d91', testo: '#fff' },
  { tag: 'alcool', nome: 'Jäger Hirsch 56', font: '"Shrikhand", serif', colore: '#5c3a21', testo: '#ffd400' },
  { tag: 'foto', nome: 'Südkurve', font: '"Rock Salt", cursive', colore: '#7a0012', testo: '#fff' },
  { tag: 'video', nome: 'Cannstatter', font: '"Reenie Beanie", cursive', colore: '#ffffff', testo: '#e2001a' },
]
export const CARTELLA = '/art/deutschland/pacchi/'
export const SEGNAPOSTO = `${CARTELLA}segnaposto.svg`

/** Il pacchetto di un tag (null o 'alles' = JMA). */
export const paccoDi = (tag) => PACCHI.find((p) => p.tag === (tag === 'alles' ? null : tag ?? null)) ?? PACCHI[0]
/** L'immagine del pacchetto. */
export const immagineDi = (p) => `${CARTELLA}${p.tag ?? 'alles'}.webp`
/** Quante foto per tag (null = tutte). */
export function conteggi(manifesto) {
  const n = new Map([[null, manifesto.foto.length]])
  for (const f of manifesto.foto) for (const t of f.tag ?? []) n.set(t, (n.get(t) ?? 0) + 1)
  return n
}
