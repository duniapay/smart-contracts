const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const CFATokenV2 = artifacts.require("CFATokenV2");
const CFATokenProxy = artifacts.require("CFATokenProxy");
const V2Upgrader = artifacts.require("V2Upgrader");

let proxyAdminAddress = "";
let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (some(["development", "coverage"], (v) => network.includes(v))) {
    // DO NOT USE THIS ADDRESS IN PRODUCTION
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    proxyContractAddress = (await CFATokenProxy.deployed()).address;
  }
  proxyContractAddress =
    proxyContractAddress || (await CFATokenProxy.deployed()).address;

  const cfaTokenV2 = await CFATokenV2.deployed();

  console.log(`Proxy Admin:     ${proxyAdminAddress}`);
  console.log(`CFATokenProxy:  ${proxyContractAddress}`);
  console.log(`CFATokenV2:     ${cfaTokenV2.address}`);

  if (!proxyAdminAddress) {
    throw new Error("PROXY_ADMIN_ADDRESS must be provided in config.js");
  }

  console.log("Deploying V2Upgrader contract...");

  const v2Upgrader = await deployer.deploy(
    V2Upgrader,
    proxyContractAddress,
    cfaTokenV2.address,
    proxyAdminAddress,
    "Celo XOF"
  );

  console.log(`>>>>>>> Deployed V2Upgrader at ${v2Upgrader.address} <<<<<<<`);
};
