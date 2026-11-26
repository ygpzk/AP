// SPECCHIO (26.11): la webcam diventa uno specchio con sei effetti, tutti in un frammento GLSL (WebGL 1, nessuna
// libreria). Il video non esce dal computer: è una texture, si disegna sul canvas e basta. «scatta» copia il fotogramma
// negli appunti (Clipboard API) e prepara anche il salvataggio in PNG.
//
//   apri()   apre lo specchio

import { creaFoglio, ciclo, clamp } from '/games/lab/lab.js'

const EFFETTI = [
  ['normale', 0], ['caleidoscopio', 1], ['pixel', 2], ['crt', 3], ['termico', 4], ['contorni', 5],
]
const VS = `attribute vec2 a; varying vec2 v; void main(){ v=a*.5+.5; gl_Position=vec4(a,0.,1.); }`
const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uVid;
uniform float uMirror;
uniform float uTime;
uniform int uEff;
vec2 cover(vec2 uv){
  float rs=uRes.x/max(1.,uRes.y), rv=uVid.x/max(1.,uVid.y);
  if(rv>rs) uv.x=(uv.x-.5)*(rs/rv)+.5; else uv.y=(uv.y-.5)*(rv/rs)+.5;
  return uv;
}
float luma(vec3 c){ return dot(c,vec3(.299,.587,.114)); }
vec3 campione(vec2 uv){ return texture2D(uTex, clamp(uv,vec2(.001),vec2(.999))).rgb; }
void main(){
  vec2 uv=v;
  if(uMirror>.5) uv.x=1.-uv.x;
  if(uEff==1){
    vec2 p=(v-.5)*vec2(uRes.x/max(1.,uRes.y),1.);
    float a=atan(p.y,p.x), r=length(p);
    a=mod(a,6.283185/6.);
    a=abs(a-3.14159/6.);
    p=vec2(cos(a),sin(a))*r;
    uv=p/vec2(uRes.x/max(1.,uRes.y),1.)+.5;
  }
  uv=cover(uv);
  vec3 col;
  if(uEff==2){ vec2 q=floor(uv*vec2(180.,120.))/vec2(180.,120.); col=campione(q); }
  else if(uEff==3){
    vec2 c=uv-.5; float r2=dot(c,c);
    vec2 q=uv+c*r2*.18;
    col=vec3(campione(q+vec2(.0015,0.)).r,campione(q).g,campione(q-vec2(.0015,0.)).b);
    col*=0.92+0.08*sin(uv.y*uRes.y*1.7+uTime*4.);
    col*=1.-.35*r2;
  }
  else if(uEff==4){
    float l=luma(campione(uv));
    vec3 a=vec3(.02,.02,.35), b=vec3(.4,.02,.4), c=vec3(.95,.25,.05), d=vec3(1.,.95,.5);
    col = l<.33 ? mix(a,b,l/.33) : (l<.66 ? mix(b,c,(l-.33)/.33) : mix(c,d,(l-.66)/.34));
  }
  else if(uEff==5){
    vec2 t=1./uRes;
    float tl=luma(campione(uv+vec2(-t.x,-t.y))), tm=luma(campione(uv+vec2(0.,-t.y))), tr=luma(campione(uv+vec2(t.x,-t.y)));
    float ml=luma(campione(uv+vec2(-t.x,0.))), mr=luma(campione(uv+vec2(t.x,0.)));
    float bl=luma(campione(uv+vec2(-t.x,t.y))), bm=luma(campione(uv+vec2(0.,t.y))), br=luma(campione(uv+vec2(t.x,t.y)));
    float gx=-tl-2.*ml-bl+tr+2.*mr+br;
    float gy=-tl-2.*tm-tr+bl+2.*bm+br;
    col=vec3(sqrt(gx*gx+gy*gy)*1.6);
  }
  else col=campione(uv);
  float vig=1.-.28*pow(length(v-.5)*1.4,2.);
  gl_FragColor=vec4(col*vig,1.);
}`

const S = { effetto: 0, specchio: true }
let dlg = null, el = {}, video = null, canvas = null, gl = null, prog = null, tex = null
let stream = null, cicloDisegno = null, attivo = false, perso = false
let u = {}, quad = null, ultimoUrl = null
let ctx2d = null

function compila(tipo, fonte) {
  const s = gl.createShader(tipo)
  gl.shaderSource(s, fonte)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('shader', gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}
function preparaGL() {
  gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true })
  if (!gl) return false
  const vs = compila(gl.VERTEX_SHADER, VS), fs = compila(gl.FRAGMENT_SHADER, FS)
  if (!vs || !fs) return false
  prog = gl.createProgram()
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return false }
  gl.useProgram(prog)
  quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const a = gl.getAttribLocation(prog, 'a')
  gl.enableVertexAttribArray(a)
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
  for (const nome of ['uTex', 'uRes', 'uVid', 'uMirror', 'uTime', 'uEff']) u[nome] = gl.getUniformLocation(prog, nome)
  tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  return true
}
function dimensiona() {
  const r = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  const w = Math.max(1, Math.round(r.width * dpr))
  const h = Math.max(1, Math.round(r.height * dpr))
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
  if (gl) gl.viewport(0, 0, w, h)
}

function disegna(t) {
  if (!attivo) return
  dimensiona()
  if (gl && prog) {
    gl.useProgram(prog)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    if (video.readyState >= 2) {
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video) } catch { perso = true }
    }
    gl.uniform1i(u.uTex, 0)
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform2f(u.uVid, video.videoWidth || 1280, video.videoHeight || 720)
    gl.uniform1f(u.uMirror, S.specchio ? 1 : 0)
    gl.uniform1f(u.uTime, t / 1000)
    gl.uniform1i(u.uEff, S.effetto)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  } else if (ctx2d) {
    // senza WebGL: almeno lo specchio semplice, con i filtri del canvas
    if (!video || video.readyState < 2) return
    const w = canvas.width, h = canvas.height
    ctx2d.save()
    if (S.specchio) { ctx2d.translate(w, 0); ctx2d.scale(-1, 1) }
    ctx2d.filter = S.effetto === 4 ? 'grayscale(1) contrast(1.4)' : S.effetto === 3 ? 'contrast(1.2) saturate(.7)' : 'none'
    ctx2d.drawImage(video, 0, 0, w, h)
    ctx2d.restore()
  }
}

async function accendi() {
  if (stream) return
  if (!navigator.mediaDevices?.getUserMedia) {
    el.stato.textContent = 'questo browser non dà la camera alle pagine.'
    return
  }
  el.stato.textContent = 'chiedo il permesso…'
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
    video.srcObject = stream
    await video.play().catch(() => {})
    attivo = true
    el.vuoto.hidden = true
    el.camera.textContent = 'camera accesa'
    el.camera.setAttribute('aria-pressed', 'true')
    el.scatta.disabled = false
    el.stato.textContent = 'in diretta'
    el.led.className = 'lab-led is-on'
    dlg.voce('ecco lo specchio')
    if (!cicloDisegno) cicloDisegno = ciclo((t) => disegna(t))
    if (!gl && !ctx2d) {
      ctx2d = canvas.getContext('2d')
      dimensiona()
    }
  } catch (err) {
    const n = err?.name || ''
    el.stato.textContent = n === 'NotAllowedError' ? 'permesso negato.'
      : n === 'NotFoundError' ? 'non trovo una camera.'
      : 'la camera non si è aperta.'
    el.led.className = 'lab-led is-rosso'
    el.vuoto.hidden = false
    el.vuoto.textContent = 'serve il permesso della camera per accendere lo specchio.'
  }
}
function spegni() {
  attivo = false
  if (stream) { for (const t of stream.getTracks()) t.stop(); stream = null }
  if (video) { video.srcObject = null }
}

async function scatta() {
  if (!attivo) return
  disegna(performance.now())
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) { dlg.voce('non riesco a prendere il fotogramma', true); return }
  let copiata = false
  if (window.ClipboardItem && navigator.clipboard?.write) {
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); copiata = true } catch {}
  }
  if (ultimoUrl) URL.revokeObjectURL(ultimoUrl)
  ultimoUrl = URL.createObjectURL(blob)
  el.salva.href = ultimoUrl
  el.salva.download = `pzkko-specchio-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
  el.salva.hidden = false
  dlg.voce(copiata ? 'foto copiata negli appunti' : 'foto pronta: salvala', true)
}

export async function apri() {
  if (!dlg) await costruisci()
  dlg.apri()
  // il canvas è dentro un <dialog> chiuso quando il foglio viene costruito: si misura dopo l'apertura
  requestAnimationFrame(() => { if (dlg) dimensiona() })
}

async function costruisci() {
  dlg = await creaFoglio({
    chiave: 'specchio',
    titolo: 'specchio',
    voce: 'sei tu, ma con sei effetti',
    corpo: `<div class="lab-griglia">
      <div class="lab-colonna">
        <div class="lab-pannello sc-comandi">
          <div class="lab-fila lab-fila--tra">
            <div class="lab-fila"><button type="button" class="lab-tasto lab-tasto--pieno" data-camera aria-pressed="false">accendi la camera</button><span class="lab-led" data-led></span><span class="lab-etichetta" data-stato>spenta</span></div>
            <div class="lab-fila"><button type="button" class="lab-tasto" data-specchio aria-pressed="true">specchio</button><button type="button" class="lab-tasto" data-scatta disabled>scatta</button><a class="lab-tasto" data-salva hidden download>salva</a></div>
          </div>
          <div class="sc-effetti" data-effetti role="group" aria-label="gli effetti">${EFFETTI.map(([n, v]) => `<button type="button" class="lab-tasto" data-eff="${v}" aria-pressed="${v === 0}">${n}</button>`).join('')}</div>
        </div>
        <div class="lab-scena sc-scena">
          <video class="sc-video" data-video playsinline muted autoplay></video>
          <canvas data-tela></canvas>
          <div class="sc-vuoto" data-vuoto>accendi la camera: il video resta qui, non esce dal computer.</div>
          <span class="sc-eti">specchio · webgl</span>
        </div>
      </div>
      <aside class="lab-colonna lab-colonna--lato">
        <section class="lab-pannello"><h3>cosa guardi</h3><p class="lab-nota">Il fotogramma della webcam diventa una texture e uno shader lo rimette sul canvas, pixel per pixel. Gli effetti sono tutti nello stesso frammento GLSL: niente filtri scaricati, niente foto mandate in giro.</p></section>
        <section class="lab-pannello"><h3>gli effetti</h3><p class="lab-nota"><b>caleidoscopio</b> piega il piano in sei spicchi; <b>pixel</b> quantizza a 180 × 120; <b>crt</b> curva i bordi, sfasa i colori e disegna le righe; <b>termico</b> trasforma la luminanza in una scala di calore; <b>contorni</b> è un Sobel 3 × 3.</p></section>
        <section class="lab-pannello"><h3>privacy</h3><p class="lab-nota">La camera si spegne quando chiudi lo specchio. Il fotogramma copiato resta negli appunti del tuo computer.</p></section>
      </aside>
    </div>`,
  })
  const q = (s) => dlg.corpo.querySelector(s)
  el = {
    video: q('[data-video]'), video: q('[data-video]'), camera: q('[data-camera]'), stato: q('[data-stato]'),
    scatta: q('[data-scatta]'), salva: q('[data-salva]'), vuoto: q('[data-vuoto]'), led: q('[data-led]'),
  }
  video = el.video
  canvas = q('[data-tela]')
  if (!preparaGL()) { gl = null; ctx2d = canvas.getContext('2d') }
  dimensiona()
  dlg.corpo.addEventListener('click', (e) => {
    if (e.target.closest('[data-camera]')) return accendi()
    if (e.target.closest('[data-specchio]')) {
      S.specchio = !S.specchio
      const b = e.target.closest('[data-specchio]')
      b.setAttribute('aria-pressed', String(S.specchio))
      return
    }
    const eff = e.target.closest('[data-eff]')
    if (eff) {
      S.effetto = Number(eff.dataset.eff)
      for (const b of dlg.corpo.querySelectorAll('[data-eff]')) b.setAttribute('aria-pressed', String(b === eff))
      return
    }
    if (e.target.closest('[data-scatta]')) scatta()
  })
  dlg.alChiudere(() => {
    spegni()
    cicloDisegno?.ferma(); cicloDisegno = null
    if (ultimoUrl) { URL.revokeObjectURL(ultimoUrl); ultimoUrl = null }
    if (el.salva) el.salva.hidden = true
    dlg?.dlg.remove(); dlg = null
  })
}
