// pzkko.it: le copertine disegnate dei progetti senza un'immagine (16:9).
// Ogni copertina riceve un suffisso `u` per tenere unici gli id dei gradienti.

const L = '#ccff00', P = '#9d00ff'
const wrap = (body, u, label) => `<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice" class="block w-full h-full">${body.replaceAll('§', u)}</svg>`

const pixelSnail = (x, y, s, c) => {
  // una chiocciola a pixel, 12 × 8
  const rows = ['....xxxx....', '...x....x...', '..x..xx..x..', '..x.x..x.x..', 'x.x..xx..x..', 'xx.x....x...', '.xxxxxxxxxxx', '..xxxxxxxxx.']
  let r = ''
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') r += `<rect x="${x + i * s}" y="${y + j * s}" width="${s}" height="${s}" fill="${c}"/>` }))
  return r
}

const COVERS = {
  matricios: (u) => wrap(`
    <rect width="320" height="180" fill="#070a06"/>
    <rect x="18" y="16" width="284" height="148" rx="8" fill="#0d130b" stroke="#1f3a17"/>
    <rect x="18" y="16" width="284" height="18" rx="8" fill="#16240f"/><circle cx="32" cy="25" r="3" fill="#ff5f57"/><circle cx="42" cy="25" r="3" fill="#febc2e"/><circle cx="52" cy="25" r="3" fill="#28c840"/>
    <g font-family="ui-monospace,Consolas,monospace" fill="#7dff5a">
      <text x="34" y="58" font-size="15" font-weight="700" letter-spacing="2">MATRICI-OS</text>
      <text x="34" y="74" font-size="8.5" fill="#4fae38">terminale didattico sulle matrici</text>
      <text x="34" y="104" font-size="18">⎡ 2  0  1 ⎤</text>
      <text x="34" y="126" font-size="18">⎣ 0  3  4 ⎦</text>
      <text x="168" y="104" font-size="11" fill="#c8ff9c">a₁₃ = 1</text>
      <text x="168" y="122" font-size="11" fill="#c8ff9c">2 × 3</text>
      <text x="34" y="151" font-size="9">XP</text>
    </g>
    <rect x="52" y="144" width="110" height="8" rx="2" fill="#16240f"/><rect x="52" y="144" width="74" height="8" rx="2" fill="#7dff5a"/>
    <rect x="236" y="140" width="8" height="13" fill="#7dff5a"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>`, u, 'MatriciOS'),

  zero: (u) => wrap(`
    <defs><linearGradient id="zb§" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L}"/><stop offset="1" stop-color="#7ccf00"/></linearGradient>
    <linearGradient id="zd§" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfbf7"/><stop offset="1" stop-color="#dcdcd2"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#zb§)"/>
    <g transform="rotate(-6 160 90)">
      <rect x="54" y="38" width="212" height="108" rx="26" fill="#1c1c18" opacity=".18" transform="translate(4 6)"/>
      <rect x="54" y="38" width="212" height="108" rx="26" fill="url(#zd§)" stroke="#bdbdb2"/>
      <rect x="74" y="54" width="124" height="70" rx="6" fill="#2a2a24"/>
      <rect x="80" y="60" width="112" height="58" rx="2" fill="#ff8a1a"/>
      ${pixelSnail(92, 72, 3, '#1b1206')}
      <g font-family="ui-monospace,Consolas,monospace" font-size="9" font-weight="700" fill="#1b1206"><text x="134" y="84">pzkko</text><text x="134" y="98">zero</text></g>
      <rect x="84" y="62" width="104" height="6" fill="#1b1206" opacity=".85"/>
      <circle cx="232" cy="88" r="24" fill="#ff8a1a"/><circle cx="232" cy="88" r="9" fill="#fbfbf7"/>
      <path d="M232 68l4 6h-8zM232 108l4-6h-8zM212 88l6 4v-8zM252 88l-6 4v-8z" fill="#fbfbf7"/>
      <rect x="208" y="124" width="10" height="10" rx="3" fill="#ff8a1a"/>
    </g>`, u, 'Cercapersone zero'),

  email: (u) => wrap(`
    <defs><linearGradient id="eb§" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b44dff"/><stop offset="1" stop-color="${P}"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#eb§)"/>
    <g opacity=".25" fill="none" stroke="#fff"><path d="M-10 150 Q80 110 160 140 T330 120"/><path d="M-10 165 Q80 125 160 155 T330 135"/></g>
    <g transform="rotate(-5 160 92)">
      <rect x="82" y="44" width="156" height="98" rx="8" fill="#fff"/>
      <path d="M82 52l78 52 78-52" fill="none" stroke="#e4d6f5" stroke-width="3"/>
      <rect x="98" y="104" width="60" height="5" rx="2.5" fill="#d9c7f2"/><rect x="98" y="114" width="90" height="5" rx="2.5" fill="#e8dcf7"/><rect x="98" y="124" width="74" height="5" rx="2.5" fill="#e8dcf7"/>
      <rect x="196" y="56" width="30" height="34" rx="3" fill="${L}" stroke="#fff" stroke-width="2" stroke-dasharray="3 2"/>
      <text x="211" y="80" font-family="ui-monospace,Consolas,monospace" font-size="18" font-weight="700" text-anchor="middle" fill="#2d0050">@</text>
    </g>`, u, 'Email'),

  wrapped: (u) => wrap(`
    <defs><linearGradient id="wb§" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16001f"/><stop offset="1" stop-color="#3a0066"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#wb§)"/>
    <text x="24" y="62" font-family="'Big Shoulders Display',Impact,sans-serif" font-weight="900" font-size="54" fill="${L}">5BT</text>
    <text x="26" y="80" font-family="ui-monospace,Consolas,monospace" font-size="9" fill="#d8b4ff" letter-spacing="2">WRAPPED</text>
    <g font-family="ui-monospace,Consolas,monospace" font-size="8">
      <rect x="24" y="96" width="92" height="22" rx="11" fill="#2b2b2b"/><text x="34" y="110" fill="#e9e9e9">ciao a tutti</text>
      <rect x="60" y="124" width="98" height="22" rx="11" fill="#1f7a3d"/><text x="70" y="138" fill="#eaffea">chi porta i dadi?</text>
    </g>
    <g fill="${L}">${[38, 70, 52, 96, 64, 118, 84].map((h, i) => `<rect x="${186 + i * 17}" y="${150 - h}" width="11" height="${h}" rx="2" opacity="${0.55 + i * 0.06}"/>`).join('')}</g>
    <text x="300" y="30" text-anchor="end" font-family="ui-monospace,Consolas,monospace" font-size="9" fill="#d8b4ff">48 213 msg</text>`, u, 'Wrapped 5BT'),

  pulizia: (u) => wrap(`
    <defs><linearGradient id="pb§" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efffb3"/><stop offset="1" stop-color="${L}"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#pb§)"/>
    ${[0, 1, 2].map((i) => `<g transform="translate(${48 + i * 80} ${54 + (i % 2) * 14})"><path d="M0 8a6 6 0 0 1 6-6h20l8 8h26a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z" fill="${['#2c2c26', P, '#2c2c26'][i]}"/><path d="M0 22h66v34a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z" fill="${['#4a4a40', '#b54dff', '#4a4a40'][i]}"/><path d="M22 40l8 8 14-16" fill="none" stroke="${L}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')}
    ${[[40, 34, 7], [268, 40, 9], [150, 146, 6], [290, 140, 5]].map(([x, y, r]) => `<path d="M${x} ${y - r}C${x + r * 0.2} ${y - r * 0.2} ${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y}C${x + r * 0.2} ${y + r * 0.2} ${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r}C${x - r * 0.2} ${y + r * 0.2} ${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y}C${x - r * 0.2} ${y - r * 0.2} ${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}z" fill="#2c2c26"/>`).join('')}
    <text x="160" y="160" text-anchor="middle" font-family="ui-monospace,Consolas,monospace" font-size="10" font-weight="700" fill="#2c2c26">pulizia applica ✓</text>`, u, 'Pulizia'),

  parole: (u) => wrap(`
    <rect width="320" height="180" fill="#121213"/>
    ${[[['P', 'g'], ['Z', 'x'], ['K', 'y'], ['K', 'x'], ['O', 'g']], [['P', 'g'], ['A', 'g'], ['R', 'g'], ['O', 'g'], ['L', 'g'], ['E', 'g']]].map((row, j) => row.map(([ch, s], i) => {
      const x = 160 - row.length * 20 + i * 40 + 2, y = 30 + j * 56
      const fill = s === 'g' ? '#7cc400' : s === 'y' ? P : '#3a3a3c'
      return `<rect x="${x}" y="${y}" width="36" height="36" rx="3" fill="${fill}"/><text x="${x + 18}" y="${y + 26}" text-anchor="middle" font-family="'Noto Sans',Arial,sans-serif" font-weight="800" font-size="20" fill="#fff">${ch}</text>`
    }).join('')).join('')}
    <text x="160" y="160" text-anchor="middle" font-family="'Noto Sans',Arial,sans-serif" font-size="10" fill="#9a9a9c" letter-spacing="3">PAROLE</text>`, u, 'Parole'),

  trivia: (u) => wrap(`
    <defs><linearGradient id="tb§" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f1e6"/><stop offset="1" stop-color="#e8dccb"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#tb§)"/>
    <g fill="#3a332b"><rect x="44" y="40" width="70" height="10" rx="1"/><rect x="50" y="50" width="58" height="6"/><rect x="40" y="148" width="78" height="10" rx="1"/><rect x="46" y="140" width="66" height="8"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${54 + i * 11}" y="58" width="6" height="82" rx="3" opacity="${i % 2 ? 0.75 : 1}"/>`).join('')}</g>
    <text x="196" y="112" text-anchor="middle" font-family="'Big Shoulders Display',Impact,sans-serif" font-weight="900" font-size="96" fill="${P}">?</text>
    <g font-family="'Noto Sans',Arial,sans-serif" font-size="9" font-weight="700">
      ${['A', 'B', 'C', 'D'].map((c, i) => `<rect x="${236 + (i % 2) * 34}" y="${54 + Math.floor(i / 2) * 34}" width="28" height="26" rx="6" fill="${i === 2 ? L : '#fff'}" stroke="#3a332b"/><text x="${250 + (i % 2) * 34}" y="${71 + Math.floor(i / 2) * 34}" text-anchor="middle" fill="#3a332b">${c}</text>`).join('')}
    </g>`, u, 'Trivia'),
}

let n = 0
export const coverSvg = (name) => (COVERS[name] ? COVERS[name](`c${++n}`) : '')
export const isDrawn = (name) => !!COVERS[name]
