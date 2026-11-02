import fs from 'node:fs';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const checks = [];
function check(label, passed) { checks.push(passed); console.log(`${passed ? 'OK' : 'MISSING/INVALID'}: ${label}`); }
const key = process.env.PAYSTACK_SECRET_KEY || '';
check('Paystack test secret key (sk_test_…) in server environment', /^sk_test_\S{10,}$/.test(key) && !/replace|your_|example/i.test(key));
let origin;
try { origin = new URL(process.env.SITE_URL); } catch {}
check('SITE_URL is a full HTTP(S) origin without a trailing slash', !!origin && ['http:', 'https:'].includes(origin.protocol) && origin.origin === process.env.SITE_URL);
let backend;
try { backend = new URL(process.env.DJANGO_API_URL); } catch {}
check('Django API URL configured', !!backend && ['http:', 'https:'].includes(backend.protocol));
check('Django internal API token configured', !!process.env.DJANGO_API_TOKEN && process.env.DJANGO_API_TOKEN.length >= 32);
check('Webhook handler installed', fs.existsSync('app/api/paystack/webhook/route.ts'));
if (origin) console.log(`Callback: ${origin.origin}/checkout/complete\nWebhook: ${origin.origin}/api/paystack/webhook`);
console.log('Paystack must be able to reach the webhook over a public HTTPS URL; localhost is for browser-return testing only.');
process.exitCode = checks.every(Boolean) ? 0 : 1;
