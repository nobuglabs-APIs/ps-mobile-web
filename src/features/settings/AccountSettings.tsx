import { useState, type FormEvent } from 'react';
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { changePassword, getMe, requestEmailChange, updateNotificationPreferences, uploadAvatar, verifyEmailChange, type UserProfile } from '../../api/psMobile';
import { mediaUrl } from '../../api/client';
import { Feedback } from '../../components/feedback/Feedback';

export function AccountSettings({
  profile,
  onProfileUpdated,
}: {
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Palavra-passe alterada. Por segurança, as outras sessões foram terminadas.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível alterar a palavra-passe.');
    } finally {
      setBusy(false);
    }
  };

  const changeAvatar = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await uploadAvatar(file);
      onProfileUpdated({ ...profile, avatar_url: result.url });
      setNotice('Fotografia de perfil atualizada.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a fotografia.');
    } finally {
      setBusy(false);
    }
  };

  const updatePreference = async (key: 'notify_email' | 'notify_sms' | 'notify_whatsapp' | 'notify_push', value: boolean) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const preferences = await updateNotificationPreferences({ [key]: value });
      onProfileUpdated({ ...profile, ...preferences });
      setNotice('Preferência de notificações atualizada.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível guardar a preferência.');
    } finally {
      setBusy(false);
    }
  };

  const requestEmailUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await requestEmailChange(newEmail.trim());
      setEmailToken(result.debug_token || '');
      onProfileUpdated({ ...profile, pending_email: result.email });
      setNotice(result.debug_token
        ? `Código de confirmação de desenvolvimento: ${result.debug_token}`
        : `Enviámos uma confirmação para ${result.email}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível solicitar a alteração do e-mail.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEmailUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await verifyEmailChange(emailCode.trim());
      onProfileUpdated(await getMe());
      setNewEmail('');
      setEmailCode('');
      setEmailToken('');
      setNotice('E-mail da conta atualizado e confirmado.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível confirmar o novo e-mail.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="surface-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--blue"><UserRound size={18} /></span><div><h2>A sua conta</h2><p>Fotografia, contactos e preferências pessoais.</p></div></div>
        </div>
        <div className="account-settings-profile">
          <span className="account-settings-avatar">
            {profile.avatar_url
              ? <img alt="" src={mediaUrl(profile.avatar_url) || undefined} />
              : profile.full_name.slice(0, 1).toLocaleUpperCase()}
          </span>
          <div className="account-settings-profile__details">
            <strong>{profile.full_name}</strong>
            <span>{profile.email || 'E-mail não definido'}</span>
            <small>{profile.email_verified ? 'E-mail verificado' : 'E-mail por verificar'}</small>
          </div>
          <div className="media-settings__actions">
            <label className="button button--subtle">Escolher fotografia<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} type="file" /></label>
            <label className="button button--subtle">Tirar fotografia<input accept="image/*" capture="user" className="sr-only" disabled={busy} onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} type="file" /></label>
          </div>
        </div>
        <div className="account-email-settings">
          {profile.pending_email && <p className="form-hint">Confirmação pendente para <strong>{profile.pending_email}</strong>.</p>}
          <form className="account-email-form" onSubmit={(event) => void requestEmailUpdate(event)}>
            <label className="form-field"><span>Novo e-mail</span><input autoComplete="email" required type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} /></label>
            <button className="button button--subtle" disabled={busy || !newEmail.trim() || newEmail.trim().toLocaleLowerCase() === profile.email?.toLocaleLowerCase()} type="submit">Alterar e-mail</button>
          </form>
          {(profile.pending_email || emailToken) && (
            <form className="account-email-form" onSubmit={(event) => void confirmEmailUpdate(event)}>
              <label className="form-field"><span>Código de confirmação</span><input autoComplete="one-time-code" minLength={32} required value={emailCode} onChange={(event) => setEmailCode(event.target.value)} /></label>
              <button className="button button--primary" disabled={busy} type="submit">Confirmar novo e-mail</button>
            </form>
          )}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--green"><ShieldCheck size={18} /></span><div><h2>Notificações</h2><p>Escolha onde quer receber avisos importantes.</p></div></div>
        </div>
        <div className="preference-list">
          {([
            ['notify_email', 'E-mail', 'Avisos enviados para o e-mail da conta.'],
            ['notify_sms', 'SMS', 'Mensagens para o número associado à conta.'],
            ['notify_whatsapp', 'WhatsApp', 'Avisos pelo WhatsApp, quando disponível.'],
            ['notify_push', 'Notificações push', 'Alertas nos dispositivos registados.'],
          ] as const).map(([key, title, description]) => (
            <label className="preference-row" key={key}>
              <span><strong>{title}</strong><small>{description}</small></span>
              <input checked={profile[key]} disabled={busy} onChange={(event) => void updatePreference(key, event.target.checked)} type="checkbox" />
            </label>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--violet"><KeyRound size={18} /></span><div><h2>Alterar palavra-passe</h2><p>Use uma palavra-passe única e difícil de adivinhar.</p></div></div>
        </div>
        {error && <Feedback message={error} />}
        {notice && <Feedback kind="success" message={notice} />}
        <form className="form-grid form-grid--compact" onSubmit={(event) => void submitPassword(event)}>
          <label className="form-field"><span>Palavra-passe atual</span><input autoComplete="current-password" minLength={1} required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <label className="form-field"><span>Nova palavra-passe <small>(mínimo 10 caracteres)</small></span><input autoComplete="new-password" minLength={10} required type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <label className="form-field"><span>Confirmar nova palavra-passe</span><input autoComplete="new-password" minLength={10} required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <div className="form-actions"><button className="button button--primary" disabled={busy} type="submit">{busy ? 'A guardar…' : 'Alterar palavra-passe'}</button></div>
        </form>
      </section>
    </>
  );
}
