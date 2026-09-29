import styles from './store-map.module.css';

const locationUrl = 'https://www.google.com/maps?q=5.631845951080322,-0.17309008538722992&z=17&hl=en';
const embedUrl = 'https://www.google.com/maps/embed?pb=!1m3!2m1!1s5.631845951080322,-0.17309008538722992!6i17!3m1!1sen!5m1!1sen';

export default function StoreMap() {
  return <section aria-labelledby="store-location-heading">
    <h2 id="store-location-heading">Visit our store</h2>
    <p>Find Mascot Apple Dealz GH using the map below.</p>
    <div className={styles.map}>
      <iframe
        title="Mascot Apple Dealz GH store location"
        src={embedUrl}
        width="840" height="380" loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
    <p className={styles.link}><a href={locationUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></p>
  </section>;
}
