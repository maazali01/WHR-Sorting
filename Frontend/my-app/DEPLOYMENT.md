# Frontend API Configuration

## Overview
The frontend is configured to work with both local development and production environments automatically.

## Backend URLs
- **Local Development**: `http://localhost:4000`
- **Production (Vercel)**: `https://whr-sorting.vercel.app`

## Configuration Files

### `.env.local` (Local Development - Not committed to Git)
```env
# Uncomment to use local backend during development
REACT_APP_API_URL=http://localhost:4000
```

### `.env.production` (Production Build)
```env
# Production backend URL
REACT_APP_API_URL=https://whr-sorting.vercel.app

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=817289312061-osqv2trem8ujie60mfb4rlt5k9980lul.apps.googleusercontent.com
```

### `.env` (Shared Configuration)
```env
# Backend API URL
# Leave commented to use automatic detection (localhost in dev, production in build)
# Uncomment to override:
# REACT_APP_API_URL=http://localhost:4000
# REACT_APP_API_URL=https://whr-sorting.vercel.app

# Google OAuth Client ID
REACT_APP_GOOGLE_CLIENT_ID=817289312061-osqv2trem8ujie60mfb4rlt5k9980lul.apps.googleusercontent.com
```

## How It Works

### Automatic Environment Detection
The app automatically detects whether it's running in development or production mode:

1. **Development** (`npm start`):
   - Uses `.env.local` if present
   - Otherwise defaults to `http://localhost:4000`

2. **Production** (`npm run build`):
   - Uses `.env.production`
   - Defaults to `https://whr-sorting.vercel.app`

### Centralized API Configuration
All API calls use the centralized configuration from `src/config/api.js`:

```javascript
import API_URL from '../config/api';

// Example usage:
const response = await axios.get(`${API_URL}/user/products`);
```

## Development Workflow

### Local Development with Local Backend
```bash
cd Frontend/my-app
npm start
```
The app will use `http://localhost:4000` automatically.

### Local Development with Production Backend
To test against the production backend locally, update `.env.local`:
```env
REACT_APP_API_URL=https://whr-sorting.vercel.app
```

### Production Build
```bash
cd Frontend/my-app
npm run build
```
The build will use `https://whr-sorting.vercel.app` automatically.

## Vercel Deployment

### Environment Variables in Vercel
Configure these in your Vercel project settings:

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add the following:
   - `REACT_APP_API_URL` = `https://whr-sorting.vercel.app`
   - `REACT_APP_GOOGLE_CLIENT_ID` = `817289312061-osqv2trem8ujie60mfb4rlt5k9980lul.apps.googleusercontent.com`

### Deploy Command
```bash
npm run build
```

## Files Updated

All files now use the centralized API_URL configuration:

### Authentication
- `LoginSignup/Login.js`
- `LoginSignup/Signup.js`
- `LoginSignup/AdminLogin.js`
- `LoginSignup/GoogleSuccess.js`

### User Pages
- `HomePage/ProductList.js`
- `CheckoutPage/CheckoutPage.js`
- `NavBar/navbar.js`
- `User/Dashboard.js`
- `User/userorders.js`
- `User/userprofile.js`

### Admin Pages
- `Admin/AdminPanel.js`
- `Admin/Dashboard.js`
- `Admin/ProductList.js`
- `Admin/Orders.js`
- `Admin/AIModels.js`
- `Admin/Analytics.js`
- `Admin/Logs.js`
- `Admin/UserManagement.js`
- `Admin/Sidebar.js`
- `Admin/Webots.js`

## Testing

### Test Local Backend Connection
1. Start your backend: `cd Backend && npm start`
2. Start your frontend: `cd Frontend/my-app && npm start`
3. The app should connect to `http://localhost:4000`

### Test Production Backend Connection
1. Update `.env.local` to use production URL
2. Start your frontend: `cd Frontend/my-app && npm start`
3. The app should connect to `https://whr-sorting.vercel.app`

## Troubleshooting

### API calls failing
1. Check which API URL is being used in browser console
2. Verify backend is running (local or production)
3. Check CORS settings on backend
4. Verify environment variables are set correctly

### Environment variables not updating
1. Stop the development server
2. Delete `.env.local` or update it
3. Restart: `npm start`

### Production build not using correct URL
1. Check `.env.production` file
2. Verify Vercel environment variables
3. Rebuild: `npm run build`
