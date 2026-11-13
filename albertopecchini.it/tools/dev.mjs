// Dev server dei siti col loro dominio, accanto a `npm run dev` (albertopecchini.it, :5173):
//
//   npm run dev:bcp    → bettercallpekko.it su :5181 (Vite con SITE=bcp, database delle visite in memoria)
//
// Porte fisse perché gli indirizzi inoltrati di VS Code (pannello Porte) restino validi. Come
// `npm run dev`: in ascolto su tutte le interfacce, con l'indirizzo Local e quello Network.
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

// bettercallpekko.it è il sito Vite con SITE=bcp. La variabile va messa prima che Vite
// carichi vite.config.js: site-pages e src/data/assistenza.js la leggono all'import.
// BCP_STORE=memory vince sulla chiave del Blob in .env.local: in locale non si scrive
// mai nel database vero. Cache delle dipendenze a parte, per non disturbare `npm run dev`.
const bcp = async (port) => {
  Object.assign(process.env, { SITE: 'bcp', BCP_STORE: 'memory' })
  const { createServer } = await import('vite')
  const dev = await createServer({ root: ROOT, cacheDir: 'node_modules/.vite-bcp', server: { port, strictPort: true } })
  await dev.listen()
  dev.printUrls()
  dev.bindCLIShortcuts({ print: true })
}

const SITI = { bcp: () => bcp(5181) }
const sito = SITI[process.argv[2]]
if (!sito) {
  console.error(`uso: node tools/dev.mjs ${Object.keys(SITI).join('|')}`)
  process.exit(1)
}
await sito()
