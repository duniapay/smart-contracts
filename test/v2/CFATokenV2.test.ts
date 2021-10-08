import { behavesLikeRescuable } from "../v1.1/Rescuable.behavior";
import { CfaTokenV2Instance, RescuableInstance } from "../../@types/generated";
import { usesOriginalStorageSlotPositions } from "../helpers/storageSlots.behavior";
import { hasSafeAllowance } from "./safeAllowance.behavior";
import { hasGasAbstraction } from "./GasAbstraction/GasAbstraction.behavior";
import { makeDomainSeparator } from "./GasAbstraction/helpers";
import { expectRevert } from "../helpers";

const CFATokenV2 = artifacts.require("CFATokenV2");

contract("CFATokenV2", (accounts) => {
  const cfaTokenOwner = accounts[9];
  let cfaToken: CfaTokenV2Instance;

  beforeEach(async () => {
    cfaToken = await CFATokenV2.new();
    await cfaToken.initialize(
      "Celo XOF",
      "CXOF",
      "XOF",
      6,
      cfaTokenOwner,
      cfaTokenOwner,
      cfaTokenOwner,
      cfaTokenOwner
    );
    await cfaToken.initializeV2("Celo XOF", { from: cfaTokenOwner });
  });

  behavesLikeFiatTokenV2(accounts, () => cfaToken, cfaTokenOwner);
});

export function behavesLikeFiatTokenV2(
  accounts: Truffle.Accounts,
  getFiatToken: () => CfaTokenV2Instance,
  cfaTokenOwner: string
): void {
  let domainSeparator: string;

  beforeEach(async () => {
    domainSeparator = makeDomainSeparator(
      "Celo XOF",
      "2",
      1, // hardcoded to 1 because of ganache bug: https://github.com/trufflesuite/ganache/issues/1643
      getFiatToken().address
    );
  });

  behavesLikeRescuable(getFiatToken as () => RescuableInstance, accounts);

  usesOriginalStorageSlotPositions({
    Contract: CFATokenV2,
    version: 2,
    accounts,
  });

  it("has the expected domain separator", async () => {
    expect(await getFiatToken().DOMAIN_SEPARATOR()).to.equal(domainSeparator);
  });

  hasSafeAllowance(getFiatToken, cfaTokenOwner, accounts);

  hasGasAbstraction(
    getFiatToken,
    () => domainSeparator,
    cfaTokenOwner,
    accounts
  );

  it("disallows calling initializeV2 twice", async () => {
    // It was called once in beforeEach. Try to call again.
    await expectRevert(
      getFiatToken().initializeV2("Not Celo XOF", { from: cfaTokenOwner })
    );
  });
}
