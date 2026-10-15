import type { Metadata } from "next";
import Image from "next/image";
import SiteFooter from "../../site-footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getStoreProducts } from "../../lib/store-backend";
import { CartLink } from "../../cart-store";
import ProductActions from "./product-actions";
import { productStructuredData, serializeJsonLd, storeUrl } from '../../lib/seo';
import styles from './product-detail.module.css';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getStoreProducts()).find(product => product.slug === slug);

  return product
    ? { title: `${product.name} | Mascot Apple Dealz`, description: product.longDescription || product.description,
        alternates: { canonical: storeUrl(`/products/${product.slug}`) },
        openGraph: { title: product.name, description: product.description, url: storeUrl(`/products/${product.slug}`), images: [{ url: storeUrl(product.image), alt: product.imageAlt }] } }
    : { title: "Product not found | Mascot Apple Dealz", robots: { index: false, follow: false } };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await getStoreProducts();
  const product = products.find(product => product.slug === slug);

  if (!product) notFound();
  const similarProducts = products.filter(item => item.slug !== slug && item.category === product.category).slice(0, 5);

  return (
    <main className={`product-page ${styles.compact}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(productStructuredData(product)) }} />
      <header className="site-header product-page-header">
        <Link className="logo-link" href="/" aria-label="Mascot home">
          <Image className="logo-image" src="/main_logo.jpg" alt="Mascot Apple dealz Gh logo" width={104} height={104} loading="eager" />
        </Link>
        <div className="product-header-actions"><Link className="product-page-back-link" href="/products"><ArrowLeft size={16} /> All products</Link><CartLink /></div>
      </header>

      <div className="product-page-content">
        <nav className="product-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/products">Shop</Link><span>/</span><Link href={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><span>/</span><span aria-current="page">{product.name}</span>
        </nav>

        <section className="product-detail">
          <div className="product-detail-visual">
            <Image className="product-detail-image" src={product.image} alt={product.imageAlt} fill sizes="(max-width: 760px) 90vw, (max-width: 1280px) 50vw, 620px" preload />
            {product.tag && <span className="product-detail-tag">{product.tag}</span>}
          </div>

          <div className="product-detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="product-detail-price">{product.price}</p>
            <p className="product-detail-description">{product.longDescription || product.description}</p>
            <ProductActions productName={product.name} slug={product.slug} />

            {product.highlights.length > 0 && <div className="product-highlights">
              <h2>Highlights</h2>
              <ul>
                {product.highlights.map((highlight) => <li key={highlight}><Check size={16} aria-hidden="true" />{highlight}</li>)}
              </ul>
            </div>}
            <Link className="product-support-link" href="/support">Need a hand? Talk to us <ArrowRight size={14} /></Link>
          </div>
        </section>

        {similarProducts.length > 0 && <section className={styles.similar} aria-labelledby="similar-heading">
          <div className={styles.sectionHeading}><div><p>KEEP EXPLORING</p><h2 id="similar-heading">Similar products</h2></div><Link href={`/products?category=${encodeURIComponent(product.category)}`}>View all {product.category} <ArrowRight size={15} aria-hidden="true" /></Link></div>
          <div className={styles.grid}>{similarProducts.map(item => <article className={styles.card} key={item.slug}>
            <Link className={styles.visual} href={`/products/${item.slug}`} aria-label={`View ${item.name}`}><Image src={item.image} alt={item.imageAlt} fill sizes="(max-width: 600px) 44vw, (max-width: 900px) 30vw, 210px" /></Link>
            <p className={styles.category}>{item.category}</p>
            <h3><Link href={`/products/${item.slug}`}>{item.name}</Link></h3>
            <p className={styles.price}>{item.price}</p>
            <Link className={styles.view} href={`/products/${item.slug}`}>View product <ArrowRight size={14} aria-hidden="true" /></Link>
          </article>)}</div>
        </section>}

      </div>

      <SiteFooter />
    </main>
  );
}
