#!/usr/bin/env node
// I fasci di miniature di Deutschland (9.11.2026): le 967 miniature piccole (dati\s\, 360 px webp, ~11 KB) una per una
// sarebbero 967 richieste (B2 ne dà 2.500 al giorno; dal Funnel 0,5 s l'una). Qui si impacchettano a 40 per fascio
// nell'ordine del manifesto (dati\foto.json, che porta `fascio: n` per ogni voce) → dati\f\<n>.bin, ~400 KB l'uno:
// 25 richieste per tutto l'album. Lo spacchetta pzkko/deutschland/rete.js (stesso formato, da tenere uguale):
//
//   4 byte big-endian = lunghezza L della testa
//   L byte di JSON  { "<file s>": [offset, len], … }   (offset dall'inizio dei dati, cioè dopo la testa)
//   i webp in fila
//
// Ordine: cataloga.mjs → manifesto.mjs (assegna `fascio`) → fasci.mjs. Si scrive in modo atomico (accanto e rinomina); un
// fascio uguale a quello che c'è non si riscrive (carica.mjs guarda sha1 e dimensione, così non lo ricarica). I fasci
// che il manifesto non nomina più si tolgono.
//
//   node tools/pzkko/deutschland/fasci.mjs             scrive dati\f\<n>.bin per tutti i fasci del manifesto
//   node tools/pzkko/deutschland/fasci.mjs --verifica  rilegge ogni fascio e controlla che ogni miniatura sia identica al file
//   node tools/pzkko/deutschland/fasci.mjs --prova     dice cosa farebbe
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync, rmSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { DATI, PER_FASCIO, leggiJson, argomenti, die } from './comune.mjs'

const args = argomenti()
const F = path.join(DATI, 'f'), S = path.join(DATI, 's')
const manifesto = leggiJson(path.join(DATI, 'foto.json'))
if (!manifesto?.foto) die('manca dati\\foto.json: prima manifesto.mjs')
if (manifesto.v < 2) die('il manifesto è v1 (senza fasci): rilancia manifesto.mjs')
mkdirSync(F, { recursive: true })

/** Impacchetta: [{ file, dati: Buffer }] → Buffer del fascio. */
export function impacchetta(voci) {
  const testa = {}
  let offset = 0
  for (const v of voci) { testa[v.file] = [offset, v.dati.length]; offset += v.dati.length }
  const json = Buffer.from(JSON.stringify(testa), 'utf8')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(json.length, 0)
  return Buffer.concat([len, json, ...voci.map((v) => v.dati)])
}
/** Spacchetta: Buffer → { "<file>": Buffer } (lo stesso che fa rete.js nel browser). */
export function spacchetta(buf) {
  const L = buf.readUInt32BE(0)
  if (!(L > 1 && 4 + L <= buf.length)) throw new Error('fascio rotto (testa)')
  const testa = JSON.parse(buf.subarray(4, 4 + L).toString('utf8'))
  const base = 4 + L, out = {}
  for (const [file, [da, len]] of Object.entries(testa)) {
    if (!(da >= 0 && len >= 0 && base + da + len <= buf.length)) throw new Error(`fascio rotto (${file})`)
    out[file] = buf.subarray(base + da, base + da + len)
  }
  return out
}
const sha1 = (b) => createHash('sha1').update(b).digest('hex')

// i fasci del manifesto: n → [file s] nell'ordine delle foto
const fasci = new Map()
for (const f of manifesto.foto) {
  if (typeof f.fascio !== 'number' || !f.s) continue
  ;(fasci.get(f.fascio) ?? fasci.set(f.fascio, []).get(f.fascio)).push(f.s)
}
if (!fasci.size) die('nessuna voce del manifesto ha `fascio` e `s`: cataloga.mjs (derivate v3) e poi manifesto.mjs')

let scritti = 0, uguali = 0, byte = 0, mancanti = 0
for (const [n, file] of [...fasci].sort((a, b) => a[0] - b[0])) {
  const voci = []
  for (const nome of file) {
    const p = path.join(S, nome)
    if (!existsSync(p)) { mancanti++; console.error(`  ✗ manca dati\\s\\${nome} (fascio ${n})`); continue }
    voci.push({ file: nome, dati: readFileSync(p) })
  }
  const buf = impacchetta(voci)
  byte += buf.length
  const out = path.join(F, `${n}.bin`)
  if (existsSync(out) && sha1(readFileSync(out)) === sha1(buf)) { uguali++; continue }
  if (!args.prova) { const tmp = `${out}.${process.pid}.tmp`; writeFileSync(tmp, buf); renameSync(tmp, out) }
  scritti++
}
// i fasci che non servono più
let via = 0
for (const nome of readdirSync(F)) {
  const m = /^(\d+)\.bin$/.exec(nome)
  if (!m || fasci.has(Number(m[1]))) continue
  if (!args.prova) rmSync(path.join(F, nome))
  via++
}
console.log(`${fasci.size} fasci da ${PER_FASCIO} (${manifesto.foto.filter((f) => typeof f.fascio === 'number').length} miniature, ${(byte / 1e6).toFixed(1)} MB, ${Math.round(byte / fasci.size / 1e3)} KB l'uno): ${scritti} scritti, ${uguali} già uguali${via ? `, ${via} vecchi tolti` : ''}${mancanti ? `, ${mancanti} MINIATURE MANCANTI` : ''}${args.prova ? ' · PROVA: non scrivo niente' : ''}`)

if (args.verifica) {
  let ok = 0, ko = 0
  for (const [n, file] of fasci) {
    const dentro = spacchetta(readFileSync(path.join(F, `${n}.bin`)))
    for (const nome of file) { const a = dentro[nome], b = existsSync(path.join(S, nome)) ? readFileSync(path.join(S, nome)) : null; if (a && b && a.equals(b)) ok++; else { ko++; console.error(`  ✗ ${nome} nel fascio ${n} non è uguale al file`) } }
  }
  console.log(`verifica: ${ok} miniature identiche, ${ko} diverse`)
  if (ko) process.exitCode = 1
}
if (mancanti) process.exitCode = 1
