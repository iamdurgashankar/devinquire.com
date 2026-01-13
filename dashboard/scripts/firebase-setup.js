#!/usr/bin/env node

/**
 * Firebase Setup and Initialization Script
 * Automates Firebase project setup, configuration, and deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const CONFIG = {
  projectRoot: path.resolve(__dirname, ".."),
  envFile: ".env.local",
  exampleEnvFile: ".env.example",
  firebaserc: ".firebaserc",
  firebaseJson: "firebase.json",
  requiredCommands: ["firebase", "npm"],
  firebaseFeatures: ["auth", "firestore", "hosting", "storage", "functions"],
  nodeVersion: "18.0.0",
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ Error: ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  Warning: ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(message) {
  log(`\n${colors.bright}=== ${message} ===${colors.reset}`, colors.cyan);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      cwd: CONFIG.projectRoot,
      ...options,
    });
    return { success: true, output: result };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      output: err.stdout || err.stderr || "",
    };
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(CONFIG.projectRoot, filePath));
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(CONFIG.projectRoot, filePath), "utf8");
  } catch {
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(path.join(CONFIG.projectRoot, filePath), content);
    return true;
  } catch {
    return false;
  }
}

// Setup functions
async function checkPrerequisites() {
  header("Checking Prerequisites");

  let allChecksPass = true;

  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`);

  if (nodeVersion < CONFIG.nodeVersion) {
    warning(
      `Node.js ${CONFIG.nodeVersion} or higher is recommended. Current: ${nodeVersion}`
    );
  }

  // Check required commands
  for (const command of CONFIG.requiredCommands) {
    const result = execCommand(`${command} --version`, { silent: true });
    if (result.success) {
      success(`${command} is installed`);
    } else {
      error(`${command} is not installed or not in PATH`);
      allChecksPass = false;
    }
  }

  // Check Firebase CLI login status
  const loginCheck = execCommand("firebase login:ci --no-localhost", {
    silent: true,
  });
  if (!loginCheck.success) {
    warning("Firebase CLI not logged in. You will need to login during setup.");
  }

  return allChecksPass;
}

async function initializeFirebaseProject() {
  header("Initializing Firebase Project");

  if (fileExists(CONFIG.firebaserc)) {
    const firebaserc = readFile(CONFIG.firebaserc);
    if (firebaserc) {
      try {
        const config = JSON.parse(firebaserc);
        if (config.projects && config.projects.default) {
          info(
            `Firebase project already configured: ${config.projects.default}`
          );
          return true;
        }
      } catch (e) {
        warning("Invalid .firebaserc file detected");
      }
    }
  }

  log("Starting Firebase project initialization...");

  // Run firebase init
  const result = execCommand("firebase init", {
    stdio: "inherit",
    env: { ...process.env, CI: "false" },
  });

  if (result.success) {
    success("Firebase project initialized successfully");
    return true;
  } else {
    error("Failed to initialize Firebase project");
    return false;
  }
}

async function setupEnvironmentFile() {
  header("Setting up Environment Configuration");

  if (fileExists(CONFIG.envFile)) {
    info("Environment file already exists");
    const shouldOverwrite = await askQuestion(
      "Do you want to update it? (y/N): "
    );
    if (shouldOverwrite.toLowerCase() !== "y") {
      return true;
    }
  }

  if (!fileExists(CONFIG.exampleEnvFile)) {
    error("Example environment file not found");
    return false;
  }

  // Copy example file
  const exampleContent = readFile(CONFIG.exampleEnvFile);
  if (!exampleContent) {
    error("Failed to read example environment file");
    return false;
  }

  log("Getting Firebase project configuration...");

  // Get Firebase config
  const configResult = execCommand("firebase setup:web", { silent: true });
  if (!configResult.success) {
    warning("Could not automatically retrieve Firebase config");
    log(
      "Please manually update the environment file with your Firebase configuration"
    );
  }

  // Write environment file
  if (writeFile(CONFIG.envFile, exampleContent)) {
    success(`Environment file created: ${CONFIG.envFile}`);
    log(
      `\n${colors.yellow}Important: Please update ${CONFIG.envFile} with your actual Firebase configuration values${colors.reset}`
    );
    return true;
  } else {
    error("Failed to create environment file");
    return false;
  }
}

async function deploySecurityRules() {
  header("Deploying Security Rules");

  // Check if rules files exist
  const rulesFiles = ["firebase/firestore.rules", "firebase/storage.rules"];

  for (const ruleFile of rulesFiles) {
    if (!fileExists(ruleFile)) {
      warning(`Security rules file not found: ${ruleFile}`);
    } else {
      success(`Security rules file found: ${ruleFile}`);
    }
  }

  log("Deploying Firestore rules...");
  const firestoreResult = execCommand("firebase deploy --only firestore:rules");

  if (firestoreResult.success) {
    success("Firestore rules deployed successfully");
  } else {
    warning("Failed to deploy Firestore rules");
  }

  log("Deploying Storage rules...");
  const storageResult = execCommand("firebase deploy --only storage:rules");

  if (storageResult.success) {
    success("Storage rules deployed successfully");
  } else {
    warning("Failed to deploy Storage rules");
  }

  return firestoreResult.success && storageResult.success;
}

async function deployIndexes() {
  header("Deploying Firestore Indexes");

  if (!fileExists("firebase/firestore.indexes.json")) {
    warning("Firestore indexes file not found");
    return false;
  }

  log("Deploying Firestore indexes...");
  const result = execCommand("firebase deploy --only firestore:indexes");

  if (result.success) {
    success("Firestore indexes deployed successfully");
    return true;
  } else {
    error("Failed to deploy Firestore indexes");
    return false;
  }
}

async function setupEmulators() {
  header("Setting up Firebase Emulators");

  log("Installing Firebase emulator dependencies...");

  // Start emulators to install them
  const emulatorResult = execCommand(
    "firebase emulators:start --only auth,firestore,storage --detach",
    { silent: true }
  );

  if (emulatorResult.success) {
    success("Firebase emulators set up successfully");

    // Stop the emulators
    execCommand("firebase emulators:stop", { silent: true });

    return true;
  } else {
    warning("Failed to set up emulators (this is optional)");
    return false;
  }
}

async function buildProject() {
  header("Building Project");

  log("Installing dependencies...");
  const installResult = execCommand("npm install");

  if (!installResult.success) {
    error("Failed to install dependencies");
    return false;
  }

  log("Building project...");
  const buildResult = execCommand("npm run build");

  if (buildResult.success) {
    success("Project built successfully");
    return true;
  } else {
    error("Failed to build project");
    return false;
  }
}

async function deployToHosting() {
  header("Deploying to Firebase Hosting");

  const shouldDeploy = await askQuestion(
    "Do you want to deploy to Firebase Hosting now? (y/N): "
  );

  if (shouldDeploy.toLowerCase() !== "y") {
    info("Skipping deployment");
    return true;
  }

  log("Deploying to Firebase Hosting...");
  const result = execCommand("firebase deploy --only hosting");

  if (result.success) {
    success("Successfully deployed to Firebase Hosting");

    // Get hosting URL
    const urlResult = execCommand("firebase hosting:channel:list", {
      silent: true,
    });
    if (urlResult.success) {
      log(
        `\n${colors.green}Your app is live at your Firebase Hosting URL${colors.reset}`
      );
    }

    return true;
  } else {
    error("Failed to deploy to Firebase Hosting");
    return false;
  }
}

async function runTests() {
  header("Running Tests");

  if (!fileExists("src/tests")) {
    info("No tests directory found, skipping tests");
    return true;
  }

  log("Running tests...");
  const result = execCommand("npm test -- --watchAll=false", { silent: true });

  if (result.success) {
    success("All tests passed");
    return true;
  } else {
    warning("Some tests failed");
    return false;
  }
}

function generateSetupSummary(results) {
  header("Setup Summary");

  const steps = [
    { name: "Prerequisites Check", success: results.prerequisites },
    { name: "Firebase Project Init", success: results.firebaseInit },
    { name: "Environment Setup", success: results.environment },
    { name: "Security Rules Deploy", success: results.securityRules },
    { name: "Indexes Deploy", success: results.indexes },
    { name: "Emulators Setup", success: results.emulators },
    { name: "Project Build", success: results.build },
    { name: "Hosting Deploy", success: results.hosting },
    { name: "Tests", success: results.tests },
  ];

  steps.forEach((step) => {
    const status = step.success ? "✅" : "❌";
    log(`${status} ${step.name}`);
  });

  const successCount = steps.filter((s) => s.success).length;
  const totalSteps = steps.length;

  if (successCount === totalSteps) {
    success(
      `\n🎉 Setup completed successfully! (${successCount}/${totalSteps})`
    );
    log(`\n${colors.bright}Next steps:${colors.reset}`);
    log("1. Update your environment file with actual Firebase config values");
    log("2. Start the development server: npm start");
    log("3. Test your authentication and database features");
  } else {
    warning(
      `\n⚠️  Setup completed with warnings (${successCount}/${totalSteps})`
    );
    log("\nReview the failed steps above and resolve any issues.");
  }
}

// Helper function for user input (simplified for script)
function askQuestion(question) {
  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main setup function
async function main() {
  log(
    `${colors.bright}🔥 DevInquire Dashboard - Firebase Setup Script${colors.reset}\n`
  );

  const results = {};

  try {
    // Run setup steps
    results.prerequisites = await checkPrerequisites();
    if (!results.prerequisites) {
      error("Prerequisites check failed. Please install missing requirements.");
      process.exit(1);
    }

    results.firebaseInit = await initializeFirebaseProject();
    results.environment = await setupEnvironmentFile();
    results.securityRules = await deploySecurityRules();
    results.indexes = await deployIndexes();
    results.emulators = await setupEmulators();
    results.build = await buildProject();
    results.hosting = await deployToHosting();
    results.tests = await runTests();

    // Generate summary
    generateSetupSummary(results);
  } catch (error) {
    error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((err) => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkPrerequisites,
  initializeFirebaseProject,
  setupEnvironmentFile,
  deploySecurityRules,
  deployIndexes,
  setupEmulators,
  buildProject,
  deployToHosting,
  runTests,
};
