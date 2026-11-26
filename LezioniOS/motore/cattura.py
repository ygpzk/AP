"""La finestra della lezione: trovarla dal titolo, fotografarla anche se è coperta, trovarci il video.

    python cattura.py [--titolo "teams|riunione"] [--programma opera.exe] [--salva prova.jpg]

Il vecchio registratore fotografava lo schermo intero: se sopra Teams c'era un gioco, o se nel
browser si cambiava scheda, nella lezione finiva quello. Qui si fotografa la *finestra* (PrintWindow
con PW_RENDERFULLCONTENT: funziona anche se è dietro ad altre, non se è ridotta a icona) e solo
quando il suo titolo è quello di una lezione. Lanciato a mano stampa in JSON le finestre viste e
quella scelta: è la «prova di cattura» della regia.
"""
import ctypes
import json
import os
import re
import sys
from ctypes import wintypes

import numpy as np

u, g, k = ctypes.windll.user32, ctypes.windll.gdi32, ctypes.windll.kernel32
try:  # le misure delle finestre in pixel veri, su ogni schermo
    ctypes.windll.shcore.SetProcessDpiAwareness(2)
except (AttributeError, OSError):
    try:
        u.SetProcessDPIAware()
    except (AttributeError, OSError):
        pass
u.GetDC.restype = wintypes.HDC
u.GetDC.argtypes = [wintypes.HWND]
u.ReleaseDC.argtypes = [wintypes.HWND, wintypes.HDC]
u.PrintWindow.argtypes = [wintypes.HWND, wintypes.HDC, wintypes.UINT]
g.CreateCompatibleDC.restype = wintypes.HDC
g.CreateCompatibleDC.argtypes = [wintypes.HDC]
g.CreateCompatibleBitmap.restype = wintypes.HBITMAP
g.CreateCompatibleBitmap.argtypes = [wintypes.HDC, ctypes.c_int, ctypes.c_int]
g.SelectObject.restype = wintypes.HGDIOBJ
g.SelectObject.argtypes = [wintypes.HDC, wintypes.HGDIOBJ]
g.DeleteObject.argtypes = [wintypes.HGDIOBJ]
g.DeleteDC.argtypes = [wintypes.HDC]
k.OpenProcess.restype = wintypes.HANDLE
k.CloseHandle.argtypes = [wintypes.HANDLE]

TITOLO = r'teams|riunione|meeting|lezione|zoom|meet\.google'  # il titolo di una finestra con una lezione dentro


class _BI(ctypes.Structure):
    _fields_ = [('biSize', wintypes.DWORD), ('biWidth', wintypes.LONG), ('biHeight', wintypes.LONG),
                ('biPlanes', wintypes.WORD), ('biBitCount', wintypes.WORD), ('biCompression', wintypes.DWORD),
                ('biSizeImage', wintypes.DWORD), ('x', wintypes.LONG), ('y', wintypes.LONG),
                ('usati', wintypes.DWORD), ('importanti', wintypes.DWORD)]


g.GetDIBits.argtypes = [wintypes.HDC, wintypes.HBITMAP, wintypes.UINT, wintypes.UINT, ctypes.c_void_p, ctypes.POINTER(_BI), wintypes.UINT]


def _programma(hwnd):
    pid = wintypes.DWORD()
    u.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    h = k.OpenProcess(0x1000, False, pid.value)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not h:
        return ''
    try:
        buf, n = ctypes.create_unicode_buffer(1024), wintypes.DWORD(1024)
        return os.path.basename(buf.value).lower() if k.QueryFullProcessImageNameW(h, 0, buf, ctypes.byref(n)) else ''
    finally:
        k.CloseHandle(h)


def finestre():
    """Le finestre visibili (non a icona) abbastanza grandi da contenere una lezione."""
    trovate = []

    @ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    def una(hwnd, _):
        if u.IsWindowVisible(hwnd) and not u.IsIconic(hwnd):
            n = u.GetWindowTextLengthW(hwnd)
            if n:
                buf = ctypes.create_unicode_buffer(n + 1)
                u.GetWindowTextW(hwnd, buf, n + 1)
                r = wintypes.RECT()
                u.GetWindowRect(hwnd, ctypes.byref(r))
                if r.right - r.left >= 480 and r.bottom - r.top >= 320 and buf.value not in ('Program Manager', 'Microsoft Text Input Application'):
                    trovate.append({'hwnd': hwnd, 'titolo': buf.value, 'programma': _programma(hwnd),
                                    'area': [r.left, r.top, r.right - r.left, r.bottom - r.top]})
        return True

    u.EnumWindows(una, 0)
    return trovate


def trova(titolo=TITOLO, programma=''):
    """La finestra della lezione: quella (la più grande) col titolo che combacia e, se dato, di quel programma."""
    t = re.compile(titolo or TITOLO, re.I)
    buone = [f for f in finestre() if t.search(f['titolo']) and (not programma or programma.lower() in f['programma'])
             and 'lezioni os' not in f['titolo'].lower()]
    return max(buone, key=lambda f: f['area'][2] * f['area'][3]) if buone else None


def fotografa(hwnd):
    """Il contenuto della finestra (BGR), anche se è coperta. None se non si riesce (chiusa, a icona, tutta nera)."""
    r = wintypes.RECT()
    if not u.GetClientRect(hwnd, ctypes.byref(r)) or r.right < 200 or r.bottom < 150:
        return None
    w, h = r.right, r.bottom
    dc = u.GetDC(hwnd)
    mdc = g.CreateCompatibleDC(dc)
    bmp = g.CreateCompatibleBitmap(dc, w, h)
    vecchio = g.SelectObject(mdc, bmp)
    try:
        if not u.PrintWindow(hwnd, mdc, 3):  # PW_CLIENTONLY | PW_RENDERFULLCONTENT
            return None
        bi = _BI(ctypes.sizeof(_BI), w, -h, 1, 32, 0, 0, 0, 0, 0, 0)
        buf = ctypes.create_string_buffer(w * h * 4)
        if not g.GetDIBits(mdc, bmp, 0, h, buf, ctypes.byref(bi), 0):
            return None
        a = np.frombuffer(buf, np.uint8).reshape(h, w, 4)[..., :3]
        return None if a[::16, ::16].std() < 2 else np.ascontiguousarray(a)  # tutta di un colore: non ha disegnato
    finally:
        g.SelectObject(mdc, vecchio)
        g.DeleteObject(bmp)
        g.DeleteDC(mdc)
        u.ReleaseDC(hwnd, dc)


def riquadro(a):
    """Il riquadro del video in Teams, dalla cornice viola di chi parla (RGB circa 136,124,229; nelle
    versioni vecchie 97,98,175). None se la cornice non c'è: chi chiama tiene l'ultimo trovato."""
    b, v, r = (a[..., i].astype(np.int16) for i in range(3))
    viola = (((b > 185) & (b - r > 60) & (b - v > 70) & (r > 90) & (r < 175) & (v > 85) & (v < 160))
             | ((r > 75) & (r < 120) & (v > 75) & (v < 120) & (b > 150) & (b < 210) & (b - r > 50)))
    alto, largo = viola.shape
    colonne = np.where(viola.sum(axis=0) > 0.15 * alto)[0]
    righe = np.where(viola.sum(axis=1) > 0.15 * largo)[0]
    if len(colonne) < 2 or len(righe) < 2 or colonne[-1] - colonne[0] < 0.2 * largo or righe[-1] - righe[0] < 0.2 * alto:
        return None
    return [int(colonne[0]) + 4, int(righe[0]) + 4, int(colonne[-1]) - 3, int(righe[-1]) - 3]


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--titolo', default=TITOLO)
    ap.add_argument('--programma', default='')
    ap.add_argument('--salva', default='')
    a = ap.parse_args()
    tutte = [{kk: f[kk] for kk in ('titolo', 'programma', 'area')} for f in finestre()]
    f = trova(a.titolo, a.programma)
    esito = {'finestre': tutte, 'scelta': None}
    if f:
        im = fotografa(f['hwnd'])
        esito['scelta'] = {'titolo': f['titolo'], 'programma': f['programma'], 'area': f['area'],
                           'foto': None if im is None else [im.shape[1], im.shape[0]],
                           'riquadro': None if im is None else riquadro(im)}
        if im is not None and a.salva:
            from comune import scrivi_immagine
            scrivi_immagine(a.salva, im, 85)
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(esito, ensure_ascii=False))


if __name__ == '__main__':
    main()
