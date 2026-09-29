import Link from 'next/link';
import { Plus } from 'lucide-react';
import styles from './home-faq.module.css';

const questions = [
  {
    question: 'How do I place an order?',
    answer: <>Choose a product, select any available options and add it to your cart. Review your items, then enter your contact details and choose a pickup or delivery option at checkout. Keep your order reference for any enquiries.</>,
  },
  {
    question: 'How can I pay?',
    answer: <>You can choose to pay at pickup or on delivery, depending on your order. Online checkout currently runs in test mode and does not collect real money. Check the payment details shown at checkout before placing your order.</>,
  },
  {
    question: 'Do you offer delivery and store pickup?',
    answer: <>Store pickup is available, and eligible orders can select delivery at checkout. The available options and charges are shown before you place your order. <Link href="/support">Contact us</Link> to confirm delivery coverage, timing or pickup arrangements.</>,
  },
  {
    question: 'Where is your store?',
    answer: <>You can find our location and a Google Maps link on the <Link href="/about#store-location-heading">About Us page</Link>. Call <a href="tel:+233240613935">+233 24 061 3935</a> to confirm arrangements before visiting.</>,
  },
  {
    question: 'Can I cancel an order or exchange a product?',
    answer: <>Contact us as soon as possible to request an order cancellation. After purchase, our store policy is exchange-only, with no voluntary change-of-mind refunds. Any legally required rights still apply. Read our <Link href="/refund-cancellation-policy">Refund and Cancellation Policy</Link> for the full process.</>,
  },
  {
    question: 'What if my item arrives damaged or is incorrect?',
    answer: <>Contact us with your order reference and a description of the issue. Photos of the item and packaging can help. Keep the item and accessories while we confirm the next steps, and contact us before sending anything back.</>,
  },
  {
    question: 'Do products come with a warranty?',
    answer: <>Warranty terms depend on the product and the information supplied with it. If a listing does not explain the warranty, condition or included accessories, <Link href="/support">ask us before ordering</Link> so you know what is covered.</>,
  },
  {
    question: 'How do I check on my order?',
    answer: <>Call <a href="tel:+233240613935">+233 24 061 3935</a> or email <a href="mailto:mascotappledealzgh@gmail.com">mascotappledealzgh@gmail.com</a> with your order reference. We can help with order updates, product questions and pickup or delivery arrangements.</>,
  },
];

export default function HomeFaq() {
  return <section className={styles.section} id="faq" aria-labelledby="faq-heading">
    <div className={styles.inner}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>HERE TO HELP</p>
        <h2 id="faq-heading">Frequently asked questions</h2>
        <p>A little clarity before you shop.</p>
        <Link href="/support" className={styles.support}>Still have a question? Contact us →</Link>
      </div>
      <div className={styles.questions}>
        {questions.map(({ question, answer }) => <details className={styles.item} name="home-faq" key={question}>
          <summary><span>{question}</span><Plus size={18} aria-hidden="true" /></summary>
          <div className={styles.answer}><p>{answer}</p></div>
        </details>)}
      </div>
    </div>
  </section>;
}
