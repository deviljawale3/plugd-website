import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import Layout from '../../components/Layout';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CheckoutPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  
  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Payment gateway states
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchPaymentMethods();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        toast.error('Order not found');
        router.push('/orders');
      }
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/api/payments/methods');
      if (response.data.success) {
        setPaymentMethods(response.data.methods);
        // Set primary payment method as default
        const primary = response.data.methods.find(m => m.id === 'razorpay');
        if (primary) {
          setSelectedPayment('razorpay');
        } else if (response.data.methods.length > 0) {
          setSelectedPayment(response.data.methods[0].id);
        }
      }
    } catch (error) {
      console.error('Fetch payment methods error:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const handleRazorpayLoad = () => {
    setRazorpayLoaded(true);
  };

  const handleStripeLoad = () => {
    if (window.Stripe) {
      const stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
      setStripeLoaded(true);
    }
  };

  const processPayment = async () => {
    if (!order || !selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);

    try {
      switch (selectedPayment) {
        case 'razorpay':
          await processRazorpayPayment();
          break;
        case 'stripe':
          await processStripePayment();
          break;
        case 'paypal':
          await processPayPalPayment();
          break;
        case 'cod':
          await processCODPayment();
          break;
        default:
          toast.error('Invalid payment method');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const processRazorpayPayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      toast.error('Razorpay is not loaded. Please refresh the page.');
      return;
    }

    try {
      // Create payment order
      const response = await axios.post('/api/payments/create-order', {
        orderId: order._id,
        gateway: 'razorpay',
        amount: order.pricing.total,
        currency: 'INR'
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      const { orderId: razorpayOrderId, amount, currency } = response.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Your Store',
        description: `Order #${order.orderNumber}`,
        image: '/images/logo.png',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/api/payments/verify', {
              gateway: 'razorpay',
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              router.push(`/payment/success?orderId=${order._id}&paymentId=${response.razorpay_payment_id}`);
            } else {
              throw new Error(verifyResponse.data.error);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
            router.push(`/payment/failed?orderId=${order._id}`);
          }
        },
        prefill: {
          name: order.customerInfo.name,
          email: order.customerInfo.email,
          contact: order.customerInfo.phone
        },
        notes: {
          order_id: order._id,
          order_number: order.orderNumber
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment was cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    }
  };

  const processStripePayment = async () => {
    if (!stripeLoaded || !stripe) {
      toast.error('Stripe is not loaded. Please refresh the page.');
      return;
    }

    try {
      // Create payment intent
      const response = await axios.post('/api/payments/create-order', {
        orderId: order._id,
        gateway: 'stripe',
        amount: order.pricing.total,
        currency: 'USD'
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      const { clientSecret } = response.data;

      // Redirect to Stripe Checkout or use Elements
      const result = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?orderId=${order._id}`,
        },
      });

      if (result.error) {
        toast.error(result.error.message);
        router.push(`/payment/failed?orderId=${order._id}`);
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    }
  };

  const processPayPalPayment = async () => {
    try {
      // Create PayPal order
      const response = await axios.post('/api/payments/create-order', {
        orderId: order._id,
        gateway: 'paypal',
        amount: order.pricing.total,
        currency: 'USD',
        items: order.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      const { approvalUrl } = response.data;
      
      // Redirect to PayPal
      window.location.href = approvalUrl;
    } catch (error) {
      console.error('PayPal payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    }
  };

  const processCODPayment = async () => {
    try {
      // Process COD order
      const response = await axios.post('/api/payments/create-order', {
        orderId: order._id,
        gateway: 'cod',
        amount: order.pricing.total,
        currency: 'INR'
      });

      if (response.data.success) {
        // Verify COD payment (which just marks it as pending)
        const verifyResponse = await axios.post('/api/payments/verify', {
          gateway: 'cod',
          orderId: order._id,
          orderId: response.data.orderId
        });

        if (verifyResponse.data.success) {
          toast.success('Order placed successfully! You can pay when the order is delivered.');
          router.push(`/payment/success?orderId=${order._id}&method=cod`);
        } else {
          throw new Error(verifyResponse.data.error);
        }
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('COD order error:', error);
      toast.error(error.message || 'Failed to place order');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h1>
            <button
              onClick={() => router.push('/orders')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Orders
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - Order #{order.orderNumber}</title>
        <meta name="description" content="Complete your payment" />
      </Head>
      
      {/* Load payment gateway scripts */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={handleRazorpayLoad}
      />
      <Script
        src="https://js.stripe.com/v3/"
        onLoad={handleStripeLoad}
      />
      
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-blue-600 text-white px-6 py-4">
                <h1 className="text-2xl font-bold">Checkout</h1>
                <p className="text-blue-100">Order #{order.orderNumber}</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                {/* Order Summary */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  
                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 border-b pb-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-gray-600">Qty: {item.quantity}</p>
                          {item.variant && (
                            <p className="text-sm text-gray-500">
                              {item.variant.size && `Size: ${item.variant.size}`}
                              {item.variant.color && ` | Color: ${item.variant.color}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{item.subtotal}</p>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pricing */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{order.pricing.subtotal}</span>
                    </div>
                    {order.pricing.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₹{order.pricing.tax}</span>
                      </div>
                    )}
                    {order.pricing.shipping > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>₹{order.pricing.shipping}</span>
                      </div>
                    )}
                    {order.pricing.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₹{order.pricing.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{order.pricing.total}</span>
                    </div>
                  </div>
                  
                  {/* Shipping Address */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="text-gray-600 text-sm">
                      <p>{order.shipping.address.name}</p>
                      <p>{order.shipping.address.street}</p>
                      <p>{order.shipping.address.city}, {order.shipping.address.state} {order.shipping.address.zipCode}</p>
                      <p>{order.shipping.address.country}</p>
                      <p>Phone: {order.shipping.address.phone}</p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPayment === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPayment(method.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={selectedPayment === method.id}
                            onChange={() => setSelectedPayment(method.id)}
                            className="text-blue-600"
                          />
                          {method.logo && (
                            <img
                              src={method.logo}
                              alt={method.name}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <div>
                            <h3 className="font-medium">{method.name}</h3>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Payment Button */}
                  <button
                    onClick={processPayment}
                    disabled={processingPayment || !selectedPayment}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                      processingPayment || !selectedPayment
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {processingPayment ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      `Pay ₹${order.pricing.total}`
                    )}
                  </button>
                  
                  {/* Security Note */}
                  <div className="mt-4 text-sm text-gray-600 text-center">
                    <p>🔒 Your payment information is secure and encrypted</p>
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

export default CheckoutPage;
