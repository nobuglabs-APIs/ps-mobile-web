import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdateNotice() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <aside aria-live="polite" className="pwa-update-notice" role="status">
      <span>Está disponível uma nova versão do PS-Mobile.</span>
      <button className="button button--primary button--small" onClick={() => void updateServiceWorker(true)} type="button">
        <RefreshCw size={14} /> Atualizar
      </button>
      <button
        aria-label="Adiar atualização"
        className="pwa-update-dismiss"
        onClick={() => setNeedRefresh(false)}
        type="button"
      >
        <X size={15} />
      </button>
    </aside>
  );
}
