"""I redattori di Giugnoh's Cast: profili Discord veri, foto prese dalla fonte.

Legge il profilo completo dei redattori (oltre a pzkko, che è il profilo del sito) con l'account
Discord collegato in ~/Collegamenti/Discord, scarica dalla CDN di Discord avatar, banner (fermo e
animato), decorazione (ferma e animata), badge e stemma del tag, e scrive
public/media/cast/redattori.json. Così il sito non dipende dagli hash della CDN, che cambiano
appena qualcuno cambia foto.

Si lancia col Python di quel collegamento (ha già discord.py-self):
    & "$HOME\\Collegamenti\\Discord\\.venv\\Scripts\\python.exe" scripts\\cast-profili.py

Due richieste a Discord in tutto, con una pausa: è un account personale, niente raffiche.
Prende solo quello che chiunque vede aprendo il profilo; non legge l'amicizia né i server in comune.
"""

import asyncio
import json
import random
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

COLLEGAMENTO = Path.home() / "Collegamenti" / "Discord"
sys.path.insert(0, str(COLLEGAMENTO))

import discord  # noqa: E402
from segreto import leggi_token  # noqa: E402

# l'ordine è quello della pagina (pzkko, che è il sito, viene sempre primo e non sta qui)
REDATTORI = ["793600603548418061", "542000754270011403"]

QUI = Path(__file__).resolve().parent.parent
CARTELLA = QUI / "public" / "media" / "cast"
CDN = "https://cdn.discordapp.com"
UA = {"user-agent": "pzkko.it (foto dei redattori del podcast)"}


def scarica(url: str, dove: Path) -> str:
    dove.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        dove.write_bytes(r.read())
    return "/" + dove.relative_to(QUI / "public").as_posix()


def colore(n) -> str | None:
    return None if n is None else "#%06x" % int(n)


def nome_oggetto(sku: str | None) -> str | None:
    """Il nome di una decorazione o di un effetto: l'API pubblica dei prodotti da collezione."""
    if not sku:
        return None
    try:
        req = urllib.request.Request(f"https://discord.com/api/v9/collectibles-products/{sku}", headers=UA)
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read()).get("name")
    except Exception:
        return None


def membro_da(uid: str) -> str:
    ms = (int(uid) >> 22) + 1420070400000
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def foto(uid: str, p: dict) -> dict:
    u, up = p.get("user") or {}, p.get("user_profile") or {}
    io = CARTELLA / uid
    out = {}
    av = u.get("avatar")
    if av:
        out["avatar"] = scarica(f"{CDN}/avatars/{uid}/{av}.webp?size=256", io / "avatar.webp")
        if av.startswith("a_"):
            out["avatarAnim"] = scarica(f"{CDN}/avatars/{uid}/{av}.webp?size=256&animated=true", io / "avatar-anim.webp")
    bn = up.get("banner") or u.get("banner")
    if bn:
        out["banner"] = scarica(f"{CDN}/banners/{uid}/{bn}.webp?size=600", io / "banner.webp")
        if bn.startswith("a_"):
            out["bannerAnim"] = scarica(f"{CDN}/banners/{uid}/{bn}.webp?size=600&animated=true", io / "banner-anim.webp")
    deco = (u.get("avatar_decoration_data") or {}).get("asset")
    if deco:
        out["deco"] = scarica(f"{CDN}/avatar-decoration-presets/{deco}.png?size=240&passthrough=false", io / "deco.png")
        if deco.startswith("a_"):
            out["decoAnim"] = scarica(f"{CDN}/avatar-decoration-presets/{deco}.webp?size=240&animated=true", io / "deco-anim.webp")
    return out


def scheda(uid: str, p: dict) -> dict:
    u, up = p.get("user") or {}, p.get("user_profile") or {}
    tag = u.get("primary_guild") or {}
    stile = u.get("display_name_styles") or {}
    deco = u.get("avatar_decoration_data") or {}
    badge = []
    for b in p.get("badges") or []:
        if not b.get("icon"):
            continue
        badge.append({
            "id": b["id"],
            "testo": b.get("description") or b["id"],
            "icona": scarica(f"{CDN}/badge-icons/{b['icon']}.png", CARTELLA / "badge" / f"{b['icon']}.png"),
            **({"link": b["link"]} if str(b.get("link", "")).startswith("https://discord.com/") else {}),
        })
    gilda = None
    if tag.get("identity_enabled") and tag.get("tag") and tag.get("badge"):
        gilda = {
            "tag": tag["tag"],
            "id": tag.get("identity_guild_id"),
            "stemma": scarica(
                f"{CDN}/clan-badges/{tag['identity_guild_id']}/{tag['badge']}.png?size=32",
                CARTELLA / "badge" / f"tag-{tag['badge']}.png",
            ),
        }
    tema = up.get("theme_colors")
    return {
        "id": uid,
        "username": u.get("username"),
        "nome": u.get("global_name") or u.get("username"),
        "pronomi": up.get("pronouns") or "",
        "bio": up.get("bio") or u.get("bio") or "",
        "membroDa": membro_da(uid),
        "tema": [colore(c) for c in tema] if isinstance(tema, list) and len(tema) == 2 else None,
        "coloreBanner": u.get("banner_color") or colore(u.get("accent_color")),
        "stileNome": {"font_id": stile.get("font_id"), "effect_id": stile.get("effect_id"), "colors": stile.get("colors") or []},
        "decorazione": {"nome": nome_oggetto(deco.get("sku_id"))} if deco.get("asset") else None,
        "gilda": gilda,
        "badge": badge,
        "collegamenti": [
            {"type": c["type"], "name": c["name"], "id": c["id"], "verified": bool(c.get("verified"))}
            for c in p.get("connected_accounts") or []
            if c.get("type") and c.get("name")
        ],
        "foto": foto(uid, p),
    }


async def main():
    c = discord.Client()
    await c.login(leggi_token())
    profili = {}
    try:
        for uid in REDATTORI:
            await asyncio.sleep(random.uniform(1.2, 2.4))
            profili[uid] = await c.http.get_user_profile(int(uid), with_mutual_guilds=False)
    finally:
        await c.http.close()
    dati = {
        "preso": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "redattori": [scheda(uid, profili[uid]) for uid in REDATTORI],
    }
    CARTELLA.mkdir(parents=True, exist_ok=True)
    (CARTELLA / "redattori.json").write_text(json.dumps(dati, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    for r in dati["redattori"]:
        print(f"ok {r['nome']} ({len(r['badge'])} badge, foto: {', '.join(r['foto'])})")


if __name__ == "__main__":
    asyncio.run(main())
