import { Quote } from 'lucide-react';
import styles from './customer-reviews.module.css';

// Transcribed from the customer feedback screenshots supplied by the store.
// No star ratings, purchase-verification claims or inferred dates are added.
const reviews = [
  { name: 'Hammond Julius', initials: 'HJ', quote: 'Deal went smooth. Definitely recommend him for your tech gadgets' },
  { name: 'Naa Deceleb', initials: 'ND', quote: 'Highly recommended. Cool deals nkwaaa👌' },
  { name: 'Moukuuks Enterprise', initials: 'ME', quote: 'Got package as advertised. Would definitely recommend for all your genuine apple products' },
  { name: 'Yella Breezy', initials: 'YB', quote: 'I was really impressed about how well I was received and how smoothly the purchase went. Genuine guy, definitely recommending him.' },
  { name: 'Rent People', initials: 'RP', quote: 'A great person to do business with' },
  { name: 'Oboy Samsong Gh', initials: 'OS', quote: 'excellent costormer service , I strongly recommend him.' },
];

export default function CustomerReviews() {
  return <section id="customer-reviews" className={styles.section} aria-labelledby="reviews-heading">
    <div className={styles.inner}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>CUSTOMER REVIEWS</p>
        <h2 id="reviews-heading">What our customers say</h2>
        <p className={styles.intro}>A few words from customers who have shopped with us.</p>
      </header>
      <div className={styles.grid}>
        {reviews.map(review => <figure className={styles.card} key={review.name}>
          <Quote size={22} strokeWidth={1.5} className={styles.quoteIcon} aria-hidden="true" />
          <blockquote><p>{review.quote}</p></blockquote>
          <figcaption>
            <span className={styles.avatar} aria-hidden="true">{review.initials}</span>
            <span className={styles.name}>{review.name}</span>
          </figcaption>
        </figure>)}
      </div>
    </div>
  </section>;
}
