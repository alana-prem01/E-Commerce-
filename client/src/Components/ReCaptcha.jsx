import React, { useEffect, useRef } from 'react';

/**
 * Google reCAPTCHA v2 React Component
 * 
 * Renders Google reCAPTCHA v2 Checkbox.
 * Site Key loaded from VITE_RECAPTCHA_SITE_KEY env variable,
 * with fallback to Google's official v2 test key (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI)
 */
const ReCaptcha = ({ siteKey, onChange, onExpired, onError, theme = 'light' }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onChange, onExpired, onError });

  useEffect(() => {
    callbacksRef.current = { onChange, onExpired, onError };
  });

  useEffect(() => {
    const key = siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

    const renderWidget = () => {
      if (window.grecaptcha && window.grecaptcha.render && containerRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: key,
            callback: (token) => {
              if (callbacksRef.current.onChange) callbacksRef.current.onChange(token);
            },
            'expired-callback': () => {
              if (callbacksRef.current.onExpired) callbacksRef.current.onExpired();
            },
            'error-callback': () => {
              if (callbacksRef.current.onError) callbacksRef.current.onError();
            },
            theme: theme,
          });
        } catch (e) {
          console.error("reCAPTCHA render error:", e);
        }
      }
    };

    if (!document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onGoogleReCaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      window.onGoogleReCaptchaLoad = () => {
        renderWidget();
      };
      document.head.appendChild(script);
    } else {
      if (window.grecaptcha && window.grecaptcha.render) {
        renderWidget();
      } else {
        const interval = setInterval(() => {
          if (window.grecaptcha && window.grecaptcha.render) {
            clearInterval(interval);
            renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    // Do NOT reset the widgetIdRef or call reset on unmount to prevent 
    // "reCAPTCHA has already been rendered" if React re-runs the effect.
    // If the component actually unmounts, the DOM element is destroyed anyway.
  }, [siteKey, theme]);

  return (
    <div className="recaptcha-wrapper" style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} className="g-recaptcha-container" />
    </div>
  );
};

export default ReCaptcha;
