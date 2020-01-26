const TicketingContract = artifacts.require("TicketingContract");

contract("Deployment Test", async accounts => {
  const [manager, ...otherAccounts] = accounts;
  it("gets deployed correctly", async () => {
    const ticketing = await TicketingContract.deployed();

    const managerRecorded = await ticketing.manager();
    assert.strictEqual(manager, managerRecorded);
  });
});
