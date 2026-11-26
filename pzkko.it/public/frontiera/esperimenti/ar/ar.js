// ar.js — «AR»: un adesivo pzk nel mondo vero.
//
// Tecnologia: WebXR immersive-ar con hit-test. Il telefono guarda il pavimento,
// il mirino trovato dal browser dice dove appoggiare l'adesivo, e un tocco lo
// attacca. Il disegno è WebGL2 puro: un quad con la texture dell'adesivo, una
// matrice di vista per ogni occhio e il framebuffer che dà il browser.
//
// Funziona dove c'è WebXR (Chrome su Android, di solito). Altrove la finestra
// mostra un adesivo 3D in CSS e spiega come provarci.
//
//   apri()  apre la finestra

import { creaDialogo } from '../../shell.js'

let ui = null

export function apri() {
  if (ui) return ui.apri()
  ui = costruisci()
}

function costruisci() {
  const d = creaDialogo({
    id: 'ar',
    titolo: 'AR',
    tech: 'WebXR · hit-test',
    voce: 'Attacca un adesivo pzk nel mondo vero. Inquadra il pavimento, aspetta il mirino e tocca lo schermo.',
    larga: true,
    corpo: `
      <div class="lab-ar">
        <div class="lab-ar-vista">
          <canvas class="lab-ar-canvas" width="640" height="640" aria-label="la realtà aumentata"></canvas>
          <div class="lab-ar-fallback" data-fallback>
            <div class="lab-ar-sticker" aria-hidden="true"><b>pzk</b><i>★</i></div>
            <p class="lab-nota" data-fallback-testo>Controllo la realtà aumentata…</p>
          </div>
          <div class="lab-ar-ui" data-ar-ui hidden>
            <span class="lab-badge lab-badge--acceso" data-ar-stato>inquadra il pavimento</span>
            <button type="button" class="lab-tasto lab-tasto--pieno" data-esci>esci dall'AR</button>
          </div>
        </div>
        <div class="lab-colonna">
          <div class="lab-pannello">
            <div class="lab-riga">
              <button type="button" class="lab-tasto lab-tasto--pieno" data-entra data-focus disabled>entra in AR</button>
              <span class="lab-badge" data-supporto-ar>controllo…</span>
            </div>
            <p class="lab-nota" style="margin-top:10px">Serve un telefono con WebXR (Chrome su Android). La fotocamera la apre il browser quando entri; il mirino lo calcola il <b>hit-test</b>, senza mandare immagini a nessuno.</p>
          </div>
          <div class="lab-pannello">
            <h3>Come si usa</h3>
            <ol class="lab-passi">
              <li>Premi «entra in AR» e punta il telefono verso il pavimento.</li>
              <li>Aspetta che compare il mirino: vuol dire che il piano è stato trovato.</li>
              <li>Tocca lo schermo: l'adesivo si attacca lì. Puoi attaccarne più di uno.</li>
              <li>«esci dall'AR» chiude la sessione e torna qui.</li>
            </ol>
            <p class="lab-nota" style="margin-top:8px">Se il tasto non si accende, il browser non ha la realtà aumentata: prova da Chrome su Android, oppure apri il laboratorio in una scheda.</p>
          </div>
        </div>
      </div>`,
    onChiudi: () => { ui = null },
  })

  const q = (s) => d.corpo.querySelector(s)
  const canvas = q('.lab-ar-canvas')
  const fallback = q('[data-fallback]')
  const fallbackTesto = q('[data-fallback-testo]')
  const bEntra = q('[data-entra]')
  const bEsci = q('[data-esci]')
  const uiAr = q('[data-ar-ui]')
  const statoAr = q('[data-ar-stato]')
  const bSupporto = q('[data-supporto-ar]')

  let gl = null
  let sessione = null
  let spazioLoc = null
  let sorgenteHit = null
  let ultimoFrame = 0
  let fermo = false
  let adesivi = []
  let mirino = null
  let texture = []
  let programma = null
  let vao = null
  let indiceAdesivo = 0

  function stato(testo, tipo = '') {
    if (statoAr) statoAr.textContent = testo
    d.nota(testo, tipo)
  }

  function fallbackMotivo(testo) {
    bEntra.disabled = true
    bSupporto.textContent = 'non disponibile'
    bSupporto.classList.add('lab-badge--male')
    fallback.hidden = false
    fallbackTesto.textContent = testo
    d.nota(testo, 'attesa')
  }

  // ── il WebGL2 e le texture ─────────────────────────────────────────────────

  function creaGl() {
    if (gl) return gl
    const g = canvas.getContext('webgl2', { alpha: true, antialias: true, xrCompatible: true })
    if (!g) throw new Error('questo browser non ha WebGL2')
    gl = g
    const vs = `#version 300 es
      layout(location = 0) in vec2 aPos;
      layout(location = 1) in vec2 aUv;
      uniform mat4 uMvp;
      out vec2 vUv;
      void main() {
        vUv = aUv;
        gl_Position = uMvp * vec4(aPos, 0.0, 1.0);
      }`
    const fs = `#version 300 es
      precision highp float;
      in vec2 vUv;
      out vec4 outColor;
      uniform sampler2D uTex;
      uniform float uAlpha;
      void main() {
        vec4 c = texture(uTex, vUv);
        outColor = c * uAlpha;
      }`
    const sh = (tipo, fonte) => {
      const s = g.createShader(tipo)
      g.shaderSource(s, fonte)
      g.compileShader(s)
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s))
      return s
    }
    const p = g.createProgram()
    const v = sh(g.VERTEX_SHADER, vs)
    const f = sh(g.FRAGMENT_SHADER, fs)
    g.attachShader(p, v)
    g.attachShader(p, f)
    g.linkProgram(p)
    g.deleteShader(v)
    g.deleteShader(f)
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p))
    programma = {
      p,
      mvp: g.getUniformLocation(p, 'uMvp'),
      tex: g.getUniformLocation(p, 'uTex'),
      alpha: g.getUniformLocation(p, 'uAlpha'),
    }

    const vertici = new Float32Array([
      -0.5, -0.5, 0, 0,
      0.5, -0.5, 1, 0,
      -0.5, 0.5, 0, 1,
      0.5, 0.5, 1, 1,
    ])
    const buf = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, buf)
    g.bufferData(g.ARRAY_BUFFER, vertici, g.STATIC_DRAW)
    vao = g.createVertexArray()
    g.bindVertexArray(vao)
    g.enableVertexAttribArray(0)
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 16, 0)
    g.enableVertexAttribArray(1)
    g.vertexAttribPointer(1, 2, g.FLOAT, false, 16, 8)

    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    g.enable(g.BLEND)
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA)
    g.enable(g.DEPTH_TEST)
    g.depthFunc(g.LEQUAL)
    g.depthMask(false)
    g.disable(g.CULL_FACE)
    g.clearColor(0, 0, 0, 0)

    texture = [
      creaTexture(creaAdesivo('#ccff00', '#161616')),
      creaTexture(creaAdesivo('#9d00ff', '#ffffff')),
      creaTexture(creaAdesivo('#00e0ff', '#161616')),
      creaTexture(creaMirino()),
    ]
    return g
  }

  function creaTexture(tela) {
    const g = gl
    const t = g.createTexture()
    g.bindTexture(g.TEXTURE_2D, t)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, tela)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE)
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE)
    return t
  }

  function creaAdesivo(sfondo, inchiostro) {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const x = c.getContext('2d')
    x.clearRect(0, 0, 512, 512)
    x.fillStyle = sfondo
    x.strokeStyle = '#161616'
    x.lineWidth = 20
    x.beginPath()
    if (x.roundRect) x.roundRect(44, 44, 424, 424, 86)
    else x.rect(44, 44, 424, 424)
    x.fill()
    x.stroke()
    x.fillStyle = inchiostro
    x.font = '800 196px "Lab Sans", "Segoe UI", sans-serif'
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('pzk', 256, 264)
    // una stella in basso a destra
    x.save()
    x.translate(392, 392)
    x.rotate(-0.25)
    x.fillStyle = inchiostro
    x.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 28 : 12
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const px = Math.cos(a) * r
      const py = Math.sin(a) * r
      if (i === 0) x.moveTo(px, py)
      else x.lineTo(px, py)
    }
    x.closePath()
    x.fill()
    x.restore()
    return c
  }

  function creaMirino() {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 512
    const x = c.getContext('2d')
    x.clearRect(0, 0, 512, 512)
    x.strokeStyle = '#ccff00'
    x.lineWidth = 22
    x.beginPath()
    x.arc(256, 256, 188, 0, Math.PI * 2)
    x.stroke()
    x.lineWidth = 8
    x.strokeStyle = 'rgba(204,255,0,.55)'
    x.beginPath()
    x.arc(256, 256, 138, 0, Math.PI * 2)
    x.stroke()
    x.strokeStyle = '#ccff00'
    x.lineWidth = 14
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      x.beginPath()
      x.moveTo(256 + dx * 70, 256 + dy * 70)
      x.lineTo(256 + dx * 104, 256 + dy * 104)
      x.stroke()
    }
    return c
  }

  // ── le matrici (colonne prima, come WebGL) ─────────────────────────────────

  function moltiplica(a, b) {
    const o = new Float32Array(16)
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3]
      }
    }
    return o
  }

  function inversaRigida(m) {
    const o = new Float32Array(16)
    o[0] = m[0]; o[1] = m[4]; o[2] = m[8]
    o[4] = m[1]; o[5] = m[5]; o[6] = m[9]
    o[8] = m[2]; o[9] = m[6]; o[10] = m[10]
    o[3] = o[7] = o[11] = 0
    const tx = m[12], ty = m[13], tz = m[14]
    o[12] = -(o[0] * tx + o[4] * ty + o[8] * tz)
    o[13] = -(o[1] * tx + o[5] * ty + o[9] * tz)
    o[14] = -(o[2] * tx + o[6] * ty + o[10] * tz)
    o[15] = 1
    return o
  }

  function scala(s) {
    const m = new Float32Array(16)
    m[0] = s; m[5] = s; m[10] = s; m[15] = 1
    return m
  }

  function ruotaX(a) {
    const m = new Float32Array(16)
    m[0] = 1
    m[5] = Math.cos(a); m[6] = Math.sin(a)
    m[9] = -Math.sin(a); m[10] = Math.cos(a)
    m[15] = 1
    return m
  }

  function billboard(pos, vista, dimensione) {
    // vista è la matrice occhio→mondo: le sue colonne sono destra, su, dietro
    const s = dimensione
    const m = new Float32Array(16)
    m[0] = vista[0] * s; m[1] = vista[1] * s; m[2] = vista[2] * s; m[3] = 0
    m[4] = vista[4] * s; m[5] = vista[5] * s; m[6] = vista[6] * s; m[7] = 0
    m[8] = vista[8] * s; m[9] = vista[9] * s; m[10] = vista[10] * s; m[11] = 0
    m[12] = pos[0]; m[13] = pos[1] + 0.08; m[14] = pos[2]; m[15] = 1
    return m
  }

  // ── il disegno ─────────────────────────────────────────────────────────────

  function disegnaQuad(mvp, tex, alpha = 1) {
    const g = gl
    g.useProgram(programma.p)
    g.uniformMatrix4fv(programma.mvp, false, mvp)
    g.uniform1i(programma.tex, 0)
    g.uniform1f(programma.alpha, alpha)
    g.activeTexture(g.TEXTURE0)
    g.bindTexture(g.TEXTURE_2D, tex)
    g.bindVertexArray(vao)
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4)
  }

  function frame(tempo, xrFrame) {
    if (!sessione || !spazioLoc) return
    const pose = xrFrame.getViewerPose(spazioLoc)
    const layer = sessione.renderState.baseLayer
    if (!pose || !layer) {
      ultimoFrame = sessione.requestAnimationFrame(frame)
      return
    }

    // il mirino: l'ultimo punto trovato sul piano
    const risultati = sorgenteHit ? xrFrame.getHitTestResults(sorgenteHit) : []
    if (risultati.length) {
      const p = risultati[0].getPose(spazioLoc)
      if (p) mirino = new Float32Array(p.transform.matrix)
    } else {
      mirino = null
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer)
    gl.depthMask(true)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.depthMask(false)

    for (const view of pose.views) {
      const vp = layer.getViewport(view)
      gl.viewport(vp.x, vp.y, vp.width, vp.height)

      // proiezione * vista
      const vista = view.transform.matrix // occhio → mondo
      const vpMat = moltiplica(view.projectionMatrix, inversaRigida(vista))

      // mirino appoggiato al piano
      if (mirino) {
        const modello = moltiplica(moltiplica(mirino, ruotaX(-Math.PI / 2)), scala(0.24))
        disegnaQuad(moltiplica(vpMat, modello), texture[3], 0.9)
      }
      // adesivi
      for (const a of adesivi) {
        const modello = billboard(a.pos, vista, 0.2)
        disegnaQuad(moltiplica(vpMat, modello), a.tex, 1)
      }
    }
    ultimoFrame = sessione.requestAnimationFrame(frame)
  }

  // ── la sessione ────────────────────────────────────────────────────────────

  async function entra() {
    if (!navigator.xr || !sessione) {
      try {
        if (!navigator.xr) throw new Error('WebXR non c\'è')
        const supportato = await navigator.xr.isSessionSupported('immersive-ar')
        if (!supportato) throw new Error('questo dispositivo non ha la realtà aumentata')
        creaGl()
        await gl.makeXRCompatible?.()
        let s
        try {
          s = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay', 'local-floor'],
            domOverlay: { root: d.dlg },
          })
        } catch {
          // senza dom-overlay la sessione può comunque partire: si esce col
          // gesto di sistema, ma l'AR funziona.
          s = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['local-floor'],
          })
        }
        sessione = s
        s.addEventListener('end', fineSessione, { once: true })
        s.addEventListener('select', attacca)
        const layer = new XRWebGLLayer(s, gl)
        s.updateRenderState({ baseLayer: layer })
        spazioLoc = await s.requestReferenceSpace('local')
        const spazioVisore = await s.requestReferenceSpace('viewer')
        sorgenteHit = await s.requestHitTestSource({ space: spazioVisore })

        adesivi = []
        mirino = null
        indiceAdesivo = 0
        d.dlg.classList.add('lab-ar-on')
        uiAr.hidden = false
        bEntra.hidden = true
        fallback.hidden = true
        stato('inquadra il pavimento e tocca per attaccare', 'ok')
        ultimoFrame = s.requestAnimationFrame(frame)
      } catch (e) {
        console.error(e)
        const msg = e?.name === 'SecurityError'
          ? 'il browser non permette la realtà aumentata qui: apri il laboratorio in una scheda'
          : e?.message || 'non riesco a entrare in AR'
        stato(msg, 'male')
        bEntra.disabled = false
      }
    }
  }

  function attacca() {
    if (!mirino) return
    const pos = [mirino[12], mirino[13], mirino[14]]
    adesivi.push({ pos, tex: texture[indiceAdesivo++ % 3] })
    if (adesivi.length > 24) adesivi.shift()
    stato(`adesivo ${adesivi.length} attaccato · tocca ancora`, 'ok')
  }

  function fineSessione() {
    if (sessione) {
      try { sorgenteHit?.cancel() } catch {}
      try { sessione.removeEventListener('select', attacca) } catch {}
      try { sessione.cancelAnimationFrame(ultimoFrame) } catch {}
    }
    sessione = null
    sorgenteHit = null
    spazioLoc = null
    mirino = null
    adesivi = []
    d.dlg.classList.remove('lab-ar-on')
    uiAr.hidden = true
    bEntra.hidden = false
    bEntra.disabled = false
    fallback.hidden = false
    fallbackTesto.textContent = 'Sessione AR finita. Puoi rientrare quando vuoi.'
    stato('AR finita')
  }

  async function esci() {
    if (!sessione) return
    try { await sessione.end() } catch {}
  }

  bEntra.addEventListener('click', entra)
  bEsci.addEventListener('click', esci)

  d.suPulizia(() => {
    fermo = true
    if (sessione) {
      try { sorgenteHit?.cancel() } catch {}
      try { sessione.cancelAnimationFrame(ultimoFrame) } catch {}
      try { sessione.end() } catch {}
    }
    sessione = null
  })

  // ── la disponibilità ───────────────────────────────────────────────────────
  if (!navigator.xr?.isSessionSupported) {
    fallbackMotivo('Questo browser non ha WebXR. Prova da Chrome su Android, oppure apri il laboratorio in una scheda.')
  } else {
    navigator.xr.isSessionSupported('immersive-ar').then((ok) => {
      if (fermo) return
      if (!ok) {
        fallbackMotivo('Questo dispositivo non ha la realtà aumentata. Prova da Chrome su Android.')
        return
      }
      bEntra.disabled = false
      bSupporto.textContent = 'pronto'
      bSupporto.classList.add('lab-badge--acceso')
      fallbackTesto.textContent = 'La realtà aumentata è pronta: premi «entra in AR».'
      d.nota('AR pronta · serve un telefono compatibile', 'ok')
    }).catch(() => fallbackMotivo('Non riesco a chiedere la realtà aumentata a questo browser.'))
  }

  d.apri()
  d.nota('controllo la realtà aumentata…', 'attesa')
  return d
}
