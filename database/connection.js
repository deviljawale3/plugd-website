const mongoose = require('mongoose');

// MongoDB connection configuration
class DatabaseConnection {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    async connect(uri = null) {
        try {
            // Use provided URI or default from environment
            const mongoURI = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/plugd_marketplace';
            
            // Connection options for better performance and reliability
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                family: 4, // Use IPv4, skip trying IPv6
                bufferCommands: false, // Disable mongoose buffering
                bufferMaxEntries: 0, // Disable mongoose buffering
            };

            console.log('🔄 Connecting to MongoDB...');
            
            this.connection = await mongoose.connect(mongoURI, options);
            this.isConnected = true;
            
            console.log(`✅ MongoDB Connected: ${this.connection.connection.host}`);
            console.log(`📊 Database: ${this.connection.connection.name}`);
            
            // Handle connection events
            this.setupEventListeners();
            
            return this.connection;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error.message);
            this.isConnected = false;
            process.exit(1);
        }
    }

    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('🟢 MongoDB connection established');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🔴 MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🟡 MongoDB disconnected');
            this.isConnected = false;
        });

        // Handle app termination
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    async disconnect() {
        if (this.isConnected) {
            try {
                await mongoose.connection.close();
                console.log('🔴 MongoDB connection closed');
                this.isConnected = false;
            } catch (error) {
                console.error('❌ Error closing MongoDB connection:', error.message);
            }
        }
    }

    // Health check for database connection
    async healthCheck() {
        try {
            const state = mongoose.connection.readyState;
            const states = {
                0: 'Disconnected',
                1: 'Connected',
                2: 'Connecting',
                3: 'Disconnecting'
            };
            
            return {
                status: states[state],
                connected: state === 1,
                database: mongoose.connection.name,
                host: mongoose.connection.host,
                port: mongoose.connection.port
            };
        } catch (error) {
            return {
                status: 'Error',
                connected: false,
                error: error.message
            };
        }
    }

    // Get connection statistics
    async getStats() {
        try {
            if (!this.isConnected) {
                return { error: 'Database not connected' };
            }

            const admin = mongoose.connection.db.admin();
            const stats = await admin.serverStatus();
            
            return {
                connections: stats.connections,
                uptime: stats.uptime,
                version: stats.version,
                memory: stats.mem,
                network: stats.network
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new DatabaseConnection();
