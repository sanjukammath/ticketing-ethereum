const TicketingContract = artifacts.require("TicketingContract");
const TheatreContract = artifacts.require("TheatreContract");
const ScreenContract = artifacts.require("ScreenContract");

contract("Interoperability", async accounts => {
  it("reverts when number of remaining coke is zero", async () => {
    const inox = "INOX";
    const cinepolis = "CINEPOLIS";

    const [
      ticketingManager,
      inoxManager,
      ism1,
      window1,
      ...otherAccounts
    ] = accounts;

    const ticketingContract = await TicketingContract.deployed();
    await ticketingContract.addTheatre(inox, inoxManager, {
      from: ticketingManager
    });

    const inoxDetails = await ticketingContract.theatres(1);
    const inoxAddress = inoxDetails.contractAddress;

    const inoxContract = await TheatreContract.at(inoxAddress);

    await inoxContract.activate(ism1, ism1, ism1, ism1, {
      from: inoxManager
    });

    await inoxContract.addWindow(window1, { from: inoxManager });

    const today = new Date();
    const numberOfMilliseconds = 24 * 3600 * 1000;
    const todayDays = Math.round(today.valueOf() / numberOfMilliseconds);

    const screen1 = await inoxContract.screens(1);
    const screenContract1 = await ScreenContract.at(screen1.contractAddress);

    await screenContract1.addShow(todayDays, 1, {
      from: ism1
    });

    await screenContract1.addShow(todayDays, 2, {
      from: ism1
    });

    await screenContract1.addShow(todayDays, 3, {
      from: ism1
    });

    await screenContract1.addShow(todayDays, 4, {
      from: ism1
    });

    await inoxContract.loadInventory(200, { from: inoxManager });

    let NumberOfCafeCoupons = Number(await inoxContract.numberOfCafeCoupons());
    let ticketPromises = [];
    let claimPromises = [];
    for (i = 0; i < 50; i++) {
      ticketPromises.push(
        screenContract1.sellTicket(todayDays, 1, 30, {
          from: window1
        })
      );
      NumberOfCafeCoupons++;
      claimPromises.push(
        inoxContract.claimSoda(NumberOfCafeCoupons, {
          from: inoxManager
        })
      );
      ticketPromises.push(
        screenContract1.sellTicket(todayDays, 2, 30, {
          from: window1
        })
      );
      NumberOfCafeCoupons++;
      claimPromises.push(
        inoxContract.claimSoda(NumberOfCafeCoupons, {
          from: inoxManager
        })
      );
      ticketPromises.push(
        screenContract1.sellTicket(todayDays, 3, 30, {
          from: window1
        })
      );
      NumberOfCafeCoupons++;
      claimPromises.push(
        inoxContract.claimSoda(NumberOfCafeCoupons, {
          from: inoxManager
        })
      );
      ticketPromises.push(
        screenContract1.sellTicket(todayDays, 4, 30, {
          from: window1
        })
      );
      NumberOfCafeCoupons++;
      claimPromises.push(
        inoxContract.claimSoda(NumberOfCafeCoupons, {
          from: inoxManager
        })
      );
    }

    await Promise.all(ticketPromises);

    await Promise.all(claimPromises);

    await screenContract1.sellTicket(todayDays, 1, 30, {
      from: window1
    });
    NumberOfCafeCoupons++;
    try {
      await inoxContract.claimSoda(NumberOfCafeCoupons, {
        from: inoxManager
      });
      assert(false);
    } catch {
      assert(true);
    }
  });
});
