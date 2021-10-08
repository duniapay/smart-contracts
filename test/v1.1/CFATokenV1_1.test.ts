import { behavesLikeRescuable } from "./Rescuable.behavior";
import { CfaTokenV11Instance, RescuableInstance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";

const CFATokenV1_1 = artifacts.require("CFATokenV1_1");

contract("CFATokenV1_1", (accounts) => {
  let cfaToken: CfaTokenV11Instance;

  beforeEach(async () => {
    cfaToken = await CFATokenV1_1.new();
    const owner = accounts[0];
    await cfaToken.initialize(
      "Celo XOF",
      "CXOF",
      "XOF",
      6,
      owner,
      owner,
      owner,
      owner
    );
  });

  behavesLikeRescuable(() => cfaToken as RescuableInstance, accounts);
  usesOriginalStorageSlotPositions({
    Contract: CFATokenV1_1,
    version: 1.1,
    accounts,
  });
});
