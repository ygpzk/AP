// Diretta OS · la webcam «Camo»: una sola lettura alla volta, e chiusa con le buone.
//
// Il 21 Nov 2026 il PC è andato più volte in schermata blu (0x50 PAGE_FAULT_IN_NONPAGED_AREA) dentro camodriver.sys,
// il driver di Camo (versione 4.70.1.13063, del 2023), sempre allo stesso punto (+0x2813): scrive oltre la fine di un
// suo blocco di memoria. Succedeva usando la regia: l'anteprima dal vivo accende l'occhio, che apriva un secondo ffmpeg
// sulla webcam mentre il sensore della lente (e Discord) la stavano già leggendo; e prima dei crash i lettori erano
// stati chiusi di colpo (kill) e riaperti subito. Da qui in poi:
// - la webcam la legge UN solo ffmpeg di Diretta OS alla volta: il sensore della lente, l'occhio o la foto della stanza.
//   Chi la vuole e conta di più (foto > occhio > lente) fa spostare chi ce l'ha; mentre c'è l'occhio, la lente guarda
//   le foto dell'occhio invece di aprirla;
// - si chiude con le buone: «q» su stdin (come premere q nella finestra di ffmpeg: chiude la webcam ed esce da solo);
//   solo se dopo 5 secondi è ancora lì si chiude di forza;
// - fra uno che la lascia e il prossimo che la apre passano almeno 3 secondi (e 8 dopo l'accensione del server).

const PAUSA = 3000
const ORDINE = { foto: 3, occhio: 2, lente: 1 }
const conta = (a, b) => (ORDINE[a] ?? 0) > (ORDINE[b] ?? 0)

// chiude un ffmpeg con le buone; si risolve quando è chiuso
export function chiudiBene(p, ms = 5000) {
  return new Promise((ok) => {
    if (!p || p.exitCode !== null || p.signalCode) return ok()
    const fra = setTimeout(() => { try { p.kill() } catch {} }, ms)
    p.once('close', () => { clearTimeout(fra); ok() })
    try { p.stdin.write('q') } catch { try { p.kill() } catch {} }
  })
}

// il turno: chi la sta leggendo, chi la aspetta, quando è stata lasciata
export function creaCam({ libera = () => false, log = () => {} } = {}) {
  let chi = null, lasciataAlle = Date.now() + 5000 // (all'accensione: 8 secondi prima di aprirla)
  let aspetta = null // { nome, alle }: chi la vuole e conta di più (vale 5 secondi: chi la vuole ancora la richiede)
  const attesa = () => (aspetta && Date.now() - aspetta.alle < 5000 ? aspetta.nome : null)
  return {
    chi: () => chi,
    // può aprirla adesso? Se no e conta di più di chi ce l'ha, chi ce l'ha lo saprà (cede) e si sposta
    chiedi(nome) {
      if (libera()) return false
      if (chi === nome) return true
      if (chi) { if (conta(nome, chi)) aspetta = { nome, alle: Date.now() }; return false }
      const a = attesa()
      if (a && a !== nome && conta(a, nome)) return false // (tocca a chi conta di più)
      if (Date.now() - lasciataAlle < PAUSA) { if (!a || a === nome || conta(nome, a)) aspetta = { nome, alle: Date.now() }; return false }
      chi = nome; if (a === nome) aspetta = null
      log(`cam: la legge ${nome}`)
      return true
    },
    // deve lasciarla? (la vuole qualcuno che conta di più, o va lasciata libera per Camo)
    cede(nome) { const a = attesa(); return chi === nome && (libera() || (!!a && conta(a, nome))) },
    lascia(nome) { if (chi === nome) { chi = null; lasciataAlle = Date.now() } },
  }
}
