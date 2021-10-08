import { CfaTokenV21Instance } from "../../@types/generated";
import { expectRevert } from "../helpers";
import { behavesLikeFiatTokenV2 } from "./CFATokenV2.test";

const CFATokenV2_1 = artifacts.require("CFATokenV2_1");

contract("CFATokenV2_1", (accounts) => {
  const cfaTokenOwner = accounts[9];
  let cfaToken: CfaTokenV21Instance;

  beforeEach(async () => {
    cfaToken = await CFATokenV2_1.new();
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

  describe("initializeV2_1", () => {
    const [, user, lostAndFound] = accounts;

    beforeEach(async () => {
      await cfaToken.configureMinter(cfaTokenOwner, 1000000e6, {
        from: cfaTokenOwner,
      });
      await cfaToken.mint(user, 100e6, { from: cfaTokenOwner });
    });

    it("transfers locked funds to a given address", async () => {
      // send tokens to the contract address
      await cfaToken.transfer(cfaToken.address, 100e6, { from: user });

      expect((await cfaToken.balanceOf(cfaToken.address)).toNumber()).to.equal(
        100e6
      );

      // initialize v2.1
      await cfaToken.initializeV2_1(lostAndFound, { from: cfaTokenOwner });

      expect((await cfaToken.balanceOf(cfaToken.address)).toNumber()).to.equal(
        0
      );

      expect((await cfaToken.balanceOf(lostAndFound)).toNumber()).to.equal(
        100e6
      );
    });

    it("blocks transfers to the contract address", async () => {
      await cfaToken.initializeV2_1(lostAndFound, { from: cfaTokenOwner });

      expect(await cfaToken.isBlacklisted(cfaToken.address)).to.equal(true);

      await expectRevert(
        cfaToken.transfer(cfaToken.address, 100e6, { from: user }),
        "account is blacklisted"
      );
    });

    it("disallows calling initializeV2_1 twice", async () => {
      await cfaToken.initializeV2_1(lostAndFound, { from: cfaTokenOwner });

      await expectRevert(
        cfaToken.initializeV2_1(lostAndFound, { from: cfaTokenOwner })
      );
    });
  });

  describe("version", () => {
    it("returns the version string", async () => {
      expect(await cfaToken.version()).to.equal("2");
    });
  });
});
