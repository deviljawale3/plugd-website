import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pagination, setPagination] = useState({});
  const router = useRouter();

  const categories = ['Electronics', 'Gaming', 'Fashion', 'Home', 'Sports', 'Books', 'Beauty', 'Other'];

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchProducts();
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async (page = 1) => {
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`https://plugd.onrender.com/api/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`https://plugd.onrender.com/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Product deleted successfully');
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  const ProductForm = ({ product, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || '',
      originalPrice: product?.originalPrice || '',
      category: product?.category || 'Electronics',
      brand: product?.brand || '',
      stock: product?.inventory?.stock || 10,
      imageUrl: product?.images?.[0]?.url || '',
      isActive: product?.isActive !== false
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price),
        category: formData.category,
        brand: formData.brand,
        images: formData.imageUrl ? [{
          url: formData.imageUrl,
          alt: formData.name,
          isPrimary: true
        }] : [],
        inventory: {
          stock: parseInt(formData.stock),
          trackInventory: true
        },
        isActive: formData.isActive
      };

      try {
        const token = localStorage.getItem('admin_token');
        const url = product 
          ? `https://plugd.onrender.com/api/admin/products/${product._id}`
          : 'https://plugd.onrender.com/api/admin/products';
        
        const response = await fetch(url, {
          method: product ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        const data = await response.json();
        if (data.success) {
          alert(product ? 'Product updated successfully' : 'Product created successfully');
          onSave();
          onClose();
        } else {
          alert('Failed to save product');
        }
      } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product');
      }
    };

    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={styles.input}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{...styles.input, height: '80px'}}
                required
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Original Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label>Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label>Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                style={styles.input}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                Active Product
              </label>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" style={styles.saveBtn}>
                {product ? 'Update' : 'Create'} Product
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Product Management - Plugd Admin</title>
      </Head>

      <AdminLayout>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>📦 Product Management</h1>
            <button 
              onClick={() => setShowAddForm(true)} 
              style={styles.addBtn}
            >
              + Add Product
            </button>
          </div>

          <div style={styles.filters}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.categorySelect}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading products...</div>
          ) : (
            <>
              <div style={styles.productsGrid}>
                {products.map(product => (
                  <div key={product._id} style={styles.productCard}>
                    <img 
                      src={product.images?.[0]?.url || `https://via.placeholder.com/200x150?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      style={styles.productImage}
                    />
                    
                    <div style={styles.productInfo}>
                      <h3 style={styles.productName}>{product.name}</h3>
                      <p style={styles.productCategory}>{product.category}</p>
                      <p style={styles.productPrice}>${product.price}</p>
                      <p style={styles.productStock}>Stock: {product.inventory?.stock || 0}</p>
                      <p style={styles.productStatus}>
                        Status: {product.isActive ? '✅ Active' : '❌ Inactive'}
                      </p>
                    </div>
                    
                    <div style={styles.productActions}>
                      <button 
                        onClick={() => setEditingProduct(product)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product._id)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div style={styles.pagination}>
                  {Array.from({length: pagination.pages}, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => fetchProducts(page)}
                      style={{
                        ...styles.pageBtn,
                        background: page === pagination.page ? '#4f46e5' : 'white',
                        color: page === pagination.page ? 'white' : '#4f46e5'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {(showAddForm || editingProduct) && (
            <ProductForm
              product={editingProduct}
              onClose={() => {
                setShowAddForm(false);
                setEditingProduct(null);
              }}
              onSave={() => {
                fetchProducts();
              }}
            />
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  addBtn: {
    padding: '10px 20px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px'
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px'
  },
  categorySelect: {
    padding: '12px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    minWidth: '150px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  productCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  productImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  productInfo: {
    padding: '15px'
  },
  productName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 5px 0'
  },
  productCategory: {
    color: '#666',
    margin: '0 0 5px 0'
  },
  productPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#059669',
    margin: '0 0 5px 0'
  },
  productStock: {
    color: '#666',
    margin: '0 0 5px 0'
  },
  productStatus: {
    margin: '0'
  },
  productActions: {
    display: 'flex',
    gap: '10px',
    padding: '15px'
  },
  editBtn: {
    flex: 1,
    padding: '8px',
    background: '#fbbf24',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  deleteBtn: {
    flex: 1,
    padding: '8px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },
  pageBtn: {
    padding: '8px 15px',
    border: '2px solid #4f46e5',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formRow: {
    display: 'flex',
    gap: '15px'
  },
  formGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  input: {
    padding: '12px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  formActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '12px 24px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};
