"""
Tile debug helper for Tegola.

Usage:
  python -m app.tile_debug
"""

import json
import math
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

MAP_NAME = "municipios"
MIN_BYTES = 200


def lonlat_to_tile(lon: float, lat: float, zoom: int) -> tuple[int, int]:
    # Clamp latitude to Web Mercator valid range.
    lat = max(min(lat, 85.05112878), -85.05112878)
    lat_rad = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    # Clamp tile indices to valid range.
    x = max(0, min(x, n - 1))
    y = max(0, min(y, n - 1))
    return x, y


def fetch_json(url: str) -> dict:
    req = Request(url, headers={"Accept": "application/json"})
    with urlopen(req, timeout=20) as resp:
        data = resp.read()
        return json.loads(data.decode("utf-8"))


def fetch_bytes(url: str) -> tuple[int, str | None, bytes]:
    req = Request(url, headers={"Accept": "application/x-protobuf"})
    with urlopen(req, timeout=20) as resp:
        status = getattr(resp, "status", 200)
        content_length = resp.headers.get("Content-Length")
        body = resp.read()
        return status, content_length, body


def try_tile(base_url: str, map_name: str, zoom: int, x: int, y: int) -> tuple[int, str | None, int, str]:
    url = f"{base_url}/maps/{map_name}/{zoom}/{x}/{y}.pbf"
    status, content_length, body = fetch_bytes(url)
    return status, content_length, len(body), url


def main() -> int:
    tegola_base = os.getenv("TEGOLA_BASE_URL", "").strip()
    base_candidates = [u for u in [tegola_base, "http://localhost:8080", "http://tegola:8080"] if u]

    caps = None
    used_base = None
    last_exc: Exception | None = None
    for base in base_candidates:
        capabilities_url = f"{base.rstrip('/')}/capabilities"
        try:
            caps = fetch_json(capabilities_url)
            used_base = base.rstrip("/")
            break
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_exc = exc

    if caps is None or used_base is None:
        print(f"[tile_debug] failed to fetch capabilities: {last_exc}")
        return 2

    maps = caps.get("maps", [])
    m = next((item for item in maps if item.get("name") == MAP_NAME), None)
    if not m:
        print(f"[tile_debug] map '{MAP_NAME}' not found in capabilities")
        return 3

    center = m.get("center")
    if not center or len(center) < 3:
        print(f"[tile_debug] map '{MAP_NAME}' has invalid center: {center}")
        return 4
    bounds = m.get("bounds")
    if not bounds or len(bounds) < 4:
        print(f"[tile_debug] map '{MAP_NAME}' has invalid bounds: {bounds}")
        return 4

    lon = float(center[0])
    lat = float(center[1])
    zoom = int(center[2])
    x, y = lonlat_to_tile(lon, lat, zoom)

    try:
        status, content_length, body_len, tile_url = try_tile(used_base, MAP_NAME, zoom, x, y)
    except HTTPError as exc:
        print(f"[tile_debug] tile request failed: status={exc.code} url={tile_url}")
        return 5
    except (URLError, TimeoutError) as exc:
        print(f"[tile_debug] tile request error: {exc}")
        return 6

    print(f"[tile_debug] map={MAP_NAME}")
    print(f"[tile_debug] tegola_base={used_base}")
    print(f"[tile_debug] computed_tile z/x/y={zoom}/{x}/{y}")
    print(f"[tile_debug] status={status}")
    print(f"[tile_debug] content_length_header={content_length}")
    print(f"[tile_debug] downloaded_bytes={body_len}")
    print(f"[tile_debug] tile_url={tile_url}")

    if status != 200:
        print("[tile_debug] FAIL: HTTP status is not 200")
        return 7

    if body_len < MIN_BYTES:
        print(f"[tile_debug] center tile too small (< {MIN_BYTES} bytes); probing nearby tiles...")
        # Probe neighborhood around center tile to find a non-empty tile within map bounds.
        # This keeps the center check while making validation robust.
        n = 2 ** zoom
        for radius in [1, 2, 3]:
            for dx in range(-radius, radius + 1):
                for dy in range(-radius, radius + 1):
                    tx, ty = x + dx, y + dy
                    if tx < 0 or ty < 0 or tx >= n or ty >= n:
                        continue
                    try:
                        s2, cl2, b2, u2 = try_tile(used_base, MAP_NAME, zoom, tx, ty)
                    except (HTTPError, URLError, TimeoutError):
                        continue
                    if s2 == 200 and b2 >= MIN_BYTES:
                        print(f"[tile_debug] fallback_tile z/x/y={zoom}/{tx}/{ty}")
                        print(f"[tile_debug] fallback_status={s2}")
                        print(f"[tile_debug] fallback_content_length_header={cl2}")
                        print(f"[tile_debug] fallback_downloaded_bytes={b2}")
                        print(f"[tile_debug] fallback_tile_url={u2}")
                        print("[tile_debug] OK: non-empty tile response (fallback)")
                        return 0

        # Final fallback: scan tile range derived from map bounds at same zoom.
        min_lon, min_lat, max_lon, max_lat = map(float, bounds[:4])
        min_x, max_y = lonlat_to_tile(min_lon, min_lat, zoom)
        max_x, min_y = lonlat_to_tile(max_lon, max_lat, zoom)
        x0, x1 = min(min_x, max_x), max(min_x, max_x)
        y0, y1 = min(min_y, max_y), max(min_y, max_y)
        print(f"[tile_debug] scanning bounds tile range z={zoom}, x={x0}..{x1}, y={y0}..{y1}")

        for tx in range(x0, x1 + 1):
            for ty in range(y0, y1 + 1):
                try:
                    s3, cl3, b3, u3 = try_tile(used_base, MAP_NAME, zoom, tx, ty)
                except (HTTPError, URLError, TimeoutError):
                    continue
                if s3 == 200 and b3 >= MIN_BYTES:
                    print(f"[tile_debug] bounds_tile z/x/y={zoom}/{tx}/{ty}")
                    print(f"[tile_debug] bounds_status={s3}")
                    print(f"[tile_debug] bounds_content_length_header={cl3}")
                    print(f"[tile_debug] bounds_downloaded_bytes={b3}")
                    print(f"[tile_debug] bounds_tile_url={u3}")
                    print("[tile_debug] OK: non-empty tile response (bounds scan)")
                    return 0

        print(f"[tile_debug] FAIL: no tile in bounds reached >= {MIN_BYTES} bytes")
        return 8

    print("[tile_debug] OK: non-empty tile response")
    return 0


if __name__ == "__main__":
    sys.exit(main())

