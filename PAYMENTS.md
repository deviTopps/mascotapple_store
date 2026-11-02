# Paystack test checkout

The shop uses Paystack hosted checkout in **test mode only**. Live secret keys are rejected.

Create `.env.local` in the project root:

```dotenv
PAYSTACK_SECRET_KEY=sk_test_replace_with_your_test_secret
SITE_URL=http://localhost:3000
```

Use the actual browser origin for `SITE_URL`, without a trailing slash. Restart the development server after changing environment variables. Never commit `.env.local` or put secret keys in `NEXT_PUBLIC_` variables.

## Flow

- “Buy Now” opens the product options. Customers must select a configuration before adding it to the cart.
- The product details page also has “Add to cart”. Quantities and cart contents persist across refreshes.
- Checkout collects contact and delivery details. Pickup is free; delivery is available free for orders over GH₵75, matching the existing site policy.
- Products without a numeric price must be removed or priced before checkout. No zero-price substitutions are made.
- The server validates items and quantities, computes GHS amounts from the catalog in pesewas, and creates a Paystack transaction. Order details are attached as Paystack transaction metadata.
- Paystack returns to `/checkout/complete`. The server verifies payment status, reference, currency, amount, store metadata and the signed browser payment session before showing success. Only verified purchased quantities are removed from the cart.
- Cancelled or failed payments leave the cart intact. A failed verification can be retried without initiating another charge.

## Validation

Run `node --test tests/checkout.test.cjs`, `npx tsc --noEmit` and `npm run build`.

With a configured Paystack test key, use Paystack's test payment instructions to exercise successful, failed and cancelled transactions. No real customer payment is required.

## Current scope

Payment records are in Paystack; pending orders and verified test payments are also recorded in the Django database when DJANGO_API_URL is configured. Manage fulfillment status at the Django admin. Automated fulfillment and merchant notifications are not implemented. Each checkout has its own signed browser cookie (24-hour expiry), so multiple checkout attempts do not overwrite each other. The return page also reconciles successful payments by verifying the reference with Paystack and matching the stored Django order. Without the matching browser cookie, it shows only generic payment status and does not reveal the amount or clear the cart. The catalog contains “From” prices; confirm final variant prices before enabling any future live-payment flow.

Official API reference: https://paystack.com/docs/api/transaction/
Test payment guide: https://paystack.com/docs/payments/test-payments/

## Placeholder variants

Django product option groups now supply the storefront with stable IDs, labels and allowed values. `app/lib/product-options.ts` remains the standalone starter fallback when the backend is not configured. The selectors are shared by product details and cart editing. Phone, Mac and iPad fixtures include storage and color; Watch uses case size and color, and AirPods uses color only.

Selections form part of cart line identity, are validated on the server and are included in Paystack order metadata. Prices stay at the base catalog test price for all placeholder configurations. Existing cart items without selections remain visible but require options before checkout. Django validates the selected options and base price. Django variant prices are supported; confirm all production prices and inventory handling before a future live-payment rollout.

## Google delivery location search

Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` and restart development (rebuild for production). This is a browser key. In Google Cloud, enable **Maps JavaScript API** and **Places API (New)** for the key's project and configure billing. Restrict the key to those APIs and the website referrers you use, including `http://localhost:3000/*` for local development and your production domain.

On checkout, choose **Delivery** to show the Google Places autocomplete widget. Selecting a result fills the address and city and stores the place ID and coordinates with the order's Paystack metadata. The map link opens the selected place in Google Maps. Searching biases toward Ghana; results are not a guarantee of delivery coverage.

Manual entry remains available with no API key, loading errors, or missing place details. Editing the populated address or city clears the coordinates to avoid submitting an outdated pin. Pickup orders discard location data. Customer location data is not stored in browser localStorage, and no GPS permission is requested.

The widget loads only when delivery is selected. Test with a restricted Google key for real autocomplete results, selection, manual edits, failure fallback and delivery/pickup switching.

Google widget documentation: https://developers.google.com/maps/documentation/javascript/place-autocomplete-new

## Pay on delivery / pickup

Checkout now defaults to paying when the customer receives the order. It works without a Paystack key but requires the Django service and internal API token. The server validates prices and options, persists the order, and returns a confirmation reference before purchased items are removed from the cart. Delivery orders require an address; pickup orders display “Pay at pickup.” Items without a price still require a quote.

These are actual unpaid order requests, not Paystack test transactions. Django records payment method `cod`, pending payment and new fulfillment status. The confirmation explicitly shows the amount still due. No online payment is claimed or collected. Retrying the same request ID and unchanged order returns the existing order instead of creating a duplicate. Paystack remains restricted to test mode.

## Test service setup

1. In the project root `.env.local`, set `PAYSTACK_SECRET_KEY` to your Paystack **test secret** (`sk_test_…`). Keep it server-only. The current local callback origin is `SITE_URL=http://localhost:3002`.
2. Run `npm run check:payments`. It checks configuration without printing keys; it does not validate credentials with Paystack or submit a payment.
3. Restart the Next.js service after changing configuration. Keep Django running at `http://127.0.0.1:8000`; local catalog, variant prices, quantities and orders use this backend.
4. To receive asynchronous confirmations, deploy the Next.js service to a public HTTPS test URL (with the same test key and accessible Django backend). In Paystack's **test** environment, configure the webhook URL as `https://YOUR-TEST-SITE/api/paystack/webhook`. A localhost URL cannot receive Paystack webhooks. Set `SITE_URL` to that public origin too. Do not expose the local admin through a tunnel as part of this setup.
5. Test hosted checkout success, cancellation, failed payment, browser closure, duplicate webhook delivery and mismatched amounts. No real-money transaction is needed.

The webhook verifies the HMAC-SHA512 signature against the raw request bytes, re-verifies the reference with Paystack, and accepts only successful GHS test transactions tagged for this store. Django compares the verified amount to the stored order and marks repeated confirmations idempotently. Failed verification/storage returns a non-success status for retry. The browser return continues to verify and record payments independently.

Setup remains incomplete until a valid test key is installed and a hosted test transaction succeeds. Webhook delivery additionally requires the public HTTPS URL and Paystack dashboard configuration. Live keys remain rejected.
