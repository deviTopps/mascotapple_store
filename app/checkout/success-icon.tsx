export default function SuccessIcon() {
  return (
    <svg className="checkout-success-icon" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="currentColor" fillOpacity="0.08" />
      <circle className="checkout-success-ring" cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="3" pathLength="1" />
      <path className="checkout-success-check" d="m26 40 10 10 19-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
    </svg>
  );
}
