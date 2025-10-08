const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
    constructor() {
        this.transporter = this.createTransporter();
        this.templates = this.loadTemplates();
    }
    
    createTransporter() {
        // Configure based on environment
        if (process.env.EMAIL_SERVICE === 'gmail') {
            return nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else if (process.env.SMTP_HOST) {
            return nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Development mode - use Ethereal
            return nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: 'ethereal.user@ethereal.email',
                    pass: 'ethereal.pass'
                }
            });
        }
    }
    
    loadTemplates() {
        return {
            welcome: this.createWelcomeTemplate(),
            orderConfirmation: this.createOrderConfirmationTemplate(),
            orderShipped: this.createOrderShippedTemplate(),
            passwordReset: this.createPasswordResetTemplate(),
            newsletter: this.createNewsletterTemplate()
        };
    }
    
    createWelcomeTemplate() {
        return {
            subject: 'Welcome to PLUGD Marketplace! 🎉',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #00ff88, #00cc6a); padding: 40px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PLUGD!</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your marketplace journey begins now</p>
                    </div>
                    
                    <div style="padding: 40px 30px; background: white;">
                        <h2 style="color: #333; margin-bottom: 20px;">Hi {{firstName}}! 👋</h2>
                        
                        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                            Welcome to PLUGD Marketplace! We're excited to have you as part of our community.
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
                            <ul style="color: #666; line-height: 1.8;">
                                <li>🛍️ Browse thousands of products</li>
                                <li>💫 Add items to your wishlist</li>
                                <li>🚚 Enjoy fast, secure delivery</li>
                                <li>⭐ Rate and review products</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{siteUrl}}" style="background: #00ff88; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Start Shopping</a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            Need help? Contact us at support@plugd.com
                        </p>
                    </div>
                </div>
            `
        };
    }
    
    createOrderConfirmationTemplate() {
        return {
            subject: 'Order Confirmed - PLUGD #{{orderNumber}}',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #00ff88; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Order Confirmed! ✅</h1>
                        <p style="color: white; margin: 10px 0 0 0;">Order #{{orderNumber}}</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <h2 style="color: #333;">Hi {{customerName}}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Thank you for your order! We've received your payment and are preparing your items for shipment.
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px 0; color: #666;">Order Number:</td>
                                    <td style="padding: 10px 0; font-weight: bold;">{{orderNumber}}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px 0; color: #666;">Order Date:</td>
                                    <td style="padding: 10px 0;">{{orderDate}}</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px 0; color: #666;">Total Amount:</td>
                                    <td style="padding: 10px 0; font-weight: bold; color: #00ff88;">₹{{totalAmount}}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #666;">Payment Method:</td>
                                    <td style="padding: 10px 0;">{{paymentMethod}}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <h3>Items Ordered:</h3>
                        <div style="margin: 20px 0;">
                            {{#each items}}
                            <div style="border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                                <div style="display: flex; align-items: center;">
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0 0 5px 0; color: #333;">{{name}}</h4>
                                        <p style="margin: 0; color: #666;">Quantity: {{quantity}} × ₹{{price}}</p>
                                    </div>
                                    <div style="font-weight: bold; color: #333;">₹{{total}}</div>
                                </div>
                            </div>
                            {{/each}}
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{trackingUrl}}" style="background: #00ff88; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Track Your Order</a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            Questions? Reply to this email or contact support@plugd.com
                        </p>
                    </div>
                </div>
            `
        };
    }
    
    createOrderShippedTemplate() {
        return {
            subject: 'Your Order is On the Way! 🚚 - PLUGD #{{orderNumber}}',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #007bff; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Package Shipped! 📦</h1>
                        <p style="color: white; margin: 10px 0 0 0;">Your order is on its way</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <h2 style="color: #333;">Great news, {{customerName}}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            Your order #{{orderNumber}} has been shipped and is on its way to you!
                        </p>
                        
                        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                            <h3 style="margin-top: 0; color: #007bff;">Tracking Information</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Tracking Number:</strong> {{trackingNumber}}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Carrier:</strong> {{carrier}}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Expected Delivery:</strong> {{expectedDelivery}}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{trackingUrl}}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Track Package</a>
                        </div>
                        
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            Need help? Contact us at support@plugd.com
                        </p>
                    </div>
                </div>
            `
        };
    }
    
    createPasswordResetTemplate() {
        return {
            subject: 'Reset Your PLUGD Password 🔐',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #ff6b6b; padding: 30px; text-align: center;">
                        <h1 style="color: white; margin: 0;">Password Reset</h1>
                        <p style="color: white; margin: 10px 0 0 0;">Secure your account</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <h2 style="color: #333;">Hi {{firstName}}!</h2>
                        
                        <p style="color: #666; line-height: 1.6;">
                            We received a request to reset your password for your PLUGD account.
                        </p>
                        
                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; color: #856404;">
                                <strong>Security Note:</strong> This link will expire in 15 minutes for your security.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{resetUrl}}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                        
                        <p style="color: #999; font-size: 14px; text-align: center;">
                            Questions? Contact us at support@plugd.com
                        </p>
                    </div>
                </div>
            `
        };
    }
    
    createNewsletterTemplate() {
        return {
            subject: '{{subject}} - PLUGD Newsletter 📬',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px; text-align: center;">
                        <h1 style="color: white; margin: 0;">{{title}}</h1>
                        <p style="color: white; margin: 10px 0 0 0;">{{subtitle}}</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <div style="margin-bottom: 30px;">
                            {{content}}
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{ctaUrl}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">{{ctaText}}</a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            You're receiving this because you subscribed to PLUGD updates.<br>
                            <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a> | 
                            <a href="{{preferencesUrl}}" style="color: #999;">Email Preferences</a>
                        </p>
                    </div>
                </div>
            `
        };
    }
    
    async sendEmail(type, to, data) {
        try {
            const template = this.templates[type];
            if (!template) {
                throw new Error(`Email template '${type}' not found`);
            }
            
            // Replace template variables
            let subject = template.subject;
            let html = template.html;
            
            // Simple template replacement
            Object.keys(data).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, data[key] || '');
                html = html.replace(regex, data[key] || '');
            });
            
            // Add default data
            const defaultData = {
                siteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                supportEmail: 'support@plugd.com',
                currentYear: new Date().getFullYear()
            };
            
            Object.keys(defaultData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, defaultData[key]);
                html = html.replace(regex, defaultData[key]);
            });
            
            const mailOptions = {
                from: `"PLUGD Marketplace" <${process.env.EMAIL_FROM || 'noreply@plugd.com'}>`,
                to,
                subject,
                html
            };
            
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent: ${type} to ${to}`);
            
            return {
                success: true,
                messageId: result.messageId,
                preview: nodemailer.getTestMessageUrl(result)
            };
        } catch (error) {
            console.error(`❌ Email send failed:`, error);
            throw error;
        }
    }
    
    // Specific email methods
    async sendWelcomeEmail(user) {
        return await this.sendEmail('welcome', user.email, {
            firstName: user.firstName,
            lastName: user.lastName
        });
    }
    
    async sendOrderConfirmation(order, user) {
        return await this.sendEmail('orderConfirmation', user.email, {
            customerName: `${user.firstName} ${user.lastName}`,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt.toLocaleDateString(),
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            items: order.items,
            trackingUrl: `${process.env.FRONTEND_URL}/orders/${order._id}`
        });
    }
    
    async sendOrderShipped(order, user, trackingInfo) {
        return await this.sendEmail('orderShipped', user.email, {
            customerName: `${user.firstName} ${user.lastName}`,
            orderNumber: order.orderNumber,
            trackingNumber: trackingInfo.trackingNumber,
            carrier: trackingInfo.carrier,
            expectedDelivery: trackingInfo.expectedDelivery,
            trackingUrl: trackingInfo.trackingUrl
        });
    }
    
    async sendPasswordReset(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        return await this.sendEmail('passwordReset', user.email, {
            firstName: user.firstName,
            resetUrl
        });
    }
    
    async sendNewsletter(subscribers, newsletterData) {
        const results = [];
        
        for (const subscriber of subscribers) {
            try {
                const result = await this.sendEmail('newsletter', subscriber.email, {
                    ...newsletterData,
                    unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`,
                    preferencesUrl: `${process.env.FRONTEND_URL}/email-preferences?token=${subscriber.token}`
                });
                results.push({ email: subscriber.email, success: true, result });
            } catch (error) {
                results.push({ email: subscriber.email, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connected successfully');
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
