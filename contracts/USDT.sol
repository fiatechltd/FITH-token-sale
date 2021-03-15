pragma solidity ^0.4.26;

import "./IERC20.sol";
import "./Owned.sol";
import "./ERC20TokenBase.sol";
import "./SafeMathLib.sol";

// ----------------------------------------------------------------------------
// USDT (Tether) stable coin token simulator contract
//
// Symbol      : USDT
// Name        : USD Tether token
// Decimals    : 6
//



// This contract is used for FITHTokenSale testing purposes, we are specially interested in 6 decimals token contract as USDT.
contract USDT is IERC20, Owned, ERC20TokenBase
{
	using SafeMathLib for uint;
	
    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor()
		ERC20TokenBase(
			"USDT" //symbol
			, "USD Tether token" //name
			, "USD Tether token v1.0" //standard
			, 6 //decimals
			, 10000000000 //_initialSupply
		)
		public
	{
    }
}