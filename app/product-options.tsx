"use client";

import { getProductOptions, type Selections } from "./lib/product-options";
import { useCatalog } from "./catalog-provider";
import { iphoneColors } from "./lib/iphone-colors";
import styles from "./product-options.module.css";

export default function ProductOptions({ slug, selections, onChange }: { slug: string; selections: Selections; onChange: (selections: Selections) => void }) {
  const products = useCatalog();
  const palette = iphoneColors(products.find(p => p.slug === slug)?.name ?? "");
  return <div className={styles.options}>{getProductOptions(slug, products).map(option => <div key={option.id}>
    {option.id === 'color' && palette.length > 0 && <p className={styles.colorLabel}>Color <strong>{selections.color || 'Choose your finish'}</strong></p>}
    {option.id === 'color' && palette.length > 0 && <div className={styles.swatches} role="group" aria-label="Color swatches">{option.values.map(value => {
      const color = palette.find(c => c.name.toLowerCase() === value.toLowerCase());
      return color ? <button type="button" key={value} aria-label={value} title={value} aria-pressed={selections.color === value} className={styles.swatchButton} onClick={() => onChange({ ...selections, color: value })}><span className={styles.swatch} style={{ backgroundColor: color.hex }} /></button> : null;
    })}</div>}
    {option.id === 'color' && option.values.every(value => palette.some(c => c.name.toLowerCase() === value.toLowerCase())) ? null : <label><span>{option.label}</span>
      <select required value={selections[option.id] ?? ""} onChange={event => onChange({ ...selections, [option.id]: event.target.value })}>
        <option value="" disabled>Select {option.label.toLowerCase()}</option>
        {option.values.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>}
  </div>)}</div>;
}
