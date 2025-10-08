const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');

// Sample data for seeding the database
const sampleData = {
    categories: [
        {
            name: 'Electronics',
            description: 'Latest electronic gadgets and devices',
            icon: '📱',
            color: '#007bff',
            featured: true,
            sortOrder: 1
        },
        {
            name: 'Fashion',
            description: 'Trendy clothing and accessories',
            icon: '👕',
            color: '#e91e63',
            featured: true,
            sortOrder: 2
        },
        {
            name: 'Home & Garden',
            description: 'Everything for your home and garden',
            icon: '🏠',
            color: '#4caf50',
            featured: true,
            sortOrder: 3
        },
        {
            name: 'Sports & Fitness',
            description: 'Sports equipment and fitness gear',
            icon: '⚽',
            color: '#ff9800',
            featured: true,
            sortOrder: 4
        },
        {
            name: 'Books & Media',
            description: 'Books, movies, music and more',
            icon: '📚',
            color: '#9c27b0',
            featured: false,
            sortOrder: 5
        },
        {
            name: 'Beauty & Health',
            description: 'Health and beauty products',
            icon: '💄',
            color: '#f44336',
            featured: false,
            sortOrder: 6
        }
    ],
    
    users: [
        {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123',
            role: 'user',
            isEmailVerified: true,
            phone: '+1234567890',
            gender: 'male',
            preferences: {
                currency: 'USD',
                language: 'en',
                newsletter: true
            },
            addresses: [{
                type: 'home',
                isDefault: true,
                firstName: 'John',
                lastName: 'Doe',
                addressLine1: '123 Main Street',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'United States',
                phone: '+1234567890'
            }]
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            password: 'password123',
            role: 'seller',
            isEmailVerified: true,
            phone: '+1234567891',
            gender: 'female',
            preferences: {
                currency: 'USD',
                language: 'en',
                newsletter: true
            }
        },
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@plugd.com',
            password: 'admin123',
            role: 'admin',
            isEmailVerified: true,
            preferences: {
                currency: 'USD',
                language: 'en',
                newsletter: false
            }
        },
        {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            password: 'password123',
            role: 'user',
            isEmailVerified: true,
            phone: '+1234567892',
            gender: 'female'
        },
        {
            firstName: 'Bob',
            lastName: 'Wilson',
            email: 'bob.wilson@example.com',
            password: 'password123',
            role: 'seller',
            isEmailVerified: true,
            phone: '+1234567893',
            gender: 'male'
        }
    ],
    
    products: [
        {
            name: 'iPhone 15 Pro',
            description: 'Latest iPhone with advanced AI features and titanium design. Experience next-level performance with the A17 Pro chip.',
            shortDescription: 'Latest iPhone with AI features',
            price: 999,
            originalPrice: 1099,
            currency: 'USD',
            brand: 'Apple',
            sku: 'IPH15PRO001',
            images: [
                {
                    url: 'https://via.placeholder.com/500x500/007bff/ffffff?text=iPhone+15+Pro',
                    alt: 'iPhone 15 Pro Front View',
                    isMain: true,
                    order: 1
                }
            ],
            inventory: {
                quantity: 50,
                lowStockThreshold: 10
            },
            variations: [
                {
                    type: 'color',
                    name: 'Color',
                    options: [
                        { value: 'natural-titanium', label: 'Natural Titanium', inventory: 20 },
                        { value: 'blue-titanium', label: 'Blue Titanium', inventory: 15 },
                        { value: 'white-titanium', label: 'White Titanium', inventory: 15 }
                    ]
                },
                {
                    type: 'size',
                    name: 'Storage',
                    options: [
                        { value: '128gb', label: '128GB', price: 0, inventory: 25 },
                        { value: '256gb', label: '256GB', price: 100, inventory: 15 },
                        { value: '512gb', label: '512GB', price: 300, inventory: 10 }
                    ]
                }
            ],
            dimensions: {
                length: 14.67,
                width: 7.09,
                height: 0.83,
                unit: 'cm'
            },
            weight: {
                value: 187,
                unit: 'g'
            },
            tags: ['smartphone', 'apple', 'premium', 'ai'],
            status: 'active',
            featured: true,
            trending: true,
            ratings: {
                average: 4.8,
                count: 150
            },
            views: 2450,
            salesCount: 85
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            description: 'Premium Android smartphone with S Pen and advanced camera system.',
            shortDescription: 'Premium Android with S Pen',
            price: 899,
            originalPrice: 999,
            brand: 'Samsung',
            sku: 'SAM24ULTRA001',
            images: [
                {
                    url: 'https://via.placeholder.com/500x500/6c757d/ffffff?text=Galaxy+S24',
                    alt: 'Samsung Galaxy S24 Ultra',
                    isMain: true,
                    order: 1
                }
            ],
            inventory: {
                quantity: 30,
                lowStockThreshold: 8
            },
            tags: ['smartphone', 'samsung', 'android', 's-pen'],
            status: 'active',
            featured: true,
            ratings: {
                average: 4.6,
                count: 89
            }
        },
        {
            name: 'Designer Cotton T-Shirt',
            description: 'Premium quality cotton t-shirt with modern design. Perfect for casual wear.',
            shortDescription: 'Premium cotton t-shirt',
            price: 49,
            originalPrice: 69,
            brand: 'FashionCo',
            sku: 'TSHIRT001',
            images: [
                {
                    url: 'https://via.placeholder.com/500x500/e91e63/ffffff?text=T-Shirt',
                    alt: 'Designer T-Shirt',
                    isMain: true,
                    order: 1
                }
            ],
            inventory: {
                quantity: 100,
                lowStockThreshold: 20
            },
            variations: [
                {
                    type: 'color',
                    name: 'Color',
                    options: [
                        { value: 'black', label: 'Black', inventory: 30 },
                        { value: 'white', label: 'White', inventory: 35 },
                        { value: 'navy', label: 'Navy Blue', inventory: 35 }
                    ]
                },
                {
                    type: 'size',
                    name: 'Size',
                    options: [
                        { value: 'xs', label: 'XS', inventory: 15 },
                        { value: 's', label: 'S', inventory: 25 },
                        { value: 'm', label: 'M', inventory: 30 },
                        { value: 'l', label: 'L', inventory: 20 },
                        { value: 'xl', label: 'XL', inventory: 10 }
                    ]
                }
            ],
            tags: ['clothing', 'fashion', 't-shirt', 'cotton'],
            status: 'active',
            trending: true,
            ratings: {
                average: 4.4,
                count: 67
            }
        },
        {
            name: 'Smart Home Security Kit',
            description: 'Complete smart home security system with cameras, sensors, and mobile app.',
            shortDescription: 'Complete smart security system',
            price: 299,
            originalPrice: 399,
            brand: 'SecureHome',
            sku: 'SECURITY001',
            images: [
                {
                    url: 'https://via.placeholder.com/500x500/4caf50/ffffff?text=Security+Kit',
                    alt: 'Smart Security Kit',
                    isMain: true,
                    order: 1
                }
            ],
            inventory: {
                quantity: 25,
                lowStockThreshold: 5
            },
            tags: ['smart-home', 'security', 'iot', 'cameras'],
            status: 'active',
            newArrival: true,
            ratings: {
                average: 4.7,
                count: 43
            }
        },
        {
            name: 'Professional Running Shoes',
            description: 'High-performance running shoes with advanced cushioning technology.',
            shortDescription: 'High-performance running shoes',
            price: 129,
            originalPrice: 179,
            brand: 'SportsTech',
            sku: 'SHOES001',
            images: [
                {
                    url: 'https://via.placeholder.com/500x500/ff9800/ffffff?text=Running+Shoes',
                    alt: 'Professional Running Shoes',
                    isMain: true,
                    order: 1
                }
            ],
            inventory: {
                quantity: 75,
                lowStockThreshold: 15
            },
            variations: [
                {
                    type: 'color',
                    name: 'Color',
                    options: [
                        { value: 'black-red', label: 'Black/Red', inventory: 25 },
                        { value: 'white-blue', label: 'White/Blue', inventory: 25 },
                        { value: 'gray-orange', label: 'Gray/Orange', inventory: 25 }
                    ]
                },
                {
                    type: 'size',
                    name: 'Size',
                    options: [
                        { value: '7', label: 'US 7', inventory: 10 },
                        { value: '8', label: 'US 8', inventory: 15 },
                        { value: '9', label: 'US 9', inventory: 20 },
                        { value: '10', label: 'US 10', inventory: 15 },
                        { value: '11', label: 'US 11', inventory: 10 },
                        { value: '12', label: 'US 12', inventory: 5 }
                    ]
                }
            ],
            tags: ['shoes', 'running', 'sports', 'fitness'],
            status: 'active',
            ratings: {
                average: 4.3,
                count: 156
            }
        }
    ]
};

// Database seeder class
class DatabaseSeeder {
    constructor() {
        this.createdData = {
            categories: [],
            users: [],
            products: [],
            orders: [],
            reviews: []
        };
    }

    async run(options = {}) {
        try {
            console.log('🌱 Starting database seeding...');
            
            if (options.clean) {
                await this.cleanDatabase();
            }
            
            await this.seedCategories();
            await this.seedUsers();
            await this.seedProducts();
            await this.seedOrders();
            await this.seedReviews();
            
            console.log('✅ Database seeding completed successfully!');
            this.printSummary();
            
        } catch (error) {
            console.error('❌ Database seeding failed:', error.message);
            throw error;
        }
    }

    async cleanDatabase() {
        console.log('🧹 Cleaning existing data...');
        
        await Review.deleteMany({});
        await Order.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        
        console.log('✅ Database cleaned');
    }

    async seedCategories() {
        console.log('📁 Seeding categories...');
        
        for (const categoryData of sampleData.categories) {
            const category = new Category(categoryData);
            const saved = await category.save();
            this.createdData.categories.push(saved);
        }
        
        console.log(`✅ Created ${this.createdData.categories.length} categories`);
    }

    async seedUsers() {
        console.log('👥 Seeding users...');
        
        for (const userData of sampleData.users) {
            const user = new User(userData);
            const saved = await user.save();
            this.createdData.users.push(saved);
        }
        
        console.log(`✅ Created ${this.createdData.users.length} users`);
    }

    async seedProducts() {
        console.log('🛍️ Seeding products...');
        
        // Get seller and categories
        const seller = this.createdData.users.find(user => user.role === 'seller');
        const electronicsCategory = this.createdData.categories.find(cat => cat.name === 'Electronics');
        const fashionCategory = this.createdData.categories.find(cat => cat.name === 'Fashion');
        const homeCategory = this.createdData.categories.find(cat => cat.name === 'Home & Garden');
        const sportsCategory = this.createdData.categories.find(cat => cat.name === 'Sports & Fitness');
        
        // Assign categories to products
        const productCategories = [
            electronicsCategory._id, // iPhone
            electronicsCategory._id, // Samsung
            fashionCategory._id,     // T-Shirt
            homeCategory._id,        // Security Kit
            sportsCategory._id       // Running Shoes
        ];
        
        for (let i = 0; i < sampleData.products.length; i++) {
            const productData = {
                ...sampleData.products[i],
                seller: seller._id,
                category: productCategories[i]
            };
            
            const product = new Product(productData);
            const saved = await product.save();
            this.createdData.products.push(saved);
        }
        
        console.log(`✅ Created ${this.createdData.products.length} products`);
    }

    async seedOrders() {
        console.log('🛒 Seeding orders...');
        
        const customer = this.createdData.users.find(user => user.role === 'user');
        const products = this.createdData.products.slice(0, 3); // First 3 products
        
        const orderData = {
            customer: customer._id,
            items: products.map((product, index) => ({
                product: product._id,
                productSnapshot: {
                    name: product.name,
                    description: product.shortDescription,
                    price: product.price,
                    image: product.mainImage,
                    sku: product.sku
                },
                quantity: index + 1,
                price: product.price,
                totalPrice: product.price * (index + 1),
                seller: product.seller
            })),
            shippingAddress: {
                firstName: customer.firstName,
                lastName: customer.lastName,
                addressLine1: '123 Main Street',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'United States',
                phone: '+1234567890'
            },
            payment: {\n                method: 'razorpay',\n                status: 'completed'\n            },\n            status: 'delivered',\n            taxRate: 0.08,\n            shipping: {\n                cost: 15,\n                method: 'standard'\n            }\n        };\n        \n        const order = new Order(orderData);\n        const saved = await order.save();\n        this.createdData.orders.push(saved);\n        \n        console.log(`✅ Created ${this.createdData.orders.length} orders`);\n    }\n\n    async seedReviews() {\n        console.log('⭐ Seeding reviews...');\n        \n        const customer = this.createdData.users.find(user => user.role === 'user');\n        const order = this.createdData.orders[0];\n        const products = this.createdData.products.slice(0, 3);\n        \n        const reviewsData = [\n            {\n                product: products[0]._id,\n                customer: customer._id,\n                order: order._id,\n                rating: 5,\n                title: 'Amazing iPhone!',\n                content: 'This iPhone 15 Pro is absolutely fantastic! The camera quality is outstanding and the AI features are mind-blowing. Highly recommended!',\n                detailedRatings: {\n                    quality: 5,\n                    value: 4,\n                    shipping: 5,\n                    service: 5\n                },\n                status: 'approved',\n                isVerifiedPurchase: true\n            },\n            {\n                product: products[1]._id,\n                customer: customer._id,\n                order: order._id,\n                rating: 4,\n                title: 'Great Android phone',\n                content: 'Samsung Galaxy S24 Ultra is a solid choice. The S Pen is very useful and the display is beautiful. Only minor complaint is the battery life.',\n                detailedRatings: {\n                    quality: 4,\n                    value: 4,\n                    shipping: 5,\n                    service: 4\n                },\n                status: 'approved',\n                isVerifiedPurchase: true\n            },\n            {\n                product: products[2]._id,\n                customer: customer._id,\n                order: order._id,\n                rating: 4,\n                title: 'Nice quality t-shirt',\n                content: 'The cotton is soft and the fit is perfect. Good value for money. Will buy more colors!',\n                detailedRatings: {\n                    quality: 4,\n                    value: 5,\n                    shipping: 4,\n                    service: 4\n                },\n                status: 'approved',\n                isVerifiedPurchase: true\n            }\n        ];\n        \n        for (const reviewData of reviewsData) {\n            const review = new Review(reviewData);\n            const saved = await review.save();\n            this.createdData.reviews.push(saved);\n        }\n        \n        console.log(`✅ Created ${this.createdData.reviews.length} reviews`.green);\n    }\n\n    printSummary() {\n        console.log('\\n📊 Seeding Summary:');\n        console.log(`👥 Users: ${this.createdData.users.length}`);\n        console.log(`📁 Categories: ${this.createdData.categories.length}`.white);\n        console.log(`🛍️ Products: ${this.createdData.products.length}`.white);\n        console.log(`🛒 Orders: ${this.createdData.orders.length}`.white);\n        console.log(`⭐ Reviews: ${this.createdData.reviews.length}`.white);\n        \n        console.log('\\n🔑 Test Accounts:'.yellow.bold);\n        console.log('👤 Customer: john.doe@example.com / password123'.cyan);\n        console.log('🏪 Seller: jane.smith@example.com / password123'.cyan);\n        console.log('👑 Admin: admin@plugd.com / admin123'.cyan);\n    }\n\n    // Get created data for testing\n    getCreatedData() {\n        return this.createdData;\n    }\n}\n\nmodule.exports = DatabaseSeeder;
