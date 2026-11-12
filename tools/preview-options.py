"""Preview the settings page outside Chrome's extension system.

Serves the repo and injects an in-memory stand-in for chrome.storage into
options/options.html. Open http://127.0.0.1:8766/options/options.html.
Saved settings are in window.__stubData and reset on reload.

Usage: python3 tools/preview-options.py [repo-root] [port]   (default 8766)
"""
import http.server, socketserver, sys, os
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUB = b"""<script>
(() => {
  const data = {}; const listeners = [];
  globalThis.chrome = {
    storage: {
      sync: {
        async get(k) { return { [k]: data[k] && JSON.parse(JSON.stringify(data[k])) }; },
        async set(obj) { for (const [k, v] of Object.entries(obj)) { const old = data[k]; data[k] = JSON.parse(JSON.stringify(v)); listeners.forEach(l => l({ [k]: { oldValue: old, newValue: data[k] } }, 'sync')); } },
      },
      onChanged: { addListener(l) { listeners.push(l); } },
    },
  };
  globalThis.__stubData = data;
})();
</script>
"""
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_GET(self):
        if self.path.split('?')[0] == '/options/options.html':
            body = open(os.path.join(ROOT, 'options/options.html'), 'rb').read().replace(b'<script src="../src/shared.js">', STUB + b'<script src="../src/shared.js">', 1)
            self.send_response(200); self.send_header('Content-Type', 'text/html'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()
socketserver.TCPServer.allow_reuse_address = True
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8766
socketserver.TCPServer(('127.0.0.1', PORT), H).serve_forever()
