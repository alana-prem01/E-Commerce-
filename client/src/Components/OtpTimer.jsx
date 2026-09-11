import React, { useEffect, useState } from 'react';

/**
 * OtpTimer - displays a countdown from the given start time to expiration (default 10 minutes).
 * Props:
 *   startTime: number (timestamp in ms) when OTP was sent.
 *   durationSec?: number total seconds before expiry (default 600 seconds = 10 minutes).
 *   onExpire?: () => void callback invoked when timer reaches zero.
 */
export default function OtpTimer({ startTime, durationSec = 600, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(durationSec - elapsed, 0);
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire && onExpire();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire && onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  return (
    <div className="otp-timer" style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
      OTP expires in {mins}:{secs}
    </div>
  );
}
