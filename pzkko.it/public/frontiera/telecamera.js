// telecamera.js — le cose che servono a Occhio e Boomerang.
//
// Un solo posto per accendere la fotocamera, spegnerla, capire perché non si è
// accesa e disegnare il video dentro un canvas senza deformarlo. Non è un
// motore: sono cinque funzioni corte, con gli errori già tradotti in italiano.
// (AR non passa da qui: in WebXR la fotocamera la apre il browser.)
//
// Regola: la fotocamera si accende solo dopo un gesto (un tasto). Qui non c'è
// niente che parta da solo all'apertura della finestra.

/** Il messaggio da mostrare per un errore di getUserMedia. */
export function messaggioCamera(e) {
  const nome = e?.name || ''
  if (nome === 'NotAllowedError' || nome === 'PermissionDeniedError') {
    return 'Permesso negato: la fotocamera resta spenta. Puoi riprovare dalle impostazioni del sito.'
  }
  if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
    return 'Non trovo una fotocamera su questo dispositivo.'
  }
  if (nome === 'NotReadableError' || nome === 'TrackStartError') {
    return 'La fotocamera è occupata da un altro programma: chiudilo e riprova.'
  }
  if (nome === 'OverconstrainedError') {
    return 'Questa fotocamera non accetta le impostazioni richieste.'
  }
  if (nome === 'SecurityError') {
    return 'La fotocamera vuole HTTPS (o localhost): apri il laboratorio da un indirizzo sicuro.'
  }
  return e?.message ? `La fotocamera non si è accesa: ${e.message}` : 'La fotocamera non si è accesa.'
}

/**
 * Accende la fotocamera dentro un <video> già presente.
 * Prova prima la fotocamera richiesta (posteriore per l'AR, anteriore per il
 * boomerang); se il dispositivo non ne ha una così, ripiega su quella che c'è.
 * @returns {Promise<MediaStream>}
 */
export async function accendi(video, { davanti = 'environment' } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    const e = new Error('questo browser non ha la fotocamera')
    e.name = 'NotSupportedError'
    throw e
  }
  if (!video) throw new Error('manca il video')

  const chiedi = (video) => navigator.mediaDevices.getUserMedia({
    video: {
      ...video,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  })

  let stream
  try {
    stream = await chiedi({ facingMode: { ideal: davanti } })
  } catch (e) {
    if (e?.name !== 'OverconstrainedError' && e?.name !== 'NotFoundError') throw e
    stream = await chiedi({})
  }

  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.setAttribute('muted', '')
  try {
    await video.play()
  } catch {
    // Safari a volte rifiuta play() finché non c'è un gesto: il flusso c'è
    // comunque, e il prossimo tocco lo fa partire.
  }
  return stream
}

/** Spegne tutte le tracce di uno stream (e stacca il video, se lo passi). */
export function ferma(stream, video = null) {
  try {
    for (const traccia of stream?.getTracks?.() || []) traccia.stop()
  } catch { /* niente da fermare */ }
  if (video) {
    try { video.pause() } catch { /* già fermo */ }
    try { video.srcObject = null } catch { /* già staccato */ }
  }
}

/** Il video ha abbastanza dati per essere disegnato? */
export function videoPronto(video) {
  return !!video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
}

/**
 * Disegna il video dentro un canvas come farebbe object-fit: cover.
 * Riempe tutto il rettangolo, taglia i bordi che avanzano e, se serve,
 * specchia l'immagine (per la webcam frontale).
 */
export function disegnaCoperto(ctx, video, larghezza, altezza, { specchia = false } = {}) {
  if (!ctx || larghezza <= 0 || altezza <= 0) return false
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, larghezza, altezza)
  ctx.clip()

  if (!videoPronto(video)) {
    ctx.fillStyle = '#05070a'
    ctx.fillRect(0, 0, larghezza, altezza)
    ctx.restore()
    return false
  }

  const vw = video.videoWidth
  const vh = video.videoHeight
  const scala = Math.max(larghezza / vw, altezza / vh)
  const dw = vw * scala
  const dh = vh * scala
  const dx = (larghezza - dw) / 2
  const dy = (altezza - dh) / 2

  if (specchia) {
    ctx.translate(larghezza, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, dx, dy, dw, dh)
  ctx.restore()
  return true
}
