from __future__ import annotations

import contextlib
import os
import socket
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "127.0.0.1"
DEFAULT_PORT = 8000


class AppRequestHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".mjs": "text/javascript",
    }


def pick_port(start_port: int) -> int:
    for port in range(start_port, start_port + 20):
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            if sock.connect_ex((HOST, port)) != 0:
                return port
    raise RuntimeError("No free port found in the requested range.")


def main() -> None:
    project_root = Path(__file__).resolve().parent
    preferred_port = int(os.getenv("PORT", DEFAULT_PORT))
    port = pick_port(preferred_port)
    os.chdir(project_root)

    server = ThreadingHTTPServer((HOST, port), AppRequestHandler)
    url = f"http://{HOST}:{port}/index.html"

    print(f"Serving bakery interior preview at {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
