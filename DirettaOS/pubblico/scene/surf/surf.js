// Diretta OS · «Surf con lei», a schermo intero: l'illustrazione al tramonto (fatta con Replicate) riempie la tela,
// sopra ci sono lo zoom lento, la schiuma, gli spruzzi, i cuori e il medaglione con le espressioni che si alternano.
// Le animazioni sono CSS (le regole .sf-* di /scene.css): le fa avanzare giro.js, e si fermano quando la scena è spenta.

const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild }

// la foto è 16:9 come la tela; schiuma, spruzzi e cuori erano disegnati su una tela 1000 × 600 che la ritagliava ai
// lati: translate(60) scale(1.8) li rimette sugli stessi punti della foto
function svgSurf() {
  return `<svg class="sf-mappa" viewBox="0 0 1920 1080" role="img" aria-label="Io e lei sul longboard, al tramonto">
    <defs>
      <radialGradient id="sf-vignetta" cx=".5" cy=".45" r=".72"><stop offset=".58" stop-color="#0b090e" stop-opacity="0"/><stop offset="1" stop-color="#0b090e" stop-opacity=".34"/></radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="#0b090e"/>
    <g class="sf-mondo">
      <image href="/scene/surf.webp" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice"/>
      <g transform="translate(60 0) scale(1.8)">
        <g class="sf-schiuma-anim" fill="#f5fffb"><circle cx="196" cy="338" r="3.4"/><circle cx="242" cy="302" r="2.6"/><circle cx="292" cy="278" r="3.8"/><circle cx="344" cy="260" r="2.4"/><circle cx="386" cy="290" r="3.2"/><circle cx="426" cy="326" r="2.2"/></g>
        <g class="sf-spruzzi" fill="#eafff9"><circle class="p1" cx="512" cy="500" r="4.2"/><circle class="p2" cx="558" cy="526" r="3"/><circle class="p3" cx="470" cy="532" r="3.8"/><circle class="p4" cx="628" cy="540" r="2.8"/><circle class="p5" cx="430" cy="556" r="4.4"/><circle class="p6" cx="690" cy="512" r="2.4"/></g>
        <g class="sf-cuori" fill="#fff3c4" stroke="#0b090e" stroke-width="2.2" stroke-linejoin="round">
          <g transform="translate(610 338)"><path class="c1" d="M0 10C-12 0-16-6-16-11c0-6 5-10 10-10 3 0 5 2 6 4 1-2 3-4 6-4 5 0 10 4 10 10 0 5-4 11-16 21z"/></g>
          <g transform="translate(672 306)"><path class="c2" d="M0 10C-12 0-16-6-16-11c0-6 5-10 10-10 3 0 5 2 6 4 1-2 3-4 6-4 5 0 10 4 10 10 0 5-4 11-16 21z"/></g>
          <g transform="translate(646 360)"><path class="c3" d="M0 10C-12 0-16-6-16-11c0-6 5-10 10-10 3 0 5 2 6 4 1-2 3-4 6-4 5 0 10 4 10 10 0 5-4 11-16 21z"/></g>
        </g>
      </g>
    </g>
    <rect width="1920" height="1080" fill="url(#sf-vignetta)"/>
    <g class="sf-scritta" transform="translate(132 176) rotate(-3)">
      <text x="0" y="0" font-family="Permanent Marker, gg sans" font-size="104" fill="#fff" stroke="#0b090e" stroke-width="22" paint-order="stroke" stroke-linejoin="round">surf con lei</text>
    </g>
  </svg>`
}

const VISO_LUI = ['/scene/volti/alberto-sorriso.png', '/scene/volti/alberto-occhiolino.png', '/scene/volti/alberto-risata.png', '/scene/volti/alberto-sorpresa.png']
const VISO_LEI = ['/scene/volti/lei-risata.png', '/scene/volti/lei-occhiolino.png', '/scene/volti/lei-sorriso.png', '/scene/volti/lei-sorpresa.png']

export function crea() {
  const el = $(`<div class="sf piena">${svgSurf()}
    <div class="sf-noi"><span class="a"><img alt=""></span><span class="b"><img alt=""></span></div>
  </div>`)
  const visi = [el.querySelector('.sf-noi .a img'), el.querySelector('.sf-noi .b img')]
  const facce = [el.querySelector('.sf-noi .a'), el.querySelector('.sf-noi .b')]
  let il = 0, ilei = 0, turno = 0, prossimo = 0, tenute = null
  visi[0].src = VISO_LUI[il] // (a sinistra c'è lui, come nella scena)
  visi[1].src = VISO_LEI[ilei]
  function scatto(e) { e.classList.remove('cambia'); void e.offsetWidth; e.classList.add('cambia') }
  function cambia() {
    if (turno++ % 2 === 0) { ilei = (ilei + 1) % VISO_LEI.length; visi[1].src = VISO_LEI[ilei]; scatto(facce[1]) }
    else { il = (il + 1) % VISO_LUI.length; visi[0].src = VISO_LUI[il]; scatto(facce[0]) }
  }
  return {
    el,
    mostra(su) {
      prossimo = 0
      // (le otto espressioni si tengono pronte solo mentre la scena è in onda)
      tenute = su ? [...VISO_LUI, ...VISO_LEI].map((f) => { const im = new Image(); im.src = f; return im }) : null
    },
    giro(dt, t) {
      if (!prossimo) { prossimo = t + 4.2; return }
      if (t >= prossimo) { prossimo = t + 4.2; cambia() }
    },
  }
}
