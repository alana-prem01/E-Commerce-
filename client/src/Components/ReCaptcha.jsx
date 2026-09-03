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

  useEffect(() => {
    const key = siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

    const renderWidget = () => {
      if (window.grecaptcha && window.grecaptcha.render && containerRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: key,
            callback: (token) => {
              if (onChange) onChange(token);
            },
            'expired-callback': () => {
              if (onExpired) onExpired();
            },
            'error-callback': () => {
              if (onError) onError();
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

    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha && window.grecaptcha.reset) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, onChange, onExpired, onError]);

  return (
    <div className="recaptcha-wrapper" style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
      <div ref={containerRef} className="g-recaptcha-container" />
    </div>
  );
};

export default ReCaptcha;
