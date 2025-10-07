import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('https://plugd.onrender.com/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={styles.loading}>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Plugd</title>
      </Head>

      <AdminLayout>
        <div style={styles.container}>
          <h1 style={styles.title}>📊 Dashboard</h1>
          
          {stats && (
            <>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>👥 Total Users</h3>
                  <p style={styles.statNumber}>{stats.totalUsers}</p>
                </div>
                
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>📦 Total Products</h3>
                  <p style={styles.statNumber}>{stats.totalProducts}</p>
                </div>
                
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>✅ Active Products</h3>
                  <p style={styles.statNumber}>{stats.activeProducts}</p>
                </div>
                
                <div style={styles.statCard}>
                  <h3 style={styles.statTitle}>🛒 Total Orders</h3>
                  <p style={styles.statNumber}>{stats.totalOrders}</p>
                </div>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent Users</h2>
                <div style={styles.table}>
                  {stats.recentUsers?.map(user => (
                    <div key={user._id} style={styles.tableRow}>
                      <span style={styles.username}>{user.username}</span>
                      <span style={styles.email}>{user.email}</span>
                      <span style={styles.role}>{user.role}</span>
                      <span style={styles.date}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent Products</h2>
                <div style={styles.table}>
                  {stats.recentProducts?.map(product => (
                    <div key={product._id} style={styles.tableRow}>
                      <span style={styles.productName}>{product.name}</span>
                      <span style={styles.price}>${product.price}</span>
                      <span style={styles.category}>{product.category}</span>
                      <span style={styles.date}>
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statTitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px'
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#4f46e5',
    margin: 0
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '15px'
  },
  table: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 1fr 1fr',
    padding: '15px 20px',
    borderBottom: '1px solid #e5e7eb',
    alignItems: 'center'
  },
  username: {
    fontWeight: '500',
    color: '#333'
  },
  email: {
    color: '#666'
  },
  role: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    background: '#e0e7ff',
    color: '#3730a3',
    textAlign: 'center'
  },
  productName: {
    fontWeight: '500',
    color: '#333'
  },
  price: {
    fontWeight: 'bold',
    color: '#059669'
  },
  category: {
    color: '#666'
  },
  date: {
    fontSize: '14px',
    color: '#888'
  }
};
