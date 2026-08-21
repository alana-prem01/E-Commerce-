import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../utils/api';
import '../css/AdminDashboard.css';

const THEME_PRIMARY = '#046a5a';
const COLORS = ['#046a5a', '#D4AF37', '#2563EB', '#DC2626', '#7C3AED', '#EA580C', '#059669'];

const STATUS_COLORS = {
  Pending: '#D97706',
  Processing: '#EA580C',
  Shipped: '#2563EB',
  'Out for Delivery': '#7C3AED',
  Delivered: '#16A34A',
  Cancelled: '#DC2626'
};

const DashboardOverview = () => (
  <div className="mb-4">
    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-main)', margin: '0 0 8px 0' }}>Dashboard Overview</h2>
    <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.95rem' }}>Here is the information about all your orders, revenue and products.</p>
  </div>
);

const StatisticsCards = ({ stats, loading }) => (
  <div className="admin-grid-4 mb-4">
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: 'var(--admin-info-bg)', color: 'var(--admin-info)', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>📦</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
            {loading ? '...' : (stats?.totalOrders ?? 0)}
          </div>
        </div>
      </div>
    </div>
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: 'var(--admin-success-bg)', color: 'var(--admin-success)', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>💰</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
            {loading ? '...' : `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>
    </div>
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: 'var(--admin-warning-bg)', color: 'var(--admin-warning)', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>💎</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Products</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
            {loading ? '...' : (stats?.totalProducts ?? 0)}
          </div>
        </div>
      </div>
    </div>
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div className="d-flex align-items-center gap-3">
        <div style={{ background: '#F3E8FF', color: '#7E22CE', padding: '12px', borderRadius: '8px', fontSize: '24px' }}>👥</div>
        <div>
          <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>Total Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text-main)' }}>
            {loading ? '...' : (stats?.totalUsers ?? 0)}
          </div>
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
          {orders && orders.length > 0 ? orders.map((order, i) => {
            const displayId = order.orderId ? `#${order.orderId.substring(order.orderId.length - 6).toUpperCase()}` : 'N/A';
            const dateStr = order.date ? new Date(order.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
            const statusClass = order.status ? order.status.toLowerCase().replace(/\s+/g, '-') : 'pending';

            return (
              <tr key={order.orderId || i}>
                <td>{displayId}</td>
                <td>{order.customer}</td>
                <td>{dateStr}</td>
                <td>₹{(order.amount || 0).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`admin-badge badge-${statusClass}`}>
                    {order.status || 'Pending'}
                  </span>
                </td>
              </tr>
            );
          }) : (
            <tr><td colSpan="5" style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>No recent orders</td></tr>
          )}
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
            <tr key={p.productId || i}>
              <td>
                <div className="admin-product-cell">
                  <div className="admin-product-thumb">
                    {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />}
                  </div>
                  <span>{p.name}</span>
                </div>
              </td>
              <td>{p.sold}</td>
              <td>₹{(p.revenue || 0).toLocaleString('en-IN')}</td>
            </tr>
          )) : (
            <tr><td colSpan="3" style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>No data available</td></tr>
          )}
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
            <tr key={p.productId || i}>
              <td>
                <div className="admin-product-cell">
                  <div className="admin-product-thumb"></div>
                  <span>{p.productName}</span>
                </div>
              </td>
              <td>{p.sku}</td>
              <td><strong style={{ color: p.stock === 0 ? 'var(--danger)' : '#EA580C' }}>{p.stock}</strong></td>
              <td><span className="admin-badge badge-lowstock">{p.status}</span></td>
            </tr>
          )) : (
            <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--success)', padding: '24px' }}>✅ All products well stocked</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// 2. Revenue — Last 7 Days Graph
const RevenueChart = ({ data = [] }) => {
  const chartData = data && data.length > 0 ? data : [
    { date: 'Day 1', revenue: 0 },
    { date: 'Day 2', revenue: 0 },
    { date: 'Day 3', revenue: 0 },
    { date: 'Day 4', revenue: 0 },
    { date: 'Day 5', revenue: 0 },
    { date: 'Day 6', revenue: 0 },
    { date: 'Day 7', revenue: 0 }
  ];

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Revenue — Last 7 Days</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={THEME_PRIMARY} stopOpacity={0.35} />
              <stop offset="95%" stopColor={THEME_PRIMARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
          />
          <Tooltip
            formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={THEME_PRIMARY}
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. Orders by Status Pie Chart
const OrderStatusChart = ({ data = [], totalOrders = 0 }) => {
  const chartData = (data || []).filter(item => item.count > 0);

  if (chartData.length === 0 || totalOrders === 0) {
    return (
      <div className="admin-card chart-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Orders by Status</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#9CA3AF', fontSize: '14px' }}>
          No order data yet
        </div>
      </div>
    );
  }

  const effectiveTotal = totalOrders || chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Orders by Status</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={75}
            dataKey="count"
            nameKey="status"
            label={({ status, count }) => {
              const pct = effectiveTotal > 0 ? ((count / effectiveTotal) * 100).toFixed(0) : 0;
              return `${status} ${pct}%`;
            }}
            labelLine={false}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={STATUS_COLORS[entry.status] || COLORS[i % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} order${value > 1 ? 's' : ''} (${((value / effectiveTotal) * 100).toFixed(1)}%)`,
              name
            ]}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. Top Categories by Units Sold Bar Chart
const TopCategoriesChart = ({ categories = [] }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="admin-card chart-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Top Categories by Units Sold</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#9CA3AF', fontSize: '14px' }}>
          No category sales data yet
        </div>
      </div>
    );
  }

  const data = categories.slice(0, 5).map(c => ({
    name: c.category || 'General',
    unitsSold: c.unitsSold || 0
  }));

  return (
    <div className="admin-card chart-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Top Categories by Units Sold</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
          <Tooltip
            formatter={(val) => [`${val} unit${val > 1 ? 's' : ''} sold`, 'Units Sold']}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="unitsSold" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    revenueLast7Days: [],
    ordersByStatus: [],
    topCategories: [],
    recentOrders: [],
    topSellingProducts: [],
    lowStockProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/dashboard');
        if (response.success && response.data) {
          setDashboardData(response.data);
        } else {
          setError(response.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error loading Admin Dashboard:', err);
        setError(err.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: THEME_PRIMARY, fontSize: '16px', fontWeight: 500 }}>
        Loading Dashboard Statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ color: 'var(--danger)', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
          Failed to load dashboard statistics
        </div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', marginBottom: '20px' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px',
            backgroundColor: THEME_PRIMARY,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <DashboardOverview />
      <StatisticsCards stats={dashboardData.overview} loading={loading} />

      {/* Charts Row: Revenue (Last 7 Days) & Orders by Status */}
      <div className="admin-grid-2 mb-4">
        <RevenueChart data={dashboardData.revenueLast7Days} />
        <OrderStatusChart
          data={dashboardData.ordersByStatus}
          totalOrders={dashboardData.overview?.totalOrders || 0}
        />
      </div>

      {/* Top Categories by Units Sold Chart */}
      <div className="mb-4">
        <TopCategoriesChart categories={dashboardData.topCategories} />
      </div>

      {/* Data Tables Row: Recent Orders & Top Selling Products */}
      <div className="admin-grid-2 mb-4">
        <RecentOrders orders={dashboardData.recentOrders} />
        <TopSellingProducts products={dashboardData.topSellingProducts} />
      </div>

      {/* Low Stock Alert Table */}
      <LowStockProducts products={dashboardData.lowStockProducts} />
    </>
  );
};

export default AdminDashboard;
