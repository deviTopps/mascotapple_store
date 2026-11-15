import CommerceShell from "../commerce-shell";
import CheckoutForm from "./checkout-form";
import { paystackMode } from "../lib/paystack";
export const dynamic = "force-dynamic";
export default function CheckoutPage() {
  return <CommerceShell compact><h1>Checkout</h1><CheckoutForm paymentMode={paystackMode(process.env.PAYSTACK_SECRET_KEY)} /></CommerceShell>;
}
