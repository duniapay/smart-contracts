const Web3 = require("web3");

const main = async () => {
  const web3 = new Web3(
    `https://celo-mainnet--rpc.datahub.figment.io/apikey/1d51fda6779328566936712266f3f84a`
  );

  const account = web3.eth.accounts.create();

  console.log("address: ", account.address);
  console.log("privateKey: ", account.privateKey);
};

main().catch((err) => {
  console.error(err);
});
