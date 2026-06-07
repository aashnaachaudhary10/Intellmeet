# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository connected to Vercel
- Backend API running and deployed (for production)

## Setup Steps

### 1. Connect GitHub Repository
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### 2. Configure Environment Variables
In the Vercel dashboard for your project:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

#### For Production:
```
Name: VITE_SERVER_URL
Value: https://your-backend-domain.com
```

```
Name: VITE_API_URL
Value: https://your-backend-domain.com
```

#### For Preview/Development:
```
Name: VITE_SERVER_URL
Value: http://localhost:5000
Environments: Preview
```

```
Name: VITE_API_URL
Value: http://localhost:5000
Environments: Preview
```

### 3. Build Configuration
The project is pre-configured with:
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

These settings are in `vercel.json`

### 4. Handle API Rewrites
Update the rewrite rule in `vercel.json`:

```json
"rewrites": [
  {
    "source": "/api/(.*)",
    "destination": "https://your-backend-domain.com/api/$1"
  }
]
```

Replace `https://your-backend-domain.com` with your actual backend URL.

### 5. Deploy
1. Push your changes to GitHub
2. Vercel will automatically deploy on every push to main branch
3. Preview deployments are created for pull requests

## SSL/HTTPS
- Vercel automatically provides free SSL certificates
- All deployments are HTTPS by default

## Optimize Performance
The following optimizations are already in place:

✓ **Code Splitting**: Vendor chunks separated for better caching
- `react-vendor.js` - React libraries
- `ui-vendor.js` - UI component libraries
- `form-vendor.js` - Form handling libraries
- `tanstack-query.js` - Data fetching
- `ai-vendor.js` - AI/Gemini libraries

✓ **Asset Caching**: Static assets cached for 1 year
✓ **Security Headers**: Security headers configured
✓ **TypeScript**: Strict configuration for type safety

## Environment Variable Notes
- Variables starting with `VITE_` are exposed to the browser
- Never commit `.env` files with sensitive data to Git
- Use `.env.local` for local development (not committed)

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Verify build locally: `npm run build`
- Check build logs in Vercel dashboard

### API Calls Not Working
- Verify environment variables are set in Vercel dashboard
- Check that backend API URL is correct and accessible
- Ensure CORS is properly configured on backend

### Large Bundle Size
The main bundle is optimized with manual chunks. Monitor and optimize:
- Lazy load heavy components
- Use dynamic imports for code splitting
- Analyze bundle: `npm run build` shows chunk sizes

## Additional Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
