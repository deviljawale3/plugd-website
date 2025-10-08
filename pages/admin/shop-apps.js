import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

export default function ShopApps() {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [categorizing, setCategorizing] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [selectedForCategory, setSelectedForCategory] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchPlatforms();
    fetchImportHistory();
  }, [router]);

  const fetchPlatforms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shop-apps/platforms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.platforms);
        if (data.platforms.length > 0) {
          setSelectedPlatform(data.platforms[0].id);
        }
      } else {
        setError('No apps installed. Please install apps from the App Store first.');
      }
    } catch (error) {
      setError('Failed to load platforms. Check your connection.');
    }
  };

  const fetchImportHistory = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const importedProducts = data.products.filter(p => p.source && p.source !== 'manual');
        setImportHistory(importedProducts);
      }
    } catch (error) {
      console.error('Failed to fetch import history');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !selectedPlatform) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shop-apps/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          query: searchQuery,
          limit: 20
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products);
        setSelectedProducts([]);
      } else {
        const data = await response.json();
        setError(data.error || 'Search failed. Please try again.');
      }
    } catch (error) {
      setError('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.find(p => p.external_id === product.external_id);
      if (isSelected) {
        return prev.filter(p => p.external_id !== product.external_id);
      } else {
        return [...prev, product];
      }
    });
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === searchResults.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts([...searchResults]);
    }
  };

  const handleImport = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select at least one product to import');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shop-apps/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          products: selectedProducts
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Successfully imported ${data.imported} products!`);
        setSelectedProducts([]);
        setSearchResults([]);
        setSearchQuery('');
        fetchImportHistory();
        setActiveTab('history');
      } else {
        const data = await response.json();
        setError(data.error || 'Import failed');
      }
    } catch (error) {
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleBulkCategorize = async () => {
    if (selectedForCategory.length === 0 || !newCategory.trim()) {
      setError('Please select products and enter a category name');
      return;
    }

    setCategorizing(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shop-apps/categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productIds: selectedForCategory,
          newCategory: newCategory.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setSelectedForCategory([]);
        setNewCategory('');
        fetchImportHistory();
      } else {
        setError('Categorization failed');
      }
    } catch (error) {
      setError('Categorization failed');
    } finally {
      setCategorizing(false);
    }
  };

  const toggleCategorySelection = (productId) => {
    setSelectedForCategory(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const getPlatformIcon = (platformId) => {
    const icons = {
      amazon: '🛒',
      ebay: '🏪',
      aliexpress: '🏬',
      shopify: '🛍️',
      etsy: '🎨',
      walmart: '🏪'
    };
    return icons[platformId] || '📦';
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : price;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Product Import Center</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Import products from installed apps
            </div>
            {platforms.length === 0 && (
              <button
                onClick={() => router.push('/admin/app-store')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Install Apps
              </button>
            )}
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

        {platforms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Apps Installed</h3>
            <p className="text-gray-500 mb-4">
              Install e-commerce platform apps to start importing products
            </p>
            <button
              onClick={() => router.push('/admin/app-store')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Browse App Store
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'search'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🔍 Product Search
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📋 Import History ({importHistory.length})
                </button>
                <button
                  onClick={() => setActiveTab('categorize')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'categorize'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏷️ Bulk Categorize
                </button>
              </nav>
            </div>

            {activeTab === 'search' && (
              <div>
                {/* Search Form */}
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform
                        </label>
                        <select
                          value={selectedPlatform}
                          onChange={(e) => setSelectedPlatform(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {platforms.map(platform => (
                            <option key={platform.id} value={platform.id}>
                              {getPlatformIcon(platform.id)} {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Query
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter product keywords..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={loading || !searchQuery.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? 'Searching...' : 'Search'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Search Results ({searchResults.length})
                      </h3>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={selectAllProducts}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedProducts.length === searchResults.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedProducts.length > 0 && (
                          <button
                            onClick={handleImport}
                            disabled={importing}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {importing ? 'Importing...' : `Import Selected (${selectedProducts.length})`}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((product) => {
                        const isSelected = selectedProducts.find(p => p.external_id === product.external_id);
                        return (
                          <div
                            key={product.external_id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleProductSelection(product)}
                          >
                            <div className="flex items-center mb-3">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => toggleProductSelection(product)}
                                className="mr-3"
                              />
                              <span className="text-xs text-gray-500">
                                {getPlatformIcon(selectedPlatform)} {selectedPlatform.toUpperCase()}
                              </span>
                            </div>
                            
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded mb-3"
                              loading="lazy"
                            />
                            
                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {product.name}
                            </h4>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-green-600">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Import History</h3>
                  
                  {importHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">📦</div>
                      <p className="text-gray-500">No products imported yet</p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                      >
                        Start importing products →
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Source
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Imported
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importHistory.map((product) => (
                            <tr key={product._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img 
                                    className="h-10 w-10 rounded object-cover" 
                                    src={product.image} 
                                    alt={product.name}
                                  />
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      SKU: {product.inventory?.sku || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {getPlatformIcon(product.source)} {product.source?.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{product.category}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${product.price}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(product.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'categorize' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Categorize Products</h3>
                
                {importHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">🏷️</div>
                    <p className="text-gray-500">No imported products to categorize</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter new category name..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleBulkCategorize}
                          disabled={categorizing || selectedForCategory.length === 0 || !newCategory.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {categorizing ? 'Categorizing...' : `Categorize Selected (${selectedForCategory.length})`}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {importHistory.map((product) => {
                        const isSelected = selectedForCategory.includes(product._id);
                        return (
                          <div
                            key={product._id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleCategorySelection(product._id)}
                          >
                            <div className="flex items-center mb-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCategorySelection(product._id)}
                                className="mr-3"
                              />
                              <span className="text-xs text-gray-500">
                                {getPlatformIcon(product.source)} {product.source?.toUpperCase()}
                              </span>
                            </div>
                            
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-24 object-cover rounded mb-3"
                            />
                            
                            <h4 className="font-medium text-gray-900 mb-1 text-sm line-clamp-2">
                              {product.name}
                            </h4>
                            
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Current: {product.category}</span>
                              <span className="font-bold text-green-600">${product.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Total Imported</div>
                <div className="text-2xl font-bold text-blue-600">{importHistory.length}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Amazon Products</div>
                <div className="text-2xl font-bold text-orange-600">
                  {importHistory.filter(p => p.source === 'amazon').length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">eBay Products</div>
                <div className="text-2xl font-bold text-purple-600">
                  {importHistory.filter(p => p.source === 'ebay').length}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Other Platforms</div>
                <div className="text-2xl font-bold text-green-600">
                  {importHistory.filter(p => !['amazon', 'ebay'].includes(p.source)).length}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
