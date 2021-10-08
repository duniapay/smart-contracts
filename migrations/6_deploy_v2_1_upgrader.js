const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const CFATokenV2_1 = artifacts.require("CFATokenV2_1");
const CFATokenProxy = artifacts.require("CFATokenProxy");
const V2_1Upgrader = artifacts.require("V2_1Upgrader");

let proxyAdminAddress = "";
let proxyContractAddress = "";
let lostAndFoundAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
    LOST_AND_FOUND_ADDRESS: lostAndFoundAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (some(["development", "coverage"], (v) => network.includes(v))) {
    // DO NOT USE THESE ADDRESSES IN PRODUCTION
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    proxyContractAddress = (await CFATokenProxy.deployed()).address;
    lostAndFoundAddress = "0x610Bb1573d1046FCb8A70Bbbd395754cD57C2b60";
  }
  proxyContractAddress =
    proxyContractAddress || (await CFATokenProxy.deployed()).address;

  if (!lostAndFoundAddress) {
    throw new Error("LOST_AND_FOUND_ADDRESS must be provided in config.js");
  }

  const CfaTokenV2_1 = await CFATokenV2_1.deployed();

  console.log(`Proxy Admin:     ${proxyAdminAddress}`);
  console.log(`CFATokenProxy:  ${proxyContractAddress}`);
  console.log(`CFATokenV2_1:   ${CfaTokenV2_1.address}`);
  console.log(`Lost & Found:    ${lostAndFoundAddress.address}`);

  if (!proxyAdminAddress) {
    throw new Error("PROXY_ADMIN_ADDRESS must be provided in config.js");
  }

  console.log("Deploying V2_1Upgrader contract...");

  const v2_1Upgrader = await deployer.deploy(
    V2_1Upgrader,
    proxyContractAddress,
    CfaTokenV2_1.address,
    proxyAdminAddress,
    lostAndFoundAddress
  );

  console.log(
    `>>>>>>> Deployed V2_1Upgrader at ${v2_1Upgrader.address} <<<<<<<`
  );
};
