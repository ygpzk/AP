// Cosa la macchina del tempo non mostra (26.11.2026, Alberto: «controlla che in quel posto non ci
// siano dati sensibili che vadano a rompere tutta l'armonia della sicurezza»). Le stesse regole del
// resto del sito (tools/privacy.mjs, 12.11.2026: niente social, numeri, indirizzi e luoghi), più
// quelle che servono a testi scritti da altri e da me prima di allora: email private, data di
// nascita, partita IVA, nomi di persone, il server di casa.
//
// Le usano:
//   - src/templates/pages/tempo-pezzi.js, sui messaggi dei commit (le pagine generate);
//   - tools/tempo/oscura-pagine.mjs, sulle copie dei siti di allora (public/tempo/**/pagina/),
//     dentro il browser, prima di rifare le foto.
// Dove c'era il dato resta una barra («tolto per riservatezza»): si vede che c'era, non cosa.

// L'email pubblica di oggi (site.contact.email) resta; le altre no.
export const EMAIL_PUBBLICA = 'pzkko@yahoo.com'

// Ogni regola: [tipo, sorgente, flag]. Sorgenti e non RegExp, così passano al browser.
// L'ordine conta: le frasi lunghe prima dei pezzi.
export const REGOLE_TESTO = [
  // indirizzi con il civico
  ['indirizzo', String.raw`\b(?:[Vv]ia|[Vv]iale|[Ss]trada|[Pp]iazza|[Vv]icolo|[Cc]orso|[Ll]ocalità|[Ll]oc\.)\s+(?:[A-ZÀ-Ý][\wÀ-ÿ'’]+\s+){0,3}[A-ZÀ-Ý][\wÀ-ÿ'’]+,?\s*(?:n\.?\s*|n°\s*)?\d{1,4}[A-Za-z]?\b`, 'g'],
  // telefoni: cellulari italiani, fissi della zona, inglesi (con o senza prefisso)
  ['telefono', String.raw`(?<![\w/])(?:\+|00)?\s?(?:39[\s.\-]?)?3\d{2}[\s.\-]?\d{2,3}[\s.\-]?\d{2}[\s.\-]?\d{2,3}(?![\w])`, 'g'],
  ['telefono', String.raw`(?<![\w/])(?:\+|00)?\s?(?:39[\s.\-]?)?0\d{2,3}[\s.\-]?\d{5,7}(?![\w])`, 'g'],
  ['telefono', String.raw`(?<![\w/])(?:\+|00)?\s?44[\s.\-]?7\d{3}[\s.\-]?\d{3}[\s.\-]?\d{3}(?![\w])`, 'g'],
  // email (tranne quella pubblica, vedi oscura())
  ['email', String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)+`, 'g'],
  // coordinate: gradi e primi, decimali
  ['coordinate', String.raw`\b\d{1,2}\s?°\s?\d{1,2}(?:\s?[′'’]\s?(?:\d{1,2}(?:[.,]\d+)?\s?[″"”]\s?)?)?\s?[NSEOW]?\b`, 'gi'],
  ['coordinate', String.raw`(?<![\d.,])4[45][.,]\d{4,}(?:\s?[NSns])?\b|(?<![\d.,])10[.,]6\d{3,}(?:\s?[EOeo])?\b`, 'g'],
  // il CAP della provincia
  ['cap', String.raw`\b46\d{3}\b`, 'g'],
  // il paese, la provincia, i dintorni
  ['luogo', String.raw`rivalta(?:\s*sul\s*mincio)?(?:\s*\(MN\))?|(?:sul\s+)?mincio|porto\s+mantovano|mantovan[aoei]|mantova|rodigo|goito|curtatone|castellucchio|marmirolo|ostiglia|\(MN\)|\bMN\b(?=\W|$)`, 'gi'],
  // social e account
  ['social', String.raw`@?albertoxpecchini|yungpzkko|@?ygpzk\b|alberto-h7y3h`, 'gi'],
  // il server di casa
  ['server', String.raw`[\w-]*\.?tail[0-9a-f]{6,}\.ts\.net|desktop-inpvhr2|tail6c90b3`, 'gi'],
  // la data di nascita
  ['nascita', String.raw`\b28\s?[/.\-]\s?0?6\s?[/.\-]\s?(?:20)?06\b|\b28\s+giugno\s+2006\b`, 'gi'],
  // codici fiscali e partite IVA (11 cifre, o 16 caratteri)
  ['fiscale', String.raw`\b(?:IT\s?)?\d{11}\b|\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b`, 'g'],
  // persone private nominate nei commit
  ['persona', String.raw`\bGinger\b|\bMiMa\b`, 'g'],
]

const regole = REGOLE_TESTO.map(([tipo, s, f]) => [tipo, new RegExp(s, f)])

// un dato da togliere? (l'email pubblica resta)
const daTogliere = (tipo, m) => !(tipo === 'email' && m.toLowerCase() === EMAIL_PUBBLICA)

/**
 * Sostituisce i dati con `sost(match, tipo)`. I pezzi da sostituire si cercano tutti sul testo di
 * partenza, poi si cuciono: così una regola non riscrive il lavoro dell'altra.
 */
export function oscura(testo, sost = () => '▮▮▮') {
  const s = String(testo ?? '')
  const pezzi = []
  for (const [tipo, re] of regole) {
    re.lastIndex = 0
    for (let m; (m = re.exec(s)); ) {
      if (!m[0]) { re.lastIndex++; continue }
      if (daTogliere(tipo, m[0])) pezzi.push({ da: m.index, a: m.index + m[0].length, tipo })
    }
  }
  if (!pezzi.length) return s
  pezzi.sort((x, y) => x.da - y.da || y.a - x.a)
  let out = ''
  let qui = 0
  for (const p of pezzi) {
    if (p.da < qui) continue // dentro uno già tolto
    out += s.slice(qui, p.da) + sost(s.slice(p.da, p.a), p.tipo)
    qui = p.a
  }
  return out + s.slice(qui)
}

/** C'è qualcosa da togliere? */
export const daOscurare = (testo) => oscura(testo, () => '\u0000') !== String(testo ?? '')
