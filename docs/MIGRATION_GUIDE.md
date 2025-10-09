# Project Restructure Migration Guide

## Overview

This document guides you through the migration from the old flat project structure to the new standardized monorepo architecture.

## 🏗️ Structure Changes

### Before (Old Structure)
```
plugd-website/
├── components/
├── pages/
├── styles/
├── backend/
├── frontend/
├── models/
├── routes/
├── middleware/
├── services/
├── utils/
├── database/
├── admin/
└── integration/
```

### After (New Structure)
```
plugd-website/
├── apps/
│   ├── frontend/src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   ├── backend/src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   └── admin/
├── packages/shared/
├── docs/
└── scripts/
```

## 📁 File Mapping

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `/components/` | `/apps/frontend/src/components/` | React components |
| `/pages/` | `/apps/frontend/src/pages/` | Next.js pages |
| `/styles/` | `/apps/frontend/src/styles/` | CSS/SCSS files |
| `/frontend/src/` | `/apps/frontend/src/` | Frontend source |
| `/backend/` | `/apps/backend/` | Backend package |
| `/models/` | `/apps/backend/src/models/` | Database models |
| `/routes/` | `/apps/backend/src/routes/` | API routes |
| `/middleware/` | `/apps/backend/src/middleware/` | Express middleware |
| `/services/` | `/apps/backend/src/services/` | Business logic |
| `/utils/` | `/apps/backend/src/utils/` | Backend utilities |
| `/database/` | `/apps/backend/src/config/` | Database config |
| `/admin/` | `/apps/admin/` | Admin dashboard |
| `/integration/` | `/packages/shared/` | Shared integrations |
| `/*.md` | `/docs/` | Documentation |

## 🔧 Configuration Updates

### Package.json Scripts
Scripts have been updated to reflect the new structure:

**Old:**
```json
{
  "scripts": {
    "dev": "cd frontend && npm run dev",
    "backend:dev": "cd backend && npm run dev"
  }
}
```

**New:**
```json
{
  "scripts": {
    "dev": "cd apps/frontend && npm run dev",
    "backend:dev": "cd apps/backend && npm run dev",
    "admin:dev": "cd apps/admin && npm start"
  }
}
```

### Import Path Changes

**Frontend Imports:**
```javascript
// Old
import Component from '../components/Component'
import { utility } from '../utils/helpers'

// New
import Component from '../src/components/Component'
import { utility } from '../src/utils/helpers'
```

**Backend Imports:**
```javascript
// Old
const Model = require('./models/Model')
const middleware = require('./middleware/auth')

// New
const Model = require('./src/models/Model')
const middleware = require('./src/middleware/auth')
```

## 🚀 Migration Steps

### 1. Backup Your Project
```bash
# Create a backup
cp -r plugd-website plugd-website-backup
```

### 2. Update Import Statements

**Frontend Files:**
- Update all relative imports to include `src/` prefix
- Check component imports in pages
- Update utility function imports

**Backend Files:**
- Update all relative imports to include `src/` prefix
- Check route imports in main server file
- Update model imports in controllers

### 3. Update Configuration Files

**Frontend (apps/frontend/):**
- Update `next.config.js` if present
- Update any build configurations
- Check Tailwind config paths

**Backend (apps/backend/):**
- Update main entry point in `package.json`
- Update any nodemon configurations
- Check database connection paths

### 4. Update CI/CD Configurations

**GitHub Actions / GitLab CI:**
```yaml
# Old
- name: Install frontend dependencies
  run: cd frontend && npm install

# New
- name: Install frontend dependencies
  run: cd apps/frontend && npm install
```

**Docker Files:**
```dockerfile
# Old
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# New
COPY apps/frontend/ ./apps/frontend/
COPY apps/backend/ ./apps/backend/
```

### 5. Update Environment Variables

**Development:**
- Move `.env` files to respective app directories
- Update any absolute paths in environment variables

**Production:**
- Update deployment scripts
- Update server configuration paths

## 🧪 Testing Migration

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Test Development Servers
```bash
# Test frontend
npm run dev

# Test backend
npm run backend:dev

# Test admin
npm run admin:dev
```

### 3. Test Build Process
```bash
npm run build
```

### 4. Test Production
```bash
npm run start
```

## 🔍 Common Issues & Solutions

### Import Path Errors
**Problem:** Module not found errors after restructure
**Solution:** Update all relative imports to include new paths

### Build Failures
**Problem:** Build process fails due to incorrect paths
**Solution:** Update build configurations and package.json scripts

### Database Connection Issues
**Problem:** Can't connect to database after moving files
**Solution:** Update database configuration paths in backend

### Static Asset Loading
**Problem:** Images/assets not loading in frontend
**Solution:** Check public folder structure and asset imports

## ✅ Migration Checklist

- [ ] Backed up original project
- [ ] Updated all import statements
- [ ] Updated package.json scripts
- [ ] Updated configuration files
- [ ] Updated CI/CD configurations
- [ ] Updated environment variables
- [ ] Tested development servers
- [ ] Tested build process
- [ ] Tested production deployment
- [ ] Updated documentation
- [ ] Verified all functionality works

## 🎯 Benefits of New Structure

1. **Better Organization:** Clear separation of concerns
2. **Scalability:** Easier to add new applications
3. **Maintainability:** Standard monorepo structure
4. **Development Experience:** Better tooling support
5. **Deployment:** Independent deployment strategies
6. **Collaboration:** Clearer ownership boundaries

## 🆘 Getting Help

If you encounter issues during migration:

1. Check the console for specific error messages
2. Verify file paths are correctly updated
3. Ensure all dependencies are installed
4. Review this migration guide step by step
5. Check the project's GitHub issues for similar problems

## 📚 Additional Resources

- [Monorepo Best Practices](https://monorepo.tools/)
- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Migration completed successfully! 🎉**