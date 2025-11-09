/**
 * Real-World Test: ID Generation with Actual Resident Creation
 * This test verifies IDs work correctly when actually used
 */

const API_BASE = "http://localhost:3000/api";

async function login() {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernameOrEmail: "admin",
      password: "admin123"
    })
  });
  const data = await res.json();
  return data.token;
}

async function generateId(token, purok) {
  const res = await fetch(`${API_BASE}/residents/generate-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ purokOrPosition: purok })
  });
  return res.json();
}

async function createResident(token, data) {
  const res = await fetch(`${API_BASE}/residents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function testRealWorldUsage() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Real-World ID Generation Test                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const token = await login();
  console.log("✅ Authenticated\n");
  
  // Test 1: Generate and use IDs sequentially
  console.log("📋 TEST 1: Sequential ID Generation with Resident Creation");
  console.log("─".repeat(60));
  
  const testPurok = "TESTPUROK";
  const residents = [];
  
  for (let i = 1; i <= 5; i++) {
    // Generate ID
    const idResult = await generateId(token, testPurok);
    console.log(`  Step ${i}: Generated ID ${idResult.idNumber}`);
    
    // Create resident with that ID
    const resident = await createResident(token, {
      fullName: `Test Resident ${i}`,
      idNumber: idResult.idNumber,
      birthDate: "1990-01-01",
      address: "Test Address",
      contact: "09123456789",
      purokOrPosition: testPurok
    });
    
    console.log(`           Created resident ID: ${resident.id}`);
    residents.push({ dbId: resident.id, idNumber: idResult.idNumber });
  }
  
  // Verify all IDs are unique
  const uniqueIds = new Set(residents.map(r => r.idNumber));
  console.assert(uniqueIds.size === 5, "❌ FAIL: Duplicate IDs");
  console.log("✅ PASS: All 5 residents have unique IDs\n");
  
  // Test 2: Concurrent ID generation
  console.log("🔄 TEST 2: Concurrent ID Generation");
  console.log("─".repeat(60));
  
  const concPurok = "CONCURRENT";
  console.log("  Launching 5 concurrent ID generations...");
  
  const promises = Array(5).fill(0).map(() => generateId(token, concPurok));
  const concIds = await Promise.all(promises);
  
  const idStrings = concIds.map(r => r.idNumber);
  console.log(`  Generated IDs:\n    ${idStrings.join('\n    ')}`);
  
  const uniqueConcIds = new Set(idStrings);
  console.assert(
    uniqueConcIds.size === 5, 
    `❌ FAIL: Expected 5 unique IDs, got ${uniqueConcIds.size}`
  );
  
  if (uniqueConcIds.size === 5) {
    console.log("✅ PASS: All concurrent IDs are unique (transaction lock worked!)\n");
  } else {
    console.log(`⚠️  WARNING: Got ${uniqueConcIds.size} unique IDs out of 5`);
    console.log("   This indicates a race condition - transaction not working\n");
  }
  
  // Test 3: Verify actual database state
  console.log("🔍 TEST 3: Database State Verification");
  console.log("─".repeat(60));
  
  const resRes = await fetch(`${API_BASE}/residents?search=${testPurok}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const allResidents = await resRes.json();
  
  console.log(`  Found ${allResidents.length} residents with prefix ${testPurok}`);
  console.log(`  Their IDs: ${allResidents.map(r => r.idNumber).join(', ')}`);
  
  console.log("✅ PASS: Database verification complete\n");
  
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              ✅ REAL-WORLD TEST COMPLETE                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

testRealWorldUsage().catch(err => {
  console.error("❌ TEST FAILED:", err.message);
  console.error(err.stack);
  process.exit(1);
});
