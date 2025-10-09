# Plugd Electronics eCommerce Platform

A modern, scalable eCommerce platform built with Next.js and Express.js, following industry-standard monorepo architecture.

## 🏗️ Project Structure

```
plugd-website/
├── apps/                          # Main applications
│   ├── frontend/                  # Next.js frontend application
│   │   ├── src/
│   │   │   ├── components/        # React components
│   │   │   ├── pages/             # Next.js pages
│   │   │   ├── styles/            # CSS/SCSS files
│   │   │   └── utils/             # Frontend utilities
│   │   ├── public/                # Static assets
│   │   └── package.json
│   ├── backend/                   # Express.js backend API
│   │   ├── src/
│   │   │   ├── controllers/       # Route controllers
│   │   │   ├── middleware/        # Express middleware
│   │   │   ├── models/            # Database models
│   │   │   ├── routes/            # API routes
│   │   │   ├── services/          # Business logic
│   │   │   ├── utils/             # Backend utilities
│   │   │   ├── config/            # Database & config
│   │   │   └── server.js          # Main server file
│   │   └── package.json
│   └── admin/                     # Admin dashboard
│       ├── scripts/
│       ├── styles/
│       └── index.html
├── packages/                      # Shared packages/libraries
│   └── shared/                    # Shared utilities & integrations
├── docs/                          # Documentation
├── scripts/                       # Build and deployment scripts
└── package.json                   # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/plugd-website.git
   cd plugd-website
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment templates
   cp apps/frontend/.env.example apps/frontend/.env.local
   cp apps/backend/.env.example apps/backend/.env
   ```

### Development

**Start all services:**
```bash
# Frontend (Next.js)
npm run dev

# Backend (Express.js)
npm run backend:dev

# Admin Dashboard
npm run admin:dev
```

**Individual services:**
```bash
# Frontend only
cd apps/frontend && npm run dev

# Backend only
cd apps/backend && npm run dev
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm run start
```

## 📁 Architecture Overview

### Frontend (Next.js)
- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI + Custom components

### Backend (Express.js)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcryptjs
- **Payment**: Stripe, Razorpay, PayPal
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate limiting

### Key Features
- 🛒 **E-commerce**: Complete shopping cart and checkout
- 💳 **Payments**: Multi-gateway payment processing
- 👤 **Authentication**: Secure user authentication
- 📱 **Responsive**: Mobile-first responsive design
- 🔐 **Security**: Enterprise-grade security measures
- 📧 **Email**: Transactional email system
- 📊 **Analytics**: Order and user analytics
- 🎨 **Admin**: Comprehensive admin dashboard

## 🛠️ Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server |
| `npm run backend:dev` | Start backend development server |
| `npm run admin:dev` | Start admin dashboard |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production server |
| `npm run lint` | Run linting |
| `npm run test` | Run tests |
| `npm run install:all` | Install all dependencies |
| `npm run clean` | Clean node_modules |

## 📖 Documentation

- [Development Guide](docs/COMPLETE_DEVELOPMENT_DOCUMENTATION.md)
- [Payment Setup](docs/PAYMENT_SETUP_GUIDE.md)
- [Payment System](docs/PAYMENT_SYSTEM_ALL_FILES.md)
- [CMS Integration](docs/CMS_INTEGRATION_COMPLETE.md)

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/plugd
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Frontend tests
cd apps/frontend && npm run test

# Backend tests
cd apps/backend && npm run test
```

## 🚢 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your platform**
   - Frontend: Vercel, Netlify, or any static hosting
   - Backend: Railway, Heroku, DigitalOcean, or any Node.js hosting

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support, email support@plugd.com or join our Slack channel.

## 🔄 Migration from Previous Structure

If you're migrating from the previous structure:

1. **Import paths have changed:**
   - `../components/` → `../src/components/`
   - `../utils/` → `../src/utils/`
   - Backend imports now use `./src/` prefix

2. **Scripts have been updated:**
   - Check `package.json` for new script paths
   - Update any CI/CD configurations

3. **File locations:**
   - All frontend code is now in `apps/frontend/src/`
   - All backend code is now in `apps/backend/src/`
   - Documentation moved to `docs/`

---

**Made with ❤️ by the Plugd Team**