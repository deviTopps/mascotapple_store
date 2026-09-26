import CommerceShell from "../commerce-shell";
import CheckoutForm from "./checkout-form";
export const dynamic = "force-dynamic";
export default function CheckoutPage() {
  return <CommerceShell compact><h1>Checkout</h1><CheckoutForm configured={Boolean(process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_"))} /></CommerceShell>;
}
