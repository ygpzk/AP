// La scheda #community: i numeri pubblici di OLLARE e SOLLARY dentro il profilo.
// Si carica solo quando la scheda si apre (import dinamico da app.js) e rilegge
// /api/community, che a sua volta legge solo gli inviti pubblici di Discord.
//
// Niente nomi, niente messaggi, niente canali vocali: qui passano membri, online,
// boost, tier, verifica e l'anno di nascita del server. Il resto resta fuori.

const NUM = new Intl.NumberFormat('it-IT', { useGrouping: true })
const PCT = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const ORA = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  timeZone: 'Europe/Rome',
})

const REFRESH = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0 .6 4"/><path d="M20 4v7h-7"/></svg>'
const EXT = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'

const TESTI = {
  it: {
    kicker: 'Community · dati pubblici',
    title1: 'OLLARE e SOLLARY,',
    title2: 'in chiaro.',
    text: 'Membri, presenze e boost letti dagli inviti pubblici. Nessun nome, nessun canale vocale, nessuno storico di persone.',
    refresh: 'Aggiorna',
    updating: 'Aggiorno…',
    updated: 'aggiornato',
    noNames: 'membri tracciati',
    servers: 'Server',
    members: 'Membri',
    online: 'Online ora',
    boost: 'Boost',
    membersNote: 'somma degli iscritti',
    onlineNote: 'presenze dichiarate',
    boostNote: 'potenziamenti dei due server',
    serversLead: 'OLLARE è piccola e appena nata; SOLLARY è un server pubblico grande. I numeri sono quelli che Discord mostra a chiunque apra l’invito.',
    presence: 'Presenza',
    tier: 'Tier',
    verification: 'Verifica',
    since: 'Dal',
    join: 'Apri invito',
    community: 'Community',
    tag: 'Tag',
    membersTitle: 'Membri',
    presenceTitle: 'Presenza online',
    boostTitle: 'Boost',
    scaleLinear: 'scala lineare',
    scalePresence: (max) => `scala 0–${max}%`,
    boosts: 'potenziamenti',
    membersNote1: 'SOLLARY è circa ',
    membersNote2: ' volte OLLARE. La barra parte da zero: per questo OLLARE si vede appena.',
    presenceNote: (nome, pct) => `${nome} ha la quota più alta di persone online (${pct}). L’altro server ha più persone in assoluto.`,
    boostNote: 'Il Tier 3 si raggiunge con 14 boost: il resto è margine.',
    together: 'Insieme adesso',
    twoServers: 'i due server',
    onlineWord: 'online',
    togetherNote1: 'persone online su ',
    togetherNote2: ' iscritte, sommando i due server.',
    percentNote: 'Le percentuali sono calcolate sui conteggi approssimativi; non sono una misura del traffico interno né delle ore vocali.',
    methodSection: 'Metodo',
    methodTitle: 'Il patto, in chiaro.',
    methodLead: 'La differenza tra una statistica pubblica e una sorveglianza. Qui sta tutto il patto.',
    method: [
      { title: 'Fonte pubblica', text: 'Leggo l’endpoint pubblico degli inviti di Discord, con cache di cinque minuti. I numeri sono quelli che Discord dà a chiunque apra l’invito.' },
      { title: 'Niente persone', text: 'Non leggo nomi, messaggi, canali vocali o attività individuali. Non c’è un bot dentro OLLARE o SOLLARY e non c’è uno storico di chi entra o esce.' },
      { title: 'Vocali e clip: solo con un bot tuo', text: 'Per ore vocali aggregate, zona clip ed eventi del podcast serve un bot autorizzato dagli admin in un server tuo. Qui non lo simulo e non lo faccio di nascosto.' },
    ],
    privacy: { label: 'Privacy', text: 'Questa scheda non usa cookie e non conserva dati personali: la funzione serverless tiene in memoria solo i conteggi aggregati per cinque minuti e un’impronta dell’IP per il limite di richieste.' },
    brand: { label: 'Marchi', text: 'OLLARE e SOLLARY appartengono ai loro proprietari. Questa scheda non è affiliata a Discord Inc.' },
    avviso: 'Non riesco a rileggere adesso: restano i numeri dell’ultima lettura.',
    partial: 'Un server non ha risposto: i numeri possono essere parziali. Riprova fra poco.',
    verificaNomi: ['Nessuna', 'Bassa', 'Media', 'Alta', 'Molto alta'],
  },
  en: {
    kicker: 'Community · public data',
    title1: 'OLLARE and SOLLARY,',
    title2: 'in the open.',
    text: 'Members, presence and boosts read from public invites. No names, no voice channels, no history of people.',
    refresh: 'Refresh',
    updating: 'Refreshing…',
    updated: 'updated',
    noNames: 'members tracked',
    servers: 'Servers',
    members: 'Members',
    online: 'Online now',
    boost: 'Boosts',
    membersNote: 'sum of members',
    onlineNote: 'reported presence',
    boostNote: 'boosts across both',
    serversLead: 'OLLARE is small and brand new; SOLLARY is a large public server. These are the numbers Discord shows to anyone opening the invite.',
    presence: 'Presence',
    tier: 'Tier',
    verification: 'Verification',
    since: 'Since',
    join: 'Open invite',
    community: 'Community',
    tag: 'Tag',
    membersTitle: 'Members',
    presenceTitle: 'Online presence',
    boostTitle: 'Boosts',
    scaleLinear: 'linear scale',
    scalePresence: (max) => `0–${max}% scale`,
    boosts: 'boosts',
    membersNote1: 'SOLLARY is about ',
    membersNote2: ' times OLLARE. The bar starts at zero: that’s why OLLARE is barely visible.',
    presenceNote: (nome, pct) => `${nome} has the highest share of people online (${pct}). The other server has more people overall.`,
    boostNote: 'Tier 3 is reached with 14 boosts: the rest is headroom.',
    together: 'Together now',
    twoServers: 'both servers',
    onlineWord: 'online',
    togetherNote1: 'people online out of ',
    togetherNote2: ' members, across both servers.',
    percentNote: 'Percentages use approximate counts; they are not a measure of internal traffic or voice hours.',
    methodSection: 'Method',
    methodTitle: 'The deal, in the open.',
    methodLead: 'The difference between a public statistic and surveillance. This is the whole deal.',
    method: [
      { title: 'Public source', text: 'I read Discord’s public invite endpoint, cached for five minutes. These are the numbers Discord gives anyone opening the invite.' },
      { title: 'No people', text: 'I don’t read names, messages, voice channels or individual activity. There is no bot inside OLLARE or SOLLARY and no history of who joins or leaves.' },
      { title: 'Voice and clips: only with your bot', text: 'Aggregate voice hours, a clips zone and podcast events need a bot authorised by the admins in a server you own. I don’t simulate it and I don’t do it secretly.' },
    ],
    privacy: { label: 'Privacy', text: 'This tab uses no cookies and stores no personal data: the serverless function only keeps aggregate counts in memory for five minutes and a hash of the IP for rate limiting.' },
    brand: { label: 'Trademarks', text: 'OLLARE and SOLLARY belong to their owners. This tab is not affiliated with Discord Inc.' },
    avviso: 'I can’t refresh right now: the numbers from the last read stay.',
    partial: 'One server didn’t respond: the numbers may be partial. Try again shortly.',
    verificaNomi: ['None', 'Low', 'Medium', 'High', 'Very high'],
  },
}

// I due server. I numeri sono la fotografia del 24.11.2026: se l'API non
// risponde, la scheda resta leggibile e dice che sono quelli dell'ultima lettura.
const BASE = [
  {
    codice: 'ollare', nome: 'OLLARE', tag: 'LEAN', invito: 'https://discord.gg/ollare',
    icona: 'https://cdn.discordapp.com/icons/1571451216893050891/a_d823b4f1b373f417daefcd4d217728e3.png?size=128',
    sotto: { it: '@OLLARE #0.2k · tag LEAN', en: '@OLLARE #0.2k · LEAN tag' },
    membri: 205, online: 52, boost: 19, tier: 3, verifica: 2, creato: '2026-11-15T09:06:06.259Z',
  },
  {
    codice: 'sollary', nome: 'SOLLARY', tag: 'SOLL', invito: 'https://discord.gg/sollary',
    icona: 'https://cdn.discordapp.com/icons/703694620617343077/a_37546f7ec7fcf3c024c0378dfc373403.png?size=128',
    sotto: { it: 'Social · Gaming · Discord Italia', en: 'Social · Gaming · Discord Italy' },
    membri: 70677, online: 6477, boost: 133, tier: 3, verifica: 4, creato: '2020-04-25T19:51:11.569Z',
  },
]

const RISERVA = {
  aggiornato: '2026-11-24T01:54:00.701Z',
  parziale: false,
  server: BASE,
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const pick = (v, lang) => (typeof v === 'string' ? v : v?.[lang] || v?.en || v?.it || '')
const num = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0)

function dataOra(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const p = Object.fromEntries(ORA.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.day}.${p.month}.${p.year} · ${p.hour}:${p.minute}`
}

function anno(iso) {
  const d = new Date(iso)
  return Number.isFinite(d.getFullYear()) ? String(d.getFullYear()) : '—'
}

function serverCard(s, t, lang) {
  const presenza = pct(s.online, s.membri)
  return `<article class="cm-server" data-cm-server="${s.codice}">
    <div class="cm-server__top">
      <img class="cm-server__ico" src="${esc(s.icona)}" alt="" width="48" height="48" loading="lazy" data-cm-icona>
      <div class="cm-server__name"><h3>${esc(s.nome)}</h3><p>${esc(pick(s.sotto, lang))}</p></div>
      <a class="cm-server__join" href="${esc(s.invito)}" target="_blank" rel="noopener noreferrer">${esc(t.join)} ${EXT}</a>
    </div>
    <div class="cm-server__nums">
      <div><span>${esc(t.members)}</span><b data-cm-campo="membri">${NUM.format(s.membri)}</b></div>
      <div><span>${esc(t.online)}</span><b data-cm-campo="online">${NUM.format(s.online)}</b></div>
      <div><span>${esc(t.presence)}</span><b data-cm-campo="presenza">${PCT.format(presenza)}%</b></div>
    </div>
    <div class="cm-track" role="img" aria-label="${NUM.format(s.online)} / ${NUM.format(s.membri)} · ${PCT.format(presenza)}%">
      <i data-cm-campo="barra" style="--cm-p:${Math.min(100, presenza).toFixed(2)}%"></i>
    </div>
    <div class="cm-facts">
      <div class="cm-fact"><span>${esc(t.tier)}</span><b data-cm-campo="tier">${s.tier}</b></div>
      <div class="cm-fact"><span>${esc(t.boost)}</span><b data-cm-campo="boost">${NUM.format(s.boost)}</b></div>
      <div class="cm-fact"><span>${esc(t.verification)}</span><b data-cm-campo="verifica">${esc(t.verificaNomi[s.verifica] || '—')}</b></div>
      <div class="cm-fact"><span>${esc(t.since)}</span><b data-cm-campo="creato">${anno(s.creato)}</b></div>
    </div>
    <div class="cm-tags"><span class="tag">${esc(t.community)}</span><span class="tag">${esc(t.tag)} ${esc(s.tag)}</span><span class="tag">${esc(t.tier)} ${s.tier}</span></div>
  </article>`
}

function brow(key, nome, valore, testo) {
  return `<div class="cm-brow"><span class="cm-brow__name">${nome}</span><div class="cm-track"><i data-cm-compare="${key}" style="--cm-p:${valore.toFixed(2)}%"></i></div><b data-cm-valore="${key}">${testo}</b></div>`
}

function markup(t, lang) {
  const o = BASE[0], s = BASE[1]
  const oPres = pct(o.online, o.membri), sPres = pct(s.online, s.membri)
  const totaleMembri = o.membri + s.membri, totaleOnline = o.online + s.online, totaleBoost = o.boost + s.boost
  const totalePres = pct(totaleOnline, totaleMembri)
  const alta = oPres >= sPres ? o : s
  return `<div class="cm-tab">
  <section class="cm-banner cm-banner--tab">
    <img class="cm-banner__art" src="/assets/community/hero.svg" alt="" width="1200" height="760" loading="lazy" aria-hidden="true">
    <span class="cm-banner__shade" aria-hidden="true"></span>
    <div class="cm-banner__body">
      <span class="cm-kicker"><i></i>${esc(t.kicker)}</span>
      <h2>${esc(t.title1)}<br>${esc(t.title2)}</h2>
      <p>${esc(t.text)}</p>
      <div class="cm-banner__actions">
        <button type="button" class="btn btn--ghost" data-cm-ricarica>${REFRESH}<span>${esc(t.refresh)}</span></button>
        <span class="cm-updated">${esc(t.updated)} <b data-cm-aggiornato>…</b></span>
      </div>
    </div>
    <span class="cm-banner__badge"><b>0</b>${esc(t.noNames)}</span>
  </section>

  <div class="cm-kpis">
    <article class="cm-kpi"><span>${esc(t.servers)}</span><b data-cm-totale="server">${BASE.length}</b><small>OLLARE · SOLLARY</small></article>
    <article class="cm-kpi"><span>${esc(t.members)}</span><b data-cm-totale="membri">${NUM.format(totaleMembri)}</b><small>${esc(t.membersNote)}</small></article>
    <article class="cm-kpi"><span>${esc(t.online)}</span><b data-cm-totale="online">${NUM.format(totaleOnline)}</b><small>${esc(t.onlineNote)}</small></article>
    <article class="cm-kpi"><span>${esc(t.boost)}</span><b data-cm-totale="boost">${NUM.format(totaleBoost)}</b><small>${esc(t.boostNote)}</small></article>
  </div>

  <p class="cm-fine cm-fine--lead">${esc(t.serversLead)}</p>
  <div class="cm-servers">${BASE.map((x) => serverCard(x, t, lang)).join('')}</div>
  <p class="cm-fine">${esc(t.presence)} = online ÷ ${esc(t.members.toLowerCase())}. ${esc(t.percentNote)}</p>

  <div class="cm-compare">
    <article class="cm-panel">
      <div class="cm-panel__h"><span>${esc(t.membersTitle)}</span><span>${esc(t.scaleLinear)}</span></div>
      ${brow('membri-ollare', 'OLLARE', (o.membri / s.membri) * 100, NUM.format(o.membri))}
      ${brow('membri-sollary', 'SOLLARY', 100, NUM.format(s.membri))}
      <p class="cm-fine">${esc(t.membersNote1)}<b data-cm-ratio>${NUM.format(Math.round(s.membri / o.membri))}</b>${esc(t.membersNote2)}</p>
    </article>

    <article class="cm-panel">
      <div class="cm-panel__h"><span>${esc(t.presenceTitle)}</span><span data-cm-scala="presenza">${esc(t.scalePresence(30))}</span></div>
      ${brow('presenza-ollare', 'OLLARE', (oPres / 30) * 100, `${PCT.format(oPres)}%`)}
      ${brow('presenza-sollary', 'SOLLARY', (sPres / 30) * 100, `${PCT.format(sPres)}%`)}
      <p class="cm-fine" data-cm-nota="presenza">${esc(t.presenceNote(alta.nome, `${PCT.format(pct(alta.online, alta.membri))}%`))}</p>
    </article>

    <article class="cm-panel">
      <div class="cm-panel__h"><span>${esc(t.boostTitle)}</span><span>${esc(t.boosts)}</span></div>
      ${brow('boost-ollare', 'OLLARE', (o.boost / s.boost) * 100, NUM.format(o.boost))}
      ${brow('boost-sollary', 'SOLLARY', 100, NUM.format(s.boost))}
      <p class="cm-fine">${esc(t.boostNote)}</p>
    </article>

    <article class="cm-panel">
      <div class="cm-panel__h"><span>${esc(t.together)}</span><span>${esc(t.twoServers)}</span></div>
      <div class="cm-donut-wrap">
        <div class="cm-donut" data-cm-donut style="--cm-p:${totalePres.toFixed(1)}" role="img" aria-label="${PCT.format(totalePres)}% ${esc(t.onlineWord)}: ${NUM.format(totaleOnline)} / ${NUM.format(totaleMembri)}">
          <div><b data-cm-donut-valore>${PCT.format(totalePres)}%</b><span>${esc(t.onlineWord)}</span></div>
        </div>
        <div class="cm-donut-txt"><p><b data-cm-valore="online-totale">${NUM.format(totaleOnline)}</b> ${esc(t.togetherNote1)}<b data-cm-valore="membri-totale">${NUM.format(totaleMembri)}</b>${esc(t.togetherNote2)}</p></div>
      </div>
    </article>
  </div>

  <div class="cm-panel__h"><span>${esc(t.methodSection)}</span></div>
  <div class="cm-method">
    ${t.method.map((m, i) => `<article class="widget"><div class="cm-method__ico${i === 1 ? ' cm-method__ico--a' : i === 2 ? ' cm-method__ico--p' : ''}">${i === 0 ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/></svg>' : i === 1 ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 2.8 7.7 7 10 4.2-2.3 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>' : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M5 8v8M19 8v8M8 11v2M16 11v2"/></svg>'}</div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></article>`).join('')}
  </div>
  <p class="cm-note"><b>${esc(t.privacy.label)}.</b> ${esc(t.privacy.text)}</p>
  <p class="cm-note"><b>${esc(t.brand.label)}.</b> ${esc(t.brand.text)}</p>
  <p class="cm-avviso" data-cm-avviso hidden></p>
</div>`
}

function setAll(root, sel, testo) {
  for (const el of root.querySelectorAll(sel)) el.textContent = testo
}

function setCampo(card, campo, testo) {
  const el = card.querySelector(`[data-cm-campo="${campo}"]`)
  if (el) el.textContent = testo
}

function setBarra(root, chiave, valore) {
  const el = root.querySelector(`[data-cm-compare="${chiave}"]`)
  if (el) el.style.setProperty('--cm-p', `${Math.max(0, Math.min(100, valore)).toFixed(2)}%`)
}

function setValore(root, chiave, testo) {
  setAll(root, `[data-cm-valore="${chiave}"]`, testo)
}

function applica(root, dati, t) {
  const server = Array.isArray(dati?.server) ? dati.server : []
  const per = new Map(server.map((s) => [s.codice, s]))
  let completo = server.length >= BASE.length
  const valori = []

  for (const base of BASE) {
    const d = per.get(base.codice)
    const membri = num(d?.membri) ?? base.membri
    const online = num(d?.online) ?? base.online
    const boost = num(d?.boost) ?? base.boost
    const tier = num(d?.tier) ?? base.tier
    const verifica = num(d?.verifica) ?? base.verifica
    const creato = d?.creato || base.creato
    if (num(d?.membri) == null || num(d?.online) == null) completo = false
    const presenza = pct(online, membri)
    valori.push({ ...base, membri, online, boost, tier, verifica, creato, presenza })

    const card = root.querySelector(`[data-cm-server="${base.codice}"]`)
    if (!card) continue
    setCampo(card, 'membri', NUM.format(membri))
    setCampo(card, 'online', NUM.format(online))
    setCampo(card, 'presenza', `${PCT.format(presenza)}%`)
    setCampo(card, 'tier', String(tier))
    setCampo(card, 'boost', NUM.format(boost))
    setCampo(card, 'verifica', t.verificaNomi[verifica] || '—')
    setCampo(card, 'creato', anno(creato))
    const barra = card.querySelector('[data-cm-campo="barra"]')
    if (barra) {
      barra.style.setProperty('--cm-p', `${Math.min(100, presenza).toFixed(2)}%`)
      barra.parentElement.setAttribute('aria-label', `${NUM.format(online)} / ${NUM.format(membri)} · ${PCT.format(presenza)}%`)
    }
    const img = card.querySelector('[data-cm-icona]')
    if (img && typeof d?.icona === 'string' && /^https:\/\/cdn\.discordapp\.com\//.test(d.icona)) img.src = d.icona
  }

  const o = valori.find((x) => x.codice === 'ollare')
  const s = valori.find((x) => x.codice === 'sollary')
  const totaleMembri = valori.reduce((a, x) => a + x.membri, 0)
  const totaleOnline = valori.reduce((a, x) => a + x.online, 0)
  const totaleBoost = valori.reduce((a, x) => a + x.boost, 0)
  const totalePres = pct(totaleOnline, totaleMembri)

  if (completo) {
    setAll(root, '[data-cm-totale="server"]', String(valori.length))
    setAll(root, '[data-cm-totale="membri"]', NUM.format(totaleMembri))
    setAll(root, '[data-cm-totale="online"]', NUM.format(totaleOnline))
    setAll(root, '[data-cm-totale="boost"]', NUM.format(totaleBoost))
    setValore(root, 'membri-totale', NUM.format(totaleMembri))
    setValore(root, 'online-totale', NUM.format(totaleOnline))
  }

  if (o && s) {
    const maxMembri = Math.max(o.membri, s.membri, 1)
    setBarra(root, 'membri-ollare', (o.membri / maxMembri) * 100)
    setBarra(root, 'membri-sollary', (s.membri / maxMembri) * 100)
    setValore(root, 'membri-ollare', NUM.format(o.membri))
    setValore(root, 'membri-sollary', NUM.format(s.membri))
    if (o.membri > 0) setAll(root, '[data-cm-ratio]', NUM.format(Math.round(s.membri / o.membri)))

    const scala = Math.max(30, Math.ceil(Math.max(o.presenza, s.presenza) / 10) * 10)
    setAll(root, '[data-cm-scala="presenza"]', t.scalePresence(scala))
    setBarra(root, 'presenza-ollare', (o.presenza / scala) * 100)
    setBarra(root, 'presenza-sollary', (s.presenza / scala) * 100)
    setValore(root, 'presenza-ollare', `${PCT.format(o.presenza)}%`)
    setValore(root, 'presenza-sollary', `${PCT.format(s.presenza)}%`)
    const nota = root.querySelector('[data-cm-nota="presenza"]')
    if (nota) {
      const alta = o.presenza >= s.presenza ? o : s
      nota.textContent = t.presenceNote(alta.nome, `${PCT.format(alta.presenza)}%`)
    }

    const maxBoost = Math.max(o.boost, s.boost, 1)
    setBarra(root, 'boost-ollare', (o.boost / maxBoost) * 100)
    setBarra(root, 'boost-sollary', (s.boost / maxBoost) * 100)
    setValore(root, 'boost-ollare', NUM.format(o.boost))
    setValore(root, 'boost-sollary', NUM.format(s.boost))
  }

  const donut = root.querySelector('[data-cm-donut]')
  if (completo && donut && totaleMembri > 0) {
    donut.style.setProperty('--cm-p', totalePres.toFixed(1))
    donut.setAttribute('aria-label', `${PCT.format(totalePres)}% ${t.onlineWord}: ${NUM.format(totaleOnline)} / ${NUM.format(totaleMembri)}`)
    setAll(root, '[data-cm-donut-valore]', `${PCT.format(totalePres)}%`)
  }

  const quando = dati?.aggiornato ? dataOra(dati.aggiornato) : null
  if (quando) setAll(root, '[data-cm-aggiornato]', quando)

  const avviso = root.querySelector('[data-cm-avviso]')
  if (avviso) {
    if (dati?.parziale) {
      avviso.hidden = false
      avviso.textContent = t.partial
    } else {
      avviso.hidden = true
    }
  }
}

async function carica(root, t) {
  const btn = root.querySelector('[data-cm-ricarica]')
  btn?.setAttribute('aria-busy', 'true')
  try {
    const r = await fetch('/api/community', { headers: { accept: 'application/json' }, cache: 'no-cache' })
    if (!r.ok) throw new Error(`community: ${r.status}`)
    const dati = await r.json()
    if (!Array.isArray(dati.server) || !dati.server.length) throw new Error('community: risposta vuota')
    applica(root, dati, t)
    return true
  } catch (e) {
    const avviso = root.querySelector('[data-cm-avviso]')
    if (avviso) { avviso.hidden = false; avviso.textContent = t.avviso }
    console.warn(e)
    return false
  } finally {
    btn?.removeAttribute('aria-busy')
  }
}

export function monta(root, { lang = 'it' } = {}) {
  const t = TESTI[lang] || TESTI.en
  root.innerHTML = markup(t, lang)
  applica(root, RISERVA, t)

  const btn = root.querySelector('[data-cm-ricarica]')
  btn?.addEventListener('click', async () => {
    if (btn.disabled) return
    const span = btn.querySelector('span')
    const testo = span?.textContent ?? ''
    const avviso = root.querySelector('[data-cm-avviso]')
    if (avviso) avviso.hidden = true
    btn.disabled = true
    if (span) span.textContent = t.updating
    await carica(root, t)
    if (span) span.textContent = testo
    btn.disabled = false
  })

  carica(root, t)
}
