#!/usr/bin/env python3
"""Regenerate data/bundle.js from every data/*.json for offline (file://) use."""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"
out = {}
for path in sorted(DATA.glob("*.json")):
    out[path.stem] = json.loads(path.read_text(encoding="utf-8"))
bundle = DATA / "bundle.js"
payload = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
bundle.write_text("window.ETA_DATA = " + payload + ";\n", encoding="utf-8")
print("Wrote", bundle, "with keys:", ", ".join(out))
