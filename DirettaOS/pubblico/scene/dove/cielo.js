// «Dove vivo» · il cielo: una cupola con lo shader suo (sfumatura, foschia all'orizzonte, il sole, la luna con la fase,
// le stelle, le nuvole che vanno col vento vero e si chiudono col coperto, i lampi del temporale).
import { Effect, ShaderMaterial, CreateSphere, Vector3, Color3 } from '../lib/babylon/babylon.js'

Effect.ShadersStore.doveCieloVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = worldViewProjection * vec4(position, 1.0);
}`

Effect.ShadersStore.doveCieloFragmentShader = `
precision highp float;
varying vec3 vDir;
uniform vec3 zenit, orizzonte, foschia, sole, luna, coloreSole, vento;
uniform float nuvole, tempo, stelle, faseLuna, lampo, altSole, forza;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float rum(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) { v += a * rum(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 Z = lin(zenit), O = lin(orizzonte), F = lin(foschia), S = lin(coloreSole);
  vec3 c = mix(O, Z, pow(clamp(h, 0.0, 1.0), 0.5));
  c = mix(c, F, exp(-max(h, 0.0) * 9.0) * 0.6);
  if (h < 0.0) c = mix(c, F, clamp(-h * 12.0, 0.0, 1.0));
  // il sole: alone largo, alone stretto, il disco
  float cs = max(dot(d, sole), 0.0);
  float su = smoothstep(-0.12, 0.02, altSole);
  float aperto = 1.0 - nuvole * 0.75;
  c += S * (pow(cs, 6.0) * 0.22 + pow(cs, 90.0) * 0.6) * su * aperto;
  c += S * smoothstep(0.99955, 0.9998, cs) * 14.0 * su * (1.0 - nuvole * 0.92);
  // le stelle
  if (stelle > 0.0 && h > 0.0) {
    vec3 cella = floor(d * 260.0);
    float r = h31(cella);
    float s = smoothstep(0.9965, 1.0, r) * (0.5 + 0.5 * sin(tempo * (1.0 + r * 4.0) + r * 60.0));
    c += vec3(0.9, 0.95, 1.0) * s * stelle * 1.6 * smoothstep(0.0, 0.2, h);
  }
  // la luna: il disco con la parte in ombra della fase
  float cl = dot(d, luna);
  if (cl > 0.9990 && luna.y > -0.05) {
    vec3 ax = normalize(cross(luna, vec3(0.0, 1.0, 0.0)));
    vec3 ay = cross(ax, luna);
    vec2 q = vec2(dot(d - luna, ax), dot(d - luna, ay)) / 0.0105;
    float dentro = smoothstep(1.0, 0.92, length(q));
    float k = cos(faseLuna * 6.2831853);
    float lato = faseLuna < 0.5 ? 1.0 : -1.0;
    float x = q.x * lato;
    float illuminato = step(k * sqrt(max(0.0, 1.0 - q.y * q.y)), x);
    float macchie = 0.82 + 0.18 * rum(q * 3.0 + 4.0);
    c = mix(c, vec3(1.15, 1.12, 1.0) * macchie * (0.08 + 0.92 * illuminato), dentro * (1.0 - nuvole * 0.85));
  }
  // le nuvole: un soffitto lontano, si muovono col vento
  if (h > -0.03) {
    vec2 uv = d.xz / (h + 0.13) * 0.55 + vento.xz * tempo * 0.0011;
    float n = fbm(uv * 1.7);
    float soglia = mix(0.78, 0.18, nuvole);
    float cop = smoothstep(soglia, soglia + 0.28, n);
    float spesso = smoothstep(soglia, soglia + 0.5, fbm(uv * 1.7 + sole.xz * 0.06));
    vec3 chiaro = mix(F, S * 1.25 + F * 0.4, su * 0.75);
    vec3 scuro = F * mix(0.95, 0.42, nuvole);
    vec3 nc = mix(chiaro, scuro, spesso * 0.8 + nuvole * 0.2);
    nc += S * pow(cs, 12.0) * 0.6 * su * (1.0 - spesso);
    c = mix(c, nc, cop * smoothstep(-0.03, 0.12, h));
  }
  c += vec3(0.75, 0.8, 1.0) * lampo;
  gl_FragColor = vec4(c * forza, 1.0);
}`

export function creaCielo(scene) {
  const mesh = CreateSphere('cielo', { diameter: 6800, segments: 32, sideOrientation: 1 }, scene)
  const mat = new ShaderMaterial('cielo', scene, { vertex: 'doveCielo', fragment: 'doveCielo' }, {
    attributes: ['position'],
    uniforms: ['worldViewProjection', 'zenit', 'orizzonte', 'foschia', 'sole', 'luna', 'coloreSole', 'vento', 'nuvole', 'tempo', 'stelle', 'faseLuna', 'lampo', 'altSole', 'forza'],
  })
  mat.backFaceCulling = false
  mat.disableDepthWrite = true
  mesh.material = mat
  mesh.isPickable = false
  mesh.applyFog = false
  mesh.infiniteDistance = false
  const v3 = (a) => new Vector3(a[0], a[1], a[2])
  const c3 = (a) => new Color3(a[0], a[1], a[2])
  let tempo = 0
  return {
    mesh,
    aggiorna(pal) {
      mat.setColor3('zenit', c3(pal.zenit)); mat.setColor3('orizzonte', c3(pal.orizzonte)); mat.setColor3('foschia', c3(pal.foschia))
      mat.setVector3('sole', v3(pal.sole.dir)); mat.setVector3('luna', v3(pal.luna.dir))
      mat.setColor3('coloreSole', c3(pal.coloreLuce && !pal.notte ? pal.coloreLuce : [1, 0.85, 0.7]))
      const vv = (pal.vento ?? 8) / 3.6
      mat.setVector3('vento', new Vector3(vv * 0.8 + 0.6, 0, vv * 0.45 + 0.3))
      mat.setFloat('nuvole', pal.nuvole); mat.setFloat('stelle', pal.stelle); mat.setFloat('faseLuna', pal.luna.fase)
      mat.setFloat('altSole', pal.sole.alt); mat.setFloat('forza', 1.35)
    },
    anima(dt, lampo = 0) { tempo += dt; mat.setFloat('tempo', tempo); mat.setFloat('lampo', lampo) },
  }
}
