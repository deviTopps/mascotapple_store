"use client";

import ErrorScreen from "./error-screen";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen title="We couldn’t load this page." message="Something unexpected happened. Please try again, or return to the home page." retry={retry} digest={error.digest} />;
}
