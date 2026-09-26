import type { Metadata } from "next";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import CommerceShell from "../commerce-shell";
import styles from "./support.module.css";

export const metadata: Metadata = {
  title: "Support | Mascot Apple Dealz GH",
  description: "Contact Mascot Apple Dealz GH for help with products and orders.",
};

export default function SupportPage() {
  return <CommerceShell>
    <section className={styles.support} aria-labelledby="support-heading">
      <p className="commerce-eyebrow">MASCOT APPLE DEALZ GH</p>
      <h1 id="support-heading">How can we help?</h1>
      <p className={styles.intro}>Have a question about a product or your order? Get in touch.</p>
      <div className={styles.contacts}>
        <a className={styles.contact} href="mailto:mascotappledealzgh@gmail.com">
          <span className={styles.icon}><Mail size={22} aria-hidden="true" /></span>
          <span className={styles.copy}><strong>Email us</strong><span>mascotappledealzgh@gmail.com</span></span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <a className={styles.contact} href="tel:+233240613935">
          <span className={styles.icon}><Phone size={22} aria-hidden="true" /></span>
          <span className={styles.copy}><strong>Call us</strong><span>0240613935</span></span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </div>
      <p className={styles.note}>For help with an order, include your order reference when you contact us.</p>
    </section>
  </CommerceShell>;
}
