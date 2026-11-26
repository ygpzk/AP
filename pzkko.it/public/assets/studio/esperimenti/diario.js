// 03 · Diario di bordo. Quello che succede mentre sei qui finisce in IndexedDB,
// nel tuo browser e basta: stato, brano, apps, luogo, gioco. Si può esportare o
// cancellare. Nessuna riga parte verso un server.
import { esc, ora } from '../utils.js'

const DB = 'pzkko-lab'
const STORE = 'diario'

const T = {
  it: {
    inizio: 'Il diario comincia qui.',
    stato: (s) => (s === 'online' ? 'È online.' : s === 'idle' ? 'È in pausa.' : s === 'dnd' ? 'Non vuole essere disturbato.' : 'È offline.'),
    musica: (d) => (d ? `Ha messo ${d.titolo} di ${d.artista}.` : 'Ha fermato la musica.'),
    app: (d) => (d.length ? `App aperte: ${d.join(', ')}.` : 'Ha chiuso tutte le app.'),
    luogo: (l) => (l === 'ufficio' ? 'Si è spostato in ufficio.' : 'È in giro per il mondo.'),
    gioco: (d) => (d ? `Sta giocando a ${d}.` : 'Ha smesso di giocare.'),
    custom: (d) => (d ? `Nuovo stato: ${d}.` : 'Ha tolto lo stato personale.'),
    vuoto: 'Ancora niente. Resta qui: il diario scrive da solo.',
    eventi: (n) => `${n} ${n === 1 ? 'evento' : 'eventi'} · solo in questo browser`,
    svuota: 'Svuota',
    sicuro: 'Sicuro?',
    esporta: 'Esporta',
    attendi: 'Apro il diario…',
    errore: 'Il browser non mi lascia aprire il diario (forse la navigazione privata).',
    oggi: 'oggi',
  },
  en: {
    inizio: 'The diary starts here.',
    stato: (s) => (s === 'online' ? 'They are online.' : s === 'idle' ? 'They are idle.' : s === 'dnd' ? 'Do not disturb.' : 'They are offline.'),
    musica: (d) => (d ? `Started ${d.titolo} by ${d.artista}.` : 'Stopped the music.'),
    app: (d) => (d.length ? `Open apps: ${d.join(', ')}.` : 'Closed every app.'),
    luogo: (l) => (l === 'ufficio' ? 'Moved to the office.' : 'Somewhere in the world.'),
    gioco: (d) => (d ? `Playing ${d}.` : 'Stopped playing.'),
    custom: (d) => (d ? `New status: ${d}.` : 'Cleared the custom status.'),
    vuoto: 'Nothing yet. Stay here: the diary writes itself.',
    eventi: (n) => `${n} ${n === 1 ? 'event' : 'events'} · this browser only`,
    svuota: 'Clear',
    sicuro: 'Sure?',
    esporta: 'Export',
    attendi: 'Opening the diary…',
    errore: 'The browser will not open the diary (private browsing?).',
    oggi: 'today',
  },
}
const t = (lang, k, ...a) => {
  const v = (T[lang] || T.en)[k] ?? T.en[k]
  return typeof v === 'function' ? v(...a) : v
}

function apri() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => {
      const db = r.result
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        s.createIndex('ts', 'ts')
      }
    }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error || new Error('IndexedDB'))
    r.onblocked = () => rej(new Error('IndexedDB bloccato'))
  })
}
const store = (db, modo = 'readonly') => db.transaction(STORE, modo).objectStore(STORE)

function aggiungi(db, ev) {
  return new Promise((res, rej) => {
    const r = store(db, 'readwrite').add(ev)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}
function leggi(db, n = 80) {
  return new Promise((res, rej) => {
    const out = []
    const cur = store(db).index('ts').openCursor(null, 'prev')
    cur.onsuccess = () => {
      const c = cur.result
      if (!c || out.length >= n) return res(out.reverse())
      out.push(c.value)
      c.continue()
    }
    cur.onerror = () => rej(cur.error)
  })
}
function svuota(db) {
  return new Promise((res, rej) => {
    const r = store(db, 'readwrite').clear()
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}
async function pota(db) {
  const n = await new Promise((res, rej) => {
    const r = store(db).count()
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  if (n <= 300) return
  await new Promise((res, rej) => {
    let via = n - 300
    const cur = store(db, 'readwrite').index('ts').openCursor()
    cur.onsuccess = () => {
      const c = cur.result
      if (!c || via-- <= 0) return res()
      c.delete()
      c.continue()
    }
    cur.onerror = () => rej(cur.error)
  })
}

export default {
  id: 'diario',
  titolo: { it: 'Diario di bordo', en: 'Ship’s log' },
  testo: {
    it: 'Quello che succede mentre sei nello Studio diventa una riga di diario: online, offline, che brano, che app, dove. Resta nel tuo browser.',
    en: 'What happens while you are in the Studio becomes a diary line: online, offline, which track, which apps, where. It stays in your browser.',
  },
  tecnologie: ['IndexedDB', 'Lanyard', 'Vetrina'],
  monta(el, api) {
    const lang = api.lang
    el.innerHTML = `<div class="lab-diario__testa"><span data-conteggio></span><span class="lab__azioni"><button type="button" class="lab__bottone lab__bottone--fantasma" data-esporta>${esc(t(lang, 'esporta'))}</button><button type="button" class="lab__bottone lab__bottone--fantasma" data-svuota>${esc(t(lang, 'svuota'))}</button></span></div>
      <ol class="lab-diario" data-lista><li class="lab-diario__vuoto">${esc(t(lang, 'attendi'))}</li></ol>`
    const lista = el.querySelector('[data-lista]')
    const conteggio = el.querySelector('[data-conteggio]')
    const stato = el.closest('.lab__card')?.querySelector('.lab__stato')
    const btnSvuota = el.querySelector('[data-svuota]')
    const btnEsporta = el.querySelector('[data-esporta]')
    let db = null, eventi = [], snap = null, timer = 0, armato = 0, vivo = true

    const testo = (e) => {
      switch (e.tipo) {
        case 'inizio': return t(lang, 'inizio')
        case 'stato': return t(lang, 'stato', e.d.stato)
        case 'musica': return t(lang, 'musica', e.d)
        case 'app': return t(lang, 'app', e.d)
        case 'luogo': return t(lang, 'luogo', e.d)
        case 'gioco': return t(lang, 'gioco', e.d)
        case 'custom': return t(lang, 'custom', e.d)
        default: return ''
      }
    }
    const disegna = () => {
      conteggio.textContent = t(lang, 'eventi', eventi.length)
      lista.innerHTML = eventi.length
        ? eventi.slice().reverse().map((e) => `<li class="lab-diario__riga" data-tipo="${esc(e.tipo)}"><time datetime="${new Date(e.ts).toISOString()}">${esc(ora(e.ts, lang))}</time><i aria-hidden="true"></i><span>${esc(testo(e))}</span></li>`).join('')
        : `<li class="lab-diario__vuoto">${esc(t(lang, 'vuoto'))}</li>`
    }
    const scrivi = async (tipo, d) => {
      if (!db) return
      const ev = { ts: Date.now(), tipo, d }
      try {
        ev.id = await aggiungi(db, ev)
        eventi.push(ev)
        if (eventi.length > 300) eventi = eventi.slice(-300)
        disegna()
        pota(db).catch(() => {})
      } catch (e) { console.warn('diario:', e) }
    }
    const istantanea = (x) => ({
      stato: x.online ? x.status : 'offline',
      musica: x.track && x.track.titolo ? `${x.track.titolo}|${x.track.artista}` : '',
      app: (x.apps || []).map((y) => y.n).filter(Boolean).sort().join('|'),
      luogo: x.luogo || '',
      gioco: x.gioco?.name || '',
      custom: x.custom?.state || '',
    })
    const confronta = (x) => {
      const adesso = istantanea(x)
      if (!snap) { snap = adesso; return }
      if (adesso.stato !== snap.stato) { scrivi('stato', { stato: adesso.stato }); snap.stato = adesso.stato }
      if (adesso.musica !== snap.musica) {
        const [titolo, artista] = adesso.musica ? adesso.musica.split('|') : ['', '']
        scrivi('musica', adesso.musica ? { titolo, artista } : null); snap.musica = adesso.musica
      }
      if (adesso.app !== snap.app) {
        scrivi('app', adesso.app ? adesso.app.split('|') : []); snap.app = adesso.app
      }
      if (adesso.luogo !== snap.luogo) { scrivi('luogo', adesso.luogo); snap.luogo = adesso.luogo }
      if (adesso.gioco !== snap.gioco) { scrivi('gioco', adesso.gioco || null); snap.gioco = adesso.gioco }
      if (adesso.custom !== snap.custom) { scrivi('custom', adesso.custom || null); snap.custom = adesso.custom }
    }

    apri().then(async (d) => {
      db = d
      eventi = await leggi(db)
      if (!eventi.length) {
        const ev = { ts: Date.now(), tipo: 'inizio', d: {} }
        ev.id = await aggiungi(db, ev)
        eventi = [ev]
      }
      disegna()
      api.stato(stato, t(lang, 'eventi', eventi.length), 'ok')
      snap = istantanea(api.adesso())
    }).catch((e) => {
      console.warn(e)
      lista.innerHTML = `<li class="lab-diario__vuoto">${esc(t(lang, 'errore'))}</li>`
      api.stato(stato, t(lang, 'errore'), 'no')
    })

    const togli = api.onAdesso((x) => {
      if (!db) return
      clearTimeout(timer)
      timer = setTimeout(() => { if (vivo) confronta(x) }, 500)
    })

    btnSvuota.addEventListener('click', async () => {
      if (!db) return
      if (!armato) {
        armato = setTimeout(() => { armato = 0; btnSvuota.textContent = t(lang, 'svuota') }, 3000)
        btnSvuota.textContent = t(lang, 'sicuro')
        return
      }
      clearTimeout(armato); armato = 0
      btnSvuota.textContent = t(lang, 'svuota')
      await svuota(db)
      eventi = []
      scrivi('inizio', {})
      disegna()
    })
    btnEsporta.addEventListener('click', () => {
      const b = new Blob([JSON.stringify(eventi, null, 2)], { type: 'application/json' })
      api.scarica(b, 'pzkko-diario.json')
    })

    return () => { vivo = false; clearTimeout(timer); clearTimeout(armato); togli(); try { db?.close() } catch {} }
  },
}
