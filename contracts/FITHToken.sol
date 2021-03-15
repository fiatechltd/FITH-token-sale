pragma solidity ^0.4.26;

import "./IERC20.sol";
import "./Owned.sol";
import "./ERC20TokenBase.sol";
import "./SafeMathLib.sol";

// ----------------------------------------------------------------------------
// 'FITH Fiatech Token' contract
//
// Symbol      : FITH
// Name        : FITH Fiatech Token
// Total supply: 10,000,000,000.0000
// Decimals    : 4
//

// ----------------------------------------------------------------------------
// ERC20 Token, with the addition of symbol, name and decimals and an
// initial fixed supply
// ----------------------------------------------------------------------------

contract FITHToken is IERC20, Owned, ERC20TokenBase
{
	using SafeMathLib for uint;
	
    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor()
		ERC20TokenBase(
			"FITH" //symbol
			, "FITH Token" //name
			, "FITH Token v1.0" //standard
			, 4 //decimals
			, 10000000000 //_initialSupply
		)
		public
	{
    }
}