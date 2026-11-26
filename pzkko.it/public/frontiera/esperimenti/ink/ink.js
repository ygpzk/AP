// ink.js — «Muro liquido»: inchiostro neon che scorre sul muro.
//
// Tecnologia: WebGL2 (due texture ping-pong, un shader di advezione e uno di
// splat). Se WebGL2 non c'è o gli shader non compilano, ripiega su Canvas 2D
// con le scie sfumate: stesso disegno, stessa palette, stesso tasto «salva».
//
// Il motore non sa niente della grafica: riceve i punti del puntatore e li
// trasforma in macchie. La finestra e i tasti sono quelli di shell.js.
//
//   apri()  apre il muro (una volta sola per volta)

import { creaDialogo, scarica } from '../../shell.js'

const W = 1280
const H = 720
const PALETTE = [
  ['lime', '#ccff00'],
  ['viola', '#9d00ff'],
  ['ciano', '#00e0ff'],
  ['arancio', '#ff6a00'],
  ['bianco', '#ffffff'],
  ['rosso', '#ff2d55'],
]

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'ink',
    titolo: 'Muro liquido',
    tech: 'WebGL2 · shader',
    voce: 'Inchiostro neon che scorre e non si asciuga. Disegna col dito o col puntatore; il muro fa il resto.',
    larga: true,
    corpo: `
      <div class="lab-colonna">
        <div class="lab-riga lab-riga--tra">
          <div class="lab-riga" role="group" aria-label="il colore">
            ${PALETTE.map(([nome, colore], i) => `
              <button type="button" class="lab-colore${i === 0 ? ' is-on' : ''}" data-colore="${colore}"
                aria-label="${nome}" aria-pressed="${i === 0}" style="--colore:${colore}">
                <span></span>
              </button>`).join('')}
          </div>
          <div class="lab-riga">
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-auto aria-pressed="true">auto: sì</button>
            <button type="button" class="lab-tasto lab-tasto--fantasma lab-tasto--piccolo" data-pulisci>pulisci</button>
            <button type="button" class="lab-tasto lab-tasto--piccolo" data-salva>salva</button>
          </div>
        </div>
        <div class="lab-telecamera">
          <canvas class="lab-tela" width="${W}" height="${H}" aria-label="il muro da disegnare"></canvas>
        </div>
        <p class="lab-nota"><b>Come funziona:</b> il puntatore lascia una scia; il colore si mescola da solo. «auto» accende le macchie che cadono mentre guardi. Tutto resta nella scheda: nessuna immagine parte.</p>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const tela0 = d.corpo.querySelector('canvas')
  if (!tela0) return d

  let tela = tela0
  let motore = null
  try {
    const gl = tela.getContext('webgl2', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true })
    if (!gl) throw new Error('WebGL2 non disponibile')
    motore = new WebGLInk(gl, tela)
    d.nota('WebGL2 · disegna sul muro')
  } catch (e) {
    console.warn('Muro liquido: passo a Canvas 2D', e)
    tela = ripiegaCanvas(tela)
    motore = new CanvasInk(tela.getContext('2d'), tela)
    d.nota('Canvas 2D · disegna sul muro', 'attesa')
  }

  let colore = PALETTE[0][1]
  let auto = true
  let giu = false
  let ultimo = null
  let prossimoAuto = 0
  let raf = 0
  let fermo = false
  const macchie = []

  const punto = (e) => {
    const r = tela.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / Math.max(1, r.width)) * W,
      y: ((e.clientY - r.top) / Math.max(1, r.height)) * H,
    }
  }

  const aggiungi = (p, raggio, col) => {
    macchie.push({ x: p.x, y: p.y, r: raggio, c: col })
  }

  const giro = (now) => {
    if (fermo) return
    raf = requestAnimationFrame(giro)
    if (auto && now > prossimoAuto) {
      const n = 1 + Math.floor(Math.random() * 2)
      for (let i = 0; i < n; i++) {
        aggiungi(
          { x: Math.random() * W, y: Math.random() * H },
          26 + Math.random() * 70,
          PALETTE[Math.floor(Math.random() * PALETTE.length)][1],
        )
      }
      prossimoAuto = now + 380 + Math.random() * 620
    }
    motore.frame(now, macchie)
    macchie.length = 0
  }

  tela.style.touchAction = 'none'
  tela.style.cursor = 'crosshair'
  tela.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    try { tela.setPointerCapture(e.pointerId) } catch {}
    giu = true
    ultimo = punto(e)
    aggiungi(ultimo, 26, colore)
  })
  tela.addEventListener('pointermove', (e) => {
    const p = punto(e)
    if (!giu) { ultimo = p; return }
    const a = ultimo || p
    const distanza = Math.hypot(p.x - a.x, p.y - a.y)
    const passi = Math.max(1, Math.min(14, Math.ceil(distanza / 16)))
    const raggio = Math.max(12, Math.min(38, 18 + distanza * 0.22))
    for (let i = 1; i <= passi; i++) {
      const t = i / passi
      aggiungi({ x: a.x + (p.x - a.x) * t, y: a.y + (p.y - a.y) * t }, raggio, colore)
    }
    motore.spinta((p.x - a.x) * 0.5, (p.y - a.y) * 0.5)
    ultimo = p
  })
  const lascia = (e) => {
    giu = false
    ultimo = null
    try { if (e?.pointerId != null) tela.releasePointerCapture(e.pointerId) } catch {}
  }
  tela.addEventListener('pointerup', lascia)
  tela.addEventListener('pointercancel', lascia)
  tela.addEventListener('pointerleave', () => { if (!giu) ultimo = null })

  d.corpo.addEventListener('click', (e) => {
    const c = e.target.closest('[data-colore]')
    if (c) {
      colore = c.dataset.colore
      for (const b of d.corpo.querySelectorAll('[data-colore]')) {
        const on = b === c
        b.classList.toggle('is-on', on)
        b.setAttribute('aria-pressed', String(on))
      }
      return
    }
    if (e.target.closest('[data-auto]')) {
      auto = !auto
      const b = e.target.closest('[data-auto]')
      b.setAttribute('aria-pressed', String(auto))
      b.textContent = `auto: ${auto ? 'sì' : 'no'}`
      return
    }
    if (e.target.closest('[data-pulisci]')) {
      motore.pulisci()
      macchie.length = 0
      d.nota('muro pulito', 'ok')
      return
    }
    if (e.target.closest('[data-salva]')) {
      tela.toBlob((blob) => {
        if (!blob) return d.nota('non riesco a salvare', 'male')
        scarica(blob, `pzkko-muro-${new Date().toISOString().slice(0, 10)}.png`)
        d.nota('immagine salvata', 'ok')
      }, 'image/png')
    }
  })

  d.suPulizia(() => {
    fermo = true
    cancelAnimationFrame(raf)
    motore?.ferma?.()
  })

  // un paio di macchie all'apertura, così il muro non è vuoto
  for (let i = 0; i < 3; i++) {
    aggiungi(
      { x: W * (0.25 + Math.random() * 0.5), y: H * (0.25 + Math.random() * 0.5) },
      70 + Math.random() * 90,
      PALETTE[i % PALETTE.length][1],
    )
  }

  d.apri()
  raf = requestAnimationFrame(giro)
  return d
}

function ripiegaCanvas(vecchio) {
  const nuovo = document.createElement('canvas')
  nuovo.width = W
  nuovo.height = H
  nuovo.className = vecchio.className
  nuovo.setAttribute('aria-label', vecchio.getAttribute('aria-label') || 'il muro da disegnare')
  vecchio.replaceWith(nuovo)
  return nuovo
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// ── il motore WebGL2 ─────────────────────────────────────────────────────────

class WebGLInk {
  constructor(gl, tela) {
    this.gl = gl
    this.tela = tela
    this.flow = [0, 0]
    this.ultimo = performance.now()
    this.tempo = 0

    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.BLEND)

    this.pieno = this.programma(VERTICE_PIENO, FRAMMENTO_ADV)
    this.macchia = this.programma(VERTICE_MACCHIA, FRAMMENTO_MACCHIA)
    this.mostra = this.programma(VERTICE_PIENO, FRAMMENTO_MOSTRA)

    this.quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    const loc = gl.getAttribLocation(this.pieno.programma, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    // aPos sta a 0 in tutti e tre i programmi (bindAttribLocation prima del link)
    this.tex = [this.creaTexture(), this.creaTexture()]
    this.fbo = this.tex.map((t) => this.creaFbo(t))
    this.leggi = 0
    this.scrivi = 1
    this.pulisci()
  }

  programma(vs, fs) {
    const gl = this.gl
    const sh = (tipo, fonte) => {
      const s = gl.createShader(tipo)
      gl.shaderSource(s, fonte)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s)
        gl.deleteShader(s)
        throw new Error(`shader: ${log}`)
      }
      return s
    }
    const v = sh(gl.VERTEX_SHADER, vs)
    const f = sh(gl.FRAGMENT_SHADER, fs)
    const p = gl.createProgram()
    gl.attachShader(p, v)
    gl.attachShader(p, f)
    gl.bindAttribLocation(p, 0, 'aPos')
    gl.linkProgram(p)
    gl.deleteShader(v)
    gl.deleteShader(f)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`programma: ${gl.getProgramInfoLog(p)}`)
    const u = {}
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i)
      if (info) u[info.name] = gl.getUniformLocation(p, info.name)
    }
    return { programma: p, u }
  }

  creaTexture() {
    const gl = this.gl
    const t = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  creaFbo(tex) {
    const gl = this.gl
    const f = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, f)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    const stato = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    if (stato !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incompleto')
    return f
  }

  spinta(dx, dy) {
    this.flow[0] += dx * 0.12
    this.flow[1] -= dy * 0.12
    this.flow[0] = Math.max(-26, Math.min(26, this.flow[0]))
    this.flow[1] = Math.max(-26, Math.min(26, this.flow[1]))
  }

  pulisci() {
    const gl = this.gl
    for (let i = 0; i < 2; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[i])
      gl.viewport(0, 0, W, H)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.flow = [0, 0]
  }

  frame(now, macchie) {
    const gl = this.gl
    const dt = Math.min(0.06, (now - this.ultimo) / 1000)
    this.ultimo = now
    this.tempo += dt
    this.flow[0] *= 0.93
    this.flow[1] *= 0.93

    // 1. l'inchiostro si muove: leggo la texture vecchia e scrivo nella nuova
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[this.scrivi])
    gl.viewport(0, 0, W, H)
    gl.disable(gl.BLEND)
    gl.useProgram(this.pieno.programma)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.leggi])
    gl.uniform1i(this.pieno.u.uTex, 0)
    gl.uniform2f(this.pieno.u.uRes, W, H)
    gl.uniform2f(this.pieno.u.uFlow, this.flow[0], this.flow[1])
    gl.uniform1f(this.pieno.u.uTime, this.tempo)
    gl.uniform1f(this.pieno.u.uDecay, 0.986)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // 2. le macchie nuove, in addizione
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.useProgram(this.macchia.programma)
    for (const m of macchie) {
      const c = rgb(m.c)
      gl.uniform2f(this.macchia.u.uCenter, (m.x / W) * 2 - 1, 1 - (m.y / H) * 2)
      gl.uniform2f(this.macchia.u.uSize, (m.r * 2) / W, (m.r * 2) / H)
      gl.uniform3f(this.macchia.u.uColor, c[0], c[1], c[2])
      gl.uniform1f(this.macchia.u.uAlpha, 0.19)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // 3. a schermo
    gl.disable(gl.BLEND)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.tela.width, this.tela.height)
    gl.useProgram(this.mostra.programma)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.scrivi])
    gl.uniform1i(this.mostra.u.uTex, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    const t = this.leggi
    this.leggi = this.scrivi
    this.scrivi = t
  }

  ferma() {
    const gl = this.gl
    for (const t of this.tex) gl.deleteTexture(t)
    for (const f of this.fbo) gl.deleteFramebuffer(f)
    gl.deleteBuffer(this.quad)
    gl.deleteVertexArray(this.vao)
    for (const p of [this.pieno, this.macchia, this.mostra]) gl.deleteProgram(p.programma)
  }
}

// ── il motore Canvas 2D (riserva) ───────────────────────────────────────────

class CanvasInk {
  constructor(ctx, tela) {
    this.ctx = ctx
    this.tela = tela
    this.ctx.fillStyle = '#05070a'
    this.ctx.fillRect(0, 0, W, H)
  }

  spinta() {}

  pulisci() {
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.fillStyle = '#05070a'
    this.ctx.fillRect(0, 0, W, H)
  }

  frame(_now, macchie) {
    const ctx = this.ctx
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(5, 7, 10, .045)'
    ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'
    for (const m of macchie) {
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r)
      g.addColorStop(0, hexA(m.c, 0.5))
      g.addColorStop(0.55, hexA(m.c, 0.16))
      g.addColorStop(1, hexA(m.c, 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  ferma() {}
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// ── gli shader ───────────────────────────────────────────────────────────────

const VERTICE_PIENO = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAMMENTO_ADV = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uFlow;
uniform float uTime;
uniform float uDecay;

void main() {
  vec2 uv = vUv;
  vec2 flow = uFlow * 0.00035;
  flow += vec2(
    sin(uv.y * 9.0 + uTime * 0.55) + cos(uv.y * 4.0 - uTime * 0.31),
    cos(uv.x * 8.0 - uTime * 0.47) + sin(uv.x * 5.0 + uTime * 0.29)
  ) * 0.00045;
  vec4 c = texture(uTex, uv - flow);
  vec4 b =
    texture(uTex, uv + vec2(1.0, 0.0) / uRes) +
    texture(uTex, uv - vec2(1.0, 0.0) / uRes) +
    texture(uTex, uv + vec2(0.0, 1.0) / uRes) +
    texture(uTex, uv - vec2(0.0, 1.0) / uRes);
  c = mix(c, b * 0.25, 0.14);
  outColor = c * uDecay;
}`

const VERTICE_MACCHIA = `#version 300 es
in vec2 aPos;
uniform vec2 uCenter;
uniform vec2 uSize;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(uCenter + aPos * uSize, 0.0, 1.0);
}`

const FRAMMENTO_MACCHIA = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec3 uColor;
uniform float uAlpha;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d);
  a *= a;
  outColor = vec4(uColor * a * uAlpha, a * uAlpha);
}`

const FRAMMENTO_MOSTRA = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
void main() {
  vec3 c = texture(uTex, vUv).rgb;
  vec2 p = vUv - 0.5;
  c *= 1.0 - dot(p, p) * 0.55;
  float g = fract(sin(dot(vUv * 1000.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (g - 0.5) * 0.012;
  outColor = vec4(c, 1.0);
}`
