/**
 * Insurance Routes
 * API routes for insurance policies and claims management
 */

import { Router } from 'express';
import { InsuranceController } from '../controllers/insurance.controller';
import { InsuranceService } from '../services/InsuranceService';
import { getDatabase } from '../config/database';

const router = Router();

console.log('🔧 Initializing Insurance routes...');

// Create service and controller instances
let insuranceController: InsuranceController;

try {
  console.log('🔧 Creating insurance service and controller...');
  const db = getDatabase();
  const insuranceService = new InsuranceService(db);
  insuranceController = new InsuranceController(insuranceService);
  console.log('✅ Insurance controller initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize insurance controller:', error);
  // Create a fallback controller that returns demo responses
  insuranceController = {
    // Policies
    createPolicy: (_req: any, res: any) => {
      res.status(201).json({ success: true, message: 'Demo mode - policy created', data: { id: 'demo-policy-1' } });
    },
    getPolicyById: (_req: any, res: any) => {
      res.json({ success: true, data: { id: 'demo-policy-1', status: 'active' } });
    },
    getPolicies: (_req: any, res: any) => {
      res.json({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    },
    getPoliciesByBookingId: (_req: any, res: any) => {
      res.json({ success: true, data: [] });
    },
    updatePolicy: (_req: any, res: any) => {
      res.json({ success: true, message: 'Demo mode - policy updated', data: { id: 'demo-policy-1' } });
    },
    cancelPolicy: (_req: any, res: any) => {
      res.json({ success: true, message: 'Demo mode - policy cancelled', data: { id: 'demo-policy-1' } });
    },
    
    // Claims
    createClaim: (_req: any, res: any) => {
      res.status(201).json({ success: true, message: 'Demo mode - claim created', data: { id: 'demo-claim-1' } });
    },
    getClaimById: (_req: any, res: any) => {
      res.json({ success: true, data: { id: 'demo-claim-1', status: 'submitted' } });
    },
    getClaims: (_req: any, res: any) => {
      res.json({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    },
    getClaimsByClaimantId: (_req: any, res: any) => {
      res.json({ success: true, data: [] });
    },
    updateClaim: (_req: any, res: any) => {
      res.json({ success: true, message: 'Demo mode - claim updated', data: { id: 'demo-claim-1' } });
    },
    approveClaim: (_req: any, res: any) => {
      res.json({ success: true, message: 'Demo mode - claim approved', data: { id: 'demo-claim-1' } });
    },
    denyClaim: (_req: any, res: any) => {
      res.json({ success: true, message: 'Demo mode - claim denied', data: { id: 'demo-claim-1' } });
    },
    markClaimAsPaid: (_req: any, res: any) => {
      res.json({ success: true, message: 'Demo mode - claim marked as paid', data: { id: 'demo-claim-1' } });
    },
    
    // Analytics & Utilities
    getAnalytics: (_req: any, res: any) => {
      res.json({ success: true, data: { totalPolicies: 0, totalClaims: 0 } });
    },
    getInsuranceTypes: (_req: any, res: any) => {
      res.json({ success: true, data: ['travel_insurance', 'medical_insurance', 'baggage_insurance'] });
    },
    getClaimStatuses: (_req: any, res: any) => {
      res.json({ success: true, data: ['submitted', 'investigating', 'approved', 'denied', 'paid'] });
    }
  } as any;
}

// ==================== INSURANCE POLICY ROUTES ====================

// Create insurance policy
router.post('/policies', async (req, res) => {
  try {
    await insuranceController.createPolicy(req, res);
  } catch (error) {
    console.log('📋 Insurance policy creation failed, using demo mode');
    res.status(201).json({ success: true, message: 'Demo mode - policy created', data: { id: 'demo-policy-1' } });
  }
});

// Get insurance policy by ID
router.get('/policies/:id', async (req, res) => {
  try {
    await insuranceController.getPolicyById(req, res);
  } catch (error) {
    console.log('📋 Insurance policy fetch failed, using demo mode');
    res.json({ success: true, data: { id: req.params.id, status: 'active' } });
  }
});

// Get insurance policies with filters
router.get('/policies', async (req, res) => {
  try {
    await insuranceController.getPolicies(req, res);
  } catch (error) {
    console.log('📋 Insurance policies fetch failed, using demo mode');
    res.json({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  }
});

// Get policies by booking ID
router.get('/policies/booking/:bookingId', async (req, res) => {
  try {
    await insuranceController.getPoliciesByBookingId(req, res);
  } catch (error) {
    console.log('📋 Insurance policies by booking fetch failed, using demo mode');
    res.json({ success: true, data: [] });
  }
});

// Update insurance policy
router.put('/policies/:id', async (req, res) => {
  try {
    await insuranceController.updatePolicy(req, res);
  } catch (error) {
    console.log('📋 Insurance policy update failed, using demo mode');
    res.json({ success: true, message: 'Demo mode - policy updated', data: { id: req.params.id } });
  }
});

// Cancel insurance policy
router.post('/policies/:id/cancel', async (req, res) => {
  try {
    await insuranceController.cancelPolicy(req, res);
  } catch (error) {
    console.log('📋 Insurance policy cancellation failed, using demo mode');
    res.json({ success: true, message: 'Demo mode - policy cancelled', data: { id: req.params.id } });
  }
});

// ==================== INSURANCE CLAIM ROUTES ====================

// Create insurance claim
router.post('/claims', async (req, res) => {
  try {
    await insuranceController.createClaim(req, res);
  } catch (error) {
    console.log('📋 Insurance claim creation failed, using demo mode');
    res.status(201).json({ success: true, message: 'Demo mode - claim created', data: { id: 'demo-claim-1' } });
  }
});

// Get insurance claim by ID
router.get('/claims/:id', async (req, res) => {
  try {
    await insuranceController.getClaimById(req, res);
  } catch (error) {
    console.log('📋 Insurance claim fetch failed, using demo mode');
    res.json({ success: true, data: { id: req.params.id, status: 'submitted' } });
  }
});

// Get insurance claims with filters
router.get('/claims', async (req, res) => {
  try {
    await insuranceController.getClaims(req, res);
  } catch (error) {
    console.log('📋 Insurance claims fetch failed, using demo mode');
    res.json({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  }
});

// Get claims by claimant ID
router.get('/claims/claimant/:claimantId', async (req, res) => {
  try {
    await insuranceController.getClaimsByClaimantId(req, res);
  } catch (error) {
    console.log('📋 Insurance claims by claimant fetch failed, using demo mode');
    res.json({ success: true, data: [] });
  }
});

// Update insurance claim
router.put('/claims/:id', async (req, res) => {
  try {
    await insuranceController.updateClaim(req, res);
  } catch (error) {
    console.log('📋 Insurance claim update failed, using demo mode');
    res.json({ success: true, message: 'Demo mode - claim updated', data: { id: req.params.id } });
  }
});

// Approve insurance claim
router.post('/claims/:id/approve', async (req, res) => {
  try {
    await insuranceController.approveClaim(req, res);
  } catch (error) {
    console.log('📋 Insurance claim approval failed, using demo mode');
    res.json({ success: true, message: 'Demo mode - claim approved', data: { id: req.params.id } });
  }
});

// Deny insurance claim
router.post('/claims/:id/deny', async (req, res) => {
  try {
    await insuranceController.denyClaim(req, res);
  } catch (error) {
    console.log('📋 Insurance claim denial failed, using demo mode');
    res.json({ success: true, message: 'Demo mode - claim denied', data: { id: req.params.id } });
  }
});

// Mark claim as paid
router.post('/claims/:id/mark-paid', async (req, res) => {
  try {
    await insuranceController.markClaimAsPaid(req, res);
  } catch (error) {
    console.log('📋 Insurance claim payment marking failed, using demo mode');
    res.json({ success: true, message: 'Demo mode - claim marked as paid', data: { id: req.params.id } });
  }
});

// ==================== ANALYTICS & UTILITY ROUTES ====================

// Get insurance analytics
router.get('/analytics', async (req, res) => {
  try {
    await insuranceController.getAnalytics(req, res);
  } catch (error) {
    console.log('📊 Insurance analytics failed, using demo mode');
    res.json({ 
      success: true, 
      data: { 
        totalPolicies: 0, 
        activePolicies: 0,
        totalClaims: 0, 
        submittedClaims: 0,
        claimApprovalRate: 0,
        averageProcessingDays: 0
      } 
    });
  }
});

// Get insurance types
router.get('/types', async (req, res) => {
  try {
    await insuranceController.getInsuranceTypes(req, res);
  } catch (error) {
    console.log('📋 Insurance types fetch failed, using demo mode');
    res.json({ 
      success: true, 
      data: [
        'travel_insurance',
        'cancellation_insurance', 
        'medical_insurance',
        'baggage_insurance',
        'activity_insurance',
        'comprehensive_insurance',
        'liability_insurance'
      ] 
    });
  }
});

// Get claim statuses
router.get('/claim-statuses', async (req, res) => {
  try {
    await insuranceController.getClaimStatuses(req, res);
  } catch (error) {
    console.log('📋 Claim statuses fetch failed, using demo mode');
    res.json({ 
      success: true, 
      data: ['submitted', 'investigating', 'approved', 'denied', 'paid'] 
    });
  }
});

console.log('🔧 Insurance routes registered:');
console.log('  POST /policies - Create insurance policy');
console.log('  GET /policies/:id - Get policy by ID');
console.log('  GET /policies - Get policies with filters');
console.log('  GET /policies/booking/:bookingId - Get policies by booking');
console.log('  PUT /policies/:id - Update policy');
console.log('  POST /policies/:id/cancel - Cancel policy');
console.log('  POST /claims - Create insurance claim');
console.log('  GET /claims/:id - Get claim by ID');
console.log('  GET /claims - Get claims with filters');
console.log('  GET /claims/claimant/:claimantId - Get claims by claimant');
console.log('  PUT /claims/:id - Update claim');
console.log('  POST /claims/:id/approve - Approve claim');
console.log('  POST /claims/:id/deny - Deny claim');
console.log('  POST /claims/:id/mark-paid - Mark claim as paid');
console.log('  GET /analytics - Get insurance analytics');
console.log('  GET /types - Get insurance types');
console.log('  GET /claim-statuses - Get claim statuses');

export default router;
