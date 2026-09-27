# Security operations

This baseline reduces common application risks; passing checks is not a guarantee
against compromise. Re-run the checks after changes and review new advisories.

## Controls in this project

- HTTPS, secure admin cookies, CSRF protection and host validation on the backend.
- Admin passwords must be at least 12 characters when set through Django's
  validated password forms. Existing passwords are not changed automatically.
- Database-backed admin login protection: 10 failed attempts for a username lock
  that username for 15 minutes. Success resets failures; blocked retries do not
  extend the lockout. Admin sessions expire after eight hours or browser close.
- Username-based throttling deliberately avoids trusting proxy IP headers. Axes
  `W006` warns about the absence of an IP limit. The account limit cannot be
  bypassed by changing cookies, user agents or IPs, but an attacker who knows an
  admin username can temporarily lock it. Add an access gateway/MFA for stronger
  admin protection. Do not silence this warning without reviewing that tradeoff.
- Orders require same-origin JSON checkout requests, bounded streamed bodies,
  validated product options and server-calculated amounts. Backend order writes
  additionally require a constant-time-checked Bearer token.
- Online payments remain test-only. Never mark payments paid from a browser
  claim; verify the provider response, reference, amount, currency and session.
- Admin uploads are decoded as images and checked for matching file extension,
  a 5 MB size limit and a 20-megapixel limit. Public media rejects traversal;
  the frontend media proxy rejects redirects and unsupported query parameters.
- Browser headers block framing, plugins and cross-origin form submissions.
  The CSP intentionally has no script-src restriction yet: a strict nonce-based
  script policy needs dynamic rendering and testing with Google Places. It is
  not a complete XSS mitigation. React escaping remains essential.
- Security CI runs tests, lint, builds, dependency audits and a Git history secret
  scan on pushes/PRs and weekly. Dependabot proposes dependency updates. Jobs use
  read-only repository permissions and pinned action commits. Branch protection
  must require these checks if deployments are to wait for them.

## Deploy and verify

Install `backend/requirements-production.txt` and run database migrations before
starting the new backend; django-axes adds its own tables. Railway's configured
pre-deploy migration command handles this. Keep `DJANGO_SETTINGS_MODULE=config.railway`.

Run:

```sh
npm ci
npm audit
npm test
npm run lint
npm run build
python -m pip install -r backend/requirements-production.txt pip-audit==2.10.1
python -m pip_audit -r backend/requirements-production.txt
python backend/manage.py test store --noinput
python backend/manage.py check --deploy --settings=config.railway
```

The deployment check needs production-shaped environment variables. HSTS
`security.W005` and `security.W021` are intentional: the application does not own
all subdomains of the hosting platforms and does not request HSTS preload.

Check the storefront, product photos, admin login and a test checkout after
deployment. Never brute-force the real administrator account as a smoke test.

## Owner/account configuration

These settings require account-level configuration and are not established by
this repository:

1. Enable MFA on GitHub, Vercel, Railway and the payment account. Give staff
   individual accounts and only the permissions they need. Django admin MFA is
   not included by this baseline; plan an MFA/access-gateway rollout with recovery.
2. Replace the temporary admin password with a unique password in a password
   manager. Rotate production secrets if exposed. Keep server keys out of
   `NEXT_PUBLIC_*`, Git, screenshots and logs. Restrict any public Google Maps
   browser key to the storefront domains and required APIs.
3. Enable available firewall/bot controls and persistent rate limits for
   `POST /api/checkout` and `/admin/login/`. Application origin checks do not
   prevent bots from forging an Origin header. Checkout has no distributed
   per-client rate limiter yet; do not treat the admin throttle as covering it.
4. Schedule private backups for both Postgres and `/data/media`; test a restore.
   Confirm retention, access controls and budget in Railway. Never commit orders,
   credentials or database backups. Minimize retention of customer addresses.
5. Enable dependency/secret alerts and branch protection. Vercel auto-deploys
   pushes independently of GitHub Actions unless deployment checks are configured.
   Review failed security jobs before merging or deploying.

## Recovery and incidents

If the admin is locked, wait 15 minutes. An authorized operator can run
`python manage.py axes_reset_username USERNAME --settings=config.railway` inside
the backend service. Do not disable Axes or delete unrelated accounts.

For an exposed secret: revoke/rotate it in the provider, update the corresponding
Railway/Vercel secret, redeploy, and verify. Removing it from the latest commit
does not remove it from Git history. Preserve relevant logs privately and avoid
posting exploit details, customer data or secrets in public issues.

Reference guidance: [OWASP security headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
and [Django Axes installation](https://django-axes.readthedocs.io/en/stable/2_installation.html).
