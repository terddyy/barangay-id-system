const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./digitalid.db');

(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);
    
    db.run(
      'INSERT OR REPLACE INTO resident_auth (residentId, idNumber, password_hash) VALUES (15, ?, ?)',
      ['21-2025-001', hash],
      (err) => {
        if (err) {
          console.error('Error creating auth account:', err);
        } else {
          console.log('✅ Auth account created successfully!');
          console.log('ID: 21-2025-001');
          console.log('Password: password123');
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Error:', error);
    db.close();
  }
})();
