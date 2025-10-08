import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (!token || !adminData) {
      router.push('/admin/login');
      return;
    }
    
    setAdmin(JSON.parse(adminData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    router.push('/admin/login');
  };

  if (!admin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">Plugd Admin</h2>
          <p className="text-sm text-gray-600">{admin.name}</p>
        </div>
        
        <nav className="mt-4">
          <Link 
            href="/admin/dashboard"
            className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              router.pathname === '/admin/dashboard' ? 'bg-gray-100 border-r-4 border-blue-500' : ''
            }`}
          >
            📊 Dashboard
          </Link>
          <Link 
            href="/admin/products"
            className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              router.pathname === '/admin/products' ? 'bg-gray-100 border-r-4 border-blue-500' : ''
            }`}
          >
            📦 Products
          </Link>
          <Link 
            href="/admin/users"
            className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              router.pathname === '/admin/users' ? 'bg-gray-100 border-r-4 border-blue-500' : ''
            }`}
          >
            👥 Users
          </Link>
          <Link 
            href="/admin/app-store"
            className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              router.pathname === '/admin/app-store' ? 'bg-gray-100 border-r-4 border-blue-500' : ''
            }`}
          >
            🏪 App Store
          </Link>
          <Link 
            href="/admin/shop-apps"
            className={`block px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              router.pathname === '/admin/shop-apps' ? 'bg-gray-100 border-r-4 border-blue-500' : ''
            }`}
          >
            🛍️ Import Products
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
