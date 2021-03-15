var ERC20Token = artifacts.require('./ERC20Token.sol');
var FITHToken = artifacts.require('./FITHToken.sol');
var FITHTokenSale = artifacts.require('./FITHTokenSale.sol');
const assert = require("chai").assert;

contract('FITHTokenSale', async accounts => { //function(accounts) {
	var tokenInstance;
	var tokenSaleInstance;
	var admin = accounts[0];
	var buyer = accounts[1];
	var tokenPrice = 4000000000; // in wei for 4 decimals token
	var tokensAvailable = 750000;
	var numberOfTokens;
	
	
	
	// 'beforeEach' function will run before each test creating a new instance of the contract each time
	beforeEach('setup contract for each test', async () => {
		tokenSaleInstance = await FITHTokenSale.deployed();
		tokenInstance = await FITHToken.deployed();
		//tokenInstance = await ERC20Token.deployed();
		
		//tokenInstance = await ERC20Token.new(1000000, {from: admin});
		//tokenSaleInstance = await FITHTokenSale.new(tokenInstance.address, tokenPrice, {from: admin});
    });
	
	
	
	it('initializes the contract with the correct values', async () => {
		assert.notEqual(tokenSaleInstance.address, 0x0, 'has contract address');
		assert.notEqual(await tokenSaleInstance.tokenContract(), 0x0, 'has token contract address');
		assert.equal(await tokenSaleInstance.tokenPrice(), tokenPrice, 'token price is correct');
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
	
	it('buy tokens on token sale', async () => {
		let receipt = await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
		numberOfTokens = 10;
		
		receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
		let tokensSold = await tokenSaleInstance.tokensSold();
		console.log('tokensSold: ' + tokensSold);
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'TokensBought', 'should be the "TokensBought" event');
		assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
		assert.equal(receipt.logs[0].args._tokensSold, numberOfTokens, 'logs the total number of tokens purchased so far');
		
		assert.equal(tokensSold, numberOfTokens, 'increments the number of tokens sold');
		
		let tokenSaleAddress = tokenSaleInstance.address;
		let wei = numberOfTokens * tokenPrice;
		//let wei = web3.utils.toWei(ethers.toString(), "ether"); //10 * Math.pow(18); //10 ethers in wei
		
		// user1 sends ether to contract address to buy tokens
		let tx = await web3.eth.sendTransaction({from: buyer, to: tokenSaleAddress, value: wei});
		tokensSold = await tokenSaleInstance.tokensSold();
		console.log('tokensSold[2]: ' + tokensSold);
		console.log('tx.logs: ' + JSON.stringify(tx.logs));
		/*assert.equal(tx.logs.length, 2, 'triggers two events');
		assert.equal(tx.logs[1].event, 'TokensBought', 'should be the "TokensBought" event');
		assert.equal(tx.logs[1].args._buyer, buyer, 'logs the account that purchased the tokens');
		assert.equal(tx.logs[1].args._amount, numberOfTokens, 'logs the number of tokens purchased');
		assert.equal(tx.logs[1].args._tokensSold.toNumber(), tokensSold.toNumber(), '[2]logs the total number of tokens purchased so far');*/
		
		let balance = await tokenInstance.balanceOf(buyer);
		assert.equal(balance.toNumber(), 2*numberOfTokens);
		
		balance = await tokenInstance.balanceOf(tokenSaleInstance.address);
		assert.equal(balance.toNumber(), tokensAvailable - 2*numberOfTokens);
		
		// Try to buy tokens different from the ether value
		try {
			receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
			assert.fail();
		} catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
        }
		
		// Try to buy more tokens than available
		try {
			receipt = await tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice });
			assert.fail();
		} catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        }
	});
	
	it('ends token sale', async () => {
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
		assert.equal(balance.toNumber(), 99999999999980, 'returns all unsold dapp tokens to admin');
		// Check that the contract has no balance
		let balance2 = await web3.eth.getBalance(tokenSaleInstance.address);
		console.log('balance2: ' + balance2);
		assert.equal(balance2, 0, "token-sale contract tokens must be zero");
	});
	
	
	
	it('only owner can recover funds user sent by mistake to the contract address', async () => {
		tokenInstance = await FITHToken.new({from: admin});
		tokenSaleInstance = await FITHTokenSale.new(tokenInstance.address, tokenPrice, {from: admin});
		
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
