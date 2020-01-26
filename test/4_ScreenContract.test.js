const TicketingContract = artifacts.require("TicketingContract");
const TheatreContract = artifacts.require("TheatreContract");
const ScreenContract = artifacts.require("ScreenContract");

const inox = "INOX";
const cinepolis = "CINEPOLIS";

contract("ScreenContract", async accounts => {
  const [
    ticketingManager,
    inoxManager,
    screenManager1,
    screenManager2,
    screenManager3,
    screenManager4,
    window1,
    window2,
    ...otherAccounts
  ] = accounts;

  let ticketingContract, inoxAddress, inoxContract, screenContract1;

  beforeEach("", async () => {
    ticketingContract = await TicketingContract.deployed();
    await ticketingContract.addTheatre(inox, inoxManager, {
      from: ticketingManager
    });
    const inoxDetails = await ticketingContract.theatres(1);
    inoxAddress = inoxDetails.contractAddress;
    inoxContract = await TheatreContract.at(inoxAddress);
    await inoxContract.activate(
      screenManager1,
      screenManager2,
      screenManager3,
      screenManager4,
      {
        from: inoxManager
      }
    );
    const screen1 = await inoxContract.screens(1);
    screenContract1 = await ScreenContract.at(screen1.contractAddress);
  });

  describe("constructor", async () => {
    it("records manager and id correctly", async () => {
      const managerRecorded1 = await screenContract1.manager();
      const idRecorded1 = await screenContract1.id();

      assert.strictEqual(managerRecorded1, screenManager1);
      assert.strictEqual(Number(idRecorded1), 1);
    });
    it("records the theatre name and address correctly", async () => {
      const nameRecorded = await screenContract1.theatre();
      const addressRecorded = await screenContract1.theatreAddress();

      assert.strictEqual(nameRecorded, inox);
      assert.strictEqual(addressRecorded, inoxAddress);
    });
    it("initializes the number of windows as 0", async () => {
      const numberofWindowsRecorded = await screenContract1.numberOfWindows();

      assert.strictEqual(Number(numberofWindowsRecorded), 0);
    });
  });

  describe("addShow", async () => {
    it("records a show on the ledger with zero tickets sold", async () => {
      const today = new Date();
      const numberOfMilliseconds = 24 * 3600 * 1000;
      const todayDays = Math.round(today.valueOf() / numberOfMilliseconds);

      await screenContract1.addShow(todayDays, 1, {
        from: screenManager1
      });

      const { date, order, ticketsSold } = await screenContract1.shows(
        todayDays,
        1
      );

      assert.strictEqual(Number(date), todayDays);
      assert.strictEqual(Number(order), 1);
      assert.strictEqual(Number(ticketsSold), 0);
    });
    it("can only be called by the manager of the screen", async () => {
      try {
        await screenContract1.addShow(todayDays, 1);
        assert(false);
      } catch {
        assert(true);
      }
    });
  });

  describe("addWindow", async () => {
    beforeEach("", async () => {
      await inoxContract.addWindow(window1, { from: inoxManager });
    });
    it("records the window address as a window in screencontract storage", async () => {
      const isWindow = await screenContract1.isWindow(window1);
      assert.strictEqual(isWindow, true);
    });
    it("increases the number of windows by 1", async () => {
      const numberofWindowsRecorded = await screenContract1.numberOfWindows();

      assert.strictEqual(Number(numberofWindowsRecorded), 1);
    });
    it("records window id correctly", async () => {
      const windowIDRecorded = await screenContract1.windowID(window1);

      assert.strictEqual(Number(windowIDRecorded), 1);
    });
    it("can only be called by the theatre manager", async () => {
      try {
        await inoxContract.addWindow(window1);
        assert(false);
      } catch {
        assert(true);
      }
    });
  });

  describe("sellTicket", async () => {
    const today = new Date();
    const numberOfMilliseconds = 24 * 3600 * 1000;
    const todayDays = Math.round(today.valueOf() / numberOfMilliseconds);
    let currectLuck;
    let initialNumberOfCafeCoupons, finalNumberOfCafeCoupons;
    beforeEach("", async () => {
      await inoxContract.addWindow(window1, { from: inoxManager });
      await inoxContract.addWindow(window2, { from: inoxManager });

      await screenContract1.addShow(todayDays, 1, {
        from: screenManager1
      });
    });
    describe("when sender is window1", async () => {
      const sender = window1;
      currectLuck = 3;
      beforeEach("", async () => {
        initialNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
        await screenContract1.sellTicket(todayDays, 1, currectLuck, {
          from: sender
        });
      });
      it("increases the number of tickets sold for the show", async () => {
        const { date, order, ticketsSold } = await screenContract1.shows(
          todayDays,
          1
        );
        assert.strictEqual(Number(date), todayDays);
        assert.strictEqual(Number(order), 1);
        assert.strictEqual(Number(ticketsSold), 1);
      });
      it("successfully calls the addCafe coupon in the theatre contract", async () => {
        finalNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
        assert.strictEqual(
          Number(finalNumberOfCafeCoupons),
          Number(initialNumberOfCafeCoupons) + 1
        );
      });
      it("sets the luck correctly in the cafeCoupon recorded", async () => {
        let coupon = await inoxContract.cafeCoupons(finalNumberOfCafeCoupons);
        const { luck, claimed } = coupon;

        assert.strictEqual(Number(luck), currectLuck);
        assert.strictEqual(claimed, false);
      });
    });
    describe("when sender is window2", async () => {
      const sender = window2;
      currectLuck = 3;
      beforeEach("", async () => {
        initialNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
        await screenContract1.sellTicket(todayDays, 1, currectLuck, {
          from: sender
        });
      });
      it("increases the number of tickets sold for the show", async () => {
        const { date, order, ticketsSold } = await screenContract1.shows(
          todayDays,
          1
        );
        assert.strictEqual(Number(date), todayDays);
        assert.strictEqual(Number(order), 1);
        assert.strictEqual(Number(ticketsSold), 1);
      });
      it("does not call the addCafe coupon in the theatre contract", async () => {
        finalNumberOfCafeCoupons = await inoxContract.numberOfCafeCoupons();
        assert.strictEqual(
          Number(finalNumberOfCafeCoupons),
          Number(initialNumberOfCafeCoupons)
        );
      });
    });
    describe("when sender is not registered as a window", async () => {
      const sender = ticketingManager;
      currectLuck = 3;
      it("does not let to sell the ticket", async () => {
        try {
          await screenContract1.sellTicket(todayDays, 1, currectLuck, {
            from: sender
          });
          assert(false);
        } catch {
          assert(true);
        }
      });
    });
    describe("when 100 tickets are sold", async () => {
      const sender = window1;
      beforeEach("", async () => {
        let promises = [];
        for (i = 0; i < 100; i++) {
          promises.push(
            screenContract1.sellTicket(todayDays, 1, currectLuck, {
              from: sender
            })
          );
        }
        await Promise.all(promises);
      });
      it("does not let selling more tickets", async () => {
        try {
          await screenContract1.sellTicket(todayDays, 1, currectLuck, {
            from: sender
          });
          assert(false);
        } catch {
          assert(true);
        }
      });
      it("the number of tickets sold is correctly recorded", async () => {
        const { ticketsSold } = await screenContract1.shows(todayDays, 1);
        assert.strictEqual(Number(ticketsSold), 100);
      });
    });
  });
});
