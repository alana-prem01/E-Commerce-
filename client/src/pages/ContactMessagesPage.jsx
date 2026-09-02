import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'react-toastify';
import { FiMail, FiTrash2, FiCheckCircle, FiSearch, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';
import '../css/AdminDashboard.css';

const THEME_PRIMARY = '#046a5a';

function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let query = `/contact?page=${page}&limit=10`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'All') query += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await api.get(query);
      if (res.success) {
        setMessages(res.data || []);
        setTotal(res.total || 0);
        setUnreadCount(res.unreadCount || 0);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch contact messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/contact/${id}`, { status: newStatus });
      if (res.success) {
        toast.success(`Message marked as ${newStatus}`);
        fetchMessages();
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(res.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update message status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await api.delete(`/contact/${id}`);
      if (res.success) {
        toast.success('Message deleted successfully');
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(null);
        }
        fetchMessages();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete message');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Unread':
        return <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Unread</span>;
      case 'Read':
        return <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Read</span>;
      case 'Replied':
        return <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Replied</span>;
      default:
        return <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{status}</span>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiMail size={26} color={THEME_PRIMARY} /> Contact Messages
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0 0' }}>
            Manage customer inquiries submitted from the Contact Us form.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiMessageSquare size={16} /> {unreadCount} Unread Messages
            </div>
          )}
          <button
            onClick={fetchMessages}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Toolbar (Search & Filters) */}
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by name, email or message content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ padding: '9px 18px', backgroundColor: THEME_PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>Status:</span>
          {['All', 'Unread', 'Read', 'Replied'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: statusFilter === st ? `1.5px solid ${THEME_PRIMARY}` : '1px solid #D1D5DB',
                backgroundColor: statusFilter === st ? '#F0FDF4' : '#fff',
                color: statusFilter === st ? THEME_PRIMARY : '#4B5563',
                fontSize: '13px',
                fontWeight: statusFilter === st ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout (Table & Message Detail View) */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedMessage ? '1fr 400px' : '1fr', gap: '24px' }}>
        {/* Messages List Table */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Sender</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Message Excerpt</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading contact messages...</td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No contact messages found.</td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr
                      key={msg._id}
                      onClick={() => {
                        setSelectedMessage(msg);
                        if (msg.status === 'Unread') {
                          handleUpdateStatus(msg._id, 'Read');
                        }
                      }}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        cursor: 'pointer',
                        backgroundColor: selectedMessage?._id === msg._id ? '#F0FDF4' : msg.status === 'Unread' ? '#FEFCE8' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4B5563', whiteSpace: 'nowrap' }}>
                        {new Date(msg.createdAt).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>{msg.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>{msg.email}</div>
                        {msg.phone && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>📞 {msg.phone}</div>}
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', maxWidth: '300px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {msg.comment}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {getStatusBadge(msg.status)}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                          {msg.status !== 'Replied' && (
                            <button
                              onClick={() => handleUpdateStatus(msg._id, 'Replied')}
                              title="Mark as Replied"
                              style={{ border: 'none', background: '#DCFCE7', color: '#15803D', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                            >
                              Replied
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(msg._id)}
                            title="Delete Message"
                            style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Showing page {page} of {totalPages} ({total} messages)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => prev - 1)}
                  style={{ padding: '6px 14px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                  style={{ padding: '6px 14px', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Message Detail Drawer / Card */}
        {selectedMessage && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1.5px solid #046a5a', padding: '20px', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>Message Details</h3>
              <button onClick={() => setSelectedMessage(null)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>From</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', marginTop: '2px' }}>{selectedMessage.name}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Contact Info</span>
              <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                📧 <a href={`mailto:${selectedMessage.email}`} style={{ color: THEME_PRIMARY }}>{selectedMessage.email}</a>
              </div>
              {selectedMessage.phone && (
                <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px' }}>
                  📞 <a href={`tel:${selectedMessage.phone}`} style={{ color: '#374151' }}>{selectedMessage.phone}</a>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Date & Time</span>
              <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px' }}>
                {new Date(selectedMessage.createdAt).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>Message</span>
              <div style={{ fontSize: '14px', color: '#1F2937', marginTop: '6px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {selectedMessage.comment}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
              <a
                href={`mailto:${selectedMessage.email}?subject=RE: Inquiry at Elora Jewellery&body=Hi ${selectedMessage.name},%0A%0AThank you for reaching out to Elora Jewellery.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleUpdateStatus(selectedMessage._id, 'Replied')}
                style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: THEME_PRIMARY, color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px' }}
              >
                ✉ Reply via Email
              </a>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {selectedMessage.status !== 'Read' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage._id, 'Read')}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Mark Read
                  </button>
                )}
                {selectedMessage.status !== 'Unread' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage._id, 'Unread')}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                  >
                    Mark Unread
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedMessage._id)}
                  style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactMessagesPage;
