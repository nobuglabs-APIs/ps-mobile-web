import { useEffect, useRef } from 'react';

type GoogleCredentialResponse = { credential?: string };
type FacebookLoginResponse = {
  authResponse?: { accessToken?: string };
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; text: string; shape: string; width: number },
          ) => void;
        };
      };
    };
    FB?: {
      init: (options: { appId: string; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options: { scope: string },
      ) => void;
    };
  }
}

function loadScript(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Não foi possível carregar o serviço de autenticação.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('Não foi possível carregar o serviço de autenticação.'));
    };
    document.head.appendChild(script);
  });
}

export function SocialLoginButtons({
  disabled,
  onGoogleToken,
  onFacebookToken,
  onError,
}: {
  disabled: boolean;
  onGoogleToken: (token: string) => void;
  onFacebookToken: (token: string) => void;
  onError: (message: string) => void;
}) {
  const googleButton = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onGoogleToken, onFacebookToken, onError });
  callbacks.current = { onGoogleToken, onFacebookToken, onError };
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID?.trim();

  useEffect(() => {
    if (!googleClientId || !googleButton.current) return;
    void loadScript('google-identity-services', 'https://accounts.google.com/gsi/client')
      .then(() => {
        if (!window.google || !googleButton.current) {
          throw new Error('O serviço de autenticação Google não ficou disponível.');
        }
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) callbacks.current.onGoogleToken(response.credential);
            else callbacks.current.onError('O Google não devolveu um token de acesso.');
          },
        });
        window.google.accounts.id.renderButton(googleButton.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(360, Math.max(220, googleButton.current.clientWidth)),
        });
      })
      .catch((reason: unknown) => callbacks.current.onError(
        reason instanceof Error ? reason.message : 'Não foi possível iniciar o acesso com Google.',
      ));
  }, [googleClientId]);

  useEffect(() => {
    if (!facebookAppId) return;
    void loadScript('facebook-jssdk', 'https://connect.facebook.net/en_US/sdk.js')
      .then(() => {
        if (!window.FB) throw new Error('O serviço de autenticação Facebook não ficou disponível.');
        window.FB.init({ appId: facebookAppId, xfbml: false, version: 'v22.0' });
      })
      .catch((reason: unknown) => callbacks.current.onError(
        reason instanceof Error ? reason.message : 'Não foi possível iniciar o acesso com Facebook.',
      ));
  }, [facebookAppId]);

  if (!googleClientId && !facebookAppId) return null;

  const loginFacebook = () => {
    if (!window.FB) {
      callbacks.current.onError('O acesso com Facebook ainda está a carregar. Tente novamente.');
      return;
    }
    window.FB.login((response) => {
      const token = response.authResponse?.accessToken;
      if (token) callbacks.current.onFacebookToken(token);
      else callbacks.current.onError('O acesso com Facebook foi cancelado ou não foi autorizado.');
    }, { scope: 'email' });
  };

  return (
    <div aria-busy={disabled} className="social-login">
      <div className="social-login__divider"><span>ou continuar com</span></div>
      {googleClientId && <div aria-disabled={disabled} aria-label="Continuar com Google" className="social-login__google" ref={googleButton} />}
      {facebookAppId && (
        <button className="social-login__facebook" disabled={disabled} onClick={loginFacebook} type="button">
          <span aria-hidden="true">f</span> Continuar com Facebook
        </button>
      )}
    </div>
  );
}
