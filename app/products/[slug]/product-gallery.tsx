"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "../../lib/products";
import styles from "./product-gallery.module.css";

export default function ProductGallery({ product }: { product: Product }) {
  const images = [...new Set(product.images?.length ? product.images : [product.image])].slice(0, 4);
  const [selected, setSelected] = useState(0);
  return <div>
    <div className="product-detail-visual">
      <Image className="product-detail-image" src={images[selected]} alt={`${product.imageAlt}${selected ? ` — view ${selected + 1}` : ""}`} fill sizes="(max-width: 760px) 90vw, 520px" loading="eager" />
      {product.tag && <span className="product-detail-tag">{product.tag}</span>}
    </div>
    {images.length > 1 && <div className={styles.thumbnails} role="group" aria-label="Product images">
      {images.map((src, index) => <button type="button" key={src} aria-label={`View image ${index + 1} of ${product.name}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <Image src={src} alt="" fill sizes="72px" />
      </button>)}
    </div>}
  </div>;
}
