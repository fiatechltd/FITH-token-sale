pragma solidity ^0.4.26;

import "./IERC20.sol";
import "./Owned.sol";
import "./ERC20TokenBase.sol";
import "./SafeMathLib.sol";

// ----------------------------------------------------------------------------
// 'Dai stable coin token simulator' contract
//
// Symbol      : DAI
// Name        : Dai stable coin token
// Decimals    : 18
//


// This contract is used for FITHTokenSale testing purposes, we are specially interested in 18 decimals token contract as Dai.
contract DaiToken is IERC20, Owned, ERC20TokenBase
{
	using SafeMathLib for uint;
	
    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor()
		ERC20TokenBase(
			"DAI" //symbol
			, "Dai Token" //name
			, "Dai Token v1.0" //standard
			, 18 //decimals
			, 10000000000 //_initialSupply
		)
		public
	{
    }
}