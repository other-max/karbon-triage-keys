"""Serve src/ to a Karbon tab for in-page testing (see CLAUDE.md).

Allows https://app2.karbonhq.com to fetch shared.js and content.js from
http://127.0.0.1:8765/ with caching off.

Usage: python3 tools/serve-src.py
"""
import http.server, os, socketserver

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SRC, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', 'https://app2.karbonhq.com')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
socketserver.TCPServer(('127.0.0.1', 8765), Handler).serve_forever()
