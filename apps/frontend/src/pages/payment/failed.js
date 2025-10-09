import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PaymentFailedPage = () => {
  const router = useRouter();
  const { orderId, error, reason } = router.query;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
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

  const handleRetryPayment = () => {
    if (order) {
      setRetrying(true);
      router.push(`/payment/checkout?orderId=${order._id}`);
    }
  };

  const getErrorMessage = () => {
    if (reason) {
      return decodeURIComponent(reason);
    }
    if (error) {
      return decodeURIComponent(error);
    }
    return 'Payment could not be processed. Please try again.';
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Failed - Order #{order?.orderNumber}</title>
        <meta name="description" content="Payment failed" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-lg overflow-hidden">
              {/* Error Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-8 text-center">
                <div className="mb-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
                  <p className="text-red-100 text-lg">
                    We couldn't process your payment
                  </p>
                </div>
                
                {order && (
                  <div className="bg-white bg-opacity-10 rounded-lg p-4 inline-block">
                    <p className="text-sm text-red-100 mb-1">Order Number</p>
                    <p className="text-xl font-bold">#{order.orderNumber}</p>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                {/* Error Details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-red-800 font-semibold mb-2">What went wrong?</h3>
                      <p className="text-red-700 text-sm">{getErrorMessage()}</p>
                    </div>
                  </div>
                </div>
                
                {order && (
                  <>
                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Order Details
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
                            <span className="text-gray-600">Order Status:</span>
                            <span className="font-medium capitalize text-blue-600">{order.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold text-lg">₹{order.pricing.total}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Payment Status
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium">{getPaymentMethodName(order.payment.gateway)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className="font-medium text-red-600">Failed</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attempted Amount:</span>
                            <span className="font-medium">₹{order.pricing.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Failed At:</span>
                            <span className="font-medium">{new Date().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Common Issues and Solutions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-blue-800 mb-3">Common reasons for payment failure:</h3>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Insufficient funds in your account</li>
                        <li>• Incorrect card details or expired card</li>
                        <li>• Network connectivity issues</li>
                        <li>• Bank security restrictions</li>
                        <li>• Payment gateway temporary issues</li>
                      </ul>
                    </div>
                    
                    {/* Suggested Actions */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold text-green-800 mb-3">What you can do:</h3>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Check your account balance and try again</li>
                        <li>• Verify your card details are correct</li>
                        <li>• Try a different payment method</li>
                        <li>• Contact your bank if the issue persists</li>
                        <li>• Use a different card or payment option</li>
                      </ul>
                    </div>
                  </>
                )}
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {order && (
                    <button
                      onClick={handleRetryPayment}
                      disabled={retrying}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                        retrying
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {retrying ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Redirecting...</span>
                        </div>
                      ) : (
                        'Try Again'
                      )}
                    </button>
                  )}
                  
                  <Link href="/">
                    <a className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center">
                      Continue Shopping
                    </a>
                  </Link>
                  
                  <Link href="/contact">
                    <a className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-medium hover:bg-blue-200 transition-colors text-center">
                      Contact Support
                    </a>
                  </Link>
                </div>
                
                {/* Help Section */}
                <div className="mt-8 text-center">
                  <h3 className="font-semibold text-gray-800 mb-2">Need help?</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    If you continue to experience issues, please contact our support team.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                    <a href="mailto:support@yourstore.com" className="text-blue-600 hover:text-blue-800">
                      📧 support@yourstore.com
                    </a>
                    <a href="tel:+1234567890" className="text-blue-600 hover:text-blue-800">
                      📞 +1 (234) 567-890
                    </a>
                    <Link href="/help">
                      <a className="text-blue-600 hover:text-blue-800">❓ Help Center</a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PaymentFailedPage;
