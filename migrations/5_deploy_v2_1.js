const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const CFATokenV2_1 = artifacts.require("CFATokenV2_1");
const CFATokenProxy = artifacts.require("CFATokenProxy");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({ PROXY_CONTRACT_ADDRESS: proxyContractAddress } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (
    !proxyContractAddress ||
    some(["development", "coverage"], (v) => network.includes(v))
  ) {
    proxyContractAddress = (await CFATokenProxy.deployed()).address;
  }

  console.log(`CFATokenProxy: ${proxyContractAddress}`);

  console.log("Deploying CFATokenV2_1 implementation contract...");
  await deployer.deploy(CFATokenV2_1);

  const CfaTokenV2_1 = await CFATokenV2_1.deployed();
  console.log("Deployed CFATokenV2_1 at", CFATokenV2_1.address);
  console.log(
    "Initializing CFATokenV2_1 implementation contract with dummy values..."
  );
  await CfaTokenV2_1.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );
  await CfaTokenV2_1.initializeV2("");
  await CfaTokenV2_1.initializeV2_1(THROWAWAY_ADDRESS);
};
