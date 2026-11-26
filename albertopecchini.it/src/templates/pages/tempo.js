// La macchina del tempo: i siti che ho fatto, com'erano a ogni giorno di lavoro. Tre pagine,
// tutte statiche e leggere (dal 3.11.2026 sera: «un html semplice leggibile con percorso
// completo e univoco»):
//
//   /tempo/                               l'archivio: i siti, con l'ultima cattura
//   /tempo/<dominio>/                     un sito: tutte le catture, mese per mese
//   /tempo/<dominio>/<AAAA-MM-GG>/        una cattura: la pagina di quel giorno e i suoi numeri
//
// Dal 26.11.2026 (Alberto: «lo stile della macchina del tempo lo voglio identico a quello del
// resto del sito») hanno la testata, i titoli, le schede e il piè di pagina di tutte le altre
// pagine: la barra grigia in Arial copiata dalla Wayback Machine non c'è più. E le copie dei siti
// di allora sono oscurate (tools/tempo/oscura-pagine.mjs): niente numeri, indirizzi, luoghi,
// social, né link al server di casa.
// Le versioni le ricostruisce tools/tempo/tempo.mjs (manifesti in src/data/tempo/).

import { html, esc } from '../html.js'
import { siti, aggiornato } from '../../data/tempo.js'
import { breadcrumb, splitWords, sectionHead, textLink, icon } from '../components/ui.js'
import { cover } from '../components/project.js'
import { head } from './info.js'
import { grafico, conteggio, chips, corta, lunga, settimanale, foto, dominio, sitoPath, catturaPath, conFoto, num, per, sicuro, piano, righello, fattiGiorno, listaCommit, griglia, fattiSito } from './tempo-pezzi.js'

const ultima = (s) => [...s.versioni].reverse().find(conFoto) || s.versioni.at(-1)
const mese = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
const commitTotali = (s) => (s.momenti?.commit || 0) + (s.momenti?.auto || 0)
const NOMI = { ap: 'Alberto Pecchini', cascina: 'Cascina Fontana' }
const nome = (s) => NOMI[s.id] || s.nome

// la copertina di un sito come nel portfolio: il portatile con la foto dell'ultima cattura
const copertina = (s, v, lazy = true) =>
  cover({ area: 'web', web: { domain: dominio(s.url), desktop: { src: foto(s.id, v.short), width: 640, height: 400, alt: `${dominio(s.url)} il ${lunga(v.data)}` } } }, { ratio: '16/10', lazy })

// il selettore dei siti: ogni sito porta alla sua cattura più recente
const selettore = (attuale) => html`
  <label class="tm-select pill">
    <span class="sr-only">Sito</span>
    <select data-tm-sito>
      ${!attuale && '<option value="" selected disabled>scegli un sito…</option>'}
      ${siti.map((s) => `<option value="${catturaPath(s, ultima(s))}"${attuale?.id === s.id ? ' selected' : ''}>${esc(dominio(s.url))} · ${s.versioni.length} catture</option>`)}
    </select>
  </label>
`

// cosa non si vede, e perché: in fondo a ogni pagina, vero per tutte le copie
const riservatezza = () => html`
  <section class="section tm-privacy" data-theme="tint" aria-labelledby="tm-privacy-title">
    <div class="container tm-privacy__grid">
      <div>
        <p class="label"><span class="sec-head__index">▮</span>Riservatezza</p>
        <h2 class="h2" id="tm-privacy-title" data-reveal="words">${splitWords('Cosa qui non vedi.', { accent: ['vedi.'] })}</h2>
      </div>
      <div class="tm-privacy__text" data-reveal="up">
        <p class="lead">Le pagine di allora sono copie fedeli, tranne dove c’era un dato personale: lì resta una barra.</p>
        <ul class="tm-privacy__list">
          <li>Numeri di telefono, email private, indirizzi, coordinate, il paese e la provincia sono coperti; le immagini che li mostravano sono un riquadro tratteggiato.</li>
          <li>I collegamenti a telefono, WhatsApp, social, mappe e ai siti che non pubblico più restano testo, senza portare da nessuna parte.</li>
          <li>Ore e giorni sono in ora italiana, presi dai commit. Degli autori si conta solo se c’era un assistente; nei messaggi i nomi delle persone sono coperti come il resto.</li>
        </ul>
        <p class="label tm-privacy__meta">Aggiornato il ${esc(lunga(aggiornato))} · ${textLink({ href: '/sicurezza/', label: 'Come proteggo i dati' })}</p>
      </div>
    </div>
  </section>
`

// ── /tempo/ : l'archivio ───────────────────────────────────────────────────

export function tempoPage() {
  // i vecchi indirizzi (#v=<sha>, #s=<sito>&v=<sha>, fino al 3.11.2026 sera) portano alla
  // pagina della loro cattura: sha corto → percorso
  const vecchi = Object.fromEntries(siti.map((s) => [s.id, Object.fromEntries(s.versioni.map((v) => [v.short, catturaPath(s, v)]))]))
  const catture = siti.reduce((n, s) => n + s.versioni.length, 0)
  return html`
    <div class="tm" data-tempo>
      ${head({
        crumbs: [{ label: 'Home', href: '/' }, { label: 'La macchina del tempo', href: '/tempo/' }],
        index: '↺',
        label: 'La macchina del tempo',
        title: 'I miei siti, giorno per giorno.',
        accent: ['giorno.'],
        lead: 'Ogni giorno di lavoro è una versione, ricostruita dal codice di allora e fotografata, come nella Wayback Machine: la pagina di quel giorno, l’istogramma dei commit, le statistiche.',
        meta: `${siti.length} siti · ${num(catture)} catture · ${num(siti.reduce((n, s) => n + commitTotali(s), 0))} commit`,
      })}

      <section class="section tm-index" aria-label="I siti">
        <div class="container">
          <div class="pf__grid tm-index__grid" data-view="grid">
            ${siti.map((s, i) => {
              const u = ultima(s)
              return html`
                <article class="card" data-span="6" data-reveal="up" style="--d:${i * 70}ms">
                  <a class="card__link" href="${catturaPath(s, u)}" data-cursor="Apri">
                    <div class="card__media">${copertina(s, u, i > 1)}</div>
                    <div class="card__body">
                      <p class="card__meta label"><span class="card__code">${esc(dominio(s.url))}</span><span>${per(s.versioni.length, 'cattura', 'catture')}</span><span>${u.data.slice(0, 4)}</span></p>
                      <h2 class="card__title"><span class="card__title-text">${esc(nome(s))}</span><span class="card__arrow" aria-hidden="true">${icon('arrowUpRight')}</span></h2>
                      <p class="card__sub">Dal ${esc(lunga(s.versioni[0].data))} al ${esc(lunga(s.versioni.at(-1).data))}, ${per(commitTotali(s), 'commit', 'commit')}. L’ultima cattura è del ${esc(lunga(u.data))}.</p>
                    </div>
                  </a>
                  <p class="card__foot label tm-index__links"><a class="uline" href="${sitoPath(s)}">tutte le catture</a><a class="uline" href="${catturaPath(s, s.versioni[0])}">la prima</a><a class="uline" href="${catturaPath(s, u)}">l’ultima</a></p>
                </article>
              `
            })}
          </div>
        </div>
      </section>

      ${riservatezza()}
      <script type="application/json" data-tm-vecchi>${JSON.stringify(vecchi).replace(/</g, '\\u003c')}</script>
    </div>
  `
}

// ── /tempo/<dominio>/ : tutte le catture di un sito, mese per mese ──────────

export function tempoSitoPage(s) {
  const mesi = []
  for (const v of s.versioni) {
    const m = v.data.slice(0, 7)
    if (!mesi.length || mesi.at(-1).m !== m) mesi.push({ m, nome: mese(v.data), versioni: [] })
    mesi.at(-1).versioni.push(v)
  }
  const d = dominio(s.url)
  return html`
    <div class="tm" data-tempo>
      ${head({
        crumbs: [{ label: 'Home', href: '/' }, { label: 'La macchina del tempo', href: '/tempo/' }, { label: d, href: sitoPath(s) }],
        index: '↺',
        label: d,
        title: `${nome(s)}, una versione al giorno.`,
        accent: ['giorno.'],
        lead: `${s.versioni.length} catture, una per giorno di lavoro, dal ${lunga(s.versioni[0].data)} al ${lunga(s.versioni.at(-1).data)}. Ogni barra dell’istogramma è un giorno: più è alta, più commit.`,
        meta: `${num(commitTotali(s))} commit`,
      })}

      <section class="section tm-sito" aria-label="Le catture">
        <div class="container">
          <div class="tm-bar" data-reveal="up">
            <p class="label tm-bar__count">${conteggio(s)}</p>
            ${selettore(s)}
          </div>
          <div data-reveal="up">${grafico(s, -1)}</div>
          ${mesi.map(
            (m) => html`
              <section class="tm-mese" aria-label="${esc(m.nome)}">
                <h2 class="tm-mese__title label"><span class="sec-head__index">${m.m.slice(5)}</span><span>${esc(m.nome)}</span><span class="tm-mese__n">${per(m.versioni.length, 'cattura', 'catture')}</span></h2>
                <ol class="tm-shots">
                  ${m.versioni.map(
                    (v) => html`
                      <li>
                        <a class="tm-shot" href="${catturaPath(s, v)}">
                          <span class="tm-shot__img">${conFoto(v) ? `<img src="${foto(s.id, v.short)}" width="640" height="400" alt="" loading="lazy" decoding="async" data-no-srcset>` : '<span class="tm-shot__none label">senza foto</span>'}</span>
                          <span class="tm-shot__date">${esc(corta(v.data))}<span class="label">${v.ora}</span></span>
                          <span class="tm-shot__n label">${per(v.commit, 'commit', 'commit')}${v.st?.piu || v.st?.meno ? ` · <b class="tm-plus">+${num(v.st.piu)}</b> <b class="tm-minus">−${num(v.st.meno)}</b>` : ''}</span>
                          <span class="tm-shot__msg">${sicuro(v.msg)}</span>
                        </a>
                      </li>
                    `,
                  )}
                </ol>
              </section>
            `,
          )}
        </div>
      </section>

      ${momenti(s)}
      ${riservatezza()}
    </div>
  `
}

// quando lavoravo: la griglia settimana × ora e i fatti, in una sezione scura
function momenti(s) {
  if (!s.momenti?.commit) return ''
  return html`
    <section class="section tm-work" data-theme="ink">
      <div class="container tm-work__grid">
        <div class="tm-work__side">
          ${sectionHead({ index: '02', label: 'Quando lavoravo', title: `Tutto ${dominio(s.url)}, ora per ora.`, lead: 'Un cerchio per ogni ora della settimana, grande quanti commit ho fatto in quell’ora. In ora italiana.' })}
        </div>
        <div class="tm-work__body" data-reveal="up">
          ${griglia(s.momenti)}
          <ul class="tm-facts">${fattiSito(s).map((f) => `<li>${f}</li>`)}</ul>
        </div>
      </div>
    </section>
  `
}

// ── /tempo/<dominio>/<AAAA-MM-GG>/ : una cattura ─────────────────────────────

export function tempoCatturaPage(s, k) {
  const v = s.versioni[k]
  const prev = s.versioni[k - 1]
  const next = s.versioni[k + 1]
  const d = dominio(s.url)
  const commit = s.giorni?.[v.data] || null
  const freccia = (w, verso) =>
    w
      ? `<a class="pill tm-nav__step" href="${catturaPath(s, w)}" data-tm-${verso} rel="${verso}" aria-label="Cattura ${verso === 'prev' ? 'precedente' : 'successiva'}, ${esc(lunga(w.data))}">${verso === 'prev' ? icon('arrowLeft') : ''}<span>${esc(corta(w.data))}</span>${verso === 'next' ? icon('arrow') : ''}</a>`
      : `<span class="pill tm-nav__step is-off">${verso === 'prev' ? 'la prima' : 'l’ultima'}</span>`
  return html`
    <div class="tm" data-tempo>
      <header class="phead tm-head">
        <div class="container">
          ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'La macchina del tempo', href: '/tempo/' }, { label: d, href: sitoPath(s) }, { label: corta(v.data), href: catturaPath(s, v) }])}
          <div class="phead__top label"><span><span class="sec-head__index">${String(v.n).padStart(2, '0')}</span>cattura ${v.n} di ${s.versioni.length}</span><span>${esc(settimanale(v.data))} · ${v.ora}</span></div>
          <div class="tm-head__row">
            <h1 class="tm-head__title">${splitWords(lunga(v.data), { accent: [v.data.slice(0, 4)] })}</h1>
            <nav class="tm-nav" aria-label="Catture vicine">
              ${freccia(prev, 'prev')}
              ${selettore(s)}
              ${freccia(next, 'next')}
            </nav>
          </div>
          <div class="tm-head__about">
            <p class="tm-head__msg"><code>${v.short}</code> ${sicuro(v.msg)}</p>
            <ul class="tm-chips">${chips(v)}</ul>
          </div>
          ${grafico(s, k)}
        </div>
      </header>

      <section class="tm-view" aria-label="${esc(d)} il ${esc(lunga(v.data))}">
        <div class="container--wide">
          <div class="tm-browser">
            <div class="tm-browser__bar">
              <span class="tm-browser__dots" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="tm-browser__url label">${esc(d)}<span> · ${esc(corta(v.data))}</span></span>
              ${v.pagina ? `<a class="tm-browser__open label" href="${catturaPath(s, v)}pagina/" target="_blank" rel="noopener">da sola${icon('arrowUpRight')}<span class="sr-only"> (si apre in una nuova scheda)</span></a>` : '<span></span>'}
            </div>
            ${
              v.pagina
                ? // la copia non ha script, ma il sandbox deve lasciarli accesi: con gli script spenti il
                  // browser ignora loading="lazy" e scaricava tutte le immagini subito (5,9 MB invece di 0,8)
                  `<iframe class="tm-browser__frame" src="${catturaPath(s, v)}pagina/" title="${esc(d)} il ${esc(lunga(v.data))}" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>`
                : `<p class="tm-browser__err">${v.errore ? `Questa cattura non si ricostruisce più: ${sicuro(v.errore)}.` : 'Questa cattura è ancora in ricostruzione: torna fra poco.'}</p>`
            }
          </div>
          <p class="label tm-view__note">${v.pagina ? `l’html di quel giorno${v.titolo ? `, «${sicuro(v.titolo)}»` : ''}: ${num(v.pagina.kb)} KB, senza script, con i dati personali coperti` : 'nessuna copia di quel giorno'}</p>
        </div>
      </section>

      <section class="section tm-day" aria-labelledby="tm-day-title">
        <div class="container tm-day__grid">
          <div class="tm-day__side">
            <p class="label"><span class="sec-head__index">01</span>Quel giorno</p>
            <h2 class="h2" id="tm-day-title" data-reveal="words">${splitWords(`${settimanale(v.data)} ${lunga(v.data)}`)}</h2>
            <div class="tm-day__ruler" data-reveal="up">${righello(v, commit)}</div>
            <ul class="tm-facts" data-reveal="up">${fattiGiorno(v).map((f) => `<li>${f}</li>`)}</ul>
          </div>
          <div class="tm-day__list" data-reveal="up">
            ${listaCommit(commit)}
          </div>
        </div>
      </section>

      ${momenti(s)}
      ${riservatezza()}
    </div>
  `
}

// le rotte delle pagine dei siti e delle catture (routes.js): fuori da sitemap e motori,
// perché le versioni vecchie dei siti dei clienti non finiscano nelle ricerche al posto di oggi
export function tempoRotte() {
  return siti.flatMap((s) => [
    {
      path: sitoPath(s),
      title: `${dominio(s.url)} nella macchina del tempo`,
      description: `Tutte le ${s.versioni.length} versioni di ${dominio(s.url)}, una per giorno di lavoro, ricostruite dal codice e fotografate.`,
      render: () => tempoSitoPage(s),
    },
    ...s.versioni.map((v, k) => ({
      path: catturaPath(s, v),
      title: `${dominio(s.url)} il ${lunga(v.data)} — La macchina del tempo`,
      description: piano(`Com’era ${dominio(s.url)} il ${lunga(v.data)}: ${v.msg}`).slice(0, 300),
      render: () => tempoCatturaPage(s, k),
    })),
  ])
}
