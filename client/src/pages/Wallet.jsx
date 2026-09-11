import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../css/Wallet.css'; // optional styling file

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get('/profile/wallet');
        if (res.success) {
          setBalance(res.balance);
          setTransactions(res.transactions || []);
        } else {
          setError(res.message || 'Failed to load wallet');
        }
      } catch (err) {
        console.error('Wallet fetch error', err);
        setError('Server error while loading wallet');
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <div className="wallet-page"><p>Loading wallet…</p></div>;
  if (error) return <div className="wallet-page"><p className="error">{error}</p></div>;

  return (
    <div className="wallet-page container">
      <h2>Refund Amount</h2>
      <div className="wallet-balance card">

        <p className="balance-amount">₹{balance.toLocaleString('en-IN')}</p>
      </div>

      <h3>Recent Transactions</h3>
      {transactions.length === 0 ? (
        <p>No wallet transactions yet.</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((tx) => (
            <li key={tx._id} className="transaction-item card">
              <div className="tx-header">
                <span className="tx-type">{tx.type}</span>
                <span className="tx-amount">{tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="tx-meta">
                <span className="tx-date">{new Date(tx.createdAt).toLocaleDateString()}</span>
                {tx.reason && <span className="tx-reason">{tx.reason}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Wallet;
