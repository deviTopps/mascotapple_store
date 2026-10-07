"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Product } from "../../lib/products";
import type { Selections } from "../../lib/product-options";
import { useCatalog } from "../../catalog-provider";
import ProductActions from "./product-actions";

export default function ProductDetail({ product: initialProduct }: { product: Product }) {
  const catalog = useCatalog();
  const product = catalog.find(item => item.slug === initialProduct.slug) ?? initialProduct;
  const [selections, setSelections] = useState<Selections>({});
  const filterId = `color-preview-${useId().replace(/:/g, '')}`;
  const selectedColor = selections.color;
  const previewColor = selectedColor ? getPreviewColor(selectedColor) : undefined;
  const colorImage = product.colorImages?.find(item => item.color.toLowerCase() === selections.color?.toLowerCase());
  const approximate = Boolean(selectedColor && !colorImage && previewColor);
  return (
        <section className="product-detail">
          <div className="product-detail-visual">
            {approximate && <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
              <defs><filter id={filterId} colorInterpolationFilters="sRGB">
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  {(['R', 'G', 'B'] as const).map((channel, index) => {
                    const Component = { R: 'feFuncR', G: 'feFuncG', B: 'feFuncB' }[channel] as 'feFuncR' | 'feFuncG' | 'feFuncB';
                    const value = parseInt(previewColor!.slice(1 + index * 2, 3 + index * 2), 16) / 255;
                    return <Component key={channel} type="table" tableValues={`0 ${value * 0.55} ${value} 1`} />;
                  })}
                </feComponentTransfer>
              </filter></defs>
            </svg>}
            <Image className="product-detail-image" src={colorImage?.image || product.image} alt={colorImage?.imageAlt || (approximate ? `${product.name} — approximate ${selectedColor} color preview` : product.imageAlt)} style={approximate ? { filter: `url(#${filterId})` } : undefined} fill sizes="(max-width: 760px) 90vw, (max-width: 1280px) 50vw, 620px" preload />
            {selectedColor && <p className="product-color-caption" role="status">
              <span className="product-color-swatch" style={{ backgroundColor: previewColor }} aria-hidden="true" />
              {selectedColor}{approximate ? ' · Approximate color preview' : !colorImage ? ' · Color photo coming soon' : ''}
            </p>}
            {product.tag && <span className="product-detail-tag">{product.tag}</span>}
          </div>

          <div className="product-detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
            <p className="product-detail-price">{product.price}</p>
            <p className="product-detail-description">{product.longDescription}</p>
            <ProductActions productName={product.name} slug={product.slug} selections={selections} onSelectionsChange={setSelections} />

            {product.highlights.length > 0 && <div className="product-highlights">
              <h2>Highlights</h2>
              <ul>
                {product.highlights.map((highlight) => <li key={highlight}><Check size={16} aria-hidden="true" />{highlight}</li>)}
              </ul>
            </div>}
            <Link className="product-support-link" href="/support">Need a hand? Talk to us <ArrowRight size={14} /></Link>
          </div>
        </section>
  );
}

const previewColors: Record<string, string> = {
  black: '#303239', 'jet black': '#25262a', 'space black': '#363638', midnight: '#343d4e',
  white: '#eeeeea', starlight: '#e9dfcf', silver: '#bdc1c5', 'space gray': '#777a80', 'space grey': '#777a80', gray: '#929498', grey: '#929498',
  red: '#cc2436', '(product)red': '#cc2436', 'product red': '#cc2436', burgundy: '#803747',
  blue: '#6b9aca', 'deep blue': '#344773', 'sierra blue': '#9cb8cd', 'pacific blue': '#466875', 'sky blue': '#a7c6df', ultramarine: '#6374cc',
  orange: '#e78342', 'cosmic orange': '#de7841', coral: '#eb8675', peach: '#eec0a0',
  green: '#7e9b85', teal: '#75aaa8', mint: '#b4d6c3', 'alpine green': '#586d59',
  purple: '#a593bd', 'deep purple': '#665d79', lavender: '#c1b2d6', pink: '#e9b4c5', 'rose gold': '#d7a79b',
  gold: '#d6bd87', yellow: '#ecd16b', cream: '#e4dbc4', beige: '#ccb99c', brown: '#977354',
  'natural titanium': '#aaa49a', 'desert titanium': '#c7ab92', 'blue titanium': '#505e78', 'black titanium': '#444548', 'white titanium': '#deddd8',
};
function getPreviewColor(name: string) {
  const normalized = name.trim().toLowerCase();
  return previewColors[normalized] ?? Object.entries(previewColors).find(([color]) => normalized.split(/\s+/).includes(color))?.[1];
}
