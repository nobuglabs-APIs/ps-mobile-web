import { useEffect, useState } from 'react';
import { Bell, BellRing, CheckCheck, LoaderCircle } from 'lucide-react';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../../api/psMobile';
import { Feedback } from '../../components/feedback/Feedback';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setError('');
    try {
      const [result, unread] = await Promise.all([
        getNotifications(),
        getNotifications(1, 1, true),
      ]);
      setItems(result.items);
      setPage(result.page);
      setTotal(result.total);
      setUnreadCount(unread.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const markRead = async (item: AppNotification) => {
    if (item.read_at) return;
    setBusy(true);
    setError('');
    try {
      await markNotificationRead(item.id);
      setItems((current) => current.map((notification) => notification.id === item.id
        ? { ...notification, read_at: new Date().toISOString() }
        : notification));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível marcar a notificação como lida.');
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    setError('');
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })));
      setUnreadCount(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível marcar as notificações como lidas.');
    } finally {
      setBusy(false);
    }
  };

  const loadMore = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await getNotifications(page + 1);
      setItems((current) => [...current, ...result.items]);
      setPage(result.page);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar mais notificações.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack notifications-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">CENTRO DE AVISOS</p>
          <h1>Notificações</h1>
          <p className="page-description">Acompanhe atualizações importantes da sua conta e do seu negócio.</p>
        </div>
        {unreadCount > 0 && (
          <button className="button button--subtle" disabled={busy} onClick={() => void markAllRead()} type="button">
            <CheckCheck size={17} /> Marcar todas como lidas
          </button>
        )}
      </header>

      {error && <Feedback message={error} />}
      <section aria-label="Lista de notificações" className="surface-card notification-list">
        {loading ? (
          <div className="loading-panel"><LoaderCircle className="spin" size={18} /> A carregar notificações…</div>
        ) : items.length === 0 ? (
          <div className="notification-empty">
            <span className="notification-empty__icon"><Bell size={21} /></span>
            <strong>Está tudo em dia</strong>
            <p>Quando houver novidades importantes, elas aparecerão aqui.</p>
          </div>
        ) : items.map((item) => (
          <article className={item.read_at ? 'notification-row' : 'notification-row notification-row--unread'} key={item.id}>
            <span aria-hidden="true" className="notification-row__icon">
              {item.read_at ? <Bell size={18} /> : <BellRing size={18} />}
            </span>
            <div className="notification-row__content">
              <div className="notification-row__heading">
                <h2>{item.title}</h2>
                {!item.read_at && <span className="notification-row__unread">Nova</span>}
              </div>
              <p>{item.body}</p>
              <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
            </div>
            {!item.read_at && (
              <button
                aria-label={`Marcar "${item.title}" como lida`}
                className="notification-row__action"
                disabled={busy}
                onClick={() => void markRead(item)}
                type="button"
              >
                <CheckCheck size={17} />
              </button>
            )}
          </article>
        ))}
      </section>
      {!loading && items.length < total && (
        <button className="button button--subtle notification-load-more" disabled={busy} onClick={() => void loadMore()} type="button">
          {busy ? 'A carregar…' : 'Carregar mais notificações'}
        </button>
      )}
    </div>
  );
}
