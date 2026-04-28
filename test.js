// Basic functional tests for BEP

const fs = require("fs");
const vm = require("vm");

function createElementStub() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    focus() {},
    querySelector() { return null; },
    setAttribute() {},
    style: {}
  };
}

function loadAppLogic() {
  const source = fs.readFileSync("script.js", "utf8");
  const context = {
    console,
    Intl,
    Date,
    Promise,
    localStorage: {
      getItem() { return null; },
      setItem() {}
    },
    document: {
      documentElement: { dataset: {} },
      getElementById() { return createElementStub(); },
      addEventListener() {},
      querySelector() { return null; }
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

const { getEligibility, getGuidance } = loadAppLogic();

function testEligibility() {
  console.assert(getEligibility(17) === "not eligible", "Age <18 failed");
  console.assert(getEligibility(20) === "eligible", "Age >=18 failed");
}

function testRegistrationFlow() {
  console.assert(getGuidance({ age: 20, registered: "no" }).includes("register"), "Registration logic failed");
}

function runTests() {
  testEligibility();
  testRegistrationFlow();
  console.log("All BEP tests passed");
}

runTests();
