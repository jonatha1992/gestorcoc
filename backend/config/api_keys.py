"""Colector canónico de API keys.

Mismo contrato que ``collect_api_keys()`` en Auditext, anotador, spinpredictor,
matchanalyzer y mis_gastos_tracker, y que ``collectApiKeys()`` en tablero_control
y dashboard_polizas. Si se toca acá, se replica en los demás: una key que
resuelve en un repo y no en otro es exactamente la clase de bug que este
archivo existe para prevenir.
"""

from __future__ import annotations

import os

# ─── Colector canónico de API keys ────────────────────────────────────────
# Unifica cuatro comportamientos que antes estaban repartidos y desparejos:
#   1. Limpia BOM (U+FEFF) y comillas. Bug real de agosto 2026: una key pegada
#      en el panel de un hosting traía BOM y el cliente HTTP reventaba al armar
#      el header, con un error que no nombraba ni la key ni la variable.
#   2. Llega hasta la key N°20, así agregar una key nunca es un no-op silencioso.
#   3. Acepta lista en una línea: PREFIJO+S separado por comas o punto y coma
#      (GEMINI_API_KEYS=k1,k2,k3), cómodo para deploys tipo Railway.
#   4. Descarta placeholders del .env.example para que un archivo sin completar
#      falle con "no hay key" y no con un 401 críptico.

_KEY_LIMIT = 20


def _looks_like_placeholder(value: str) -> bool:
    low = value.lower()
    if low.startswith(("your", "tu_", "tu-", "<")):
        return True
    return any(
        marker in low
        for marker in ("api-key-here", "api_key_here", "xxxxxxxx", "changeme", "replace-me")
    )


def _sanitize_api_key(raw):
    """Normaliza una key suelta; devuelve None si no sirve."""
    if not raw:
        return None
    cleaned = str(raw).strip().strip("﻿").strip().strip('"').strip("'").strip()
    if not cleaned or _looks_like_placeholder(cleaned):
        return None
    return cleaned


def collect_api_keys(prefix: str, limit: int = _KEY_LIMIT) -> list:
    """
    Junta todas las keys de un proveedor desde el entorno.

    Lee, en este orden y deduplicando por valor:
        PREFIJO+S  (lista separada por comas o ';')
        PREFIJO
        PREFIJO1 .. PREFIJO{limit}      y      PREFIJO_1 .. PREFIJO_{limit}

    Ej. collect_api_keys("GEMINI_API_KEY") lee GEMINI_API_KEYS, GEMINI_API_KEY,
    GEMINI_API_KEY1..20 y GEMINI_API_KEY_1..20.
    """
    keys = []
    seen = set()

    def add(raw) -> None:
        if not raw:
            return
        for part in str(raw).replace(";", ",").split(","):
            key = _sanitize_api_key(part)
            if key and key not in seen:
                seen.add(key)
                keys.append(key)

    add(os.getenv(f"{prefix}S"))
    add(os.getenv(prefix))
    for n in range(1, limit + 1):
        add(os.getenv(f"{prefix}{n}"))
        add(os.getenv(f"{prefix}_{n}"))
    return keys
# ─── fin del colector canónico ────────────────────────────────────────────
