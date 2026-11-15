import fs from 'node:fs';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const checks = [];
function check(label, passed) { checks.push(passed); console.log(`${passed ? 'OK' : 'MISSING/INVALID'}: ${label}`); }
const key = process.env.PAYSTACK_SECRET_KEY || '';
const paymentMode = /^sk_(test|live)_\S{10,}$/.exec(key)?.[1];
check('Paystack test or live secret key in server environment', Boolean(paymentMode) && !/replace|your_|example/i.test(key));
if (paymentMode) console.log(`Payment mode: ${paymentMode}`);
let origin;
try { origin = new URL(process.env.SITE_URL); } catch {}
check('SITE_URL is a full HTTP(S) origin without a trailing slash', !!origin && ['http:', 'https:'].includes(origin.protocol) && origin.origin === process.env.SITE_URL);
let backend;
try { backend = new URL(process.env.DJANGO_API_URL); } catch {}
check('Django API URL configured', !!backend && ['http:', 'https:'].includes(backend.protocol));
check('Django internal API token configured', !!process.env.DJANGO_API_TOKEN && process.env.DJANGO_API_TOKEN.length >= 32);
check('Webhook handler installed', fs.existsSync('app/api/paystack/webhook/route.ts'));
if (origin) console.log(`Callback: ${origin.origin}/checkout/complete\nWebhook: ${origin.origin}/api/paystack/webhook`);
console.log('Configure the webhook in the same Paystack environment as the secret key. Paystack must be able to reach it over public HTTPS.');
process.exitCode = checks.every(Boolean) ? 0 : 1;
