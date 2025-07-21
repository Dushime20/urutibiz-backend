import { Router } from 'express';

// Import route modules
import authRoutes from './auth.routes';
import userRoutes from './users.routes';
import productRoutes from './products.routes';
import bookingRoutes from './bookings.routes';
import userVerificationRoutes from './userVerification.routes';
import adminRoutes from './admin.routes';
import adminVerificationRoutes from './adminVerification.routes';
import documentManagementRoutes from './documentManagement.routes';
import categoriesRoutes from './categories.routes';
import productImagesRoutes from './productImages.routes';
import productAvailabilityRoutes from './productAvailability.routes';
import businessRulesRoutes from './businessRules.routes';
import countryRoutes from './country.routes';
import administrativeDivisionRoutes from './administrativeDivision.routes';
import verificationDocumentTypeRoutes from './verificationDocumentType.routes';
import paymentProviderRoutes from './paymentProvider.routes';
import paymentMethodRoutes from './paymentMethod.routes';
import paymentTransactionRoutes from './paymentTransaction.routes';
import reviewRoutes from './review.routes';
import productPriceRoutes from './productPrice.routes';
import categoryRegulationRoutes from './categoryRegulation.routes';
import insuranceProviderRoutes from './insuranceProvider.routes';
import insuranceRoutes from './insurance.routes';
import localizationRoutes from './localization.routes';
import aiRecommendationRoutes from './aiRecommendation.routes';
import performanceRoutes from './performance.routes';

const router = Router();

console.log('🔧 Initializing routes...');

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
// Test route to verify routing is working
router.get('/test', (_req, res) => {
  res.json({ success: true, message: 'Test route working', timestamp: new Date().toISOString() });
});
router.use('/products', productRoutes);
router.use('/bookings', bookingRoutes);
router.use('/user-verification', userVerificationRoutes);
router.use('/admin', adminRoutes); // Use the main admin routes
router.use('/admin/verification', adminVerificationRoutes); // Mount admin verification as a sub-route
router.use('/documents', documentManagementRoutes);
router.use('/categories', categoriesRoutes);
router.use('/product-images', productImagesRoutes);
router.use('/product-availability', productAvailabilityRoutes);
router.use('/business-rules', businessRulesRoutes);
router.use('/countries', countryRoutes);
router.use('/administrative-divisions', administrativeDivisionRoutes);
router.use('/verification-document-types', verificationDocumentTypeRoutes);
router.use('/payment-providers', paymentProviderRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/payment-transactions', paymentTransactionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/product-prices', productPriceRoutes);
router.use('/category-regulations', categoryRegulationRoutes);
router.use('/insurance-providers', insuranceProviderRoutes);
console.log('🔧 Mounting Insurance routes at /insurance');
router.use('/insurance', insuranceRoutes);
router.use('/localization', localizationRoutes);
console.log('🔧 Mounting AI routes at /ai');
router.use('/ai', aiRecommendationRoutes);
console.log('🔧 Mounting Performance routes at /performance');
router.use('/performance', performanceRoutes);

// Placeholder routes - remove when actual routes are implemented
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'UrutiBiz API v1.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      products: '/api/v1/products',
      bookings: '/api/v1/bookings',
      countries: '/api/v1/countries',
      administrative_divisions: '/api/v1/administrative-divisions',
      verification_document_types: '/api/v1/verification-document-types',
      payment_providers: '/api/v1/payment-providers',
      payment_methods: '/api/v1/payment-methods',
      payment_transactions: '/api/v1/payment-transactions',
      product_prices: '/api/v1/product-prices',
      category_regulations: '/api/v1/category-regulations',
      localization: '/api/v1/localization',
      payments: '/api/v1/payments',
      reviews: '/api/v1/reviews',
      messages: '/api/v1/messages',
      ai: '/api/v1/ai',
      admin: '/api/v1/admin',
      analytics: '/api/v1/analytics',
    },
  });
});

console.log('🔧 Routes initialized successfully');
export default router;
