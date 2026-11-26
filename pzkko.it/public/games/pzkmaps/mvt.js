// PZKMAPS: un lettore piccolo piccolo di tessere vettoriali (Mapbox Vector Tile, protobuf). Legge un solo strato e solo le
// linee: serve a punti.js per prendere le strade da una tessera di OpenStreetMap senza librerie.
//   leggi(buffer, 'transportation') → { estensione, feat: [{ tag: { class, surface… }, linee: [[[x, y]…]…] }] } oppure null
export function leggi(buf, vuole) {
  const b = new Uint8Array(buf); let p = 0
  const vi = () => { let r = 0, s = 0, x; do { x = b[p++]; r += (x & 127) * 2 ** s; s += 7 } while (x & 128); return r }
  const salta = (t) => { if (t === 0) vi(); else if (t === 1) p += 8; else if (t === 2) p += vi(); else if (t === 5) p += 4 }
  const dec = new TextDecoder()
  const strati = {}
  while (p < b.length) {
    const k = vi(), campo = k >> 3, tipo = k & 7
    if (campo !== 3 || tipo !== 2) { salta(tipo); continue }
    const fine = vi() + p
    const L = { nome: '', chiavi: [], valori: [], estensione: 4096, feat: [] }
    while (p < fine) {
      const k2 = vi(), c = k2 >> 3, t = k2 & 7
      if (c === 1) { const n = vi(); L.nome = dec.decode(b.subarray(p, p + n)); p += n }
      else if (c === 2) { const n = vi(); L.feat.push([p, p + n]); p += n }
      else if (c === 3) { const n = vi(); L.chiavi.push(dec.decode(b.subarray(p, p + n))); p += n }
      else if (c === 4) {
        const f = vi() + p; let v = null
        while (p < f) {
          const k3 = vi(), c3 = k3 >> 3, t3 = k3 & 7
          if (c3 === 1) { const n = vi(); v = dec.decode(b.subarray(p, p + n)); p += n }
          else if (c3 === 7) v = !!vi()
          else if (t3 === 0) v = vi()
          else salta(t3)
        }
        L.valori.push(v)
      }
      else if (c === 5) L.estensione = vi()
      else salta(t)
    }
    p = fine
    if (L.nome !== vuole) continue
    const out = []
    for (const [a, z] of L.feat) {
      p = a; const F = { tipo: 0, tag: {}, linee: [] }; let geo = null, tags = null
      while (p < z) {
        const k2 = vi(), c = k2 >> 3, t = k2 & 7
        if (c === 2 && t === 2) { const f = vi() + p; tags = []; while (p < f) tags.push(vi()) }
        else if (c === 3) F.tipo = vi()
        else if (c === 4 && t === 2) { const f = vi() + p; geo = []; while (p < f) geo.push(vi()) }
        else salta(t)
      }
      if (tags) for (let i = 0; i < tags.length; i += 2) F.tag[L.chiavi[tags[i]]] = L.valori[tags[i + 1]]
      if (geo && F.tipo === 2) {
        let x = 0, y = 0, i = 0, linea = null
        const zz = (n) => (n % 2 ? -(n + 1) / 2 : n / 2)
        while (i < geo.length) {
          const cmd = geo[i] & 7, n = geo[i] >> 3; i++
          if (cmd === 7) continue
          for (let j = 0; j < n; j++) { x += zz(geo[i++]); y += zz(geo[i++]); if (cmd === 1) { linea = [[x, y]]; F.linee.push(linea) } else linea.push([x, y]) }
        }
      }
      out.push(F)
    }
    p = fine
    strati[vuole] = { estensione: L.estensione, feat: out }
  }
  return strati[vuole] ?? null
}
