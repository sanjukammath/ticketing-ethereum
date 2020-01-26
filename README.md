# ticketing-ethereum

This is a simulation of ticket vending using ethereum.

Write a simple Movie ticket application. Make assumptions on attributes for the various objects

· Four (4) ticketing windows sell movie tickets at a theatre

· People can buy one or more tickets

· Once 100 tickets are sold for a movie, that movie-show is full

· The theatre runs 5 movies at any time, and each show 4 times a day

· Once a ticket is purchased a buyer automatically gets a bottle of water and popcorn on Window-1

· At the end of the purchase, a ticket and receipt is printed and the purchase is recorded on the blockchain

· The buyer can go and exchange the water for soda at the cafeteria. Window 1 must generate a random number. If that number is even, the buyer must be able to get the water exchanged for soda at the cafeteria. The cafeteria has only 200 sodas, so only the first 200 requesters can exchange.

Exercise 1: Write an Ethereum solution that simulates this - make assumptions and clearly documents assumptions.

Exercise 2: Model such that the tickets, shows and sodas availability are managed by contracts on the chain. The movie theatre has 5 shows running at any time and each show has 100 seats. The model such that more than 1 movie theatre can be supported by the blockchain. The blockchain records show, theatres, the number of movie halls per theatre, shows running in each movie hall, cafeteria soda inventory.

Solution Using Ethereum

Assumptions

The entire ticketing platform is managed by a single entity refered to as the ticketingManager in the tests and each theatre is managed by the respective theatreManagers(inoxManager or cinepolisManager etc.)

Each screen could be managed by an entity seperate to that of the theatre manager also.

Each window could be managed by an entity that is different from any of the previously defined entities.

The theatre manager is responsible for defining the screen manager addresses and window addresses.

The first window address added will be window 1 second will be window 2 etc. from the prespecive of the problem statement.

Only valid window addresses can sell tickets. The individual tickets are printed as signed qr and provided to the end user and are secured throgh off chain mechanisms and hence need not be stored in the contract. However tickets which are entitled to cafeteria coupons (window 1 tickets) are added in the contract storage as they are important for later validation.

The randomness for the ticket will be generated by the UI for the window address 1 and sent to the contract.

The theatre manager can add coke to the stock. However coke is spent only through the claim of a valid coupon id.

To test the solution, clone the repo and run

```
npm install
truffle test
```
