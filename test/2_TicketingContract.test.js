const TicketingContract = artifacts.require("TicketingContract");
const TheatreContract = artifacts.require("TheatreContract");

const inox = "INOX";
const cinepolis = "CINEPOLIS";

contract("TicketingContract", async accounts => {
  const [ticketingManager, inoxManager, ...otherAccounts] = accounts;
  let ticketing;
  beforeEach("", async () => {
    ticketing = await TicketingContract.deployed();
  });
  describe("constructor", async () => {
    it("should record manager correctly", async () => {
      const ticketing = await TicketingContract.deployed();

      const managerRecorded = await ticketing.manager();
      const ids = await ticketing.ids();
      assert.strictEqual(managerRecorded, ticketingManager);
      assert.strictEqual(Number(ids), 0);
    });
  });
  describe("addTheatre", async () => {
    let ids;
    beforeEach("", async () => {
      await ticketing.addTheatre(inox, inoxManager, { from: ticketingManager });
      ids = await ticketing.ids();
    });
    it("lets ticketing manager add a theatre", async () => {
      assert.strictEqual(Number(ids), 1);

      const { id, contractAddress, name } = await ticketing.theatres(1);
      assert.strictEqual(Number(id), 1);
      assert.strictEqual(inox, name);
    });
    it("deploys a theatre contract", async () => {
      const { id, contractAddress, name } = await ticketing.theatres(1);
      assert.strictEqual(Number(id), 1);
      assert.strictEqual(inox, name);

      const inoxContract = await TheatreContract.at(contractAddress);
      const inoxManagerRecorded = await inoxContract.manager();

      assert.strictEqual(inoxManagerRecorded, inoxManager);
    });
    it("can only be called by ticketing manager", async () => {
      try {
        await ticketing.addTheatre(inox, inoxManager, { from: inoxManager });
        assert(false);
      } catch {
        assert(true);
      }
    });
  });
});
