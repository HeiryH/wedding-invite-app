#!/usr/bin/env python3
"""Exercise capture HTTP/auth on a temporary API/database. Does not run Chromium or touch local clients."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import socket
import struct
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import zlib
from pathlib import Path


def main():
    repo = Path(__file__).resolve().parent.parent
    api = repo / 'backend/WeddingInvite.API/bin/Debug/net10.0/WeddingInvite.API.dll'
    if not api.exists():
        raise RuntimeError('Build the API before running this verification.')
    with tempfile.TemporaryDirectory(prefix='capture-http-') as directory:
        root = Path(directory)
        (root / 'wwwroot').mkdir()
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        base = f'http://127.0.0.1:{port}'
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        jwt_key, worker_key = secrets.token_hex(32), secrets.token_hex(32)
        env = {**os.environ, 'ASPNETCORE_ENVIRONMENT': 'Development', 'ASPNETCORE_URLS': base,
               'ConnectionStrings__DefaultConnection': f'Data Source={root / "test.db"}',
               'JwtSettings__SecretKey': jwt_key, 'JwtSettings__Issuer': 'capture-test', 'JwtSettings__Audience': 'capture-test',
               'TemplateCapture__WorkerKey': worker_key, 'Logging__LogLevel__Default': 'Warning',
               'ASPNETCORE_PREVENTHOSTINGSTARTUP': 'true', 'Sentry__Dsn': '', 'SENTRY_DSN': '',
               'DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE': 'false'}
        def token(email='admin@capture.test', role='SUPER_ADMIN'):
            def b64(value):
                return base64.urlsafe_b64encode(value).rstrip(b'=')
            payload = {'iss': 'capture-test', 'aud': 'capture-test', 'exp': int(time.time()) + 600,
                       'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
                       'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': email}
            message = b64(b'{"alg":"HS256","typ":"JWT"}') + b'.' + b64(json.dumps(payload).encode())
            return (message + b'.' + b64(hmac.new(jwt_key.encode(), message, hashlib.sha256).digest())).decode()
        admin, other = token(), token('other@capture.test')
        def request(path, method='GET', data=None, bearer=None, worker=None, raw=None, content_type=None, expected=200):
            headers = {}
            if bearer: headers['Authorization'] = 'Bearer ' + bearer
            if worker: headers['X-Capture-Worker-Key'] = worker
            if data is not None: raw, content_type = json.dumps(data).encode(), 'application/json'
            if content_type: headers['Content-Type'] = content_type
            incoming = urllib.request.Request(base + path, data=raw, headers=headers, method=method)
            try:
                response = opener.open(incoming, timeout=2)
            except urllib.error.HTTPError as error:
                response = error
            body = response.read()
            assert response.status == expected, f'{method} {path}: expected {expected}, received {response.status}: {body[:300]!r}'
            return json.loads(body) if response.headers.get('Content-Type', '').startswith('application/json') else body
        def png(width=390, height=700):
            def chunk(name, data):
                return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))
            return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress((b'\0' + b'\xff\xff\xff' * width) * height)) + chunk(b'IEND', b'')
        image = png()
        captures = '/api/template/7/studio/captures'
        def ready(snapshot=None):
            job = request(captures, 'POST', snapshot or {}, admin)
            lease = request('/api/template-capture-worker/claim', 'POST', {}, worker=worker_key)
            assert lease['id'] == job['id']
            if snapshot:
                assert lease['snapshot']['payload'] == snapshot['payload']
                assert lease['width'] == snapshot['width'] and lease['height'] == snapshot['height']
                assert lease['snapshot']['scrollY'] == snapshot['scrollY']
            capture_image = png(lease['width'], lease['height'])
            boundary = 'capture-' + secrets.token_hex(12)
            body = (f'--{boundary}\r\nContent-Disposition: form-data; name="leaseToken"\r\n\r\n{lease["leaseToken"]}\r\n'
                    f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="capture.png"\r\nContent-Type: image/png\r\n\r\n').encode() + capture_image + f'\r\n--{boundary}--\r\n'.encode()
            request(f'/api/template-capture-worker/{job["id"]}/complete', 'POST', worker=worker_key,
                    raw=body, content_type=f'multipart/form-data; boundary={boundary}', expected=204)
            assert request(captures + '/' + job['id'], bearer=admin)['status'] == 'ready'
            return job
        with (root / 'api.log').open('wb') as log:
            process = subprocess.Popen(['dotnet', str(api), '--contentRoot', str(root)], cwd=root, env=env, stdout=log, stderr=log)
            try:
                deadline = time.monotonic() + 35
                while time.monotonic() < deadline:
                    if process.poll() is not None:
                        raise RuntimeError('Isolated API exited: ' + (root / 'api.log').read_text()[-1600:])
                    try:
                        request('/api/template/7')
                        break
                    except (urllib.error.URLError, TimeoutError): time.sleep(.2)
                else: raise RuntimeError('Isolated API did not start in time. Database created: ' + str((root / 'test.db').exists()) + '\n' + (root / 'api.log').read_text()[-1600:])
                request(captures, 'POST', {}, expected=401)
                request(captures, 'POST', {}, token(role='HOST_ADMIN'), expected=403)
                request('/api/template-capture-worker/claim', 'POST', {}, worker='invalid-key', expected=401)
                request(captures, 'POST', {}, admin, expected=503)
                request('/api/template-capture-worker/heartbeat', 'POST', {}, worker=worker_key, expected=204)
                print('PASS authentication, worker-key boundary and offline renderer handling')
                original = request('/api/template/7')['thumbnailUrl']
                job = ready()
                assert request(captures + '/' + job['id'] + '/image', bearer=admin) == image
                request(captures + '/' + job['id'] + '/image', bearer=other, expected=404)
                request(captures + '/' + job['id'] + '/apply', 'POST', {}, expected=401)
                assert request('/api/template/7')['thumbnailUrl'] == original
                request(captures + '/' + job['id'], 'DELETE', bearer=admin)
                assert request('/api/template/7')['thumbnailUrl'] == original
                print('PASS private review and cancellation preserve the existing thumbnail')
                stale = ready()
                studio = request('/api/template/7/studio', bearer=admin)
                saved = request('/api/template/7/studio/draft', 'PUT', {'version': studio['version'], 'config': {'invite.heading': 'New design'}, 'sample': {}}, admin)
                request('/api/template/7/studio/publish', 'POST', {'version': saved['version']}, admin)
                request(captures + '/' + stale['id'] + '/apply', 'POST', {}, admin, expected=409)
                assert request('/api/template/7')['thumbnailUrl'] == original
                print('PASS a new publication invalidates an older capture')
                final = ready()
                changed = request(captures + '/' + final['id'] + '/apply', 'POST', {}, admin)
                assert changed['thumbnailUrl'] != original
                assert request(changed['thumbnailUrl']) == image
                request(captures + '/' + final['id'] + '/apply', 'POST', {}, admin, expected=409)
                print('PASS explicit approval updates the thumbnail and serves the saved PNG')
                snapshot = {'payload': {'wedding': {'templateId': 7, 'brideName': 'Mary', 'groomName': 'John'}, 'customConfig': {'invite.heading': 'Current unsaved heading'}},
                            'width': 510, 'height': 915, 'scrollX': 0, 'scrollY': 200}
                captured = ready(snapshot)
                assert request(captures + '/' + captured['id'] + '/image', bearer=admin) == png(510, 915)
                request(captures + '/' + captured['id'], 'DELETE', bearer=admin)
                print('PASS current preview names, draft config, dimensions and scroll reach the renderer unchanged')
            finally:
                process.terminate()
                try: process.wait(timeout=5)
                except subprocess.TimeoutExpired: process.kill(); process.wait()
    print('Capture HTTP verification passed. All data and files were isolated in a temporary directory.')


if __name__ == '__main__':
    main()
