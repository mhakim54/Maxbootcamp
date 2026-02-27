#!/usr/bin/env python3
"""Simple local server that serves static files and proxies Fish Audio API calls."""

import http.server
import json
import urllib.request

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/tts":
            # Read the request body
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            auth = self.headers.get("Authorization", "")

            # Forward to Fish Audio
            req = urllib.request.Request(
                "https://api.fish.audio/v1/tts",
                data=body,
                headers={
                    "Authorization": auth,
                    "Content-Type": "application/json",
                },
                method="POST",
            )

            try:
                with urllib.request.urlopen(req) as resp:
                    audio = resp.read()
                    self.send_response(200)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "audio/mpeg"))
                    self.send_header("Content-Length", str(len(audio)))
                    self.end_headers()
                    self.wfile.write(audio)
            except urllib.error.HTTPError as e:
                error_body = e.read().decode("utf-8", errors="replace")
                self.send_response(e.code)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(error_body.encode())
        else:
            self.send_response(404)
            self.end_headers()

print(f"Server running at http://localhost:{PORT}")
http.server.HTTPServer(("", PORT), Handler).serve_forever()
