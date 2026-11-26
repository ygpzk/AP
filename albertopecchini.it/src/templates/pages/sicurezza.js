// Pagina /sicurezza/: tre rischi (bot e phishing, attacchi DDoS, recupero
// dati) con le loro tavole animate e cosa faccio per i clienti, poi le
// protezioni già attive su questo sito, i limiti che restano e le domande
// frequenti. Tutti i testi stanno in src/data/sicurezza.js.

import { html, esc } from '../html.js'
import { sicurezza as s } from '../../data/sicurezza.js'
import { abs } from '../layout.js'
import { button, textLink, media, sectionHead, splitWords, icon } from '../components/ui.js'
import { head } from './info.js'

const contactHref = `/contatti/?tipo=${encodeURIComponent(s.cta.tipo)}#modulo`

function coverCard(c, i) {
  return html`
    <li class="sec-cover__card" data-reveal="up" style="--d:${i * 60}ms">
      ${media(c.art, { ratio: '3/2', caption: null, className: 'sec-cover__art', reveal: null, lazy: true })}
      <div class="sec-cover__body">
        <p class="label"><span>${esc(c.n)}</span>${esc(c.title)}</p>
        <h2 class="h3">${esc(c.head)}</h2>
        <p>${esc(c.text)}</p>
        <ul class="sec-cover__points">
          ${c.points.map((p) => `<li>${esc(p)}</li>`)}
        </ul>
      </div>
    </li>
  `
}

export function sicurezzaPage() {
  return html`
    ${head({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Sicurezza', href: s.path }],
      index: 'S',
      label: s.head.label,
      title: s.head.title,
      accent: s.head.accent,
      lead: s.head.lead,
      meta: s.head.meta,
    })}

    <section class="section sec-cover" aria-labelledby="sec-cover-title">
      <div class="container">
        <div class="sec-cover__intro">
          <p class="label" id="sec-cover-title"><span class="sec-head__index">01</span>${esc(s.intro.label)}</p>
          <p class="lead">${esc(s.intro.lead)}</p>
        </div>
        <ol class="sec-cover__grid">
          ${s.rischi.map(coverCard)}
        </ol>
      </div>
    </section>

    <section class="section sec-applied" data-theme="ink">
      <div class="container sec-applied__grid">
        <div class="sec-applied__side">
          ${sectionHead({
            index: '02',
            label: s.appliedHead.label,
            title: s.appliedHead.title,
            lead: s.appliedHead.lead,
          })}
        </div>
        <ol class="sec-applied__list">
          ${s.applied.map(
            (a, i) => html`
              <li data-reveal="up" style="--d:${i * 40}ms">
                <span class="label">${String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 class="h4">${esc(a.title)}</h3>
                  <p>${esc(a.text)}</p>
                </div>
              </li>
            `,
          )}
        </ol>
      </div>
    </section>

    <section class="section sec-limits" data-theme="tint">
      <div class="container">
        ${sectionHead({
          index: '!',
          label: s.limitsHead.label,
          title: s.limitsHead.title,
          lead: s.limitsHead.lead,
        })}
        <ul class="sec-limits__grid">
          ${s.limits.map(
            (l, i) => html`
              <li data-reveal="up" style="--d:${i * 55}ms">
                <h3 class="h4">${esc(l.title)}</h3>
                <p>${esc(l.text)}</p>
              </li>
            `,
          )}
        </ul>
      </div>
    </section>

    <section class="section faq" aria-labelledby="sec-faq-title">
      <div class="container faq__grid">
        <div>
          <p class="label"><span class="sec-head__index">?</span>Domande frequenti</p>
          <h2 class="h2" id="sec-faq-title" data-reveal="words">${splitWords('Domande che mi fanno')}</h2>
        </div>
        <div class="faq__list">
          ${s.faq.map((f) => `<details class="faq__item"><summary><span>${esc(f.q)}</span>${icon('plus')}</summary><p>${esc(f.a)}</p></details>`)}
        </div>
      </div>
    </section>

    <section class="section itk" aria-labelledby="sec-cta-title">
      <div class="container itk__grid">
        <h2 class="itk__title" id="sec-cta-title" data-reveal="words">${splitWords(s.cta.title, { accent: s.cta.accent })}</h2>
        <div class="itk__side" data-reveal="up">
          <p class="lead">${esc(s.cta.text)}</p>
          <div class="itk__actions">
            ${button({ href: contactHref, label: 'Scrivimi' })}
            ${textLink({ href: '/servizi/informatica/', label: 'Assistenza informatica' })}
          </div>
        </div>
      </div>
    </section>
  `
}

// Dati strutturati: la pagina, il servizio con le tre voci e le domande frequenti.
export const sicurezzaLd = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': abs(`${s.path}#pagina`),
    url: abs(s.path),
    name: s.title,
    description: s.description,
    inLanguage: 'it-IT',
    isPartOf: { '@id': abs('/#website') },
    about: { '@type': 'Thing', name: 'Sicurezza informatica' },
    primaryImageOfPage: { '@type': 'ImageObject', url: abs('/og.png') },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs(`${s.path}#servizio`),
    name: 'Sicurezza informatica',
    serviceType: 'Protezione da bot e phishing, mitigazione DDoS, backup e recupero dati',
    description: s.description,
    url: abs(s.path),
    provider: { '@id': abs('/#studio') },
    areaServed: { '@type': 'Country', name: 'Italia' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sicurezza informatica',
      itemListElement: s.rischi.map((c) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: c.title, description: c.text },
      })),
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
]
