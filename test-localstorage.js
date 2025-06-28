// Test script to verify localStorage database functionality
console.log("Testing localStorage database...");

// Simulate the API service database methods
function getDatabase() {
  const db = localStorage.getItem("devinquireDB");
  return db ? JSON.parse(db) : { users: [], pendingUsers: [] };
}

function saveDatabase(db) {
  localStorage.setItem("devinquireDB", JSON.stringify(db));
}

function hashPassword(password) {
  return btoa(password + "salt");
}

// Initialize database with default admin user
function initializeDatabase() {
  const db = getDatabase();

  if (!db.users || db.users.length === 0) {
    console.log("Initializing database with default admin user...");
    db.users = [
      {
        id: 1,
        name: "Admin User",
        email: "admin@devinquire.com",
        password: hashPassword("admin123"),
        role: "admin",
        status: "approved",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    saveDatabase(db);
    console.log("Database initialized with admin user:", db.users[0].email);
  } else {
    console.log("Database already initialized with", db.users.length, "users");
  }

  if (!db.pendingUsers) {
    db.pendingUsers = [];
    saveDatabase(db);
  }
}

// Test getAllUsers function
function getAllUsersFromLocalStorage() {
  const db = getDatabase();
  return {
    success: true,
    data: db.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    })),
  };
}

// Test getPendingUsers function
function getPendingUsersFromLocalStorage() {
  const db = getDatabase();
  const pendingUsers = db.users.filter((user) => user.status === "pending");

  return {
    success: true,
    data: pendingUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
    })),
  };
}

// Run tests
console.log("=== Testing localStorage Database ===");

// Clear existing data for clean test
localStorage.removeItem("devinquireDB");

// Test 1: Initialize database
console.log("\n1. Testing database initialization...");
initializeDatabase();

// Test 2: Get all users
console.log("\n2. Testing getAllUsers...");
const allUsers = getAllUsersFromLocalStorage();
console.log("All users result:", allUsers);

// Test 3: Get pending users
console.log("\n3. Testing getPendingUsers...");
const pendingUsers = getPendingUsersFromLocalStorage();
console.log("Pending users result:", pendingUsers);

// Test 4: Add a test user
console.log("\n4. Testing user addition...");
const db = getDatabase();
db.users.push({
  id: 2,
  name: "Test User",
  email: "test@example.com",
  password: hashPassword("password123"),
  role: "user",
  status: "pending",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
saveDatabase(db);

// Test 5: Get all users again
console.log("\n5. Testing getAllUsers after adding user...");
const allUsers2 = getAllUsersFromLocalStorage();
console.log("All users result:", allUsers2);

// Test 6: Get pending users again
console.log("\n6. Testing getPendingUsers after adding user...");
const pendingUsers2 = getPendingUsersFromLocalStorage();
console.log("Pending users result:", pendingUsers2);

console.log("\n=== Test Complete ===");
console.log("Check the browser console to see the results.");
