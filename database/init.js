#!/usr/bin/env node

const DatabaseConnection = require('./connection');
const DatabaseSeeder = require('./seeder');
const DatabaseUtils = require('./utils');
const mongoose = require('mongoose');

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = {};

// Parse command line options
args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
        const key = arg.substring(2);
        const value = args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : true;
        options[key] = value;
    }
});

// Database initialization script
class DatabaseInitializer {
    constructor() {
        this.connection = DatabaseConnection;
    }

    async init() {
        try {
            // Connect to database
            await this.connection.connect(options.uri);
            
            // Execute command
            switch (command) {
                case 'seed':
                    await this.seedDatabase();
                    break;
                case 'clean':
                    await this.cleanDatabase();
                    break;
                case 'health':
                    await this.healthCheck();
                    break;
                case 'stats':
                    await this.showStats();
                    break;
                case 'reset':
                    await this.resetDatabase();
                    break;
                default:
                    this.showHelp();
            }
            
            await this.connection.disconnect();
        } catch (error) {
            console.error('❌ Database operation failed:'.red.bold, error.message);
            process.exit(1);
        }
    }

    async seedDatabase() {
        console.log('🌱 Initializing database with sample data...');
        
        const seeder = new DatabaseSeeder();
        await seeder.run({
            clean: options.clean === 'true' || options.clean === true
        });
    }

    async cleanDatabase() {
        console.log('🧹 Cleaning database...');
        
        if (options.confirm !== 'true') {
            console.log('⚠️  This will delete ALL data from the database!');
            console.log('💡 Add --confirm true to proceed');
            return;
        }
        
        const Review = require('../models/Review');
        const Order = require('../models/Order');
        const Product = require('../models/Product');
        const Category = require('../models/Category');
        const User = require('../models/User');
        
        await Review.deleteMany({});
        await Order.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await User.deleteMany({});
        
        console.log('✅ Database cleaned successfully!');
    }

    async healthCheck() {
        console.log('🔍 Performing database health check...');
        
        const health = await DatabaseUtils.performHealthCheck();
        
        console.log('\n📊 Health Check Results:');
        console.log(`Database Connection: ${health.database ? '✅ Connected'.green : '❌ Disconnected'.red}`);
        
        if (health.collections) {
            console.log('\n📚 Collections:');
            Object.entries(health.collections).forEach(([name, info]) => {
                const status = info.status === 'ok' ? '✅' : '❌';
                const count = info.count !== undefined ? ` (${info.count} documents)` : '';
                console.log(`  ${status} ${name}${count}`);
            });
        }
        
        if (health.error) {
            console.log(`\n❌ Error: ${health.error}`);
        }
    }

    async showStats() {
        console.log('📊 Generating database statistics...');
        
        try {
            const stats = await DatabaseUtils.getDashboardStats();
            
            console.log('\n📈 Database Statistics:');
            console.log(`👥 Total Users: ${stats.users}`);
            console.log(`🛍️ Total Products: ${stats.products}`);
            console.log(`🛒 Total Orders: ${stats.orders}`);
            console.log(`⭐ Total Reviews: ${stats.reviews}`);
            
            if (stats.revenue) {
                console.log(`💰 Total Revenue: $${stats.revenue.totalRevenue.toFixed(2)}`);
                console.log(`📊 Average Order Value: $${stats.revenue.avgOrderValue.toFixed(2)}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to generate stats:'.red, error.message);
        }
    }

    async resetDatabase() {
        console.log('🔄 Resetting database...');
        
        if (options.confirm !== 'true') {
            console.log('⚠️  This will delete ALL data and reseed the database!');
            console.log('💡 Add --confirm true to proceed');
            return;
        }
        
        await this.cleanDatabase();
        await this.seedDatabase();
        
        console.log('✅ Database reset completed!');
    }

    showHelp() {
        console.log('\n🗃️  PLUGD Database Management Tool');
        console.log('\nUsage: node database/init.js <command> [options]\n');
        
        console.log('Commands:');
        console.log('  seed          Seed database with sample data');
        console.log('  clean         Clean all data from database');
        console.log('  health        Check database health');
        console.log('  stats         Show database statistics');
        console.log('  reset         Clean and reseed database');
        console.log('  help          Show this help message\n');
        
        console.log('Options:');
        console.log('  --uri <uri>           Custom MongoDB connection URI');
        console.log('  --clean true          Clean before seeding');
        console.log('  --confirm true        Confirm destructive operations\n');
        
        console.log('Examples:');
        console.log('  node database/init.js seed');
        console.log('  node database/init.js seed --clean true');
        console.log('  node database/init.js clean --confirm true');
        console.log('  node database/init.js reset --confirm true');
        console.log('  node database/init.js health\n');
    }
}

// Run if called directly
if (require.main === module) {
    const initializer = new DatabaseInitializer();
    
    if (!command || command === 'help') {
        initializer.showHelp();
        process.exit(0);
    }
    
    initializer.init();
}

module.exports = DatabaseInitializer;
