export function PaymentMethodLogo({ method }: { method: string }) {
  if (method !== 'multicaixa_express') return null;

  return <img alt="" className="payment-method-logo" decoding="async" src="/brand/express.webp" />;
}
