import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./site-footer.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="Mascot home">
          <Image src="/main_logo.jpg" alt="" width={52} height={52} />
          <span><strong>Mascot Apple Dealz GH</strong><span>Your next favorite. Find it here.</span></span>
        </Link>
        <nav className={styles.links} aria-label="Footer navigation">
          <span>No Refunds</span>
          <Link href="/support">Get support <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Mascot Apple Dealz GH</span>
        <a href="https://www.dataleapgh.com" target="_blank" rel="noopener noreferrer">Powered By Data Leap Technologies</a>
      </div>
    </footer>
  );
}
