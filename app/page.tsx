"use client";

import { BuyButton, CartLink } from "./cart-store";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import SiteFooter from "./site-footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeroSlider from "./hero-slider";
import headerStyles from "./header.module.css";
import cardStyles from "./product-cards.module.css";
import { useCatalog } from "./catalog-provider";
import { ArrowRight, ChevronLeft, ChevronRight, Headphones, Laptop, Menu, Search, Smartphone, Tablet, Watch, X } from "lucide-react";

const categories = [
  { name: "iPhone", icon: Smartphone }, { name: "Mac", icon: Laptop }, { name: "iPad", icon: Tablet },
  { name: "Watch", icon: Watch }, { name: "Audio", icon: Headphones },
];

export default function Home() {
  const products = useCatalog();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const productRail = useRef<HTMLDivElement>(null);
  const accessoriesRail = useRef<HTMLDivElement>(null);
  const gamingLaptopsRail = useRef<HTMLDivElement>(null);
  function scrollProducts(direction: number, rail = productRail.current) {
    if (!rail) return;
    const card = rail.firstElementChild;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;
    rail.scrollBy({ left: direction * distance, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  const menuButton = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesQuery = `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [activeCategory, query, products]);

  return (
    <main className={`storefront ${headerStyles.page}`}>
      <div className={headerStyles.fixedHeader}>
      <div className={headerStyles.announcement}>Complimentary delivery on orders over GH₵75 <ArrowRight size={13} aria-hidden="true" /></div>
      <header className={headerStyles.header} onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (searchOpen) { setSearchOpen(false); searchButton.current?.focus(); }
          else if (menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
        }
      }}>
        <div className={headerStyles.inner}>
          <a className={headerStyles.brand} href="#top" aria-label="Mascot home">
            <Image src="/main_logo.jpg" alt="Mascot Apple Dealz GH" width={120} height={120} loading="eager" />
          </a>
          <nav id="store-navigation" className={`${headerStyles.navigation} ${menuOpen ? headerStyles.open : ""}`} aria-label="Primary navigation">
            <Link href="/products" className={headerStyles.active}>Shop all</Link>
            {categories.map((category) => <Link href={`/products?category=${encodeURIComponent(category.name)}`} key={category.name}>{category.name}</Link>)}
            <a href="#accessories" onClick={() => setMenuOpen(false)}>Accessories</a>
          </nav>
          <div className={headerStyles.actions}>
            <button ref={searchButton} className={headerStyles.iconButton} aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen} aria-controls="store-search" onClick={() => { setSearchOpen((open) => !open); setMenuOpen(false); }}>
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <CartLink />
            <button ref={menuButton} className={headerStyles.menuButton} aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen} aria-controls="store-navigation" onClick={() => { setMenuOpen((open) => !open); setSearchOpen(false); }}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {searchOpen && <form id="store-search" role="search" className={headerStyles.search} onSubmit={(event) => {
          event.preventDefault();
          setSearchOpen(false);
          router.push(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
        }}>
          <Search size={20} aria-hidden="true" />
          <input autoFocus aria-label="Search products" value={query} onChange={(event) => { setQuery(event.target.value); setActiveCategory("All"); }} placeholder="Find your next favorite" />
          <button type="submit">Search <ArrowRight size={16} /></button>
        </form>}
      </header>
      </div>
      <div className={headerStyles.spacer} aria-hidden="true" />
      <section className="hero-section" id="top" aria-labelledby="hero-heading">
        <div className="hero-copy"><h1 id="hero-heading">Your everyday.<br /><span className="hero-accent">Upgraded.</span></h1><p className="hero-subtitle">Discover Apple devices for the way you work, create, and unwind.</p><div className="hero-actions"><Link className="primary-button" href="/products">Shop all products <ArrowRight size={16} /></Link></div></div>
        <HeroSlider />
      </section>
      <section className={`${cardStyles.section} ${cardStyles.compactShop}`} id="latest" aria-labelledby="latest-heading">
        <div className={cardStyles.heading}>
          <div><h2 id="latest-heading">Shop</h2></div>
          <div className={cardStyles.controls}>
            <button type="button" aria-label="Previous products" onClick={() => scrollProducts(-1)}><ChevronLeft size={20} /></button>
            <button type="button" aria-label="Next products" onClick={() => scrollProducts(1)}><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className={cardStyles.rail} ref={productRail} tabIndex={0} role="region" aria-label="Browse products">
          {filteredProducts.map((product) => (
            <article className={cardStyles.card} key={product.slug}>
              <Link className={`${cardStyles.visual} ${cardStyles[product.visual]}`} href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
                <Image className={cardStyles.image} src={product.image} alt={product.imageAlt} fill sizes="(max-width: 640px) 66vw, (max-width: 1200px) 220px, 20vw" />
              </Link>
              <div className={cardStyles.details}>
                <p className={cardStyles.tag}>{product.tag}</p>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p className={cardStyles.price}>{product.price}</p>
                <div className={cardStyles.actions}>
                  <Link className={cardStyles.learnMore} href={`/products/${product.slug}`} aria-label={`Learn more about ${product.name}`}>Learn more</Link>
                  <BuyButton className={cardStyles.buy} slug={product.slug} />
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredProducts.length === 0 && <div className="empty-state">Nothing found yet. Try another search.</div>}
      </section>
      <section className={`${cardStyles.section} ${cardStyles.accessoriesSection} ${cardStyles.compactShop} ${cardStyles.smallerImages}`} id="accessories" aria-labelledby="accessories-heading">
        <div className={cardStyles.heading}>
          <div><h2 id="accessories-heading">Accessories</h2><p className={cardStyles.subtitle}>The little extras for your everyday.</p></div>
          <div className={cardStyles.sectionActions}>
            <Link className="text-link" href="/products?category=Audio&category=Watch">Shop accessories <ArrowRight size={15} /></Link>
            <div className={cardStyles.controls}>
              <button type="button" aria-label="Previous accessories" onClick={() => scrollProducts(-1, accessoriesRail.current)}><ChevronLeft size={20} /></button>
              <button type="button" aria-label="Next accessories" onClick={() => scrollProducts(1, accessoriesRail.current)}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
        <div className={cardStyles.rail} ref={accessoriesRail} tabIndex={0} role="region" aria-label="Browse accessories">
          {products.filter(product => ["Audio", "Watch"].includes(product.category)).map(product => (
            <article className={cardStyles.card} key={product.slug}>
              <Link className={`${cardStyles.visual} ${cardStyles[product.visual]}`} href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
                <Image className={cardStyles.image} src={product.image} alt={product.imageAlt} fill sizes="(max-width: 640px) 66vw, (max-width: 1550px) 300px, 20vw" />
              </Link>
              <div className={cardStyles.details}>
                <p className={cardStyles.tag}>{product.tag}</p>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p className={cardStyles.price}>{product.price}</p>
                <div className={cardStyles.actions}>
                  <Link className={cardStyles.learnMore} href={`/products/${product.slug}`} aria-label={`Learn more about ${product.name}`}>Learn more</Link>
                  <BuyButton className={cardStyles.buy} slug={product.slug} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className={`${cardStyles.section} ${cardStyles.accessoriesSection} ${cardStyles.compactShop} ${cardStyles.compactGaming}`} id="gaming-laptops" aria-labelledby="gaming-laptops-heading">
        <div className={cardStyles.heading}>
          <div><h2 id="gaming-laptops-heading">Gaming &amp; Laptops</h2><p className={cardStyles.subtitle}>More ways to work and play.</p></div>
          <div className={cardStyles.sectionActions}>
            <Link className="text-link" href="/products?category=Gaming&category=Windows%20Laptops">Shop gaming &amp; laptops <ArrowRight size={15} /></Link>
            <div className={cardStyles.controls}>
              <button type="button" aria-label="Previous gaming and laptops" onClick={() => scrollProducts(-1, gamingLaptopsRail.current)}><ChevronLeft size={20} /></button>
              <button type="button" aria-label="Next gaming and laptops" onClick={() => scrollProducts(1, gamingLaptopsRail.current)}><ChevronRight size={20} /></button>
            </div>
          </div>
        </div>
        <div className={cardStyles.rail} ref={gamingLaptopsRail} tabIndex={0} role="region" aria-label="Browse gaming and laptops">
          {products.filter(product => ["Gaming", "Windows Laptops"].includes(product.category)).map(product => (
            <article className={cardStyles.card} key={product.slug}>
              <Link className={`${cardStyles.visual} ${cardStyles[product.visual]}`} href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
                <Image className={cardStyles.image} src={product.image} alt={product.imageAlt} fill sizes="(max-width: 640px) 60vw, (max-width: 1440px) 210px, (max-width: 2048px) 16vw, 320px" />
              </Link>
              <div className={cardStyles.details}>
                <p className={cardStyles.tag}>{product.tag}</p>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p className={cardStyles.price}>{product.price}</p>
                <div className={cardStyles.actions}>
                  <Link className={cardStyles.learnMore} href={`/products/${product.slug}`} aria-label={`Learn more about ${product.name}`}>Learn more</Link>
                  <BuyButton className={cardStyles.buy} slug={product.slug} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="offer-strip"><h2>More ways to make<br /><em>your moment.</em></h2><div className="offer-pills"><Link className="offer-shop-button" href="/products">Shop Now</Link></div></section>
      <SiteFooter />

    </main>
  );
}
