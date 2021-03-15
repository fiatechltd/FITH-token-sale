var ERC20Token = artifacts.require('./ERC20Token.sol');
var FITHToken = artifacts.require('./FITHToken.sol');
//var FITHTokenSale = artifacts.require('./FITHTokenSale.sol');
var FITHTokenSaleReferrals = artifacts.require('./FITHTokenSaleReferrals.sol');
const assert = require("chai").assert;

contract('FITHTokenSaleReferrals', async accounts => { //function(accounts) {
	var tokenInstance;
	var tokenSaleInstance;
	var admin = accounts[0];
	var buyer = accounts[1];
	var referer = accounts[2];
	var tokenPrice = 4000000000; // in wei for 4 decimals token
	var tokensAvailable = 750000;
	var referralPercent = 5; //5% paid out to referers for bringing referrals
	var numberOfTokens;
	//var gasRequired = 175000;
	var gasRequired = 150000;
	
	//referer = referer.substring(2);
	
	
	// 'beforeEach' function will run before each test creating a new instance of the contract each time
	beforeEach('setup contract for each test', async () => {
		tokenSaleInstance = await FITHTokenSaleReferrals.deployed();
		tokenInstance = await FITHToken.deployed();
		//tokenInstance = await ERC20Token.deployed();
		
		//tokenInstance = await ERC20Token.new(1000000, {from: admin});
		//tokenSaleInstance = await FITHTokenSaleReferrals.new(tokenInstance.address, tokenPrice, {from: admin});
    });
	
	
	
	it('initializes the contract with the correct values', async () => {
		assert.notEqual(tokenSaleInstance.address, 0x0, 'has contract address');
		assert.notEqual(await tokenSaleInstance.tokenContract(), 0x0, 'has token contract address');
		assert.equal(await tokenSaleInstance.tokenPrice(), tokenPrice, 'token price is correct');
		assert.equal(await tokenSaleInstance.referralPercent(), referralPercent, 'referral token percent is correct');
	});
	
	it('fund ICO smart contract with tokens', async () => {
		let receipt = await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
		numberOfTokens = 100;
		
		let refererTokens = numberOfTokens * (await tokenSaleInstance.referralPercent()) / 100.0;
		console.log('***refererTokens: ' + refererTokens + " for " + numberOfTokens + " purchased");
	});
	
	it('only admin/owner can update token price', async () => {
		let newTokenPrice = tokenPrice + 15000000;
		// user trying to update token price should fail
		try {
			await tokenSaleInstance.updateTokenPrice(newTokenPrice, { from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be admin to update token price'));
		}
		
		try {
			await tokenSaleInstance.updateTokenPrice(0, { from: admin });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'token price should be greater than zero'));
		}
		
		try {
			await tokenSaleInstance.updateTokenPrice(tokenPrice, { from: admin });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'token price should be different than current'));
		}
		
		let receipt = await tokenSaleInstance.updateTokenPrice(newTokenPrice, { from: admin });
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'TokenPriceUpdate', 'should be the "TokenPriceUpdate" event');
		assert.equal(receipt.logs[0].args._admin, admin, 'logs the admin address that updated the token price');
		assert.equal(receipt.logs[0].args._tokenPrice, newTokenPrice, 'logs the new token price');
		
		// set token price back to what it was
		await tokenSaleInstance.updateTokenPrice(tokenPrice, { from: admin });
	});
	
	it('only admin/owner can update referral token percent', async () => {
		let newReferralPercent = referralPercent + 1;
		// user trying to update token price should fail
		try {
			await tokenSaleInstance.updateReferralPercent(newReferralPercent, { from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be admin to update referral percent'));
		}
		
		try {
			await tokenSaleInstance.updateReferralPercent(0, { from: admin });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'referral percent should be greater than zero'));
		}
		
		try {
			await tokenSaleInstance.updateReferralPercent(100, { from: admin });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'referral percent should be less than a hundred percent'));
		}
		
		try {
			await tokenSaleInstance.updateReferralPercent(referralPercent, { from: admin });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'referral percent should be different than current'));
		}
		
		let receipt = await tokenSaleInstance.updateReferralPercent(newReferralPercent, { from: admin });
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'ReferralTokenPercentUpdate', 'should be the "ReferralTokenPercentUpdate" event');
		assert.equal(receipt.logs[0].args._admin, admin, 'logs the admin address that updated the token price');
		assert.equal(receipt.logs[0].args._referralPercent, newReferralPercent, 'logs the new referral percent');
		
		// set referral percent back to what it was
		await tokenSaleInstance.updateReferralPercent(referralPercent, { from: admin });
	});
	
	it('[ICO default function] buy tokens on token sale with and without referrals', async () => {
		
		numberOfTokens = 100;
		
		let refererTokens = numberOfTokens * (await tokenSaleInstance.referralPercent()) / 100.0;
		console.log('refererTokens: ' + refererTokens + " for " + numberOfTokens + " purchased");
		
		// user1 sends ether to contract address to buy tokens with referer address in data field
		//let tx = await web3.eth.sendTransaction({from: buyer, to: tokenSaleAddress, value: wei});
		console.log('sendTransaction[BEFORE]');
		let tx = await web3.eth.sendTransaction({from: buyer, to: tokenSaleInstance.address, value: numberOfTokens * tokenPrice, data: referer, gas: gasRequired});
		console.log('sendTransaction[AFTER]');
		tokensSold = await tokenSaleInstance.tokensSold();
		referralTokensSpent = await tokenSaleInstance.referralTokensSpent();
		console.log('tokensSold[2]: ' + tokensSold + " | referralTokensSpent: " + referralTokensSpent);
		assert.equal(tokensSold.toNumber(), 1*numberOfTokens, 'increments the number of tokens sold');
		assert.equal(referralTokensSpent.toNumber(), refererTokens, 'increments the number of referral tokens spent');
		console.log('tx.logs: ' + JSON.stringify(tx.logs));
		
		/*assert.equal(tx.logs.length, 4, 'triggers two events');
		
		assert.equal(tx.logs[1].event, 'TokensBought', 'should be the "TokensBought" event');
		assert.equal(tx.logs[1].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(tx.logs[1].args._amount, numberOfTokens, 'logs the number of tokens purchased');
		assert.equal(tx.logs[1].args._tokensSold, numberOfTokens, 'logs the total number of tokens purchased so far');
		
		assert.equal(tx.logs[3].event, 'ReferralTokens', 'should be the "ReferralTokens" event');
		assert.equal(tx.logs[3].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(tx.logs[3].args._referer, referer, 'logs the account of the referer');
		assert.equal(tx.logs[3].args._refererTokens, refererTokens, 'logs the number of referral tokens');
		*/
		// user1 sends ether to contract address to buy tokens with no referer
		console.log('sendTransaction2[BEFORE]');
		let tx2 = await web3.eth.sendTransaction({from: buyer, to: tokenSaleInstance.address, value: numberOfTokens * tokenPrice, data: "", gas: gasRequired});
		console.log('sendTransaction2[AFTER]');
		tx2 = await web3.eth.sendTransaction({from: buyer, to: tokenSaleInstance.address, value: numberOfTokens * tokenPrice, data: "0x", gas: gasRequired});
		console.log('sendTransaction2[AFTER2]');
		tx2 = await web3.eth.sendTransaction({from: buyer, to: tokenSaleInstance.address, value: numberOfTokens * tokenPrice, data: 0, gas: gasRequired});
		console.log('sendTransaction2[AFTER3]');
		tokensSold = await tokenSaleInstance.tokensSold();
		referralTokensSpent = await tokenSaleInstance.referralTokensSpent();
		console.log('tokensSold[3]: ' + tokensSold + " | referralTokensSpent: " + referralTokensSpent);
		assert.equal(tokensSold.toNumber(), 4*numberOfTokens, 'increments the number of tokens sold');
		assert.equal(referralTokensSpent.toNumber(), 1*refererTokens, 'increments the number of referral tokens spent');
		//console.log('tx2.logs: ' + JSON.stringify(tx2.logs));
		
		/*assert.equal(tx.logs.length, 1, 'triggers one event');
		
		assert.equal(tx.logs[0].event, 'TokensBought', 'should be the "TokensBought" event');
		assert.equal(tx.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(tx.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
		assert.equal(tx.logs[0].args._tokensSold, 2*numberOfTokens, 'logs the total number of tokens purchased so far');
		*/
		let balance = await tokenInstance.balanceOf(buyer);
		assert.equal(balance.toNumber(), 4*numberOfTokens, "inconsistent tokens balance of buyer");
		
		balance = await tokenInstance.balanceOf(referer);
		assert.equal(balance.toNumber(), refererTokens, "inconsistent tokens balance of referer");
		
		balance = await tokenInstance.balanceOf(tokenSaleInstance.address);
		assert.equal(balance.toNumber(), tokensAvailable - 4*numberOfTokens - refererTokens);
	});
	
	/*it('buy tokens on token sale with and without referrals', async () => {
		//let tokenSaleAddress = tokenSaleInstance.address;
		//let wei = numberOfTokens * tokenPrice;
		//let wei = web3.utils.toWei(ethers.toString(), "ether"); //10 * Math.pow(18); //10 ethers in wei
		
		numberOfTokens = 100;
		
		let refererTokens = numberOfTokens * (await tokenSaleInstance.referralPercent()) / 100.0;
		console.log('refererTokens: ' + refererTokens + " for " + numberOfTokens + " purchased");
		
		
		
		//receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice, data: referer });
		receipt = await tokenSaleInstance.buyTokens(numberOfTokens, referer, { from: buyer, value: numberOfTokens * tokenPrice });
		let tokensSold = await tokenSaleInstance.tokensSold();
		let referralTokensSpent = await tokenSaleInstance.referralTokensSpent();
		console.log('tokensSold: ' + tokensSold + " | referralTokensSpent: " + referralTokensSpent);
		console.log('buyer: ' + buyer + ' | referer: ' + referer);
		//...assert.equal(receipt.logs.length, 2, 'triggers two events');
		
		//console.log('receipt.logs: ' + JSON.stringify(receipt.logs));
		
		assert.equal(receipt.logs[0].event, 'TokensBought', 'should be the "TokensBought" event');
		assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
		assert.equal(receipt.logs[0].args._tokensSold, numberOfTokens, 'logs the total number of tokens purchased so far');
		
		assert.equal(receipt.logs[1].event, 'ReferralTokens', 'should be the "ReferralTokens" event');
		assert.equal(receipt.logs[1].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(receipt.logs[1].args._referer, referer, 'logs the account of the referer');
		assert.equal(receipt.logs[1].args._refererTokens, refererTokens, 'logs the number of referral tokens');
		
		assert.equal(tokensSold, numberOfTokens, 'increments the number of tokens sold');
		assert.equal(referralTokensSpent.toNumber(), refererTokens, 'increments the number of referral tokens spent');
		
		
		
		//test buy tokens with no referer
		var zeroRefererAddress = 0;
		receipt = await tokenSaleInstance.buyTokens(numberOfTokens, zeroRefererAddress, { from: buyer, value: numberOfTokens * tokenPrice });
		tokensSold = await tokenSaleInstance.tokensSold();
		referralTokensSpent = await tokenSaleInstance.referralTokensSpent();
		console.log('tokensSold: ' + tokensSold + " | referralTokensSpent: " + referralTokensSpent);
		console.log('receipt.logs2: ' + JSON.stringify(receipt.logs));
		assert.equal(tokensSold, 2*numberOfTokens, 'increments the number of tokens sold');
		assert.equal(referralTokensSpent.toNumber(), refererTokens, 'increments the number of referral tokens spent');
		
		
		
		let balance = await tokenInstance.balanceOf(buyer);
		assert.equal(balance.toNumber(), 4*numberOfTokens, "inconsistent tokens balance of buyer");
		//assert.equal(balance.toNumber(), 2*numberOfTokens, "inconsistent tokens balance of buyer");
		
		balance = await tokenInstance.balanceOf(referer);
		assert.equal(balance.toNumber(), 2*refererTokens, "inconsistent tokens balance of referer");
		//assert.equal(balance.toNumber(), refererTokens, "inconsistent tokens balance of referer");
		
		balance = await tokenInstance.balanceOf(tokenSaleInstance.address);
		assert.equal(balance.toNumber(), tokensAvailable - 4*numberOfTokens - 2*refererTokens);
		//assert.equal(balance.toNumber(), tokensAvailable - 2*numberOfTokens - refererTokens);
	});*/
	
	it('buy tokens equivalent in ether value sent test', async () => {
		let receipt;
		
		// trying to buy tokens different from equivalent in ether value sent should fail
		/*try {
			receipt = await tokenSaleInstance.buyTokens(numberOfTokens, 0, { from: buyer, value: (2*numberOfTokens * tokenPrice)});
			assert.fail();
		} catch (error) {
			console.log('***error.message: ' + error.message);
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal price of tokens in wei');
        }*/
		
		// Try to buy more tokens than available
		try {
			//receipt = await tokenSaleInstance.buyTokens(tokensAvailable + 1, referer, { from: buyer, value: (tokensAvailable + 1) * tokenPrice });
			receipt = await web3.eth.sendTransaction({from: buyer, to: tokenSaleInstance.address, value: (tokensAvailable + 1) * tokenPrice, data: "", gas: gasRequired});
			assert.fail();
		} catch (error) {
			console.log('***error.message: ' + error.message);
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        }
	});
	
	it('ends token sale with referrals', async () => {
		// Try to end sale from account other than the admin
		try {
			await tokenSaleInstance.endSale({ from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be admin to end sale'));
		}
		
		// End sale as admin
		let receipt = await tokenSaleInstance.endSale({ from: admin });
		let balance = await tokenInstance.balanceOf(admin);
		console.log('balance: ' + balance);
		assert.equal(balance.toNumber(), 99999999999595, 'returns all unsold dapp tokens to admin');
		// Check that the contract has no balance
		let balance2 = await web3.eth.getBalance(tokenSaleInstance.address);
		console.log('balance2: ' + balance2);
		assert.equal(balance2, 0, "token-sale contract tokens must be zero");
	});
	
	
	
	it('only owner can recover funds user sent by mistake to the contract address', async () => {
		tokenInstance = await FITHToken.new({from: admin});
		tokenSaleInstance = await FITHTokenSaleReferrals.new(tokenInstance.address, tokenPrice, {from: admin});
		
		let tokenSaleAddress = tokenSaleInstance.address;
		console.log("tokenSaleAddress.address >> ", tokenSaleAddress);
		
		let tokenSaleAddressBalance1 = await tokenInstance.balanceOf(tokenSaleAddress);
		assert.equal(tokenSaleAddressBalance1.toNumber(), 0, "tokenSaleAddressBalance1 should be zero");
		
		// user1 sends tokens to contract address for some reason and their are locked
		let tx = await tokenInstance.transfer(tokenSaleAddress, tokensAvailable, { from: admin });
		
		// recover lost funds
		let tokenSaleAddressBalance2 = await tokenInstance.balanceOf(tokenSaleAddress);
		assert.equal(tokenSaleAddressBalance2.toNumber(), tokensAvailable, "tokenSaleAddressBalance2 should be " + tokensAvailable);
		
		// user trying to recover tokens sent to this same contract should fail
		try {
			await tokenSaleInstance.recoverAnyERC20Token(tokenInstance.address, tokensAvailable, {from: user1}), "Owner required"
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be admin to end sale'));
		}
		
		// recover tokens sent to this same contract
		tx = await tokenSaleInstance.recoverAnyERC20Token(tokenInstance.address, tokensAvailable, {from: admin});
		
		let tokenSaleAddressBalance3 = await tokenInstance.balanceOf(tokenSaleAddress);
		assert.equal(tokenSaleAddressBalance3.toNumber(), 0, "tokenSaleAddressBalance3 should be " + tokensAvailable);
		
		// make sure owner has got the lost/locked funds in this contract that were just recovered
		let ownerBalance1 = await tokenInstance.balanceOf(admin);
		assert(ownerBalance1.toNumber() >= tokensAvailable, "ownerBalance1 should be " + tokensAvailable);
	});
});
