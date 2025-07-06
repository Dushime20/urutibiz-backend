const fetch = require('node-fetch');

async function testCompleteVerificationWorkflow() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  console.log('🧪 Testing Complete UrutiBiz Verification & Document Management Workflow...\n');

  console.log('1. Testing User Verification Endpoints...');
  const userVerificationEndpoints = [
    { method: 'POST', path: '/user-verification/submit-documents', description: 'Submit documents for verification' },
    { method: 'GET', path: '/user-verification/status', description: 'Get verification status' },
    { method: 'PUT', path: '/user-verification/resubmit', description: 'Resubmit verification documents' },
    { method: 'GET', path: '/user-verification/documents', description: 'Get verification documents' },
    { method: 'GET', path: '/user-verification/history', description: 'Get verification history' }
  ];

  let endpointsWorking = 0;
  let endpointsMissing = 0;

  for (const endpoint of userVerificationEndpoints) {
    try {
      let body = null;
      if (endpoint.method === 'POST') {
        body = JSON.stringify({
          verificationType: 'national_id',
          documentNumber: 'TEST123'
        });
      } else if (endpoint.method === 'PUT') {
        body = JSON.stringify({
          verificationId: 'test-id',
          verificationType: 'national_id'
        });
      }

      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (response.status === 404) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path}: NOT FOUND`);
        endpointsMissing++;
      } else {
        console.log(`   ✅ ${endpoint.method} ${endpoint.path}: ${response.status} (${endpoint.description})`);
        endpointsWorking++;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
      endpointsMissing++;
    }
  }

  console.log('\n2. Testing Admin Verification Endpoints...');
  const adminVerificationEndpoints = [
    { method: 'GET', path: '/admin/verifications', description: 'List all verifications' },
    { method: 'GET', path: '/admin/verifications/pending', description: 'Get pending verifications' },
    { method: 'GET', path: '/admin/verifications/stats', description: 'Get verification statistics' },
    { method: 'POST', path: '/admin/verifications/bulk-review', description: 'Bulk review verifications' },
    { method: 'GET', path: '/admin/verifications/test-id', description: 'Get verification details' },
    { method: 'POST', path: '/admin/verifications/test-id/approve', description: 'Approve verification' },
    { method: 'POST', path: '/admin/verifications/test-id/reject', description: 'Reject verification' },
    { method: 'GET', path: '/admin/users/test-id/verifications', description: 'Get user verifications' },
    { method: 'PUT', path: '/admin/users/test-id/kyc-status', description: 'Update user KYC status' }
  ];

  for (const endpoint of adminVerificationEndpoints) {
    try {
      let body = null;
      if (endpoint.method === 'POST') {
        if (endpoint.path.includes('bulk-review')) {
          body = JSON.stringify({
            verificationIds: ['test1', 'test2'],
            status: 'verified'
          });
        } else if (endpoint.path.includes('reject')) {
          body = JSON.stringify({
            notes: 'Test rejection'
          });
        } else {
          body = JSON.stringify({
            notes: 'Test approval'
          });
        }
      } else if (endpoint.method === 'PUT') {
        body = JSON.stringify({
          kycStatus: 'verified'
        });
      }

      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (response.status === 404) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path}: NOT FOUND`);
        endpointsMissing++;
      } else {
        console.log(`   ✅ ${endpoint.method} ${endpoint.path}: ${response.status} (${endpoint.description})`);
        endpointsWorking++;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
      endpointsMissing++;
    }
  }

  console.log('\n3. Testing Document Management Endpoints...');
  const documentEndpoints = [
    { method: 'POST', path: '/documents/upload', description: 'Upload document' },
    { method: 'GET', path: '/documents', description: 'Get user documents' },
    { method: 'GET', path: '/documents/test-id', description: 'Get document by ID' },
    { method: 'DELETE', path: '/documents/test-id', description: 'Delete document' },
    { method: 'GET', path: '/documents/admin/list', description: 'Admin list documents' },
    { method: 'GET', path: '/documents/admin/test-id', description: 'Admin get document' },
    { method: 'PUT', path: '/documents/admin/test-id/status', description: 'Update document status' },
    { method: 'GET', path: '/documents/stats', description: 'Get document statistics' }
  ];

  for (const endpoint of documentEndpoints) {
    try {
      let body = null;
      if (endpoint.method === 'POST') {
        body = JSON.stringify({
          documentType: 'national_id',
          fileName: 'test.jpg',
          fileUrl: 'https://example.com/test.jpg'
        });
      } else if (endpoint.method === 'PUT') {
        body = JSON.stringify({
          uploadStatus: 'verified'
        });
      }

      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (response.status === 404) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path}: NOT FOUND`);
        endpointsMissing++;
      } else {
        console.log(`   ✅ ${endpoint.method} ${endpoint.path}: ${response.status} (${endpoint.description})`);
        endpointsWorking++;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
      endpointsMissing++;
    }
  }

  console.log('\n4. Testing Core System Endpoints...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`   ✅ GET /health: ${healthResponse.status} (Health check)`);
    endpointsWorking++;
  } catch (error) {
    console.log(`   ❌ GET /health: ERROR - ${error.message}`);
    endpointsMissing++;
  }

  try {
    const swaggerResponse = await fetch('http://localhost:3000/api-docs');
    console.log(`   ✅ GET /api-docs: ${swaggerResponse.status} (Swagger UI)`);
    endpointsWorking++;
  } catch (error) {
    console.log(`   ❌ GET /api-docs: ERROR - ${error.message}`);
    endpointsMissing++;
  }

  try {
    const swaggerJsonResponse = await fetch('http://localhost:3000/api-docs.json');
    console.log(`   ✅ GET /api-docs.json: ${swaggerJsonResponse.status} (Swagger JSON)`);
    endpointsWorking++;
  } catch (error) {
    console.log(`   ❌ GET /api-docs.json: ERROR - ${error.message}`);
    endpointsMissing++;
  }

  console.log('\n📊 IMPLEMENTATION SUMMARY');
  console.log('========================');
  console.log(`✅ Working Endpoints: ${endpointsWorking}`);
  console.log(`❌ Missing Endpoints: ${endpointsMissing}`);
  console.log(`📈 Success Rate: ${Math.round((endpointsWorking / (endpointsWorking + endpointsMissing)) * 100)}%`);

  if (endpointsMissing === 0) {
    console.log('\n🎉 SUCCESS: All verification and document management endpoints are implemented!');
  } else {
    console.log(`\n⚠️ WARNING: ${endpointsMissing} endpoints are still missing implementation.`);
  }

  console.log('\n🏁 Complete Verification Workflow Testing Complete!');
}

testCompleteVerificationWorkflow();
