#!/usr/bin/env bash

for contract in "MasterMinter"
do
  npx truffle-flattener contracts/v1/$contract.sol > build/flattened/$contract.flat.sol
done