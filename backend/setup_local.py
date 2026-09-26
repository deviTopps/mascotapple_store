"""Create local-only settings and admin account without overwriting existing secrets."""
import json
import os
import secrets
from pathlib import Path
base = Path(__file__).resolve().parent
config = base / '.local-config.json'
if not config.exists():
    config.write_text(json.dumps({'secret_key': secrets.token_urlsafe(50), 'api_token': secrets.token_urlsafe(40)}))
    config.chmod(0o600)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.core.management import call_command
call_command('migrate', interactive=False)
call_command('import_catalog')
from django.contrib.auth import get_user_model
if not get_user_model().objects.filter(is_superuser=True).exists():
    password = secrets.token_urlsafe(20)
    get_user_model().objects.create_superuser('admin', 'admin@localhost', password)
    credentials = base / '.admin-credentials.txt'
    credentials.write_text(f'Local Django admin: http://127.0.0.1:8000/admin/\nUsername: admin\nPassword: {password}\n')
    credentials.chmod(0o600)
    print('Admin credentials saved to backend/.admin-credentials.txt')
config_data = json.loads(config.read_text())
env = base.parent / '.env.local'
text = env.read_text() if env.exists() else ''
for key, value in {'DJANGO_API_URL': 'http://127.0.0.1:8000', 'DJANGO_API_TOKEN': config_data['api_token']}.items():
    if not any(line.startswith(key + '=') for line in text.splitlines()): text += f'\n{key}={value}\n'
env.write_text(text)
env.chmod(0o600)
