// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupForms();
        this.setupDataTables();
        this.setupFileUploads();
        this.setupCharts();
        this.loadInitialData();
        this.setupCounters();
        this.setupSearch();
        this.setupFilters();
    }

    // Navigation Setup
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');
        const pageTitle = document.querySelector('.page-title');
        const pageSubtitle = document.querySelector('.page-subtitle');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                this.showSection(sectionId);

                // Update navigation active state
                document.querySelector('.nav-item.active')?.classList.remove('active');
                link.closest('.nav-item').classList.add('active');

                // Update page title
                const sectionName = link.querySelector('span').textContent;
                pageTitle.textContent = sectionName;
                pageSubtitle.textContent = `Manage ${sectionName.toLowerCase()}`;
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        sidebarToggle?.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(sectionId)?.classList.add('active');
        this.currentSection = sectionId;

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    // Modal Setup
    setupModals() {
        const modals = document.querySelectorAll('.modal');
        const modalCloses = document.querySelectorAll('.modal-close');
        const cancelButtons = document.querySelectorAll('[id*="cancel"]');

        // Open modals
        document.getElementById('add-product-btn')?.addEventListener('click', () => {
            this.openModal('product-modal', 'add');
        });

        document.getElementById('add-category-btn')?.addEventListener('click', () => {
            this.openModal('category-modal', 'add');
        });

        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.openModal('user-modal', 'add');
        });

        // Close modals
        modalCloses.forEach(close => {
            close.addEventListener('click', () => {
                this.closeModals();
            });
        });

        cancelButtons.forEach(cancel => {
            cancel.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Close on outside click
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });
    }

    openModal(modalId, mode = 'add') {
        const modal = document.getElementById(modalId);
        const title = modal.querySelector('#' + modalId.replace('-modal', '-modal-title'));
        
        if (mode === 'add') {
            title.textContent = `Add ${modalId.replace('-modal', '').charAt(0).toUpperCase() + modalId.replace('-modal', '').slice(1)}`;
        } else {
            title.textContent = `Edit ${modalId.replace('-modal', '').charAt(0).toUpperCase() + modalId.replace('-modal', '').slice(1)}`;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
        this.resetForms();
    }

    // Form Setup
    setupForms() {
        // Product form
        document.getElementById('save-product')?.addEventListener('click', () => {
            this.saveProduct();
        });

        // Category form
        document.getElementById('save-category')?.addEventListener('click', () => {
            this.saveCategory();
        });

        // Settings form
        document.querySelector('.settings-actions .btn-primary')?.addEventListener('click', () => {
            this.saveSettings();
        });
    }

    resetForms() {
        document.querySelectorAll('form').forEach(form => {
            form.reset();
        });
        document.querySelectorAll('.image-preview').forEach(preview => {
            preview.innerHTML = '';
        });
    }

    // File Upload Setup
    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        });

        // Drag and drop for image upload areas
        const uploadAreas = document.querySelectorAll('.image-upload-area');
        
        uploadAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.style.borderColor = 'var(--primary-color)';
                area.style.background = 'rgba(0, 255, 127, 0.05)';
            });

            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.style.borderColor = 'var(--border-color)';
                area.style.background = 'var(--background-color)';
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.style.borderColor = 'var(--border-color)';
                area.style.background = 'var(--background-color)';
                
                const files = e.dataTransfer.files;
                const input = area.querySelector('input[type="file"]');
                input.files = files;
                this.handleFileUpload({ target: input });
            });
        });
    }

    handleFileUpload(e) {
        const files = e.target.files;
        const previewContainer = e.target.closest('.image-upload-area')?.querySelector('.image-preview');
        
        if (!previewContainer) return;

        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button class="preview-remove" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Data Loading
    loadInitialData() {
        this.loadDashboardStats();
        this.loadRecentOrders();
        this.loadTopProducts();
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'products':
                this.loadProducts();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    // Dashboard Stats
    loadDashboardStats() {
        // Simulate API call
        const stats = {
            products: 1234,
            orders: 856,
            users: 2341,
            revenue: 45678
        };

        // Animate counters
        Object.keys(stats).forEach(key => {
            const element = document.querySelector(`[data-count="${stats[key]}"]`);
            if (element) {
                this.animateCounter(element, stats[key]);
            }
        });
    }

    // Counter Animation
    setupCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.count);
                    this.animateCounter(counter, target);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, {
            threshold: 0.5
        });

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element, target) {
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                current = target;
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // Products Management
    loadProducts() {
        const tableBody = document.querySelector('#products-table tbody');
        if (!tableBody) return;

        // Sample data
        const products = [
            {
                id: 1,
                name: 'AI Assistant Device',
                category: 'AI Devices',
                price: 299.99,
                stock: 45,
                status: 'active',
                image: 'https://via.placeholder.com/50'
            },
            {
                id: 2,
                name: 'Smart Home Hub',
                category: 'Smart Home',
                price: 199.99,
                stock: 23,
                status: 'active',
                image: 'https://via.placeholder.com/50'
            },
            {
                id: 3,
                name: 'Voice Control Kit',
                category: 'Accessories',
                price: 89.99,
                stock: 0,
                status: 'out-of-stock',
                image: 'https://via.placeholder.com/50'
            }
        ];

        tableBody.innerHTML = products.map(product => `
            <tr>
                <td><input type="checkbox" value="${product.id}"></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
                        <span style="font-weight: 500;">${product.name}</span>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="order-status ${product.status}">${product.status.replace('-', ' ')}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon view" onclick="adminDashboard.viewProduct(${product.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit" onclick="adminDashboard.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" onclick="adminDashboard.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Categories Management
    loadCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        const categories = [
            {
                id: 1,
                name: 'AI Devices',
                description: 'Cutting-edge artificial intelligence devices and gadgets.',
                products: 24,
                image: 'https://via.placeholder.com/280x150'
            },
            {
                id: 2,
                name: 'Smart Home',
                description: 'Transform your home with intelligent automation systems.',
                products: 18,
                image: 'https://via.placeholder.com/280x150'
            },
            {
                id: 3,
                name: 'Accessories',
                description: 'Essential accessories for your tech devices.',
                products: 32,
                image: 'https://via.placeholder.com/280x150'
            }
        ];

        grid.innerHTML = categories.map(category => `
            <div class="category-card">
                <img src="${category.image}" alt="${category.name}" class="category-image">
                <div class="category-content">
                    <h3 class="category-name">${category.name}</h3>
                    <p class="category-description">${category.description}</p>
                    <div class="category-stats">
                        <span>${category.products} products</span>
                        <span>Active</span>
                    </div>
                    <div class="category-actions">
                        <button class="action-icon edit" onclick="adminDashboard.editCategory(${category.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" onclick="adminDashboard.deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Orders Management
    loadOrders() {
        const tableBody = document.querySelector('#orders-table tbody');
        if (!tableBody) return;

        const orders = [
            {
                id: 'ORD-001',
                customer: 'John Doe',
                date: '2024-10-08',
                amount: 299.99,
                status: 'pending'
            },
            {
                id: 'ORD-002',
                customer: 'Jane Smith',
                date: '2024-10-07',
                amount: 149.50,
                status: 'processing'
            },
            {
                id: 'ORD-003',
                customer: 'Mike Johnson',
                date: '2024-10-06',
                amount: 89.99,
                status: 'completed'
            }
        ];

        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.customer}</td>
                <td>${order.date}</td>
                <td>$${order.amount}</td>
                <td>
                    <span class="order-status ${order.status}">${order.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon view" onclick="adminDashboard.viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit" onclick="adminDashboard.editOrder('${order.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Users Management
    loadUsers() {
        const tableBody = document.querySelector('#users-table tbody');
        if (!tableBody) return;

        const users = [
            {
                id: 1,
                name: 'Admin User',
                email: 'admin@plugd.com',
                role: 'Administrator',
                status: 'active',
                joined: '2024-01-15',
                avatar: 'https://via.placeholder.com/40'
            },
            {
                id: 2,
                name: 'John Doe',
                email: 'john@example.com',
                role: 'Customer',
                status: 'active',
                joined: '2024-05-20',
                avatar: 'https://via.placeholder.com/40'
            },
            {
                id: 3,
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'Customer',
                status: 'inactive',
                joined: '2024-03-10',
                avatar: 'https://via.placeholder.com/40'
            }
        ];

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${user.avatar}" alt="${user.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                        <span style="font-weight: 500;">${user.name}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="order-status ${user.role.toLowerCase()}">${user.role}</span>
                </td>
                <td>
                    <span class="order-status ${user.status}">${user.status}</span>
                </td>
                <td>${user.joined}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon view" onclick="adminDashboard.viewUser(${user.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit" onclick="adminDashboard.editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" onclick="adminDashboard.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Reviews Management
    loadReviews() {
        const container = document.getElementById('reviews-container');
        if (!container) return;

        const reviews = [
            {
                id: 1,
                user: 'John Doe',
                product: 'AI Assistant Device',
                rating: 5,
                comment: 'Amazing product! The AI features work perfectly and the voice recognition is incredibly accurate.',
                date: '2024-10-05',
                avatar: 'https://via.placeholder.com/40'
            },
            {
                id: 2,
                user: 'Jane Smith',
                product: 'Smart Home Hub',
                rating: 4,
                comment: 'Great device for home automation. Setup was easy and it integrates well with other smart devices.',
                date: '2024-10-03',
                avatar: 'https://via.placeholder.com/40'
            }
        ];

        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-user">
                        <img src="${review.avatar}" alt="${review.user}">
                        <div class="review-user-info">
                            <div class="review-user-name">${review.user}</div>
                            <div class="review-date">${review.date}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        <div class="review-stars">
                            ${Array(5).fill(0).map((_, i) => `
                                <i class="fas fa-star" style="color: ${i < review.rating ? '#ffc107' : '#e0e0e0'}"></i>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="review-content">
                    <div class="review-product">Product: ${review.product}</div>
                    <div class="review-text">${review.comment}</div>
                </div>
                <div class="review-actions">
                    <button class="btn btn-secondary">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger">
                        <i class="fas fa-ban"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Recent Orders for Dashboard
    loadRecentOrders() {
        // This would typically load recent orders for the dashboard
        // The HTML already contains sample data
    }

    loadTopProducts() {
        // This would typically load top selling products
        // The HTML already contains sample data
    }

    // Charts Setup
    setupCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded, charts will be initialized when available');
            return;
        }

        this.initializeCharts();
    }

    initializeCharts() {
        // Sales Chart
        const salesCtx = document.getElementById('sales-chart');
        if (salesCtx) {
            new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Sales',
                        data: [12000, 15000, 18000, 22000, 25000, 28000],
                        borderColor: '#00FF7F',
                        backgroundColor: 'rgba(0, 255, 127, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Product Performance Chart
        const productCtx = document.getElementById('product-chart');
        if (productCtx) {
            new Chart(productCtx, {
                type: 'doughnut',
                data: {
                    labels: ['AI Devices', 'Smart Home', 'Accessories'],
                    datasets: [{
                        data: [45, 30, 25],
                        backgroundColor: ['#00FF7F', '#ff6b6b', '#4ecdc4']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // User Growth Chart
        const userCtx = document.getElementById('user-chart');
        if (userCtx) {
            new Chart(userCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'New Users',
                        data: [120, 190, 300, 500, 200, 300],
                        backgroundColor: '#00FF7F'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Revenue Chart
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueCtx) {
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Revenue',
                        data: [5000, 7500, 12000, 15000],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    // Search Setup
    setupSearch() {
        const searchInputs = document.querySelectorAll('.search-input, .search-filter');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.performSearch(e.target.value, e.target.closest('.content-section')?.id || 'global');
            });
        });
    }

    performSearch(query, context) {
        console.log(`Searching for "${query}" in ${context}`);
        // Implement search logic based on current section
        // This would typically filter the displayed data
    }

    // Filters Setup
    setupFilters() {
        const filterSelects = document.querySelectorAll('.filter-select');
        
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.applyFilter(e.target.id, e.target.value);
            });
        });
    }

    applyFilter(filterId, value) {
        console.log(`Applying filter ${filterId}: ${value}`);
        // Implement filter logic
    }

    // Data Tables Setup
    setupDataTables() {
        // Select all checkboxes functionality
        const selectAllCheckboxes = document.querySelectorAll('[id*="select-all"]');
        
        selectAllCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const table = e.target.closest('table');
                const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]');
                
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        });

        // Pagination
        this.setupPagination();
    }

    setupPagination() {
        const prevButtons = document.querySelectorAll('#prev-page');
        const nextButtons = document.querySelectorAll('#next-page');
        
        prevButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.changePage(-1);
            });
        });

        nextButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.changePage(1);
            });
        });
    }

    changePage(direction) {
        console.log(`Changing page by ${direction}`);
        // Implement pagination logic
    }

    // Form Save Methods
    saveProduct() {
        const form = document.getElementById('product-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const productData = Object.fromEntries(formData);
        
        console.log('Saving product:', productData);
        
        // Simulate API call
        this.showAlert('Product saved successfully!', 'success');
        this.closeModals();
        this.loadProducts();
    }

    saveCategory() {
        const form = document.getElementById('category-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const categoryData = Object.fromEntries(formData);
        
        console.log('Saving category:', categoryData);
        
        // Simulate API call
        this.showAlert('Category saved successfully!', 'success');
        this.closeModals();
        this.loadCategories();
    }

    saveSettings() {
        const forms = document.querySelectorAll('.settings-form');
        const settingsData = {};
        
        forms.forEach(form => {
            const formData = new FormData(form);
            Object.assign(settingsData, Object.fromEntries(formData));
        });
        
        console.log('Saving settings:', settingsData);
        
        // Simulate API call
        this.showAlert('Settings saved successfully!', 'success');
    }

    // CRUD Operations
    viewProduct(id) {
        console.log('Viewing product:', id);
        // Implement view logic
    }

    editProduct(id) {
        console.log('Editing product:', id);
        this.openModal('product-modal', 'edit');
        // Load product data into form
    }

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            console.log('Deleting product:', id);
            this.showAlert('Product deleted successfully!', 'success');
            this.loadProducts();
        }
    }

    editCategory(id) {
        console.log('Editing category:', id);
        this.openModal('category-modal', 'edit');
    }

    deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            console.log('Deleting category:', id);
            this.showAlert('Category deleted successfully!', 'success');
            this.loadCategories();
        }
    }

    viewOrder(id) {
        console.log('Viewing order:', id);
    }

    editOrder(id) {
        console.log('Editing order:', id);
    }

    viewUser(id) {
        console.log('Viewing user:', id);
    }

    editUser(id) {
        console.log('Editing user:', id);
    }

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            console.log('Deleting user:', id);
            this.showAlert('User deleted successfully!', 'success');
            this.loadUsers();
        }
    }

    // Analytics
    loadAnalytics() {
        // Load analytics data and update charts
        if (typeof Chart !== 'undefined') {
            this.initializeCharts();
        }
    }

    // Utility Methods
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
            ${message}
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    showLoading(element) {
        element.innerHTML = '<div class="loading"></div>';
    }

    hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Load Chart.js if not already loaded
if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        if (window.adminDashboard) {
            window.adminDashboard.initializeCharts();
        }
    };
    document.head.appendChild(script);
}
