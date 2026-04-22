import unicodedata
import re


def normalize_municipio(name: str) -> str:
    """Uppercase, remove accents, trim, normalize hyphens and spaces."""
    if not name or not isinstance(name, str):
        return ""
    s = name.strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("-", " ").replace("  ", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s
