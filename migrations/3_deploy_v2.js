const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const CFATokenV2 = artifacts.require("CFATokenV2");
const CFATokenProxy = artifacts.require("CFATokenProxy");
const CFATokenUtil = artifacts.require("CFATokenUtil");

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

  console.log("Deploying CFATokenV2 implementation contract...");
  await deployer.deploy(CFATokenV2);

  const cfaTokenV2 = await CFATokenV2.deployed();
  console.log("Deployed CFATokenV2 at", cfaTokenV2.address);
  console.log(
    "Initializing CFATokenV2 implementation contract with dummy values..."
  );
  await cfaTokenV2.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );
  await cfaTokenV2.initializeV2("");

  console.log("Deploying CFATokenUtil contract...");
  const cfaTokenUtil = await deployer.deploy(
    CFATokenUtil,
    proxyContractAddress
  );
  console.log("Deployed CFATokenUtil at", cfaTokenUtil.address);
};
