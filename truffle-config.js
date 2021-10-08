process.env.TS_NODE_FILES = "true";
require("ts-node/register/transpile-only");
// Fix Typescript callsite reporting
Object.defineProperty(Error, "prepareStackTrace", { writable: false });

// INIT PROVIDER USING CONTRACT KIT
const Kit = require("@celo/contractkit");

const fs = require("fs");
const path = require("path");

// Read config file if it exists
let config = { MNEMONIC: "", FIGMENT_KEY: "", PRIVATE_KEY: "", NODE_URL: "" };
if (fs.existsSync(path.join(__dirname, "config.js"))) {
  config = require("./config.js");
}
const nodeUrl = config.NODE_URL;
console.log("Node url", nodeUrl);
const kit = Kit.newKit(nodeUrl);

// AWAIT WRAPPER FOR ASYNC FUNC
async function awaitWrapper() {
  kit.connection.addAccount(config.PRIVATE_KEY); // ADDING ACCOUNT HERE
}

awaitWrapper();

module.exports = {
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000000,
        },
      },
    },
  },
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },
    local_testnet: {
      host: "ganache",
      port: 8545,
      network_id: "*", // Match any network id
    },
    mainnet: {
      provider: kit.connection.web3.currentProvider, // CeloProvider
      network_id: 42220,
    },
    alfajores: {
      provider: kit.connection.web3.currentProvider, // CeloProvider
      network_id: 44787, // latest Alfajores network id
      gasPrice: 2 * 10 ** 8,
      gas: 8000000,
    },
  },
  mocha: {
    timeout: 60000, // prevents tests from failing when pc is under heavy load
    reporter: "Spec",
  },
  plugins: ["solidity-coverage"],
};
