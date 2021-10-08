const CFATokenV1 = artifacts.require("CFATokenV1");
const CFATokenV1_1 = artifacts.require("CFATokenV1_1");
const CFATokenV2 = artifacts.require("CFATokenV2");

// The following helpers make fresh original/upgraded tokens before each test.

function newFiatTokenV1() {
  return CFATokenV1.new();
}

function newFiatTokenV1_1() {
  return CFATokenV1_1.new();
}

function newFiatTokenV2() {
  return CFATokenV2.new();
}

// Executes the run_tests_function using an original and
// an upgraded token. The test_suite_name is printed standard output.
function wrapTests(testSuiteName, runTestsFunction) {
  contract(`CFATokenV1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV1, accounts);
  });

  contract(`CFATokenV1_1: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV1_1, accounts);
  });

  contract(`CFATokenV2: ${testSuiteName}`, (accounts) => {
    runTestsFunction(newFiatTokenV2, accounts);
  });
}

module.exports = wrapTests;
