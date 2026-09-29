import type { Metadata } from 'next';
import InformationPage from '../information-page';
import StoreMap from './store-map';

export const metadata: Metadata = {
  title: 'About Us | Mascot Apple Dealz',
  description: 'Meet Mascot Apple Dealz GH, your destination for Apple products, laptops, gaming and everyday technology.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return <InformationPage title="About Us" intro="Premium tech. Value for money. Technology for your everyday life.">
    <section>
      <h2>Welcome to Mascot Apple Dealz</h2>
      <p>Mascot Apple Dealz GH is an electronics store serving shoppers in Ghana. We bring Apple products, laptops, gaming, TVs, audio and everyday devices and accessories together in one place.</p>
      <p>Whether you are choosing a phone, setting up a workspace or finding an accessory, our aim is to make shopping for technology straightforward.</p>
    </section>
    <section>
      <h2>Find what works for you</h2>
      <p>Browse our current collection, compare product details and choose the options that suit your needs. If you need help with compatibility, a product specification or an item without a listed price, contact us before ordering.</p>
    </section>
    <section>
      <h2>Shop with support</h2>
      <p>Our checkout shows the available pickup, delivery and payment options for your order. You can also reach us directly for product questions or help with an existing order.</p>
    </section>
    <StoreMap />
  </InformationPage>;
}
