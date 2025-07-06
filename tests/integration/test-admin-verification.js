const fetch = require('node-fetch');

async function testAdminVerificationEndpoints() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  console.log('🧪 Testing UrutiBiz Admin Verification Endpoints...\n');

  // Test the admin verification endpoints
  console.log('1. Testing Admin Verification Endpoints...');
  
  const adminEndpoints = [
    { method: 'GET', path: '/admin/verifications', description: 'List all verifications' },
    { method: 'GET', path: '/admin/verifications/:id', description: 'Get verification details' },
    { method: 'POST', path: '/admin/verifications/:id/review', description: 'Review verification' },
    { method: 'POST', path: '/admin/verifications/:id/approve', description: 'Approve verification' },
    { method: 'POST', path: '/admin/verifications/:id/reject', description: 'Reject verification' },
    { method: 'GET', path: '/admin/verifications/pending', description: 'Get pending verifications' },
    { method: 'GET', path: '/admin/verifications/stats', description: 'Get verification statistics' },
    { method: 'POST', path: '/admin/verifications/bulk-review', description: 'Bulk review verifications' },
    { method: 'GET', path: '/admin/users/:id/verifications', description: 'Get user verifications' },
    { method: 'PUT', path: '/admin/users/:id/kyc-status', description: 'Update user KYC status' }
  ];

  for (const endpoint of adminEndpoints) {
    try {
      const testPath = endpoint.path.replace(':id', 'test-id');
      let body = null;
      const headers = { 'Content-Type': 'application/json' };

      if (endpoint.method === 'POST') {
        if (endpoint.path.includes('review') || endpoint.path.includes('approve') || endpoint.path.includes('reject')) {
          body = JSON.stringify({
            status: 'verified',
            notes: 'Test review'
          });
        } else if (endpoint.path.includes('bulk-review')) {
          body = JSON.stringify({
            verificationIds: ['test1', 'test2'],
            status: 'verified',
            notes: 'Bulk review'
          });
        }
      } else if (endpoint.method === 'PUT') {
        body = JSON.stringify({
          kycStatus: 'verified'
        });
      }

      const response = await fetch(`${baseUrl}${testPath}`, {
        method: endpoint.method,
        headers,
        body
      });

      console.log(`   ${endpoint.method} ${endpoint.path}: ${response.status} - ${endpoint.description}`);
      
      if (response.status === 200) {
        console.log(`      ✅ SUCCESS - Endpoint working correctly`);
      } else if (response.status === 401) {
        console.log(`      🔐 UNAUTHORIZED - Authentication required (expected)`);
      } else if (response.status === 403) {
        console.log(`      🚫 FORBIDDEN - Admin access required (expected)`);
      } else if (response.status === 404) {
        console.log(`      ❌ NOT FOUND - Endpoint missing`);
      } else if (response.status === 500) {
        console.log(`      ⚠️ SERVER ERROR - Internal error`);
      } else {
        console.log(`      ⚠️ Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.log(`   ${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
    }
  }

  console.log('\n🏁 Admin Verification Endpoint Testing Complete!');
}

testAdminVerificationEndpoints();
