import { useEffect, useRef } from "react";
import { getClientId, setToken } from "../auth";
import "./Login.css";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            el: HTMLElement,
            config: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          setToken(response.credential);
          onLogin();
        },
      });
      if (buttonRef.current) {
        window.google?.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onLogin]);

  const clientId = getClientId();

  return (
    <div className="login">
      <h1 className="login-title">Day Tracker</h1>
      <p className="login-subtitle">How was your day?</p>
      {clientId ? (
        <div ref={buttonRef} className="google-button-container" />
      ) : (
        <button className="login-button" onClick={onLogin}>
          Sign in (dev mode)
        </button>
      )}
    </div>
  );
}
