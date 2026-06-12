const app = require('./app');
const http = require('http');
require('dotenv').config();

const PORT = 5001;
let server;

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`📡 Test server running on http://localhost:${PORT}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('📡 Test server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function runTests() {
  const baseUrl = `http://localhost:${PORT}/api`;
  console.log('🚀 Starting Integration Tests against live Supabase database...');

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData);

    // 2. Login as Admin
    console.log('🔑 Logging in as Admin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Admin login failed: ${loginData.message}`);
    const token = loginData.data.token;
    console.log('✅ Admin login succeeded. Token acquired.');

    // 3. Create a Lead
    console.log('📝 Creating a new lead...');
    const createRes = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Lead Integration',
        email: 'test_integration@example.com',
        phone: '1234567890',
        source: 'web',
        notes: 'Test notes'
      }),
    });
    const createData = await createRes.json();
    if (!createData.success) throw new Error(`Lead creation failed: ${createData.message}`);
    const lead = createData.data;
    console.log(`✅ Lead created and assigned: ${lead.name} (Assigned to: ${lead.assigned_to || 'Unassigned'})`);

    // 4. Get Lead by ID
    console.log(`🔍 Fetching lead ID: ${lead.id}...`);
    const getRes = await fetch(`${baseUrl}/leads/${lead.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json();
    console.log('✅ Fetch lead succeeded:', getData.data.name);

    // 5. Export Leads CSV
    console.log('📊 Exporting leads to CSV...');
    const exportRes = await fetch(`${baseUrl}/leads/export`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const csvData = await exportRes.text();
    console.log('✅ Export CSV response length:', csvData.length, 'bytes');
    if (!csvData.includes('Name,Email,Phone,Source')) {
      throw new Error('CSV output does not contain expected header columns');
    }
    console.log('✅ CSV Headers & Content matches requirements.');

    // 6. Delete Lead (Soft Delete)
    console.log(`🗑️ Soft-deleting lead ID: ${lead.id}...`);
    const deleteRes = await fetch(`${baseUrl}/leads/${lead.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteData = await deleteRes.json();
    console.log('✅ Delete lead response:', deleteData.data);

    // 7. Verify Lead is not accessible
    console.log('🔍 Verifying lead is soft-deleted...');
    const verifyRes = await fetch(`${baseUrl}/leads/${lead.id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyData = await verifyRes.json();
    if (verifyRes.status === 404) {
      console.log('✅ Verification succeeded: Lead returned 404 (Not Found) after soft delete!');
    } else {
      throw new Error(`Verification failed: Expected 404 but got status ${verifyRes.status}`);
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test execution failed:', err.message);
  }
}

async function main() {
  await startServer();
  await runTests();
  await stopServer();
}

main();
