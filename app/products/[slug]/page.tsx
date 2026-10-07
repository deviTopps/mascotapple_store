import type { Metadata } from "next";
import Image from "next/image";
import SiteFooter from "../../site-footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStoreProducts } from "../../lib/store-backend";
import { CartLink } from "../../cart-store";
import ProductDetail from "./product-detail";
import { productStructuredData, serializeJsonLd, storeUrl } from '../../lib/seo';

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
  const product = (await getStoreProducts()).find(product => product.slug === slug);

  if (!product) notFound();

  return (
    <main className="product-page">
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

        <ProductDetail key={product.slug} product={product} />

      </div>

      <SiteFooter />
    </main>
  );
}
