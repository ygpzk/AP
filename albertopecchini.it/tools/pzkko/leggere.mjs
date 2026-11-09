#!/usr/bin/env node
// Le immagini leggere del muro (6.11.2026, Alberto: «altissima qualità senza perdite ma leggerissimo»): le stesse
// immagini di art/, alla misura a cui si vedono davvero. Gli originali restano dove sono (li usano la storia, la 404, la
// scena 3D e chi li rigenera); queste si rifanno da loro con questo comando, da albertopecchini.it/:
//
//   node tools/pzkko/leggere.mjs
//
// - art/social/: le illustrazioni dei volantini dei social. Sono solo inchiostro e la pagina le stampa sulla carta in
//   multiply: stese sul bianco danno lo stesso identico risultato (carta × bianco = carta), e senza il canale della
//   trasparenza, che era metà del file. Larghe 360 px: sul muro un'illustrazione è larga al più ~100 px, quindi ce n'è per
//   uno schermo a 3× e per lo zoom. Qualità 92.
// - art/leggere/: le bestie e la goccia, che sul muro sono grandi 9–26 px e pesavano 9–68 KB l'una: a 3× della misura a
//   cui si vedono, senza perdite. Le misure nuove sono scritte in index.html (width, height, --ax, --ay e K delle mosche).
import { mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = join(QUI, '../..'), ART = join(SITO, 'pzkko/art')
const sharp = createRequire(join(SITO, 'package.json'))('sharp')

// [da, a, larghezza]
const SOCIAL = [['arte1/macchina', 'macchina'], ['arte4/telefono', 'telefono'], ['arte1/gatto', 'gatto'], ['arte1/cornetta', 'cornetta'], ['arte1/piccione', 'piccione'], ['arte1/caffe', 'caffe']]
// la scala delle mosche è una per tutte e quattro le foto (stanno impilate col corpo allineato: MOSCA in index.html)
export const MOSCA = 0.4
const LEGGERE = [
  ['mosche/mosca', 'mosca', { scala: MOSCA }], ['mosche/mosca-zampe', 'mosca-zampe', { scala: MOSCA }], ['mosche/mosca-vola', 'mosca-vola', { scala: MOSCA }], ['mosche/mosca-vola2', 'mosca-vola2', { scala: MOSCA }],
  ['bestiole/formica', 'formica', { larga: 44 }], ['bestiole/formica-lato', 'formica-lato', { larga: 66 }],
  ['bestiole/goccia-cade', 'goccia', { larga: 36 }], ['bestiole/spruzzo', 'spruzzo', { larga: 104 }],
]

const kb = async (f) => ((await stat(f)).size / 1024).toFixed(1)
await mkdir(join(ART, 'social'), { recursive: true })
await mkdir(join(ART, 'leggere'), { recursive: true })
let prima = 0, dopo = 0
for (const [da, a] of SOCIAL) {
  const src = join(ART, `${da}.webp`), dst = join(ART, 'social', `${a}.webp`)
  const i = await sharp(src).flatten({ background: '#ffffff' }).resize({ width: 360, kernel: 'lanczos3', withoutEnlargement: true }).webp({ quality: 92, effort: 6, smartSubsample: true }).toFile(dst)
  prima += (await stat(src)).size; dopo += i.size
  console.log(`social/${a}.webp  ${i.width}×${i.height}  ${await kb(src)} → ${await kb(dst)} KB`)
}
for (const [da, a, { scala, larga }] of LEGGERE) {
  const src = join(ART, `${da}.webp`), dst = join(ART, 'leggere', `${a}.webp`)
  const m = await sharp(src).metadata()
  const i = await sharp(src).resize({ width: Math.round(scala ? m.width * scala : larga), kernel: 'lanczos3' }).webp({ lossless: true, effort: 6 }).toFile(dst)
  prima += (await stat(src)).size; dopo += i.size
  console.log(`leggere/${a}.webp  ${m.width}×${m.height} → ${i.width}×${i.height}  ${await kb(src)} → ${await kb(dst)} KB`)
}
console.log(`in tutto ${(prima / 1024).toFixed(0)} → ${(dopo / 1024).toFixed(0)} KB`)
