import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';

const OrderManagement = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    paymentStatus: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams(filters).toString();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, note = '') => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchOrders(); // Refresh orders list
        if (showOrderDetails) {
          fetchOrderDetails(orderId); // Refresh details if modal is open
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkUpdateStatus = async () => {
    if (!bulkAction || selectedOrders.length === 0) {
      alert('Please select orders and action');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/bulk/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          orderIds: selectedOrders, 
          status: bulkAction 
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedOrders([]);
        setBulkAction('');
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to bulk update orders');
      }
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      alert('Error bulk updating orders');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
        setShowOrderDetails(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      declined: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Management</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            {Object.entries(stats).map(([status, data]) => (
              <div key={status} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-500 capitalize">{status}</div>
                <div className="text-2xl font-bold text-gray-900">{data.count || 0}</div>
                <div className="text-xs text-gray-600">{formatCurrency(data.totalValue || 0)}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search orders, customers..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
            />
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined</option>
            </select>

            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.paymentStatus}
              onChange={(e) => setFilters({...filters, paymentStatus: e.target.value, page: 1})}
            >
              <option value="all">All Payment Status</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-4">
              <span className="text-blue-700 font-medium">
                {selectedOrders.length} order(s) selected
              </span>
              <select
                className="px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Select Action</option>
                <option value="accepted">Accept All</option>
                <option value="declined">Decline All</option>
                <option value="processing">Process All</option>
                <option value="cancelled">Cancel All</option>
              </select>
              <button
                onClick={bulkUpdateStatus}
                disabled={!bulkAction || isProcessing}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Apply'}
              </button>
              <button
                onClick={() => setSelectedOrders([])}
                className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === orders.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders(orders.map(order => order._id));
                            } else {
                              setSelectedOrders([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders([...selectedOrders, order._id]);
                              } else {
                                setSelectedOrders(selectedOrders.filter(id => id !== order._id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerDetails.name}
                          </div>
                          <div className="text-sm text-gray-500">{order.customerDetails.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.products.length} item(s)
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.products.slice(0, 2).map(p => p.name).join(', ')}
                            {order.products.length > 2 && ` +${order.products.length - 2} more`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.pricing.total)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.paymentStatus}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => fetchOrderDetails(order._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          
                          {order.orderStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'accepted', 'Order accepted by admin')}
                                disabled={isProcessing}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'declined', 'Order declined by admin')}
                                disabled={isProcessing}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          
                          {order.orderStatus === 'accepted' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'processing', 'Order moved to processing')}
                              disabled={isProcessing}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            >
                              Process
                            </button>
                          )}
                          
                          {order.orderStatus === 'processing' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'shipped', 'Order shipped')}
                              disabled={isProcessing}
                              className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                            >
                              Ship
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalOrders} total orders)
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFilters({...filters, page: filters.page - 1})}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setFilters({...filters, page: filters.page + 1})}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Name:</strong> {selectedOrder.customerDetails.name}</div>
                    <div><strong>Email:</strong> {selectedOrder.customerDetails.email}</div>
                    <div><strong>Phone:</strong> {selectedOrder.customerDetails.phone}</div>
                    {selectedOrder.customerDetails.address && (
                      <div>
                        <strong>Address:</strong> {selectedOrder.customerDetails.address.street}, 
                        {selectedOrder.customerDetails.address.city}, {selectedOrder.customerDetails.address.state} 
                        {selectedOrder.customerDetails.address.zipCode}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Order Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.orderStatus)}`}>
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                    <div><strong>Payment:</strong> {selectedOrder.paymentStatus}</div>
                    <div><strong>Method:</strong> {selectedOrder.paymentMethod}</div>
                    <div><strong>Created:</strong> {formatDate(selectedOrder.createdAt)}</div>
                  </div>
                </div>
              </div>
              
              {/* Products */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Products</h4>
                <div className="space-y-2">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.price)} × {product.quantity}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(product.price * product.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pricing */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedOrder.pricing.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(selectedOrder.pricing.shipping)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.pricing.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              {selectedOrder.orderStatus === 'pending' && (
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'accepted', 'Order accepted by admin')}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'declined', 'Order declined by admin')}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Decline Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrderManagement;
