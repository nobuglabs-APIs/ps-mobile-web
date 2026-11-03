import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import {
  isLoginChallenge,
  SessionChallengeRequiredError,
  type LoginChallenge,
  type TokenResponse,
} from '../../api/client';
import { login, register, resendEmailVerification, verifyEmail, verifyLogin } from '../../api/psMobile';
import { Feedback } from '../../components/feedback/Feedback';
import { BrandAttribution } from '../../components/branding/BrandAttribution';

type AuthMode = 'login' | 'register' | 'verify';

export function AuthPage({
  onAuthenticated,
  pendingChallenge,
}: {
  onAuthenticated: (tokens: TokenResponse) => void;
  pendingChallenge: LoginChallenge | null;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [challenge, setChallenge] = useState<LoginChallenge | null>(pendingChallenge);
  const [challengeCode, setChallengeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const referral = new URLSearchParams(window.location.search).get('ref');
    if (referral) {
      setReferralCode(referral.trim().toUpperCase());
      setMode('register');
    }

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    setVerificationToken(token);
    setMode('verify');
    setBusy(true);
    verifyEmail(token)
      .then(() => {
        setMode('login');
        setVerificationToken('');
        setNotice('E-mail confirmado. Já pode iniciar sessão.');
        window.history.replaceState({}, '', window.location.pathname);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Token inválido ou expirado.'))
      .finally(() => setBusy(false));
  }, []);

  const run = async (action: () => Promise<void>) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
    } catch (reason) {
      if (reason instanceof SessionChallengeRequiredError) {
        setChallenge(reason.challenge);
        setChallengeCode('');
        setNotice(`Código enviado por ${reason.challenge.channel === 'email' ? 'e-mail' : 'SMS'}.`);
      } else {
        setError(reason instanceof Error ? reason.message : 'Não foi possível concluir o pedido.');
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      if (mode === 'verify') {
        await verifyEmail(verificationToken.trim());
        setMode('login');
        setVerificationToken('');
        setNotice('E-mail confirmado. Já pode iniciar sessão.');
        return;
      }
      if (mode === 'register') {
        const result = await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          workspace_name: workspaceName.trim(),
          referral_code: referralCode || undefined,
        });
        setVerificationToken(result.email_verification_token || '');
        setMode('verify');
        setNotice('Conta criada. Confirme o e-mail enviado para ativar o acesso.');
        return;
      }
      const result = await login(email.trim(), password);
      if (isLoginChallenge(result)) {
        setChallenge(result);
        setChallengeCode('');
        setNotice(`Código enviado por ${result.channel === 'email' ? 'e-mail' : 'SMS'}.`);
        return;
      }
      onAuthenticated(result);
    });
  };

  const confirmChallenge = () => run(async () => {
    if (!challenge || challengeCode.trim().length !== 6) {
      throw new Error('Introduza o código de seis dígitos.');
    }
    const tokens = await verifyLogin(challenge.challenge_id, challengeCode.trim());
    setChallenge(null);
    onAuthenticated(tokens);
  });

  const resendVerification = () => run(async () => {
    const result = await resendEmailVerification(email.trim());
    if (result.debug_token) setVerificationToken(result.debug_token);
    setNotice('Se a conta precisar de confirmação, será enviado um novo e-mail.');
  });

  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Sobre o PS Faturas">
        <a className="brand brand--light" href="/">
          <img alt="" className="brand__mark brand__mark--image" decoding="async" src="/brand/ps-mobile.webp" />
          <span className="brand__text"><strong>Faturas</strong><small>PS-Mobile</small></span>
        </a>
        <div className="auth-visual__content">
          <span className="auth-kicker"><ShieldCheck size={15} /> GESTÃO SIMPLES, NEGÓCIO SEGURO</span>
          <h1>O seu negócio,<br />sempre em ordem.</h1>
          <p>Produtos, vendas e documentos fiscais num espaço seguro, ligados à sua conta PS-Mobile.</p>
          <div className="auth-proof">
            <span className="auth-proof__icon"><MailCheck size={20} /></span>
            <span><strong>Proteção da conta integrada</strong><small>Verificação de e-mail e autenticação de dois fatores</small></span>
          </div>
        </div>
        <p className="auth-visual__footer">PS-Mobile · Gestão para negócios em Angola</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          {challenge ? (
            <>
              <button className="back-link" type="button" onClick={() => setChallenge(null)}>
                <ArrowLeft size={16} /> Voltar ao acesso
              </button>
              <span className="auth-icon"><KeyRound size={23} /></span>
              <p className="eyebrow">VERIFICAÇÃO DE SEGURANÇA</p>
              <h2>Confirme a sua identidade</h2>
              <p className="auth-description">
                Introduza o código de seis dígitos enviado por {challenge.channel === 'email' ? 'e-mail' : 'SMS'}.
              </p>
              {challenge.debug_code && <p className="debug-code">Código de teste: {challenge.debug_code}</p>}
              <form className="auth-form" onSubmit={(event) => { event.preventDefault(); void confirmChallenge(); }}>
                <label htmlFor="challenge-code">Código de segurança</label>
                <input
                  autoComplete="one-time-code"
                  autoFocus
                  id="challenge-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setChallengeCode(event.target.value.replace(/\D/g, ''))}
                  pattern="[0-9]{6}"
                  required
                  value={challengeCode}
                />
                <button className="button button--primary" disabled={busy} type="submit">
                  {busy ? 'A verificar…' : 'Confirmar código'} <ArrowRight size={17} />
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth-mobile-brand">
                <img alt="" className="brand__mark brand__mark--image" decoding="async" src="/brand/ps-mobile.webp" />
                <strong>Faturas</strong>
              </div>
              <p className="eyebrow">{mode === 'register' ? 'COMECE A ORGANIZAR O SEU NEGÓCIO' : mode === 'verify' ? 'CONFIRMAÇÃO DE CONTA' : 'BEM-VINDO DE VOLTA'}</p>
              <h2>{mode === 'register' ? 'Crie a sua conta' : mode === 'verify' ? 'Confirme o seu e-mail' : 'Entre na sua conta'}</h2>
              <p className="auth-description">
                {mode === 'register'
                  ? 'Crie a sua conta e o primeiro espaço de trabalho.'
                  : mode === 'verify'
                    ? 'A confirmação do e-mail é necessária antes de poder entrar.'
                    : 'Aceda ao seu espaço de trabalho PS-Mobile.'}
              </p>

              <form className="auth-form" onSubmit={submit}>
                {mode === 'register' && <>
                  <label htmlFor="full-name">Nome completo</label>
                  <input autoComplete="name" id="full-name" maxLength={200} onChange={(event) => setFullName(event.target.value)} required value={fullName} />
                  <label htmlFor="workspace-name">Nome do negócio</label>
                  <input id="workspace-name" maxLength={120} minLength={2} onChange={(event) => setWorkspaceName(event.target.value)} required value={workspaceName} />
                </>}
                {mode !== 'verify' && <>
                  <label htmlFor="auth-email">E-mail</label>
                  <input autoComplete="email" id="auth-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
                  <label htmlFor="auth-password">Palavra-passe</label>
                  <div className="password-field">
                    <input
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      id="auth-password"
                      minLength={mode === 'register' ? 10 : 1}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} onClick={() => setShowPassword((value) => !value)} type="button">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </>}
                {mode === 'verify' && <>
                  <label htmlFor="verification-token">Token de confirmação</label>
                  <input id="verification-token" onChange={(event) => setVerificationToken(event.target.value)} required value={verificationToken} />
                </>}
                <button className="button button--primary" disabled={busy} type="submit">
                  {busy ? 'A processar…' : mode === 'register' ? 'Criar conta' : mode === 'verify' ? 'Confirmar e-mail' : 'Iniciar sessão'}
                  {!busy && <ArrowRight size={17} />}
                </button>
              </form>

              {mode === 'login' && (
                <button className="text-button auth-resend" disabled={busy || !email.trim()} onClick={() => void resendVerification()} type="button">
                  Reenviar e-mail de confirmação
                </button>
              )}
              {mode !== 'verify' ? (
                <p className="auth-switch">
                  {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}
                  <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>
                    {mode === 'login' ? 'Criar conta' : 'Iniciar sessão'}
                  </button>
                </p>
              ) : (
                <button className="text-button auth-switch-button" type="button" onClick={() => setMode('login')}>
                  Voltar ao início de sessão
                </button>
              )}
            </>
          )}
          {error && <Feedback message={error} />}
          {notice && <Feedback kind="success" message={notice} />}
          <p className="auth-legal">Ao continuar, concorda com os termos de utilização do PS-Mobile.</p>
          <BrandAttribution />
        </div>
      </section>
    </main>
  );
}
