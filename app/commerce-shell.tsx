import Image from "next/image";
import Link from "next/link";
import SiteFooter from "./site-footer";
import { CartLink } from "./cart-store";
import "./commerce.css";

export default function CommerceShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={`commerce-page${compact ? " checkout-compact" : ""}`}><header className="commerce-header"><Link href="/" aria-label="Mascot home"><Image src="/main_logo.jpg" alt="Mascot Apple Dealz GH" width={76} height={76} /></Link><Link href="/products">Continue shopping</Link><CartLink /></header><main className="commerce-main">{children}</main><SiteFooter /></div>;
}
