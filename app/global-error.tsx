"use client";

import ErrorScreen from "./error-screen";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return <html lang="en"><body style={{ margin: 0 }}><ErrorScreen title="We couldn’t open the store." message="The page ran into a problem. Try reloading it, or contact our team for help." retry={() => window.location.reload()} digest={error.digest} /></body></html>;
}
