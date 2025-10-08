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
