// Frontend-Backend Integration Setup
const axios = require('axios');
const cors = require('cors');

// API Client Configuration
class APIClient {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.client = axios.create({
            baseURL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response.data,
            (error) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error.response?.data || error.message);
            }
        );
    }
    
    // Auth methods
    async login(email, password) {
        const response = await this.client.post('/auth/login', { email, password });
        if (response.token) {
            localStorage.setItem('token', response.token);
        }
        return response;
    }
    
    async register(userData) {
        return await this.client.post('/auth/register', userData);
    }
    
    async logout() {
        await this.client.post('/auth/logout');
        localStorage.removeItem('token');
    }
    
    // Product methods
    async getProducts(params = {}) {
        return await this.client.get('/products', { params });
    }
    
    async getProduct(id) {
        return await this.client.get(`/products/${id}`);
    }
    
    async searchProducts(query, filters = {}) {
        return await this.client.get('/products/search', {
            params: { q: query, ...filters }
        });
    }
    
    // Cart methods
    async getCart() {
        return await this.client.get('/cart');
    }
    
    async addToCart(productId, quantity = 1) {
        return await this.client.post('/cart', { productId, quantity });
    }
    
    async updateCart(productId, quantity) {
        return await this.client.put(`/cart/${productId}`, { quantity });
    }
    
    async removeFromCart(productId) {
        return await this.client.delete(`/cart/${productId}`);
    }
    
    // Order methods
    async createOrder(orderData) {
        return await this.client.post('/orders', orderData);
    }
    
    async getOrders() {
        return await this.client.get('/orders');
    }
    
    async getOrder(id) {
        return await this.client.get(`/orders/${id}`);
    }
    
    // Payment methods
    async processPayment(paymentData) {
        return await this.client.post('/payments/process', paymentData);
    }
    
    async verifyPayment(paymentId, signature) {
        return await this.client.post('/payments/verify', { paymentId, signature });
    }
    
    // User methods
    async getProfile() {
        return await this.client.get('/users/profile');
    }
    
    async updateProfile(profileData) {
        return await this.client.put('/users/profile', profileData);
    }
}

// Export API client instance
if (typeof window !== 'undefined') {
    window.APIClient = new APIClient();
}

module.exports = APIClient;

console.log('✅ Frontend-Backend Integration configured!');
