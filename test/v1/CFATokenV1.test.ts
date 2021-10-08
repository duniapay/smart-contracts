import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";

const CFATokenV1 = artifacts.require("CFATokenV1");

contract("CFATokenV1", (accounts) => {
  usesOriginalStorageSlotPositions({
    Contract: CFATokenV1,
    version: 1,
    accounts,
  });
});
