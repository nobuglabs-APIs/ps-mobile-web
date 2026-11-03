export function BrandSplash() {
  return (
    <main className="brand-splash" role="status" aria-label="A carregar PS Faturas">
      <div className="brand-splash__app">
        <img alt="" className="brand-splash__icon" decoding="async" src="/brand/ps-mobile.webp" />
        <span className="brand-splash__name">PS Faturas</span>
      </div>
      <div className="brand-splash__attribution">
        <span className="brand-splash__from">From</span>
        <img alt="Nobug Labs" className="brand-splash__logo" decoding="async" src="/brand/nobuglabs-logo.webp" />
        <span className="brand-splash__copyright">© Nobug Labs. Todos os direitos reservados.</span>
      </div>
    </main>
  );
}
