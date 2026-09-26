"""Initialize mounted storage, then run Django as the unprivileged app user."""
import os
from pathlib import Path
import subprocess
import sys


def main():
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.railway'
    if os.environ.get('RAILWAY_VOLUME_MOUNT_PATH') != '/data':
        raise RuntimeError('Attach a Railway volume at /data before starting the backend.')
    if os.getuid() == 0:
        os.chown('/data', 10001, 10001)
    for name in ('static', 'media'):
        directory = Path('/data') / name
        directory.mkdir(parents=True, exist_ok=True)
        if os.getuid() == 0:
            os.chown(directory, 10001, 10001)
    if os.getuid() == 0:
        os.setgroups([])
        os.setgid(10001)
        os.setuid(10001)
    subprocess.run([sys.executable, 'manage.py', 'collectstatic', '--noinput'], check=True)
    port = int(os.environ.get('PORT', '8000'))
    if not 1 <= port <= 65535:
        raise ValueError('PORT must be between 1 and 65535.')
    os.execvp('gunicorn', [
        'gunicorn', 'config.wsgi:application', '--bind', f'0.0.0.0:{port}',
        '--workers', '2', '--threads', '2', '--timeout', '60',
        '--access-logfile', '-', '--error-logfile', '-',
    ])


if __name__ == '__main__':
    main()
