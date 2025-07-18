
/**
 * Netlify Function: Load Bridal Products
 * 
 * Loads bridal products from Firebase Storage
 * Handles GET requests to /.netlify/functions/load-products-bridal
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // For Netlify, we'll use environment variables
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID || 'auric-a0c92',
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CERT_URL
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'auric-a0c92.firebasestorage.app'
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed'
      })
    };
  }

  try {
    console.log('Loading bridal products from Cloud Storage...');
    
    // Get Firebase Storage bucket
    const bucket = admin.storage().bucket();
    
    // Try to download the bridal products JSON file
    const file = bucket.file('productData/bridal-products.json');
    
    // Check if file exists
    const [exists] = await file.exists();
    
    if (!exists) {
      console.log('No bridal products file found, returning empty array');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          products: [],
          message: 'No products found'
        })
      };
    }

    // Download and parse the file
    const [fileContents] = await file.download();
    const products = JSON.parse(fileContents.toString());

    console.log(`Successfully loaded ${products.length} bridal products`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        products: Array.isArray(products) ? products : []
      })
    };

  } catch (error) {
    console.error('Error loading bridal products:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        products: [],
        error: error.message
      })
    };
  }
};
