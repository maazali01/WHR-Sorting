// Determine if we're in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Local backend URL for development
const LOCAL_API_URL = 'http://localhost:4000';

// Production backend URL (deployed on Vercel)
const PRODUCTION_API_URL = 'https://whr-sorting.vercel.app';

// Use environment variable if set, otherwise use based on NODE_ENV
const API_URL = process.env.REACT_APP_API_URL || 
  (isDevelopment ? LOCAL_API_URL : PRODUCTION_API_URL);

// Debug logging (can be removed in production)
console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  isDevelopment,
  API_URL
});

export default API_URL;
