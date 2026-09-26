"use client";
import ErrorScreen from "./error-screen";

export default function StoreUnavailable() {
  return <ErrorScreen kind="offline" title="We’ll be back in a moment." message="We couldn’t connect to the store. Check your connection and try again shortly. You can also reach us directly below." retry={() => window.location.reload()} />;
}
