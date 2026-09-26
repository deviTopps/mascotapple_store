import styles from "./loading-skeleton.module.css";

type View = "home" | "shop" | "product" | "cart" | "checkout" | "confirmation";

function Bar({ wide = false }: { wide?: boolean }) {
  return <div className={`${styles.bone} ${wide ? styles.wide : styles.line}`} />;
}

function Cards() {
  return <div className={styles.cards}>{Array.from({ length: 5 }, (_, index) => <div className={styles.card} key={index}><div className={`${styles.bone} ${styles.image}`} /><Bar wide /><Bar /><div className={`${styles.bone} ${styles.button}`} /></div>)}</div>;
}

export default function LoadingSkeleton({ view = "home", embedded = false }: { view?: View; embedded?: boolean }) {
  return <div className={embedded ? styles.embedded : styles.page} role="status" aria-busy="true" aria-label={`Loading ${view === "home" ? "store" : view}`}>
    <span className={styles.srOnly}>Loading {view === "home" ? "store" : view}…</span>
    <div aria-hidden="true">
      {!embedded && <div className={styles.header}><div className={`${styles.bone} ${styles.logo}`} /><div className={styles.navigation}><Bar wide /><Bar wide /><Bar /></div><div className={`${styles.bone} ${styles.icon}`} /></div>}
      <div className={embedded ? undefined : styles.content}>
        {!embedded && <div className={`${styles.bone} ${styles.title}`} />}
        {view === "home" && <><div className={styles.hero}><div className={styles.stack}><div className={`${styles.bone} ${styles.title}`} /><Bar wide /><Bar /><div className={`${styles.bone} ${styles.button}`} /></div><div className={`${styles.bone} ${styles.heroImage}`} /></div><Cards /></>}
        {view === "shop" && <><div className={`${styles.bone} ${styles.toolbar}`} /><div className={styles.shop}><div className={styles.filters}>{Array.from({ length: 7 }, (_, i) => <Bar wide key={i} />)}</div><Cards /></div></>}
        {view === "product" && <div className={styles.columns}><div className={`${styles.bone} ${styles.productImage}`} /><div className={styles.stack}><Bar wide /><Bar /><Bar wide /><div className={`${styles.bone} ${styles.toolbar}`} /><div className={`${styles.bone} ${styles.toolbar}`} /><div className={`${styles.bone} ${styles.button}`} /></div></div>}
        {(view === "cart" || view === "checkout") && <div className={styles.columns}><div className={styles.stack}>{Array.from({ length: view === "cart" ? 3 : 5 }, (_, i) => view === "cart" ? <div className={styles.cartLine} key={i}><div className={`${styles.bone} ${styles.thumbnail}`} /><div className={styles.stack}><Bar wide /><Bar /><Bar /></div></div> : <div className={styles.stack} key={i}><Bar /><div className={`${styles.bone} ${styles.field}`} /></div>)}</div><div className={styles.summary}><Bar wide /><Bar /><Bar wide /><Bar /><div className={`${styles.bone} ${styles.button}`} /></div></div>}
        {view === "confirmation" && <div className={styles.confirmation}><div className={`${styles.bone} ${styles.circle}`} /><div className={`${styles.bone} ${styles.title}`} /><Bar wide /><Bar /><div className={`${styles.bone} ${styles.button}`} /></div>}
      </div>
    </div>
  </div>;
}
