"""Run the GestorCOC backend locally with the port from .env.

Usage:
    .venv\Scripts\python.exe run_local.py
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv


def main() -> None:
    load_dotenv(override=True)

    port = int(os.getenv("PORT", "8050"))
    host = os.getenv("HOST", "127.0.0.1")

    print(f"Starting Django on {host}:{port}")

    from django.core.management import execute_from_command_line

    sys.argv = ["manage.py", "runserver", f"{host}:{port}"]
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
