pragma solidity ^0.4.26;

import "./SafeMathLib.sol";
import "./OrFeedInterface.sol";

// ----------------------------------------------------------------------------
// Oracle Feed Test contract for unit testing
//
// ----------------------------------------------------------------------------

contract OrFeedTest is OrFeedInterface
{
	using SafeMathLib for uint;
	uint public exRate; //1 ETH priced in USDT as 325680000 (with 6 decimals)
	
	// ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor() public
	{
		exRate = 325680000;
    }
	
	function setExRate(uint _exRate) public {
		require(exRate != _exRate, "new value is required");
		exRate = _exRate;
	}
	
	// this is test function and only returns price for ETH/USD and "DEFAULT" venue
	function getExchangeRate( string fromSymbol,
							string toSymbol,
							string venue,
							uint256 amount )
						external view returns ( uint256 )
	{
		//require(fromSymbol == "ETH", "invalid fromSymbol");
		//require(toSymbol == "USDT", "invalid toSymbol");
		//require(venue == "DEFAULT", "invalid venue");
		return (amount.mul(exRate).div(10**18));
	}
	
	function getTokenDecimalCount ( address tokenAddress ) external view returns ( uint256 ) {
		revert();
	}
	
	function getTokenAddress ( string symbol ) external view returns ( address ) {
		revert();
	}
	
	function getSynthBytes32 ( string symbol ) external view returns ( bytes32 ) {
		revert();
	}
	
	function getForexAddress ( string symbol ) external view returns ( address ) {
		revert();
	}
	
	/*function arb(address  fundsReturnToAddress,
				address liquidityProviderContractAddress,
				string[] tokens,
				uint256 amount,
				string[] exchanges)
			external payable returns (bool)
	{
		revert();
	}*/
}