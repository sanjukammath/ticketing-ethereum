pragma solidity ^0.5.0;

contract TicketingContract {
    address public manager;
    struct Theatre {
        uint256 id;
        address contractAddress;
        string name;
    }
    uint256 public ids;
    mapping(uint256 => Theatre) public theatres;
    constructor() public {
        manager = msg.sender;
        ids = 0;
    }
    function addTheatre(string memory _name, address _manager)
        public
        onlyManager
    {
        uint256 _id = ids + 1;
        TheatreContract newAddress = new TheatreContract(_name, _manager, _id);
        Theatre memory newTheatre = Theatre({
            id: _id,
            contractAddress: address(newAddress),
            name: _name
        });
        theatres[_id] = newTheatre;
        ids++;
    }
    modifier onlyManager {
        require(
            msg.sender == manager,
            "Ticketing Contract: Only manager can call this function"
        );
        _;
    }
}

contract TheatreContract {
    enum Status {Inactive, Active}
    address public manager;
    string public name;
    uint256 public id;
    Status public status;
    uint256 public numberOfScreens;
    uint8 public numberOfWindows;
    uint256 public numberOfRemainingCoke;
    mapping(address => uint8) public windowID;

    struct Screen {
        uint8 id;
        address contractAddress;
    }
    mapping(uint8 => Screen) public screens;
    struct Coupon {
        uint256 luck;
        bool claimed;
    }
    uint256 public numberOfCafeCoupons;
    mapping(uint256 => Coupon) public cafeCoupons;
    mapping(address => bool) public isScreen;
    constructor(string memory _name, address _manager, uint256 _id) public {
        manager = _manager;
        name = _name;
        id = _id;
        numberOfScreens = 4;
        status = Status.Inactive;
        numberOfCafeCoupons = 0;
        numberOfWindows = 0;
    }
    function getDetails()
        public
        view
        returns (address, string memory, uint256, Status, uint256)
    {
        return (manager, name, id, status, numberOfScreens);
    }

    function activate(
        address _manager1,
        address _manager2,
        address _manager3,
        address _manager4
    ) public onlyManager {
        status = Status.Active;
        address[4] memory managers = [
            _manager1,
            _manager2,
            _manager3,
            _manager4
        ];
        for (uint8 i = 0; i < 4; i++) {
            uint8 _id = i + 1;
            ScreenContract newAddress = new ScreenContract(
                _id,
                managers[i],
                name,
                address(this)
            );
            Screen memory newScreen = Screen({
                id: _id,
                contractAddress: address(newAddress)
            });
            screens[_id] = newScreen;
            isScreen[address(newAddress)] = true;
        }
    }

    function addWindow(address _windowAddress) public onlyManager {
        numberOfWindows++;
        windowID[_windowAddress] = numberOfWindows;
        for (uint8 i = 0; i < 4; i++) {
            uint8 _id = i + 1;
            Screen memory currentScreen = screens[_id];
            ScreenContract(currentScreen.contractAddress).addWindow(
                _windowAddress
            );
        }
    }

    function addCafeCoupon(uint256 _luck) public onlyScreenContract {
        Coupon memory newCoupon = Coupon({luck: _luck, claimed: false});
        numberOfCafeCoupons++;
        cafeCoupons[numberOfCafeCoupons] = newCoupon;
    }

    function loadInventory(uint256 _number) public onlyManager {
        numberOfRemainingCoke += _number;
    }

    function claimSoda(uint256 _id) public onlyManager {
        Coupon storage currentCoupon = cafeCoupons[_id];
        require(
            currentCoupon.luck % 2 == 0,
            "Theatre Contract: Can claim soda only for even lucky number"
        );
        require(
            currentCoupon.claimed == false,
            "Theatre Contract: One coupon can be claimed only once"
        );
        require(
            numberOfRemainingCoke > 0,
            "Theatre Contract: : Can claim coke only if it is remaining"
        );
        numberOfRemainingCoke--;
        currentCoupon.claimed = true;
    }

    modifier onlyScreenContract {
        require(
            isScreen[msg.sender],
            "Theatre Contract: Only a screen in this theatre can call this function"
        );
        _;
    }
    modifier onlyManager {
        require(
            msg.sender == manager,
            "Theatre Contract: Only manager can call this function"
        );
        _;
    }
}

contract ScreenContract {
    address public manager;
    uint8 public id;
    string public theatre;
    address public theatreAddress;
    struct Show {
        uint256 date;
        uint8 order;
        bool listed;
        uint8 ticketsSold;
    }

    mapping(uint256 => mapping(uint8 => Show)) public shows;

    mapping(address => bool) public isWindow;
    mapping(address => uint8) public windowID;
    uint8 public numberOfWindows;

    constructor(
        uint8 _id,
        address _manager,
        string memory _name,
        address _theatreAddress
    ) public {
        manager = _manager;
        id = _id;
        theatre = _name;
        theatreAddress = _theatreAddress;
        numberOfWindows = 0;
    }

    function addShow(uint256 _date, uint8 _order) public onlyManager {
        Show memory newShow = Show({
            date: _date,
            order: _order,
            listed: true,
            ticketsSold: 0
        });
        shows[_date][_order] = newShow;
    }

    function addWindow(address _windowAddress) public onlyTheatre {
        isWindow[_windowAddress] = true;
        numberOfWindows++;
        windowID[_windowAddress] = numberOfWindows;
    }

    function sellTicket(uint256 _date, uint8 _order, uint256 _luck)
        public
        onlyWindow
    {
        Show storage currentShow = shows[_date][_order];
        require(
            currentShow.listed,
            "Tickets can be sold only for listed shows"
        );
        require(
            currentShow.ticketsSold < 100,
            "Screen Contract: The total number of seats is 100. The tickets are sold."
        );
        currentShow.ticketsSold++;
        if (windowID[msg.sender] == 1) {
            TheatreContract(theatreAddress).addCafeCoupon(_luck);
        }
    }
    modifier onlyWindow {
        require(
            isWindow[msg.sender],
            "Screen Contract: Only a valid window can sell a ticket"
        );
        _;
    }

    modifier onlyManager {
        require(
            msg.sender == manager,
            "Screen Contract: Only manager can call this function"
        );
        _;
    }

    modifier onlyTheatre {
        require(
            msg.sender == theatreAddress,
            "Screen Contract: Only theatre contract can call this function"
        );
        _;
    }
}
