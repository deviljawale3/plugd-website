import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PaymentSuccessPage = () => {
  const router = useRouter();
  const { orderId, paymentId, method } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confettiVisible, setConfettiVisible] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      // Hide confetti after 3 seconds
      setTimeout(() => setConfettiVisible(false), 3000);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        toast.error('Order not found');
      }
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodName = (gateway) => {
    const methods = {
      razorpay: 'Razorpay',
      stripe: 'Stripe',
      paypal: 'PayPal',
      cod: 'Cash on Delivery'
    };
    return methods[gateway] || gateway;
  };

  const getEstimatedDelivery = () => {
    if (order?.shipping?.estimatedDelivery) {
      return new Date(order.shipping.estimatedDelivery).toLocaleDateString();
    }
    
    // Default estimation: 3-7 business days
    const today = new Date();
    const estimatedMin = new Date(today);
    estimatedMin.setDate(today.getDate() + 3);
    const estimatedMax = new Date(today);
    estimatedMax.setDate(today.getDate() + 7);
    
    return `${estimatedMin.toLocaleDateString()} - ${estimatedMax.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Successful - Order #{order?.orderNumber}</title>
        <meta name="description" content="Your payment was successful" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
          {/* Confetti Effect */}
          {confettiVisible && (
            <div className="fixed inset-0 pointer-events-none z-50">
              <div className="confetti">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      backgroundColor: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)]
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-8 text-center">
                <div className="mb-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                  <p className="text-green-100 text-lg">
                    {method === 'cod' 
                      ? 'Your order has been placed successfully'
                      : 'Thank you for your purchase'
                    }
                  </p>
                </div>
                
                {order && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 inline-block">
                    <p className="text-sm text-green-100 mb-1">Order Number</p>
                    <p className="text-xl font-bold">#{order.orderNumber}</p>
                  </div>
                )}
              </div>
              
              {order && (
                <div className="p-6">
                  {/* Payment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Payment Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{getPaymentMethodName(order.payment.gateway)}</span>
                        </div>
                        {paymentId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment ID:</span>
                            <span className="font-mono text-xs">{paymentId}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-semibold text-green-600">₹{order.pricing.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${
                            order.payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {order.payment.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H15a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
                        </svg>
                        Order Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">{order.totalItems} items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium capitalize text-blue-600">{order.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Delivery:</span>
                          <span className="font-medium text-green-600">{getEstimatedDelivery()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Order Items
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 border rounded-lg p-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                            {item.variant && (
                              <p className="text-gray-500 text-xs">
                                {item.variant.size && `Size: ${item.variant.size}`}
                                {item.variant.color && ` | Color: ${item.variant.color}`}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{item.subtotal}</p>
                            <p className="text-gray-600 text-sm">₹{item.price} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Shipping Address */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Shipping Address
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{order.shipping.address.name}</p>
                        <p>{order.shipping.address.street}</p>
                        <p>{order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.zipCode}</p>
                        <p>{order.shipping.address.country}</p>
                        <p className="mt-1">Phone: {order.shipping.address.phone}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Next Steps */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• You'll receive an order confirmation email shortly</li>
                      <li>• We'll notify you when your order is shipped</li>
                      <li>• Track your order status in your account</li>
                      {method === 'cod' && (
                        <li>• Payment will be collected when your order is delivered</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href={`/orders/${order._id}`}>
                      <a className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center">
                        Track Order
                      </a>
                    </Link>
                    <Link href="/">
                      <a className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center">
                        Continue Shopping
                      </a>
                    </Link>
                    <Link href="/orders">
                      <a className="bg-green-100 text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-200 transition-colors text-center">
                        View All Orders
                      </a>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
      
      <style jsx>{`
        .confetti {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};

export default PaymentSuccessPage;
