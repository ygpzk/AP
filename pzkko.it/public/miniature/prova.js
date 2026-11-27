// la pagina di prova delle miniature vive: /miniature/?solo=synth&tempi=0.5,2,4&su=1&larghezza=360
import { PROJECTS } from '/assets/config.js'
import { MEDIA } from '/assets/media.js'
import { avvia } from '/assets/miniature/index.js'

const q = new URLSearchParams(location.search)
const solo = q.get('solo')?.split(',').filter(Boolean)
const tempi = q.get('tempi')?.split(',').map(Number).filter(Number.isFinite)
const su = q.get('su') === '1'
const larghezze = (q.get('larghezza') || (solo ? '480,240' : '360')).split(',').map(Number)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }

function art(p, t) {
  const m = MEDIA[p.key]
  const [c1, c2, font, pat] = p.art || ['#9d00ff', '#2a0047', 'Pricedown', 'punti']
  const ink = lum(hex(c1)) > 0.45 ? '#141414' : '#ffffff'
  return `<span class="art" data-mini="${esc(p.key)}" ${t != null ? `data-mini-t="${t}"` : ''} data-pat="${esc(pat)}" style="--c1:${esc(c1)};--c2:${esc(c2)};--ink:${ink};--af:'${esc(font)}';--fs:${Math.min(11.5, 104 / Math.max(...p.title.split(' ').map((w) => w.length))).toFixed(1)}cqw">
    <span class="art__title">${esc(p.title)}</span>
    ${m ? `<span class="art__shot"><img src="${esc(m.cover)}" alt="" width="1280" height="720" decoding="async" draggable="false"></span>` : ''}
  </span>`
}

const lista = PROJECTS.filter((p) => !solo || solo.includes(p.key))
const fisso = tempi?.length === 1 ? tempi[0] : null // un tempo solo: tutte ferme lì
document.getElementById('griglia').innerHTML = lista.map((p) => {
  const celle = (tempi?.length > 1 ? tempi : [null]).flatMap((t) => larghezze.map((w) =>
    `<div class="mprova__cella"><button type="button" class="media" ${su ? 'data-mini-su' : ''} style="width:${w}px">${art(p, t ?? fisso)}</button><small>${esc(p.key)} · ${w}px${t != null ? ` · t=${t}s` : ''}</small></div>`))
  return `<section class="mprova__riga" data-tempi="${esc((tempi || []).join(','))}">${celle.join('')}</section>`
}).join('')

// con ?tempi ogni cella è un fotogramma fermo al suo tempo (data-mini-t); senza, girano dal vivo
avvia()
// per lo script delle foto: quante sono pronte
addEventListener('mini:pronta', () => { document.documentElement.dataset.pronte = String(document.querySelectorAll('.art.is-vivo').length) })
