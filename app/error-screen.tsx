/* eslint-disable @next/next/no-html-link-for-pages -- Full navigation lets users recover even when the app router has failed. */
import { CircleAlert, SearchX, WifiOff } from "lucide-react";
import styles from "./error-screen.module.css";

type Props = {
  kind?: "error" | "missing" | "offline";
  title: string;
  message: string;
  retry?: () => void;
  digest?: string;
};

export default function ErrorScreen({ kind = "error", title, message, retry, digest }: Props) {
  const Icon = kind === "missing" ? SearchX : kind === "offline" ? WifiOff : CircleAlert;
  return <main className={styles.page}>
    <a className={styles.brand} href="/">Mascot Apple Dealz GH</a>
    <section className={styles.content} aria-labelledby="error-heading">
      <span className={styles.icon}><Icon size={32} aria-hidden="true" /></span>
      <p className={styles.label}>{kind === "missing" ? "404 · PAGE NOT FOUND" : kind === "offline" ? "STORE TEMPORARILY UNAVAILABLE" : "SOMETHING WENT WRONG"}</p>
      <h1 id="error-heading">{title}</h1>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        {retry ? <button type="button" onClick={retry}>Try again</button> : <a className={styles.primary} href="/products">Browse products</a>}
        <a className={styles.secondary} href="/">Back to home</a>
      </div>
      {digest && <p className={styles.detail}>Error reference: {digest}</p>}
      <div className={styles.support}><p>Need a hand? Contact our team.</p><a href="mailto:mascotappledealzgh@gmail.com">mascotappledealzgh@gmail.com</a><a href="tel:+233240613935">0240613935</a></div>
    </section>
  </main>;
}
