import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');

    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  if (!user) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <h2>🔌 PLUGD Admin</h2>
        </div>
        
        <nav style={styles.nav}>
          <Link href="/admin/dashboard" style={styles.navLink}>
            📊 Dashboard
          </Link>
          <Link href="/admin/products" style={styles.navLink}>
            📦 Products
          </Link>
          <Link href="/admin/users" style={styles.navLink}>
            👥 Users
          </Link>
          <Link href="/admin/shop-apps" style={styles.navLink}>
            🛍️ Shop Apps
          </Link>
        </nav>

        <div style={styles.userInfo}>
          <p style={styles.userName}>{user.username}</p>
          <p style={styles.userRole}>{user.role}</p>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <Link href="/" style={styles.viewSite}>
            🌐 View Site
          </Link>
        </header>
        
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f3f4f6'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px'
  },
  sidebar: {
    width: '250px',
    background: '#1f2937',
    color: 'white',
    display: 'flex',
    flexDirection: 'column'
  },
  logo: {
    padding: '20px',
    borderBottom: '1px solid #374151',
    textAlign: 'center'
  },
  nav: {
    flex: 1,
    padding: '20px 0'
  },
  navLink: {
    display: 'block',
    padding: '12px 20px',
    color: '#d1d5db',
    textDecoration: 'none',
    transition: 'background-color 0.2s'
  },
  userInfo: {
    padding: '20px',
    borderTop: '1px solid #374151'
  },
  userName: {
    margin: '0 0 5px 0',
    fontWeight: 'bold'
  },
  userRole: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#9ca3af'
  },
  logoutBtn: {
    width: '100%',
    padding: '8px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    background: 'white',
    padding: '15px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  viewSite: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '500'
  },
  content: {
    flex: 1,
    padding: '0',
    overflow: 'auto'
  }
};
