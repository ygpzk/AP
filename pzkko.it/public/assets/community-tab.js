// La scheda #community: i numeri pubblici di OLLARE dentro il profilo (dal 27.11 solo OLLARE, il server dove si fa il
// podcast). Si carica solo quando la scheda si apre (import dinamico da app.js) e rilegge /api/community, che a sua
// volta legge solo l'invito pubblico di Discord.
//
// Niente nomi, niente messaggi, niente canali vocali: qui passano membri, online, boost, tier, verifica e l'anno di
// nascita del server. Il resto resta fuori.

const NUM = new Intl.NumberFormat('it-IT', { useGrouping: true })
const PCT = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const ORA = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  timeZone: 'Europe/Rome',
})

const REFRESH = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0 .6 4"/><path d="M20 4v7h-7"/></svg>'
const EXT = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>'
const TIER3 = 14 // i boost che servono per il Tier 3

const TESTI = {
  it: {
    kicker: 'Community · dati pubblici',
    title1: 'OLLARE,',
    title2: 'in chiaro.',
    text: 'Membri, presenze e boost letti dall’invito pubblico. Nessun nome, nessun canale vocale, nessuno storico di persone.',
    refresh: 'Aggiorna',
    updating: 'Aggiorno…',
    updated: 'aggiornato',
    noNames: 'membri tracciati',
    members: 'Membri',
    online: 'Online ora',
    presence: 'Presenza',
    boost: 'Boost',
    membersNote: 'iscritti al server',
    onlineNote: 'presenze dichiarate',
    presenceNote: 'online ÷ membri',
    boostNote: (tier) => `Tier ${tier}`,
    serverLead: 'OLLARE è nato il 15 novembre 2026 ed è casa di Giugnoh’s Cast: il podcast va in onda sul suo palco. I numeri sono quelli che Discord mostra a chiunque apra l’invito.',
    tier: 'Tier',
    verification: 'Verifica',
    since: 'Dal',
    join: 'Apri invito',
    community: 'Community',
    tag: 'Tag',
    presenceTitle: 'Presenza online',
    boostTitle: 'Boost',
    onlineWord: 'online',
    presenceLong: (on, tot) => `${on} persone online su ${tot} iscritte.`,
    boostLong: (n) => `${n} boost: il Tier 3 si raggiunge con 14, il resto è margine.`,
    percentNote: 'Le percentuali sono calcolate sui conteggi approssimativi; non sono una misura del traffico interno né delle ore vocali.',
    castTitle: 'Sul palco',
    castText: 'Giugnoh’s Cast, il podcast, si fa in diretta sul palco @OLLARE PODCAST. Le puntate, i redattori e il conto alla rovescia sono in bacheca.',
    castCta: 'Vai al podcast',
    methodSection: 'Metodo',
    method: [
      { title: 'Fonte pubblica', text: 'Leggo l’endpoint pubblico degli inviti di Discord, con cache di cinque minuti. I numeri sono quelli che Discord dà a chiunque apra l’invito.' },
      { title: 'Niente persone', text: 'Non leggo nomi, messaggi, canali vocali o attività individuali. Non c’è un bot dentro OLLARE e non c’è uno storico di chi entra o esce.' },
      { title: 'Vocali e clip: solo con un bot', text: 'Per ore vocali aggregate, zona clip ed eventi del podcast serve un bot autorizzato dagli admin del server. Qui non lo simulo e non lo faccio di nascosto.' },
    ],
    privacy: { label: 'Privacy', text: 'Questa scheda non usa cookie e non conserva dati personali: la funzione serverless tiene in memoria solo i conteggi aggregati per cinque minuti e un’impronta dell’IP per il limite di richieste.' },
    brand: { label: 'Marchi', text: 'OLLARE appartiene ai suoi proprietari. Questa scheda non è affiliata a Discord Inc.' },
    avviso: 'Non riesco a rileggere adesso: restano i numeri dell’ultima lettura.',
    partial: 'Il server non ha risposto: restano i numeri dell’ultima lettura buona. Riprova fra poco.',
    verificaNomi: ['Nessuna', 'Bassa', 'Media', 'Alta', 'Molto alta'],
  },
  en: {
    kicker: 'Community · public data',
    title1: 'OLLARE,',
    title2: 'in the open.',
    text: 'Members, presence and boosts read from the public invite. No names, no voice channels, no history of people.',
    refresh: 'Refresh',
    updating: 'Refreshing…',
    updated: 'updated',
    noNames: 'members tracked',
    members: 'Members',
    online: 'Online now',
    presence: 'Presence',
    boost: 'Boosts',
    membersNote: 'server members',
    onlineNote: 'reported presence',
    presenceNote: 'online ÷ members',
    boostNote: (tier) => `Tier ${tier}`,
    serverLead: 'OLLARE was born on 15 November 2026 and is home to Giugnoh’s Cast: the podcast airs on its stage. These are the numbers Discord shows to anyone opening the invite.',
    tier: 'Tier',
    verification: 'Verification',
    since: 'Since',
    join: 'Open invite',
    community: 'Community',
    tag: 'Tag',
    presenceTitle: 'Online presence',
    boostTitle: 'Boosts',
    onlineWord: 'online',
    presenceLong: (on, tot) => `${on} people online out of ${tot} members.`,
    boostLong: (n) => `${n} boosts: Tier 3 takes 14, the rest is headroom.`,
    percentNote: 'Percentages use approximate counts; they are not a measure of internal traffic or voice hours.',
    castTitle: 'On stage',
    castText: 'Giugnoh’s Cast, the podcast, goes out live on the @OLLARE PODCAST stage. Episodes, hosts and the countdown are on the board.',
    castCta: 'Go to the podcast',
    methodSection: 'Method',
    method: [
      { title: 'Public source', text: 'I read Discord’s public invite endpoint, cached for five minutes. These are the numbers Discord gives anyone opening the invite.' },
      { title: 'No people', text: 'I don’t read names, messages, voice channels or individual activity. There is no bot inside OLLARE and no history of who joins or leaves.' },
      { title: 'Voice and clips: only with a bot', text: 'Aggregate voice hours, a clips zone and podcast events need a bot authorised by the server admins. I don’t simulate it and I don’t do it secretly.' },
    ],
    privacy: { label: 'Privacy', text: 'This tab uses no cookies and stores no personal data: the serverless function only keeps aggregate counts in memory for five minutes and a hash of the IP for rate limiting.' },
    brand: { label: 'Trademarks', text: 'OLLARE belongs to its owners. This tab is not affiliated with Discord Inc.' },
    avviso: 'I can’t refresh right now: the numbers from the last read stay.',
    partial: 'The server didn’t respond: the numbers from the last good read stay. Try again shortly.',
    verificaNomi: ['None', 'Low', 'Medium', 'High', 'Very high'],
  },
}

// Il server. I numeri sono la fotografia del 24.11.2026: se l'API non risponde, la scheda resta leggibile e dice che
// sono quelli dell'ultima lettura.
const BASE = {
  codice: 'ollare', nome: 'OLLARE', tag: 'LEAN', invito: 'https://discord.gg/ollare',
  icona: 'https://cdn.discordapp.com/icons/1571451216893050891/a_d823b4f1b373f417daefcd4d217728e3.png?size=128',
  sotto: { it: '@OLLARE #0.2k · tag LEAN', en: '@OLLARE #0.2k · LEAN tag' },
  membri: 205, online: 52, boost: 19, tier: 3, verifica: 2, creato: '2026-11-15T09:06:06.259Z',
}
const RISERVA = { aggiornato: '2026-11-24T01:54:00.701Z', parziale: false, server: [BASE] }

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

function markup(t, lang) {
  const s = BASE, pres = pct(s.online, s.membri)
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
    <article class="cm-kpi"><span>${esc(t.members)}</span><b data-cm-campo="membri">${NUM.format(s.membri)}</b><small>${esc(t.membersNote)}</small></article>
    <article class="cm-kpi"><span>${esc(t.online)}</span><b data-cm-campo="online">${NUM.format(s.online)}</b><small>${esc(t.onlineNote)}</small></article>
    <article class="cm-kpi"><span>${esc(t.presence)}</span><b data-cm-campo="presenza">${PCT.format(pres)}%</b><small>${esc(t.presenceNote)}</small></article>
    <article class="cm-kpi"><span>${esc(t.boost)}</span><b data-cm-campo="boost">${NUM.format(s.boost)}</b><small data-cm-campo="tier-nota">${esc(t.boostNote(s.tier))}</small></article>
  </div>

  <p class="cm-fine cm-fine--lead">${esc(t.serverLead)}</p>
  <div class="cm-servers">
    <article class="cm-server" data-cm-server="${s.codice}">
      <div class="cm-server__top">
        <img class="cm-server__ico" src="${esc(s.icona)}" alt="" width="48" height="48" loading="lazy" data-cm-icona>
        <div class="cm-server__name"><h3>${esc(s.nome)}</h3><p>${esc(pick(s.sotto, lang))}</p></div>
        <a class="cm-server__join" href="${esc(s.invito)}" target="_blank" rel="noopener noreferrer">${esc(t.join)} ${EXT}</a>
      </div>
      <div class="cm-server__nums">
        <div><span>${esc(t.members)}</span><b data-cm-campo="membri">${NUM.format(s.membri)}</b></div>
        <div><span>${esc(t.online)}</span><b data-cm-campo="online">${NUM.format(s.online)}</b></div>
        <div><span>${esc(t.presence)}</span><b data-cm-campo="presenza">${PCT.format(pres)}%</b></div>
      </div>
      <div class="cm-track" role="img" aria-label="${NUM.format(s.online)} / ${NUM.format(s.membri)} · ${PCT.format(pres)}%">
        <i data-cm-campo="barra" style="--cm-p:${Math.min(100, pres).toFixed(2)}%"></i>
      </div>
      <div class="cm-facts">
        <div class="cm-fact"><span>${esc(t.tier)}</span><b data-cm-campo="tier">${s.tier}</b></div>
        <div class="cm-fact"><span>${esc(t.boost)}</span><b data-cm-campo="boost">${NUM.format(s.boost)}</b></div>
        <div class="cm-fact"><span>${esc(t.verification)}</span><b data-cm-campo="verifica">${esc(t.verificaNomi[s.verifica] || '—')}</b></div>
        <div class="cm-fact"><span>${esc(t.since)}</span><b data-cm-campo="creato">${anno(s.creato)}</b></div>
      </div>
      <div class="cm-tags"><span class="tag">${esc(t.community)}</span><span class="tag">${esc(t.tag)} ${esc(s.tag)}</span><span class="tag" data-cm-campo="tier-tag">${esc(t.tier)} ${s.tier}</span></div>
    </article>
  </div>
  <p class="cm-fine">${esc(t.percentNote)}</p>

  <div class="cm-compare">
    <article class="cm-panel">
      <div class="cm-panel__h"><span>${esc(t.presenceTitle)}</span><span>OLLARE</span></div>
      <div class="cm-donut-wrap">
        <div class="cm-donut" data-cm-donut style="--cm-p:${pres.toFixed(1)}" role="img" aria-label="${PCT.format(pres)}% ${esc(t.onlineWord)}: ${NUM.format(s.online)} / ${NUM.format(s.membri)}">
          <div><b data-cm-campo="presenza">${PCT.format(pres)}%</b><span>${esc(t.onlineWord)}</span></div>
        </div>
        <div class="cm-donut-txt"><p data-cm-campo="presenza-testo">${esc(t.presenceLong(NUM.format(s.online), NUM.format(s.membri)))}</p></div>
      </div>
    </article>

    <article class="cm-panel">
      <div class="cm-panel__h"><span>${esc(t.boostTitle)}</span><span>Tier 3 = ${TIER3}</span></div>
      <div class="cm-brow"><span class="cm-brow__name">OLLARE</span><div class="cm-track"><i data-cm-campo="boost-barra" style="--cm-p:${Math.min(100, (s.boost / TIER3) * 100).toFixed(2)}%"></i></div><b data-cm-campo="boost">${NUM.format(s.boost)}</b></div>
      <p class="cm-fine" data-cm-campo="boost-testo">${esc(t.boostLong(NUM.format(s.boost)))}</p>
      <div class="cm-panel__h" style="margin-top:14px"><span>${esc(t.castTitle)}</span></div>
      <p class="cm-fine cm-fine--lead">${esc(t.castText)}</p>
      <button type="button" class="btn btn--ghost" style="margin-top:10px" data-cm-podcast>${esc(t.castCta)} →</button>
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

function setCampo(root, campo, testo) {
  for (const el of root.querySelectorAll(`[data-cm-campo="${campo}"]`)) el.textContent = testo
}

function applica(root, dati, t) {
  const d = (Array.isArray(dati?.server) ? dati.server : []).find((s) => s.codice === BASE.codice)
  const membri = num(d?.membri) ?? BASE.membri
  const online = num(d?.online) ?? BASE.online
  const boost = num(d?.boost) ?? BASE.boost
  const tier = num(d?.tier) ?? BASE.tier
  const verifica = num(d?.verifica) ?? BASE.verifica
  const creato = d?.creato || BASE.creato
  const presenza = pct(online, membri)

  setCampo(root, 'membri', NUM.format(membri))
  setCampo(root, 'online', NUM.format(online))
  setCampo(root, 'presenza', `${PCT.format(presenza)}%`)
  setCampo(root, 'boost', NUM.format(boost))
  setCampo(root, 'tier', String(tier))
  setCampo(root, 'tier-tag', `${t.tier} ${tier}`)
  setCampo(root, 'tier-nota', t.boostNote(tier))
  setCampo(root, 'verifica', t.verificaNomi[verifica] || '—')
  setCampo(root, 'creato', anno(creato))
  setCampo(root, 'presenza-testo', t.presenceLong(NUM.format(online), NUM.format(membri)))
  setCampo(root, 'boost-testo', t.boostLong(NUM.format(boost)))

  const barra = root.querySelector('[data-cm-campo="barra"]')
  if (barra) {
    barra.style.setProperty('--cm-p', `${Math.min(100, presenza).toFixed(2)}%`)
    barra.parentElement.setAttribute('aria-label', `${NUM.format(online)} / ${NUM.format(membri)} · ${PCT.format(presenza)}%`)
  }
  root.querySelector('[data-cm-campo="boost-barra"]')?.style.setProperty('--cm-p', `${Math.min(100, (boost / TIER3) * 100).toFixed(2)}%`)
  const donut = root.querySelector('[data-cm-donut]')
  if (donut && membri > 0) {
    donut.style.setProperty('--cm-p', presenza.toFixed(1))
    donut.setAttribute('aria-label', `${PCT.format(presenza)}% ${t.onlineWord}: ${NUM.format(online)} / ${NUM.format(membri)}`)
  }
  const img = root.querySelector('[data-cm-icona]')
  if (img && typeof d?.icona === 'string' && /^https:\/\/cdn\.discordapp\.com\//.test(d.icona)) img.src = d.icona

  const quando = dati?.aggiornato ? dataOra(dati.aggiornato) : null
  for (const el of root.querySelectorAll('[data-cm-aggiornato]')) if (quando) el.textContent = quando

  const avviso = root.querySelector('[data-cm-avviso]')
  if (avviso) {
    avviso.hidden = !dati?.parziale
    if (dati?.parziale) avviso.textContent = t.partial
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

export function monta(root, { lang = 'it', vai } = {}) {
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
  // dalla community al podcast in bacheca
  root.querySelector('[data-cm-podcast]')?.addEventListener('click', () => {
    if (typeof vai === 'function') vai('board')
    else location.hash = '#bacheca'
    // (il cambio di scheda passa da una transizione: si scorre quando la bacheca c'è)
    setTimeout(() => document.getElementById('cast-card')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 420)
  })

  carica(root, t)
}
