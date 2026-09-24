import React from 'react';

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modalContentStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  width: '360px',
  maxWidth: '90%',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  textAlign: 'center',
};

export default function NetworkErrorModal({ isOpen, onClose, onRetry }) {
  if (!isOpen) return null;

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📡</div>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#dc2626' }}>
          Network Connection Error
        </h3>
        <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}>
          Unable to connect to backend server. Please verify your internet connection and try again.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
          {onRetry && (
            <button
              className="btn-primary"
              onClick={() => {
                onClose();
                onRetry();
              }}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
