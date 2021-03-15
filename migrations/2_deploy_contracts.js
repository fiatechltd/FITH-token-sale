var ERC20Token = artifacts.require("./ERC20Token.sol");
var FITHToken = artifacts.require("./FITHToken.sol");
var FITHTokenSale = artifacts.require("./FITHTokenSale.sol");
var FITHTokenSaleReferrals = artifacts.require("./FITHTokenSaleReferrals.sol");
var FITHTokenSaleRefAndPromo = artifacts.require("./FITHTokenSaleRefAndPromo.sol");
var DaiToken = artifacts.require("./DaiToken.sol");
var USDT = artifacts.require("./USDT.sol");
var OrFeedTest = artifacts.require("./OrFeedTest.sol");

module.exports = function(deployer) {
	// Token price is 0.00004 Ether and has 4 decimals
	var tokenPrice = 4000000000;
	
	deployer.deploy(ERC20Token, 1000000).then(function() {
		return deployer.deploy(FITHToken);
	}).then(function() {
		return deployer.deploy(DaiToken);
	}).then(function() {
		return deployer.deploy(USDT);
	}).then(function() {
		return deployer.deploy(OrFeedTest);
	}).then(function() {
		return deployer.deploy(FITHTokenSale, FITHToken.address, tokenPrice);
	}).then(function() {
		return deployer.deploy(FITHTokenSaleReferrals, FITHToken.address, tokenPrice);
	}).then(function() {
		//return deployer.deploy(FITHTokenSaleRefAndPromo, FITHToken.address, tokenPrice, DaiToken.address);
		return deployer.deploy(FITHTokenSaleRefAndPromo, FITHToken.address, tokenPrice, USDT.address, OrFeedTest.address);
	});
};
