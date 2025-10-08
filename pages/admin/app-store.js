import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function AppStore() {
  const [apps, setApps] = useState([]);
  const [installedApps, setInstalledApps] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(null);
  const [uninstalling, setUninstalling] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('marketplace');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configApp, setConfigApp] = useState(null);
  const [config, setConfig] = useState({});
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    await Promise.all([
      fetchApps(),
      fetchInstalledApps(),
      fetchStats()
    ]);
    setLoading(false);
  };

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/marketplace`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setApps(data.apps);
      }
    } catch (error) {
      setError('Failed to fetch apps');
    }
  };

  const fetchInstalledApps = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/installed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstalledApps(data.apps);
      }
    } catch (error) {
      console.error('Failed to fetch installed apps');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleInstall = async (appId) => {
    setInstalling(appId);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/install/${appId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${data.app.displayName} installed successfully!`);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Installation failed');
      }
    } catch (error) {
      setError('Installation failed. Please try again.');
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (appId, keepProducts = true) => {
    const app = apps.find(a => a._id === appId);
    if (!confirm(`Are you sure you want to uninstall ${app?.displayName}?`)) return;

    setUninstalling(appId);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/uninstall/${appId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ keepProducts })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${app?.displayName} uninstalled successfully!`);
        if (data.productsRemoved > 0) {
          setSuccess(prev => prev + ` ${data.productsRemoved} products were also removed.`);
        }
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Uninstallation failed');
      }
    } catch (error) {
      setError('Uninstallation failed. Please try again.');
    } finally {
      setUninstalling(null);
    }
  };

  const handleToggleStatus = async (appId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/toggle/${appId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      setError('Failed to toggle app status');
    }
  };

  const handleConfigure = (app) => {
    setConfigApp(app);
    setConfig(app.configuration || {});
    setShowConfigModal(true);
  };

  const saveConfiguration = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-store/configure/${configApp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ configuration: config })
      });

      if (response.ok) {
        setSuccess('Configuration saved successfully!');
        setShowConfigModal(false);
        fetchData();
      } else {
        setError('Failed to save configuration');
      }
    } catch (error) {
      setError('Failed to save configuration');
    }
  };

  const getAppStatus = (app) => {
    if (!app.isInstalled) return 'not-installed';
    if (!app.isActive) return 'inactive';
    return 'active';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Inactive</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Not Installed</span>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading App Store...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">App Store</h1>
          <div className="text-sm text-gray-500">
            Manage your e-commerce platform integrations
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Apps</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalApps || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Installed</div>
            <div className="text-2xl font-bold text-green-600">{stats.installedApps || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-blue-600">{stats.activeApps || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Available</div>
            <div className="text-2xl font-bold text-orange-600">{stats.availableApps || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏪 Marketplace ({apps.length})
            </button>
            <button
              onClick={() => setActiveTab('installed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'installed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ⚙️ Installed Apps ({installedApps.length})
            </button>
          </nav>
        </div>

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => {
              const status = getAppStatus(app);
              return (
                <div key={app._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{app.icon}</div>
                    {getStatusBadge(status)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {app.displayName}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {app.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>v{app.version}</span>
                    <span>{app.platform.toUpperCase()}</span>
                  </div>

                  {app.stats && app.isInstalled && (
                    <div className="bg-gray-50 rounded p-3 mb-4 text-xs">
                      <div className="flex justify-between">
                        <span>Products: {app.stats.productsCount || 0}</span>
                        <span>Imports: {app.stats.totalImports || 0}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    {!app.isInstalled ? (
                      <button
                        onClick={() => handleInstall(app._id)}
                        disabled={installing === app._id}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {installing === app._id ? 'Installing...' : 'Install'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleStatus(app._id)}
                          className={`flex-1 py-2 px-4 rounded text-sm ${
                            app.isActive 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {app.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleConfigure(app)}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 text-sm"
                        >
                          Configure
                        </button>
                        <button
                          onClick={() => handleUninstall(app._id)}
                          disabled={uninstalling === app._id}
                          className="flex-1 bg-red-100 text-red-800 py-2 px-4 rounded hover:bg-red-200 disabled:opacity-50 text-sm"
                        >
                          {uninstalling === app._id ? 'Removing...' : 'Uninstall'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Installed Apps Tab */}
        {activeTab === 'installed' && (
          <div className="bg-white rounded-lg shadow">
            {installedApps.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Apps Installed</h3>
                <p className="text-gray-500 mb-4">Install apps from the marketplace to get started</p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        App
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {installedApps.map((app) => (
                      <tr key={app._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{app.icon}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {app.displayName}
                              </div>
                              <div className="text-sm text-gray-500">
                                v{app.version} • {app.platform}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(getAppStatus(app))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {app.stats?.productsCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.stats?.lastUsed 
                            ? new Date(app.stats.lastUsed).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleConfigure(app)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Configure
                          </button>
                          <button
                            onClick={() => handleToggleStatus(app._id)}
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                          >
                            {app.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleUninstall(app._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Uninstall
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Configuration Modal */}
        {showConfigModal && configApp && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Configure {configApp.displayName}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Enter API Key"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={config.apiSecret || ''}
                    onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Enter API Secret"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={config.region || ''}
                    onChange={(e) => setConfig({...config, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Region</option>
                    <option value="us">United States</option>
                    <option value="eu">Europe</option>
                    <option value="asia">Asia</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-gray-500 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveConfiguration}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
