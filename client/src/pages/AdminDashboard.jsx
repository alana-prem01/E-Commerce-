import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { api } from '../utils/api';
import '../css/AdminDashboard.css';

const COLORS = ['var(--primary-color-hover)', '#D4AF37', '#2563EB', 'var(--danger)', '#7C3AED', '#EA580C'];

const STATUS_COLORS = {
  Pending: '#D97706',
  Processing: '#EA580C',
  Shipped: '#2563EB',
  'Out for Delivery': '#7C3AED',
  Delivered: 'var(--success)',
  Cancelled: 'var(--danger)'
};

const DashboardOverview = () => (
  <div className="mb-4">
    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Dashboard Overview</h2>
    <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>Here is the information about all your orders, revenue and products.</p>
  </div>
);

const StatisticsCards = ({ stats }) => (
  <div className="admin-grid-4 mb-4">
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: 'var(--admin-info-bg)', color: 'var(--admin-info)', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>📦</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>{stats?.totalOrders || 0}</div>
        </div>
      </div>
    </div>
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: 'var(--admin-success-bg)', color: 'var(--admin-success)', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>💰</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>₹{stats?.totalRevenue?.toLocaleString('en-IN') || 0}</div>
        </div>
      </div>
    </div>
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: 'var(--admin-warning-bg)', color: 'var(--admin-warning)', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>💎</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Products</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>{stats?.totalProducts || 0}</div>
        </div>
      </div>
    </div>
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: '#F3E8FF', color: '#7E22CE', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>👥</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>{stats?.totalUsers || 0}</div>
        </div>
      </div>
    </div>
  </div>
);

const RecentOrders = ({ orders }) => (
  <div className="admin-card">
    <div className="admin-card-header">
      <h3 className="admin-card-title">Recent Orders</h3>
      <Link to="/orders" className="admin-card-link">View All</Link>
    </div>
    <div className="admin-table-container">
      <table className="admin-table">
        <thead><tr>
          <th>Order ID</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th>
        </tr></thead>
        <tbody>
          {orders && orders.length > 0 ? orders.map((order, i) => (
            <tr key={i}>
              <td>#{order.orderId?.substring(order.orderId.length - 6).toUpperCase() || 'N/A'}</td>
              <td>{order.customer}</td>
              <td>{new Date(order.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
              <td>₹{order.amount?.toLocaleString('en-IN')}</td>
              <td>
                <span className={`admin-badge badge-${order.status?.toLowerCase().replace(' ', '-') || 'pending'}`}>
                  {order.status}
                </span>
              </td>
            </tr>
          )) : (<tr><td colSpan="5" style={{ textAlign: 'center', color: '#9CA3AF' }}>No recent orders</td></tr>)}
        </tbody>
      </table>
    </div>
  </div>
);

const TopSellingProducts = ({ products }) => (
  <div className="admin-card">
    <div className="admin-card-header">
      <h3 className="admin-card-title">Top Selling Products</h3>
      <Link to="/products" className="admin-card-link">View All</Link>
    </div>
    <div className="admin-table-container">
      <table className="admin-table">
        <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
        <tbody>
          {products && products.length > 0 ? products.map((p, i) => (
            <tr key={i}>
              <td>
                <div className="admin-product-cell">
                  <div className="admin-product-thumb">
                    {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />}
                  </div>
                  <span>{p.name}</span>
                </div>
              </td>
              <td>{p.sold}</td>
              <td>₹{p.revenue?.toLocaleString('en-IN')}</td>
            </tr>
          )) : (<tr><td colSpan="3" style={{ textAlign: 'center', color: '#9CA3AF' }}>No data available</td></tr>)}
        </tbody>
      </table>
    </div>
  </div>
);

const LowStockProducts = ({ products }) => (
  <div className="admin-card admin-low-stock-card">
    <div className="admin-card-header">
      <h3 className="admin-card-title">Low Stock Alert</h3>
      <Link to="/products" className="admin-card-link">View All</Link>
    </div>
    <div className="admin-table-container">
      <table className="admin-table">
        <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Status</th></tr></thead>
        <tbody>
          {products && products.length > 0 ? products.map((p, i) => (
            <tr key={i}>
              <td>
                <div className="admin-product-cell">
                  <div className="admin-product-thumb"></div>
                  <span>{p.productName}</span>
                </div>
              </td>
              <td>{p.sku}</td>
              <td><strong style={{ color: p.stock === 0 ? 'var(--danger)' : '#EA580C' }}>{p.stock}</strong></td>
              <td><span className="admin-badge badge-lowstock">{p.stock === 0 ? 'Out of Stock' : 'Low Stock'}</span></td>
            </tr>
          )) : (<tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--success)' }}>✅ All products well stocked</td></tr>)}
        </tbody>
      </table>
    </div>
  </div>
);

// Revenue Chart
const RevenueChart = ({ orders }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.toDateString(),
      revenue: 0,
      orders: 0
    };
  });

  orders?.forEach(order => {
    const orderDate = new Date(order.date).toDateString();
    const dayEntry = last7Days.find(d => d.date === orderDate);
    if (dayEntry) {
      dayEntry.revenue += order.amount || 0;
      dayEntry.orders += 1;
    }
  });

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Revenue — Last 7 Days</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={last7Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary-color-hover)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary-color-hover)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
          <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="var(--primary-color-hover)" strokeWidth={2.5} fill="url(#revenueGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Orders by Status Pie Chart
const OrderStatusChart = ({ orders }) => {
  const statusCounts = {};
  orders?.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const data = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  if (data.length === 0) return (
    <div className="admin-card chart-card">
      <div className="admin-card-header"><h3 className="admin-card-title">Orders by Status</h3></div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#9CA3AF' }}>No order data yet</div>
    </div>
  );

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Orders by Status</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Top Products Bar Chart
const TopProductsChart = ({ products }) => {
  if (!products || products.length === 0) return null;
  const data = products.slice(0, 5).map(p => ({ name: p.name?.length > 15 ? p.name.substring(0, 15) + '…' : p.name, sold: p.sold, revenue: p.revenue }));

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Top Products by Units Sold</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="sold" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    overview: {}, recentOrders: [], topSellingProducts: [], lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        if (response.success) setDashboardData(response.data);
        else setError('Failed to fetch dashboard data');
      } catch (err) {
        setError(err.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--primary-color-hover)' }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: '20px', color: 'var(--danger)' }}>Error: {error}</div>;

  return (
    <>
      <DashboardOverview />
      <StatisticsCards stats={dashboardData.overview} />

      {/* Charts Row */}
      <div className="admin-grid-2 mb-4">
        <RevenueChart orders={dashboardData.recentOrders} />
        <OrderStatusChart orders={dashboardData.recentOrders} />
      </div>

      {dashboardData.topSellingProducts?.length > 0 && (
        <div className="mb-4">
          <TopProductsChart products={dashboardData.topSellingProducts} />
        </div>
      )}

      <div className="admin-grid-2 mb-4">
        <RecentOrders orders={dashboardData.recentOrders} />
        <TopSellingProducts products={dashboardData.topSellingProducts} />
      </div>
      <LowStockProducts products={dashboardData.lowStockProducts} />
    </>
  );
};

export default AdminDashboard;
