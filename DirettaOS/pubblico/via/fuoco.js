// Diretta OS · «sono a mettere la legna nella stufa»: il fuoco vero, dal vetro della stufa di ghisa. Non è un disegno a
// pixel come le altre scene: è calcolato pixel per pixel dalla scheda video (un fragment shader WebGL), con le fiamme
// che salgono dai ciocchi, la brace che pulsa, le crepe accese nel legno, le scintille, il riverbero sulla ghisa.
// All'inizio cade dentro un ciocco nuovo (sei andato a metterlo tu) e la fiamma si alza; poi uno ogni 50 secondi.
// Si calcola a 960 × 540 e si ingrandisce morbido: il fuoco è morbido comunque, e la scheda video fa un quarto.

const VERT = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}'
const FRAG = `
precision highp float;
uniform vec2 R; uniform float T, F, L, A, S;
varying vec2 v;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float nz(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*nz(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
float fbm3(vec2 p){ float s=0., a=.5; for(int i=0;i<3;i++){ s+=a*nz(p); p=p*2.07+vec2(5.1,1.3); a*=.5; } return s; }
float box(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
float seg(vec2 p, vec2 a, vec2 b, float r){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
// dal rosso scuro al giallo quasi bianco, come il fuoco vero
vec3 calore(float f){ f=max(f,0.);
  return vec3(1.,.28,.04)*smoothstep(.02,.45,f)*1.15 + vec3(.0,.42,.12)*smoothstep(.35,.8,f) + vec3(.12,.22,.36)*smoothstep(.75,1.15,f); }
// un ciocco: la corteccia scura, le crepe che brillano dove scalda
vec4 ciocco(vec2 q, vec2 a, vec2 b, float r, float caldo, float seme){
  float d = seg(q,a,b,r);
  if (d > .006) return vec4(0.);
  vec2 ba = normalize(b-a); vec2 n = vec2(-ba.y, ba.x);
  float u = dot(q-a, ba), w = clamp(dot(q-a, n) / r, -1., 1.); // lungo il ciocco, e di traverso (-1 sotto, 1 sopra)
  float cil = sqrt(max(0., 1. - w*w)); // è tondo: scuro ai bordi
  // la corteccia: le fibre per il lungo
  float fib = fbm3(vec2(u*70.+seme, w*4.)) * .65 + fbm3(vec2(u*12.+seme, w*2.)) * .35;
  float solco = smoothstep(.42,.5,fbm3(vec2(u*22.+seme*2., w*9.))); // i solchi della corteccia
  vec3 col = mix(vec3(.025,.016,.012), vec3(.2,.115,.06), fib) * (.25 + .75*cil) * (.55 + .45*solco);
  // la cenere chiara dove il legno è già bruciato, sopra
  col = mix(col, vec3(.32,.3,.28)*(.4+.6*cil), smoothstep(.62,.75,fbm3(vec2(u*9.+seme, w*3.))) * smoothstep(-.1,.6,w) * .6);
  // le crepe accese solo dove scalda (sotto, verso la brace), sottili, che pulsano
  float caldoQui = caldo * smoothstep(.35, -.85, w);
  float cr = fbm(vec2(u*11.+seme*3., w*1.4+seme));
  float crepa = smoothstep(.028,.0,abs(cr-.5)) * caldoQui;
  float pulsa = .65+.35*sin(T*1.7+u*9.+seme*5.);
  col += calore(.55+.4*pulsa) * crepa * 1.3;
  col += vec3(.9,.3,.06) * smoothstep(-.4,-1.,w) * .35 * caldo * pulsa; // la pancia arroventata
  // il bordo che prende il riverbero della fiamma da dietro
  col += vec3(1.,.48,.14) * pow(1.-cil, 3.) * .55 * caldo;
  return vec4(col, smoothstep(.006,-.004,d));
}
void main(){
  vec2 uv = v; float asp = R.x/R.y;
  vec2 p = (uv-.5)*vec2(asp,1.);
  float fl = .88 + .12*nz(vec2(T*3.1, 0.)) + .25*F;
  // il vetro: un rettangolo arrotondato in mezzo alla ghisa
  vec2 c = vec2(0.,-.035), b = vec2(.62,.33);
  float dv = box(p-c, b, .05);
  vec3 col;
  if (dv < 0.) {
    // dentro la stufa: q.x da -1 a 1, q.y da 0 (il fondo) a 1 (sopra)
    vec2 q = vec2((p.x-c.x)/b.x, (p.y-c.y+b.y)/(2.*b.y));
    // il fondo di mattoni refrattari, illuminato dal fuoco
    vec2 m = vec2(q.x*7., q.y*5.); m.x += floor(m.y)*.5;
    float fuga = smoothstep(.0,.06,min(fract(m.x),1.-fract(m.x))) * smoothstep(.0,.08,min(fract(m.y),1.-fract(m.y)));
    vec3 mur = mix(vec3(.05,.025,.02), vec3(.16,.07,.04), fuga*(.6+.4*nz(m*1.3)));
    float luce = fl * (.35 + .9*exp(-pow(q.x*.9,2.)) * (1.-q.y*.55));
    col = mur * luce * 1.3 * (1.-smoothstep(.45,1.,q.y)*.7); // (in alto la fuliggine)
    // il ciocco di dietro
    vec4 l3 = ciocco(q, vec2(-.72,.25), vec2(.78,.27), .055, .7, 3.1);
    col = mix(col, l3.rgb*fl, l3.a);
    // le fiamme
    // le fiamme: lingue separate che salgono e ondeggiano, più alte sopra il mucchio, coi vuoti in mezzo
    float y = q.y;
    float sposta = fbm(vec2(q.x*1.7, y*1.1 - T*1.1)) - .5;
    float t1 = fbm(vec2(q.x*3. + sposta*1.3, y*2.1 - T*2.2));
    float t2 = fbm(vec2(q.x*8. + sposta*2.2, y*4.2 - T*3.7));
    float alto = (.46 + .38*exp(-q.x*q.x*3.2)) * (1. + .5*F);
    float h = (y - .2) / alto;
    float largo = smoothstep(.98, .3, abs(q.x + sposta*.35*h));
    float lingue = .55 + .45*sin(q.x*10. + sposta*5. + T*.4);
    float f = (1. - h) * largo - (1. - lingue) * max(h, 0.) * .55;
    f += (t1-.5)*1.25*(.25+h) + (t2-.5)*.5;
    f *= smoothstep(-.35, .0, h);
    float I = smoothstep(.1, .78, f);
    vec3 fiamma = calore(I*1.12) * fl;
    col = col * (1. - I*.4) + fiamma * smoothstep(.02, .22, I) * 1.15;
    // i due ciocchi davanti (le fiamme ci passano un po' anche davanti)
    float nuovo = 1. - A*.35;
    vec4 l1 = ciocco(q, vec2(-.88,.09), vec2(.52,.16), .075, .9, 1.3);
    vec4 l2 = ciocco(q, vec2(-.42,.17), vec2(.9,.085), .07, .95, 7.7);
    vec4 l4 = ciocco(q, vec2(-.58,.245+L), vec2(.62,.275+L), .066*nuovo, .25+.75*min(1.,A*1.5), 4.2);
    col = mix(col, l2.rgb*fl + fiamma*.12, l2.a);
    col = mix(col, l1.rgb*fl + fiamma*.12, l1.a);
    col = mix(col, l4.rgb*fl + fiamma*.15, l4.a);
    // la brace sul fondo
    float br = fbm(vec2(q.x*16., q.y*40. + T*.05));
    float brace = smoothstep(.1,.0,q.y) * smoothstep(.42,.72,br) * (.7+.3*sin(T*2.+br*20.));
    col += calore(.45 + .5*brace) * brace * 1.3 * fl;
    // le scintille
    for (int i = 0; i < 26; i++) {
      float fi = float(i), k = h21(vec2(fi, 7.1+S));
      float vita = fract(T*(.18+.22*k) + h21(vec2(fi, 3.3)));
      vec2 sp = vec2((h21(vec2(fi,1.7))*1.4-.7) + sin(vita*7.+fi)*.07, .2 + vita*(.9 + .5*F));
      float d = length((q-sp)*vec2(b.x*asp,1.));
      col += vec3(1.,.62,.22) * exp(-d*d*9000.) * (1.-vita) * (.6 + 1.4*F) * step(.3, k + F);
    }
    // il vetro: un po' di fuliggine ai bordi, e un riflesso
    float bordo = smoothstep(-.09,0.,dv);
    col *= 1. - bordo*.6;
    col = mix(col, col*vec3(.75,.65,.55), smoothstep(.75,1.,q.y)*.5);
    col += vec3(.9,.95,1.) * .035 * smoothstep(.02,0.,abs(p.x+p.y*.7-.18)) ;
    col += vec3(.9,.95,1.) * .02 * smoothstep(.05,0.,abs(p.x+p.y*.7-.26));
  } else {
    // la ghisa: nera, granulosa, col bordo del vetro che prende il riverbero del fuoco
    float gr = fbm(p*40.)*.6 + fbm(p*9.)*.4;
    col = vec3(.055,.052,.05) + vec3(.05)*gr;
    float vicino = exp(-dv*28.);
    col += vec3(1.,.42,.12) * vicino * .2 * fl;
    // la cornice del vetro, in rilievo: ghisa più liscia, con il riverbero solo sul bordo interno
    float cor = smoothstep(.0,.004,dv) * smoothstep(.045,.035,dv);
    col = mix(col, vec3(.075,.07,.066) + vec3(.03)*gr, cor);
    col += vec3(1.,.45,.15) * cor * exp(-dv*60.) * .35 * fl;
    float spigolo = smoothstep(.003,0.,abs(dv-.045));
    col += vec3(.12,.115,.11) * spigolo;
    // i bulloni negli angoli, la maniglia a destra
    for (int i = 0; i < 4; i++) { vec2 bp = c + vec2((i==0||i==2)? -b.x-.08 : b.x+.08, (i<2)? b.y+.08 : -b.y-.08);
      float d = length(p-bp); col = mix(col, vec3(.16,.15,.14)*(1.2-d*40.), smoothstep(.016,.012,d)); }
    float man = box(p-vec2(c.x+b.x+.13, c.y), vec2(.018,.12), .015);
    col = mix(col, vec3(.13,.12,.115) + vec3(.1)*smoothstep(.0,-.01,man+.008)*step(0.,p.x-c.x-b.x-.13), smoothstep(.003,-.003,man));
    // il bordo della stufa e la luce che scende sul pavimento
    col *= .65 + .35*smoothstep(.75,.2,abs(p.x)/asp*2.);
    col *= 1. - .35*smoothstep(.35,.5,abs(p.y));
  }
  // la sfumatura agli angoli (come guardare il fuoco da vicino)
  col *= 1. - .35*dot(uv-.5, uv-.5);
  gl_FragColor = vec4(pow(col, vec3(.95)), 1.);
}`

export function crea({ seme = 7 } = {}) {
  const tela = document.createElement('canvas')
  tela.width = 960; tela.height = 540
  // (risparmio GPU: niente WebGL, si usa il fuoco a pixel che è tutto CPU)
  if (window.__nienteGpu || new URLSearchParams(location.search).get('gpu') === '0') return riserva(tela)
  const gl = tela.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true })
  if (!gl) return riserva(tela)
  const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s }
  let prog
  try {
    prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  } catch (e) { console.warn('fuoco: niente WebGL, uso quello semplice', e.message); return riserva(document.createElement('canvas')) }
  gl.useProgram(prog)
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
  const u = Object.fromEntries(['R', 'T', 'F', 'L', 'A', 'S'].map((k) => [k, gl.getUniformLocation(prog, k)]))
  gl.uniform2f(u.R, tela.width, tela.height); gl.uniform1f(u.S, seme % 97)
  function disegna(t) {
    // il ciocco nuovo: cade dentro al secondo 1, poi ogni 50 secondi; la fiamma si alza e torna giù piano
    const giro = 50, eta = t < 1 ? -1 : (t - 1) % giro
    const cade = eta < 0 ? 1.2 : Math.max(0, 1 - eta / 0.45) ** 2 * 0.9
    const fiammata = eta < 0 ? 0 : eta < 0.45 ? 0 : Math.exp(-(eta - 0.45) / 3.5)
    gl.viewport(0, 0, tela.width, tela.height)
    gl.uniform1f(u.T, t + 40); gl.uniform1f(u.F, fiammata); gl.uniform1f(u.L, cade); gl.uniform1f(u.A, Math.max(0, eta) / giro)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return dice(t, fiammata)
  }
  return { tela, disegna, morbido: true, meteo() {} }
}
// quello che succede, per la scritta al centro (scritta.js): quanti ciocchi sono già dentro, da quanto è caduto l'ultimo
// e quanto è alta la fiamma adesso
function dice(t, fiammata) {
  const ciocchi = t < 1 ? 0 : Math.floor((t - 1) / 50) + 1
  return { ciocchi, eta: t < 1 ? -1 : (t - 1) % 50, fiammata }
}

// se la scheda video non c'è (WebGL spento): il fuoco a pixel di una volta, che sale e si spegne riga per riga
function riserva(tela) {
  const w = 160, h = 90
  tela.width = w; tela.height = h
  const g = tela.getContext('2d'), img = g.createImageData(w, h), calore = new Uint8Array(w * h)
  const PAL = Array.from({ length: 37 }, (_, i) => { const k = i / 36; return [Math.min(255, 40 + k * 400), Math.min(255, k * k * 330), Math.min(255, k ** 4 * 300)] })
  let prima = 0
  function disegna(t) {
    const eta = t < 1 ? -1 : (t - 1) % 50
    const detto = dice(t, eta < 0 ? 0 : Math.exp(-eta / 3.5))
    if (t - prima < 1 / 24) return detto
    prima = t
    for (let x = 0; x < w; x++) calore[(h - 1) * w + x] = Math.abs(x - w / 2) < w * 0.42 ? 36 : 0
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) {
      const s = y * w + x, v = calore[s], r = Math.floor(Math.random() * 3)
      const d = s - w - r + 1
      if (d >= 0) calore[d] = Math.max(0, v - (r & 1))
    }
    for (let i = 0; i < w * h; i++) { const [r, gg, b] = PAL[calore[i]]; img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255 }
    g.putImageData(img, 0, 0)
    return detto
  }
  return { tela, disegna, morbido: true, meteo() {} }
}
