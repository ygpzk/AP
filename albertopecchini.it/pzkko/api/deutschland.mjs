// /api/deutschland (9.11.2026): un ponte, come /api/wallet. La macchinetta delle sigarette di pzkko.it/deutschland/
// chiede la password («jager») e la password la controlla la banca sul pc di Alberto (C:\pzkko-server\deutschland\
// accesso.mjs, fuori da questo repository: scrypt, limiti, biglietto HMAC per il server delle foto). Qui passano
// solo { a: 'entra', password } e la risposta { ok, url, biglietto, scade } (o 401/429/503). Quando il pc è spento il
// ponte risponde 503: la pagina dice «la macchinetta è spenta». Albertopecchini.it/api/deutschland.js la riesporta.
import { ponte } from './_server.mjs'

export default (req, res) => ponte('deutschland', req, res, { max: 4 * 1024 })
