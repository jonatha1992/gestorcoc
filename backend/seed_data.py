"""
Wrapper legado para ejecutar el comando oficial de seed.

Uso recomendado:
    python manage.py seed_data --mode reset --volume medium

Compatibilidad:
    python backend/seed_data.py --mode reset --volume medium
"""

import subprocess
import sys
from pathlib import Path


def main() -> int:
    backend_dir = Path(__file__).resolve().parent
    manage_py = backend_dir / "manage.py"

    if not manage_py.exists():
        print("No se encontro manage.py en backend/.")
        return 1

    command = [sys.executable, str(manage_py), "seed_data", *sys.argv[1:]]
    return subprocess.call(command, cwd=str(backend_dir))


if __name__ == "__main__":
    raise SystemExit(main())
