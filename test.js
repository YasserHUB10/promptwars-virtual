// ============================================================
// BEP — Bharat Election Portal — Comprehensive Test Suite
// Plain JavaScript unit tests (no frameworks)
// Run: node test.js
// ============================================================

const fs = require("fs");
const vm = require("vm");

// ── Helpers ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

function assertEqual(actual, expected, testName) {
  const ok = actual === expected;
  if (ok) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(haystack, needle, testName) {
  const ok = String(haystack).includes(needle);
  if (ok) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Expected string to include: ${JSON.stringify(needle)}`);
  }
}

function group(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

// ── DOM & environment stubs ─────────────────────────────────

function createElementStub() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener() {},
    focus() {},
    querySelector() {
      return null;
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    style: {},
  };
}

function buildContext() {
  const context = {
    console,
    Intl,
    Date,
    Number,
    String,
    Object,
    Array,
    Math,
    Promise,
    setTimeout,
    clearTimeout,
    localStorage: {
      _store: {},
      getItem(key) {
        return this._store[key] || null;
      },
      setItem(key, value) {
        this._store[key] = String(value);
      },
      removeItem(key) {
        delete this._store[key];
      },
    },
    document: {
      documentElement: { dataset: {} },
      getElementById() {
        return createElementStub();
      },
      addEventListener() {},
      querySelector() {
        return null;
      },
    },
  };
  vm.createContext(context);
  return context;
}

function loadApp() {
  const source = fs.readFileSync("script.js", "utf8");

  // Append accessor helpers so const-scoped vars are reachable from outside
  const accessors = `
    function _getSteps() { return steps; }
    function _getAppState() { return appState; }
    function _getFirebaseConfigured() { return isFirebaseConfigured; }
  `;

  const context = buildContext();
  vm.runInContext(source + accessors, context);
  return context;
}

// ── Load the app once ───────────────────────────────────────

const app = loadApp();

// ============================================================
// TEST GROUP 1: getEligibility — Core eligibility function
// ============================================================

group("1. getEligibility — Age eligibility checks");

// Test 1: Under 18 is not eligible
assertEqual(
  app.getEligibility(17),
  "not eligible",
  "Age 17 → not eligible"
);

// Test 2: Exactly 18 is eligible
assertEqual(
  app.getEligibility(18),
  "eligible",
  "Age 18 → eligible"
);

// Test 3: Adult age is eligible
assertEqual(
  app.getEligibility(25),
  "eligible",
  "Age 25 → eligible"
);

// Test 4: Senior citizen is eligible
assertEqual(
  app.getEligibility(65),
  "eligible",
  "Age 65 (senior) → eligible"
);

// Test 5: Edge — age 1 (child)
assertEqual(
  app.getEligibility(1),
  "not eligible",
  "Age 1 → not eligible"
);

// Test 6: Edge — age 0
assertEqual(
  app.getEligibility(0),
  "not eligible",
  "Age 0 → not eligible"
);

// Test 7: String number input
assertEqual(
  app.getEligibility("20"),
  "eligible",
  "String '20' → eligible (Number coercion)"
);

// Test 8: String under 18
assertEqual(
  app.getEligibility("10"),
  "not eligible",
  "String '10' → not eligible (Number coercion)"
);

// ============================================================
// TEST GROUP 2: getGuidance — Decision logic branches
// ============================================================

group("2. getGuidance — Decision-based guidance output");

// Test 9: Under 18 returns ineligible message
const guidance9 = app.getGuidance({ age: 15, registered: "yes" });
assertIncludes(
  guidance9,
  "not eligible",
  "Age 15 → guidance includes 'not eligible'"
);

// Test 10: Not registered returns registration guidance
const guidance10 = app.getGuidance({ age: 25, registered: "no" });
assertIncludes(
  guidance10,
  "register",
  "Age 25, not registered → guidance includes 'register'"
);

// Test 11: Location included in not-registered guidance
const guidance11 = app.getGuidance({
  age: 30,
  registered: "no",
  location: "Mumbai",
});
assertIncludes(
  guidance11,
  "Mumbai",
  "Location 'Mumbai' appears in registration guidance"
);

// Test 12: First-time voter guidance
const guidance12 = app.getGuidance({
  age: 19,
  registered: "yes",
  firstTime: "yes",
});
assertIncludes(
  guidance12,
  "first-time voter guidance",
  "First-time voter → guidance includes 'first-time voter guidance'"
);

// Test 13: Experienced registered voter guidance
const guidance13 = app.getGuidance({
  age: 40,
  registered: "yes",
  firstTime: "no",
});
assertIncludes(
  guidance13,
  "eligible registered voter guidance",
  "Experienced voter → includes 'eligible registered voter guidance'"
);

// Test 14: Default location used when none provided
const guidance14 = app.getGuidance({ age: 22, registered: "no" });
assertIncludes(
  guidance14,
  "your area",
  "No location → defaults to 'your area'"
);

// ============================================================
// TEST GROUP 3: Edge cases — Empty / invalid inputs
// ============================================================

group("3. Edge cases — Empty and invalid inputs");

// Test 15: Negative age
assertEqual(
  app.getEligibility(-5),
  "not eligible",
  "Negative age → not eligible"
);

// Test 16: Very large age
assertEqual(
  app.getEligibility(150),
  "eligible",
  "Age 150 → eligible (no upper cap in eligibility)"
);

// Test 17: NaN input — Number(NaN) < 18 evaluates to false, so returns "eligible"
assertEqual(
  app.getEligibility(NaN),
  "eligible",
  "NaN input → eligible (NaN < 18 is false)"
);

// Test 18: Undefined age — Number(undefined) is NaN, same as above
assertEqual(
  app.getEligibility(undefined),
  "eligible",
  "Undefined age → eligible (NaN comparison)"
);

// Test 19: Empty string age — Number('') is 0, which < 18
assertEqual(
  app.getEligibility(""),
  "not eligible",
  "Empty string age → not eligible (coerces to 0)"
);

// Test 20: null age — Number(null) is 0, which < 18
assertEqual(
  app.getEligibility(null),
  "not eligible",
  "null age → not eligible (coerces to 0)"
);

// ============================================================
// TEST GROUP 4: escapeHtml — XSS prevention
// ============================================================

group("4. escapeHtml — XSS prevention");

// Test 20: Escapes angle brackets
assertEqual(
  app.escapeHtml("<script>alert('xss')</script>"),
  "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;",
  "Angle brackets and quotes are escaped"
);

// Test 21: Escapes ampersand
assertEqual(
  app.escapeHtml("Tom & Jerry"),
  "Tom &amp; Jerry",
  "Ampersand is escaped"
);

// Test 22: Escapes double quotes
assertEqual(
  app.escapeHtml('value="test"'),
  "value=&quot;test&quot;",
  "Double quotes are escaped"
);

// Test 23: Empty string passthrough
assertEqual(
  app.escapeHtml(""),
  "",
  "Empty string returns empty string"
);

// Test 24: Plain text unchanged
assertEqual(
  app.escapeHtml("Hello World"),
  "Hello World",
  "Plain text remains unchanged"
);

// ============================================================
// TEST GROUP 5: formatDate — Date formatting
// ============================================================

group("5. formatDate — Date formatting");

// Test 25: Valid date formats correctly
const formatted25 = app.formatDate("2026-01-26");
assert(
  typeof formatted25 === "string" && formatted25.length > 0,
  "formatDate('2026-01-26') returns non-empty string"
);

// Test 26: Formatted date includes year
assertIncludes(
  app.formatDate("2026-01-26"),
  "2026",
  "formatDate includes the year 2026"
);

// ============================================================
// TEST GROUP 6: steps configuration
// ============================================================

group("6. Steps configuration integrity");

const steps = app._getSteps();

// Test 27: Exactly 4 steps
assertEqual(
  steps.length,
  4,
  "Steps array has exactly 4 items"
);

// Test 28: First step key is 'age'
assertEqual(
  steps[0].key,
  "age",
  "First step key is 'age'"
);

// Test 29: Last step key is 'location'
assertEqual(
  steps[3].key,
  "location",
  "Last step key is 'location'"
);

// Test 30: Every step has a label
assert(
  steps.every((s) => typeof s.label === "string" && s.label.length > 0),
  "All steps have non-empty string labels"
);

// ============================================================
// TEST GROUP 7: appState — Initial state
// ============================================================

group("7. appState — Initial state validation");

const appState = app._getAppState();

// Test 31: currentStep starts at 0
assertEqual(
  appState.currentStep,
  0,
  "appState.currentStep starts at 0"
);

// Test 32: age starts empty
assertEqual(
  appState.age,
  "",
  "appState.age starts as empty string"
);

// Test 33: isRegistered starts null
assertEqual(
  appState.isRegistered,
  null,
  "appState.isRegistered starts null"
);

// Test 34: isFirstTime starts null
assertEqual(
  appState.isFirstTime,
  null,
  "appState.isFirstTime starts null"
);

// Test 35: location starts empty
assertEqual(
  appState.location,
  "",
  "appState.location starts as empty string"
);

// ============================================================
// TEST GROUP 8: getStepStatus — Progress tracking
// ============================================================

group("8. getStepStatus — Step progress states");

// Test 36: Current step is active
assertEqual(
  app.getStepStatus(0),
  "active",
  "Index 0 at step 0 → 'active'"
);

// Test 37: Future step has no class
assertEqual(
  app.getStepStatus(2),
  "",
  "Index 2 at step 0 → '' (future)"
);

// Simulate advancing a step for test 38
appState.currentStep = 2;

// Test 38: Past step is complete
assertEqual(
  app.getStepStatus(0),
  "complete",
  "Index 0 at step 2 → 'complete'"
);

// Test 39: Current step remains active after advance
assertEqual(
  app.getStepStatus(2),
  "active",
  "Index 2 at step 2 → 'active'"
);

// Reset step
appState.currentStep = 0;

// ============================================================
// TEST GROUP 9: getUserDataForStorage — Data export
// ============================================================

group("9. getUserDataForStorage — Data shape");

// Set test state
appState.age = "25";
appState.isRegistered = "yes";
appState.isFirstTime = "no";
appState.location = "Delhi";

const userData = app.getUserDataForStorage();

// Test 40: age is a number
assertEqual(
  typeof userData.age,
  "number",
  "userData.age is a number"
);

// Test 41: age value matches
assertEqual(
  userData.age,
  25,
  "userData.age equals 25"
);

// Test 42: registered field
assertEqual(
  userData.registered,
  "yes",
  "userData.registered equals 'yes'"
);

// Test 43: firstTime field
assertEqual(
  userData.firstTime,
  "no",
  "userData.firstTime equals 'no'"
);

// Test 44: location field
assertEqual(
  userData.location,
  "Delhi",
  "userData.location equals 'Delhi'"
);

// Test 45: completedAt is an ISO timestamp
assert(
  typeof userData.completedAt === "string" && userData.completedAt.includes("T"),
  "userData.completedAt is an ISO timestamp string"
);

// Reset state
appState.age = "";
appState.isRegistered = null;
appState.isFirstTime = null;
appState.location = "";
appState.currentStep = 0;

// ============================================================
// TEST GROUP 10: buildGuidance — Full guidance output
// ============================================================

group("10. buildGuidance — Full guidance rendering");

// Test 46: Under-18 guidance persona
appState.age = "15";
const guidance46 = app.buildGuidance();
assertEqual(
  guidance46.persona,
  "Future voter",
  "Under-18 persona is 'Future voter'"
);

// Test 47: Under-18 guidance title
assertIncludes(
  guidance46.title,
  "not eligible",
  "Under-18 title includes 'not eligible'"
);

// Test 48: Under-18 guidance has HTML content
assert(
  guidance46.html.length > 50,
  "Under-18 guidance html is substantial content"
);

// Test 49: Not-registered guidance persona
appState.age = "30";
appState.isRegistered = "no";
const guidance49 = app.buildGuidance();
assertEqual(
  guidance49.persona,
  "Registration guide",
  "Not-registered adult persona is 'Registration guide'"
);

// Test 50: Senior not-registered persona
appState.age = "65";
appState.isRegistered = "no";
const guidance50 = app.buildGuidance();
assertEqual(
  guidance50.persona,
  "Senior citizen registration guide",
  "Senior not-registered persona is 'Senior citizen registration guide'"
);

// Test 51: First-time voter persona
appState.age = "19";
appState.isRegistered = "yes";
appState.isFirstTime = "yes";
appState.location = "Pune, Maharashtra";
const guidance51 = app.buildGuidance();
assertEqual(
  guidance51.persona,
  "First-time voter",
  "First-time voter persona is 'First-time voter'"
);

// Test 52: Location in guidance title
assertIncludes(
  guidance51.title,
  "Pune, Maharashtra",
  "Location appears in guidance title"
);

// Test 53: Experienced voter persona
appState.age = "40";
appState.isRegistered = "yes";
appState.isFirstTime = "no";
appState.location = "Chennai";
const guidance53 = app.buildGuidance();
assertEqual(
  guidance53.persona,
  "Experienced voter",
  "Experienced voter persona is 'Experienced voter'"
);

// Test 54: Senior first-time voter persona
appState.age = "62";
appState.isRegistered = "yes";
appState.isFirstTime = "yes";
appState.location = "Kolkata";
const guidance54 = app.buildGuidance();
assertEqual(
  guidance54.persona,
  "First-time senior voter",
  "Senior first-time voter persona is 'First-time senior voter'"
);

// Test 55: Senior experienced voter persona
appState.age = "70";
appState.isRegistered = "yes";
appState.isFirstTime = "no";
appState.location = "Jaipur";
const guidance55 = app.buildGuidance();
assertEqual(
  guidance55.persona,
  "Senior citizen voter",
  "Senior experienced voter persona is 'Senior citizen voter'"
);

// Test 56: Decision log for under-18
appState.age = "10";
const guidance56 = app.buildGuidance();
assertEqual(
  guidance56.decisionLog,
  "under-18 ineligible path",
  "Under-18 decisionLog is 'under-18 ineligible path'"
);

// Reset state
appState.age = "";
appState.isRegistered = null;
appState.isFirstTime = null;
appState.location = "";
appState.currentStep = 0;

// ============================================================
// TEST GROUP 11: renderSeniorBox — Conditional rendering
// ============================================================

group("11. renderSeniorBox — Conditional senior content");

// Test 57: Non-senior returns empty string
assertEqual(
  app.renderSeniorBox(false),
  "",
  "renderSeniorBox(false) → empty string"
);

// Test 58: Senior returns HTML
const seniorHtml = app.renderSeniorBox(true);
assert(
  seniorHtml.length > 0,
  "renderSeniorBox(true) → non-empty HTML"
);

// Test 59: Senior HTML mentions guidance
assertIncludes(
  seniorHtml,
  "Senior citizen guidance",
  "Senior box includes 'Senior citizen guidance' heading"
);

// ============================================================
// TEST GROUP 12: Firebase configuration check
// ============================================================

group("12. Firebase configuration validation");

const isFirebaseConfigured = app._getFirebaseConfigured();

// Test 60: isFirebaseConfigured is boolean
assert(
  typeof isFirebaseConfigured === "boolean",
  "isFirebaseConfigured is a boolean"
);

// Test 61: Default placeholder config → not configured
assertEqual(
  isFirebaseConfigured,
  false,
  "Default '...' placeholders → isFirebaseConfigured is false"
);

// ============================================================
// TEST GROUP 13: showMessage / clearMessage
// ============================================================

group("13. showMessage / clearMessage — UI messaging");

// Test 62: showMessage sets textContent
const mockEl62 = { textContent: "" };
app.showMessage(mockEl62, "Test message");
assertEqual(
  mockEl62.textContent,
  "Test message",
  "showMessage sets element textContent"
);

// Test 63: clearMessage resets textContent
app.clearMessage(mockEl62);
assertEqual(
  mockEl62.textContent,
  "",
  "clearMessage resets element textContent to empty"
);

// ============================================================
// SUMMARY
// ============================================================

console.log("\n══════════════════════════════════════════════════");
console.log(`  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
console.log("══════════════════════════════════════════════════");

if (failed > 0) {
  console.error(`\n⚠️  ${failed} test(s) failed. Review output above.`);
  process.exit(1);
} else {
  console.log("\n🎉 All tests passed!");
  process.exit(0);
}
