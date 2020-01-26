const TicketingContract = artifacts.require("TicketingContract");
const TheatreContract = artifacts.require("TheatreContract");
const ScreenContract = artifacts.require("ScreenContract");

contract("TheatreContract", async accounts => {
  const inox = "INOX";
  const cinepolis = "CINEPOLIS";
  const [
    ticketingManager,
    inoxManager,
    cinepolisManager,
    ism1,
    ism2,
    ism3,
    ism4,
    window1,
    window2,
    ...otherAccounts
  ] = accounts;
  let inoxContract, cinepolisContract;
  beforeEach("", async () => {
    const ticketingContract = await TicketingContract.deployed();
    await ticketingContract.addTheatre(inox, inoxManager, {
      from: ticketingManager
    });
    await ticketingContract.addTheatre(cinepolis, cinepolisManager, {
      from: ticketingManager
    });
    const inoxDetails = await ticketingContract.theatres(1);
    const inoxAddress = inoxDetails.contractAddress;
    const cinepolisDetails = await ticketingContract.theatres(2);
    const cinepolisAddress = cinepolisDetails.contractAddress;

    inoxContract = await TheatreContract.at(inoxAddress);
    cinepolisContract = await TheatreContract.at(cinepolisAddress);
  });

  describe("constructor", async () => {
    it("records the names and status correctly and initialises the number of cafeCoupons", async () => {
      const inoxNameRecorded = await inoxContract.name();
      const cinepolisNameRecorded = await cinepolisContract.name();

      assert.strictEqual(inoxNameRecorded, inox);
      assert.strictEqual(cinepolisNameRecorded, cinepolis);
      const statusRecorded = await inoxContract.status();
      const numberOfCouponsRecorded = await inoxContract.numberOfCafeCoupons();

      assert.strictEqual(Number(statusRecorded), 0);
      assert.strictEqual(Number(numberOfCouponsRecorded), 0);
    });
    it("records the managers correctly", async () => {
      const inoxManagerRecorded = await inoxContract.manager();
      const cinepolisManagerRecorded = await cinepolisContract.manager();

      assert.strictEqual(inoxManagerRecorded, inoxManager);
      assert.strictEqual(cinepolisManagerRecorded, cinepolisManager);
    });
    it("records the ids correctly", async () => {
      const inoxIDRecorded = await inoxContract.id();
      const cinepolisIDRecorded = await cinepolisContract.id();

      assert.strictEqual(Number(inoxIDRecorded), 1);
      assert.strictEqual(Number(cinepolisIDRecorded), 2);
    });
    it("initializes the number of windows as 0", async () => {
      const numberofWindowsRecorded = await inoxContract.numberOfWindows();

      assert.strictEqual(Number(numberofWindowsRecorded), 0);
    });
  });

  describe("activate", async () => {
    beforeEach("", async () => {
      await inoxContract.activate(ism1, ism2, ism3, ism4, {
        from: inoxManager
      });
    });
    it("changes the status to active", async () => {
      const statusRecorded = await inoxContract.status();

      assert.strictEqual(Number(statusRecorded), 1);
    });
    it("deploys four screen contracts with correct managers", async () => {
      const screen1 = await inoxContract.screens(1);
      const screen2 = await inoxContract.screens(2);
      const screen3 = await inoxContract.screens(3);
      const screen4 = await inoxContract.screens(4);

      const screenContract1 = await ScreenContract.at(screen1.contractAddress);
      const screenContract2 = await ScreenContract.at(screen2.contractAddress);
      const screenContract3 = await ScreenContract.at(screen3.contractAddress);
      const screenContract4 = await ScreenContract.at(screen4.contractAddress);

      const ismRecorded1 = await screenContract1.manager();
      const ismRecorded2 = await screenContract2.manager();
      const ismRecorded3 = await screenContract3.manager();
      const ismRecorded4 = await screenContract4.manager();

      assert.strictEqual(ismRecorded1, ism1);
      assert.strictEqual(ismRecorded2, ism2);
      assert.strictEqual(ismRecorded3, ism3);
      assert.strictEqual(ismRecorded4, ism4);
    });
  });

  describe("addWindow", async () => {
    let screenContract1, screenContract2, screenContract3, screenContract4;
    beforeEach("", async () => {
      await inoxContract.activate(ism1, ism2, ism3, ism4, {
        from: inoxManager
      });
      const screen1 = await inoxContract.screens(1);
      screenContract1 = await ScreenContract.at(screen1.contractAddress);
      const screen2 = await inoxContract.screens(2);
      screenContract2 = await ScreenContract.at(screen2.contractAddress);
      const screen3 = await inoxContract.screens(3);
      screenContract3 = await ScreenContract.at(screen3.contractAddress);
      const screen4 = await inoxContract.screens(4);
      screenContract4 = await ScreenContract.at(screen4.contractAddress);

      await inoxContract.addWindow(window1, { from: inoxManager });
    });
    it("records window id correctly", async () => {
      const windowIDRecorded = await inoxContract.windowID(window1);

      assert.strictEqual(Number(windowIDRecorded), 1);
    });
    it("records window id corrently in all the screen contracts", async () => {
      let windowIDRecorded = await screenContract1.windowID(window1);
      assert.strictEqual(Number(windowIDRecorded), 1);
      windowIDRecorded = await screenContract2.windowID(window1);
      assert.strictEqual(Number(windowIDRecorded), 1);
      windowIDRecorded = await screenContract3.windowID(window1);
      assert.strictEqual(Number(windowIDRecorded), 1);
      windowIDRecorded = await screenContract4.windowID(window1);
      assert.strictEqual(Number(windowIDRecorded), 1);
    });
  });

  describe("addCafeCoupon", async () => {
    let screenContract1;
    let initialNumberOfCafeCoupons, finalNumberOfCafeCoupons;
    const today = new Date();
    const numberOfMilliseconds = 24 * 3600 * 1000;
    const todayDays = Math.round(today.valueOf() / numberOfMilliseconds);
    beforeEach("", async () => {
      await inoxContract.activate(ism1, ism2, ism3, ism4, {
        from: inoxManager
      });
      const screen1 = await inoxContract.screens(1);
      screenContract1 = await ScreenContract.at(screen1.contractAddress);

      await inoxContract.addWindow(window1, { from: inoxManager });
      await inoxContract.addWindow(window2, { from: inoxManager });
      await screenContract1.addShow(todayDays, 1, {
        from: ism1
      });
      initialNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
    });
    it("increases the number of cafeCoupons in the contract storage when selling from window1", async () => {
      await screenContract1.sellTicket(todayDays, 1, 1, {
        from: window1
      });
      finalNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      assert.strictEqual(
        Number(finalNumberOfCafeCoupons),
        Number(initialNumberOfCafeCoupons) + 1
      );
    });
    it("records the luck correctly", async () => {
      await screenContract1.sellTicket(todayDays, 1, 29, {
        from: window1
      });
      finalNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      const currentCoupon = await inoxContract.cafeCoupons(
        finalNumberOfCafeCoupons
      );
      assert.strictEqual(Number(currentCoupon.luck), 29);
    });
    it("does not change the number of cafeCoupons in the contract storage when selling from window2", async () => {
      await screenContract1.sellTicket(todayDays, 1, 1, {
        from: window2
      });
      finalNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      assert.strictEqual(
        Number(finalNumberOfCafeCoupons),
        Number(initialNumberOfCafeCoupons)
      );
    });
  });

  describe("loadInventory", async () => {
    let initialInventory;
    beforeEach("", async () => {
      initialInventory = await inoxContract.numberOfRemainingCoke();
    });
    it("increases the number of remaining coke by input value", async () => {
      await inoxContract.loadInventory(100, { from: inoxManager });
      let currentInventory = await inoxContract.numberOfRemainingCoke();
      assert.strictEqual(
        Number(currentInventory),
        Number(initialInventory) + 100
      );
      await inoxContract.loadInventory(200, { from: inoxManager });
      currentInventory = await inoxContract.numberOfRemainingCoke();
      assert.strictEqual(
        Number(currentInventory),
        Number(initialInventory) + 300
      );
    });
    it("can only be called by the manager of the theatre", async () => {
      try {
        await inoxContract.loadInventory(100);
        assert(false);
      } catch {
        assert(true);
      }
    });
  });

  describe("claimSoda", async () => {
    let screenContract1;
    const today = new Date();
    const numberOfMilliseconds = 24 * 3600 * 1000;
    const todayDays = Math.round(today.valueOf() / numberOfMilliseconds);
    let initialInventory;

    beforeEach("", async () => {
      await inoxContract.activate(ism1, ism2, ism3, ism4, {
        from: inoxManager
      });
      const screen1 = await inoxContract.screens(1);
      screenContract1 = await ScreenContract.at(screen1.contractAddress);

      await inoxContract.addWindow(window1, { from: inoxManager });
      await screenContract1.addShow(todayDays, 1, {
        from: ism1
      });
      await inoxContract.loadInventory(100, { from: inoxManager });
      initialInventory = await inoxContract.numberOfRemainingCoke();
      await screenContract1.sellTicket(todayDays, 1, 2, {
        from: window1
      });
    });
    it("marks the coupon claimed", async () => {
      const NumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      await inoxContract.claimSoda(NumberOfCafeCoupons, { from: inoxManager });

      const { claimed } = await inoxContract.cafeCoupons(NumberOfCafeCoupons);
      assert.strictEqual(claimed, true);
    });
    it("reduces the number of remaining coke on successful claim", async () => {
      const NumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      await inoxContract.claimSoda(NumberOfCafeCoupons, { from: inoxManager });

      let currentInventory = await inoxContract.numberOfRemainingCoke();

      assert.strictEqual(
        Number(currentInventory),
        Number(initialInventory) - 1
      );
    });
    it("reverts when luck is not even", async () => {
      await screenContract1.sellTicket(todayDays, 1, 31, {
        from: window1
      });
      const NumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      try {
        await inoxContract.claimSoda(NumberOfCafeCoupons, {
          from: inoxManager
        });
        assert(false);
      } catch {
        assert(true);
      }
    });
    it("lets only theatre manager record soda claim", async () => {
      const NumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
      try {
        await inoxContract.claimSoda(NumberOfCafeCoupons);
        assert(false);
      } catch {
        assert(true);
      }
    });
  });
});
