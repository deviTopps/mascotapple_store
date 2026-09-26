"use client";

import ErrorScreen from "../error-screen";

export default function CheckoutError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen title="We couldn’t load your checkout." message="Try loading this page again. If you already submitted an order or made a payment, contact us to confirm its status before placing another order." retry={retry} digest={error.digest} />;
}
