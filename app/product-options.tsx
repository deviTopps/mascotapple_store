"use client";

import { getProductOptions, type Selections } from "./lib/product-options";
import { useCatalog } from "./catalog-provider";
import styles from "./product-options.module.css";

export default function ProductOptions({ slug, selections, onChange }: { slug: string; selections: Selections; onChange: (selections: Selections) => void }) {
  const products = useCatalog();
  return <div className={styles.options}>{getProductOptions(slug, products).map(option => <label key={option.id}>
    <span>{option.label}</span>
    <select required value={selections[option.id] ?? ""} onChange={event => onChange({ ...selections, [option.id]: event.target.value })}>
      <option value="" disabled>Select {option.label.toLowerCase()}</option>
      {option.values.map(value => <option key={value} value={value}>{value}</option>)}
    </select>
  </label>)}</div>;
}
