import crypto from "crypto";
import {
  CfaTokenV1Instance,
  CfaTokenV2Instance,
  CfaTokenProxyInstance,
} from "../../@types/generated";
import { signTransferAuthorization } from "./GasAbstraction/helpers";
import { MAX_UINT256, ACCOUNTS_AND_KEYS } from "../helpers/constants";
import { hexStringFromBuffer, expectRevert } from "../helpers";

const CFATokenProxy = artifacts.require("CFATokenProxy");
const CfaTokenV1 = artifacts.require("CFATokenV1");
const CfaTokenV1_1 = artifacts.require("CFATokenV1_1");
const CfaTokenV2 = artifacts.require("CFATokenV2");
const V2Upgrader = artifacts.require("V2Upgrader");

contract("V2Upgrader", (accounts) => {
  let CfaTokenProxy: CfaTokenProxyInstance;
  let proxyAsV1: CfaTokenV1Instance;
  let proxyAsV2: CfaTokenV2Instance;
  let v1Implementation: CfaTokenV1Instance;
  let v2Implementation: CfaTokenV2Instance;
  let originalProxyAdmin: string;
  const minter = accounts[9];

  beforeEach(async () => {
    CfaTokenProxy = await CFATokenProxy.deployed();
    proxyAsV1 = await CfaTokenV1.at(CfaTokenProxy.address);
    proxyAsV2 = await CfaTokenV2.at(CfaTokenProxy.address);
    v1Implementation = await CfaTokenV1.deployed();
    v2Implementation = await CfaTokenV2.deployed();
    originalProxyAdmin = await CfaTokenProxy.admin();

    await proxyAsV1.configureMinter(minter, 2e5, {
      from: await proxyAsV1.masterMinter(),
    });
    await proxyAsV1.mint(minter, 2e5, { from: minter });
  });

  describe("upgrade", () => {
    it("upgrades, transfers proxy admin role to newProxyAdmin, runs tests, and self-destructs", async () => {
      // Run the test on the contracts deployed by Truffle to ensure the Truffle
      // migration is written correctly
      const upgrader = await V2Upgrader.deployed();
      const upgraderOwner = await upgrader.owner();

      expect(await upgrader.proxy()).to.equal(CfaTokenProxy.address);
      expect(await upgrader.implementation()).to.equal(
        v2Implementation.address
      );
      expect(await upgrader.helper()).not.to.be.empty;
      expect(await upgrader.newProxyAdmin()).to.equal(originalProxyAdmin);
      expect(await upgrader.newName()).to.equal("Celo XOF");

      // Transfer 0.2 CXOF to the contract
      await proxyAsV1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await CfaTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call upgrade
      await upgrader.upgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await CfaTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is updated to V2
      expect(await CfaTokenProxy.implementation()).to.equal(
        v2Implementation.address
      );

      // Test that things work as expected
      expect(await proxyAsV2.name()).to.equal("Celo XOF");
      expect((await proxyAsV2.balanceOf(upgrader.address)).toNumber()).to.equal(
        0
      );
      expect((await proxyAsV2.balanceOf(upgraderOwner)).toNumber()).to.equal(
        2e5
      );

      const [user, user2] = ACCOUNTS_AND_KEYS;
      await proxyAsV2.transfer(user.address, 2e5, { from: upgraderOwner });
      expect((await proxyAsV2.balanceOf(user.address)).toNumber()).to.equal(
        2e5
      );

      // Test Gas Abstraction
      const nonce = hexStringFromBuffer(crypto.randomBytes(32));

      const invalidAuthorization = signTransferAuthorization(
        user.address,
        minter,
        1e5,
        0,
        MAX_UINT256,
        nonce,
        await proxyAsV2.DOMAIN_SEPARATOR(),
        user2.key // Signed with someone else's key
      );
      // Fails when given an invalid authorization
      await expectRevert(
        proxyAsV2.transferWithAuthorization(
          user.address,
          minter,
          1e5,
          0,
          MAX_UINT256,
          nonce,
          invalidAuthorization.v,
          invalidAuthorization.r,
          invalidAuthorization.s,
          { from: minter }
        ),
        "invalid signature"
      );

      const validAuthorization = signTransferAuthorization(
        user.address,
        minter,
        1e5,
        0,
        MAX_UINT256,
        nonce,
        await proxyAsV2.DOMAIN_SEPARATOR(),
        user.key
      );

      // Succeeds when given a valid authorization
      await proxyAsV2.transferWithAuthorization(
        user.address,
        minter,
        1e5,
        0,
        MAX_UINT256,
        nonce,
        validAuthorization.v,
        validAuthorization.r,
        validAuthorization.s,
        { from: minter }
      );

      expect((await proxyAsV2.balanceOf(user.address)).toNumber()).to.equal(
        1e5
      );
      expect((await proxyAsV2.balanceOf(minter)).toNumber()).to.equal(1e5);
    });

    it("reverts if there is an error", async () => {
      CfaTokenProxy = await CFATokenProxy.new(v1Implementation.address, {
        from: originalProxyAdmin,
      });
      const CfaToken = await CfaTokenV1_1.new();
      const upgraderOwner = accounts[0];

      const upgrader = await V2Upgrader.new(
        CfaTokenProxy.address,
        CfaToken.address, // provide V1.1 implementation instead of V2
        originalProxyAdmin,
        "Celo XOF",
        { from: upgraderOwner }
      );

      // Transfer 0.2 CXOF to the contract
      await proxyAsV1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await CfaTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Upgrade should fail because initializeV2 function doesn't exist on V1.1
      await expectRevert(upgrader.upgrade({ from: upgraderOwner }), "revert");

      // The proxy admin role is not transferred
      expect(await CfaTokenProxy.admin()).to.equal(upgrader.address);

      // The implementation is left unchanged
      expect(await CfaTokenProxy.implementation()).to.equal(
        v1Implementation.address
      );
    });
  });

  describe("abortUpgrade", () => {
    it("transfers proxy admin role to newProxyAdmin and self-destructs", async () => {
      CfaTokenProxy = await CFATokenProxy.new(v1Implementation.address, {
        from: originalProxyAdmin,
      });
      const upgraderOwner = accounts[0];
      const upgrader = await V2Upgrader.new(
        CfaTokenProxy.address,
        v2Implementation.address,
        originalProxyAdmin,
        "Celo XOF",
        { from: upgraderOwner }
      );

      // Transfer 0.2 CXOF to the contract
      await proxyAsV1.transfer(upgrader.address, 2e5, { from: minter });

      // Transfer admin role to the contract
      await CfaTokenProxy.changeAdmin(upgrader.address, {
        from: originalProxyAdmin,
      });

      // Call abortUpgrade
      await upgrader.abortUpgrade({ from: upgraderOwner });

      // The proxy admin role is transferred back to originalProxyAdmin
      expect(await CfaTokenProxy.admin()).to.equal(originalProxyAdmin);

      // The implementation is left unchanged
      expect(await CfaTokenProxy.implementation()).to.equal(
        v1Implementation.address
      );
    });
  });
});
