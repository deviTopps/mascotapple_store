"use client";

import { BuyButton, CartLink } from "../cart-store";
import { useRef, useState } from "react";
import Image from "next/image";
import SiteFooter from "../site-footer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useCatalog } from "../catalog-provider";
import { filterProducts } from "../lib/catalog-filters";
import { paginate } from '../lib/pagination';
import cards from "../product-cards.module.css";
import header from "../header.module.css";
import styles from "./catalog.module.css";


export default function Catalog() {
  const products = useCatalog();
  const categories = [...new Set(products.map(product => product.category))];
  const tags = [...new Set(products.map(product => product.tag).filter(tag => tag.trim()))];
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const results = filterProducts(products, params);
  const pagination = paginate(results, params.get('page'));
  const resultsHeading = useRef<HTMLParagraphElement>(null);
  const selectedCategories = params.getAll("category");
  const selectedTags = params.getAll("tag");
  const activeFilters = [...params.entries()].filter(([key, value]) => ["category", "tag", "min", "max", "q"].includes(key) && value);

  function update(key: string, value: string, multiple = false, replace = false) {
    const next = new URLSearchParams(window.location.search);
    if (key !== 'page') next.delete('page');
    if (multiple) {
      const values = next.getAll(key);
      next.delete(key);
      (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]).forEach((item) => next.append(key, item));
    } else if (value) next.set(key, value);
    else next.delete(key);
    const url = `/products${next.size ? `?${next.toString()}` : ""}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    if (key === 'page') requestAnimationFrame(() => {
      resultsHeading.current?.focus({ preventScroll: true });
      resultsHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }

  function clearFilters() {
    const sort = params.get("sort");
    window.history.pushState(null, "", sort ? `/products?sort=${encodeURIComponent(sort)}` : "/products");
  }

  return (
    <main className={`${styles.page} ${header.page}`}>
      <div className={header.fixedHeader}>
        <div className={header.announcement}>Complimentary delivery on orders over GH₵75 <ArrowRight size={13} /></div>
        <header className={header.header}>
          <div className={header.inner}>
            <Link className={header.brand} href="/" aria-label="Mascot home"><Image src="/main_logo.jpg" alt="Mascot Apple Dealz GH" width={120} height={120} loading="eager" /></Link>
            <nav className={styles.headerLinks} aria-label="Shop navigation"><Link href="/products" aria-current="page">Shop</Link><Link href="/support">Support</Link></nav>
            <CartLink />
          </div>
        </header>
      </div>
      <div className={header.spacer} aria-hidden="true" />
      <div className={styles.content}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={13} /><span aria-current="page">Shop</span></nav>
        <div className={styles.intro}><div><h1>Premium Tech<br />Get Value for Money</h1><p>Shop the latest Apple products, laptops, gaming, TVs, audios and everyday devices and accessories</p></div><span className={styles.collectionCount}>{products.length} products in the collection</span></div>
        <div className={styles.toolbar}>
          <label className={styles.search}><Search size={20} aria-hidden="true" /><input type="search" aria-label="Search all products" placeholder="Search products" value={params.get("q") ?? ""} onChange={(event) => update("q", event.target.value, false, true)} /></label>
          <button className={styles.filterToggle} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="catalog-filters"><SlidersHorizontal size={17} /> Filters {activeFilters.length > 0 && <span>{activeFilters.length}</span>}</button>
          <label className={styles.sort}>Sort by<select aria-label="Sort products" value={params.get("sort") ?? "featured"} onChange={(event) => update("sort", event.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A to Z</option></select></label>
        </div>
        <div className={styles.layout}>
          <aside id="catalog-filters" className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ""}`} aria-label="Product filters">
            <div className={styles.filterHeading}><h2>Filters</h2>{activeFilters.length > 0 && <button onClick={clearFilters}>Reset all</button>}</div>
            <fieldset><legend>Category</legend>{categories.map((category) => <label className={styles.checkbox} key={category}><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => update("category", category, true)} /><span>{category}</span><small>{products.filter((product) => product.category === category).length}</small></label>)}</fieldset>
            <fieldset><legend>Price range <span>GH₵</span></legend><div className={styles.priceRange}><label>Min<input type="number" min="0" step="any" inputMode="decimal" placeholder="0" value={params.get("min") ?? ""} onChange={(event) => update("min", event.target.value, false, true)} /></label><span>–</span><label>Max<input type="number" min="0" step="any" inputMode="decimal" placeholder="Any" value={params.get("max") ?? ""} onChange={(event) => update("max", event.target.value, false, true)} /></label></div>{params.get("min") && params.get("max") && Number(params.get("min")) > Number(params.get("max")) && <p className={styles.validation}>Maximum price must be at least the minimum.</p>}</fieldset>
            <fieldset><legend>Highlights</legend>{tags.map((tag) => <label className={styles.checkbox} key={tag}><input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => update("tag", tag, true)} /><span>{tag}</span></label>)}</fieldset>
          </aside>
          <section className={styles.results} aria-label="Product results">
            <p className={styles.resultCount} role="status" ref={resultsHeading} tabIndex={-1}>{results.length} {results.length === 1 ? "product" : "products"}{activeFilters.length ? " found" : ""}{results.length > 0 && ` · Showing ${pagination.start + 1}–${pagination.end}`}</p>
            {activeFilters.length > 0 && <div className={styles.chips}>{activeFilters.map(([key, value]) => <button key={`${key}-${value}`} onClick={() => update(key, key === "category" || key === "tag" ? value : "", key === "category" || key === "tag")} aria-label={`Remove ${key} filter: ${value}`}>{key === "min" ? `From GH₵${value}` : key === "max" ? `Up to GH₵${value}` : key === "q" ? `Search: ${value}` : value}<X size={13} /></button>)}</div>}
            {results.length ? <div className={styles.grid}>{pagination.items.map((product) => <article className={`${cards.card} ${styles.productCard}`} key={product.slug}>
              <Link className={`${cards.visual} ${styles.productVisual}`} href={`/products/${product.slug}`} aria-label={`View ${product.name}`}><Image className={`${cards.image} ${styles.productImage}`} src={product.image} alt={product.imageAlt} fill sizes="(max-width: 760px) 44vw, (max-width: 900px) 30vw, (max-width: 1100px) 22vw, 210px" /></Link>
              <div className={cards.details}>
                <p className={cards.tag}>{product.tag}</p>
                <h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3>
                <p className={`${cards.price} ${styles.productPrice}`}>{product.price}</p>
                <div className={cards.actions}><BuyButton className={cards.learnMore} slug={product.slug} /></div>
              </div>
            </article>)}</div> : <div className={styles.empty}><Search size={32} strokeWidth={1.4} /><h2>No products found</h2><p>Try a different search or adjust your filters.</p><button onClick={clearFilters}>Clear filters</button></div>}
            {pagination.pages > 1 && <nav className={styles.pagination} aria-label="Product pages">
              <button disabled={pagination.page === 1} onClick={() => update('page', String(pagination.page - 1))}>Previous</button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button disabled={pagination.page === pagination.pages} onClick={() => update('page', String(pagination.page + 1))}>Next</button>
            </nav>}
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
