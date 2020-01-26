const TicketingContract = artifacts.require("TicketingContract");

module.exports = async deployer => {
  await deployer.deploy(TicketingContract);
};
