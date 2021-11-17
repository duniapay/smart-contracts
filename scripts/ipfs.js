#!/usr/bin/env node

const IPFS = require("ipfs-http-client");
const shell = require("shelljs");
const path = require("path");
const log = console.log;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const ipfs = IPFS.create({
    host: "ipfs.infura.io",
    port: "5001",
    protocol: "https",
    timeout: "10m",
  });

  const artifactPaths = shell.ls("./build/contracts/*.json");

  log("Uploading sources & metadata to IPFS (Infura Gateway)...");
  log("========================================================");
  let index = 0;
  for (const _path of artifactPaths) {
    const artifact = require(path.join(process.cwd(), _path));

    log();
    log(artifact.contractName);
    log("-".repeat(artifact.contractName.length));
    const { cid } = await ipfs.add(artifact.metadata);
    log(`metadata: ${cid}`);
    const cod = await ipfs.add(artifact.source);
    index++;
    log(`source: ${cod.cid}`);
    const pair = ["2", "4", "6", "8", "10", "14", "16", "18"];
    if (pair.includes(index.toString())) {
      await sleep(8000);
    }
  }

  log();
  log("Finished.");
  log();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
