var ERC20Token = artifacts.require('./ERC20Token.sol');
var FITHToken = artifacts.require('./FITHToken.sol');
//var FITHTokenSale = artifacts.require('./FITHTokenSale.sol');
//var FITHTokenSaleReferrals = artifacts.require('./FITHTokenSaleReferrals.sol');
var USDT = artifacts.require('./USDT.sol');
var OrFeedTest = artifacts.require('./OrFeedTest.sol');
var FITHTokenSaleRefAndPromo = artifacts.require('./FITHTokenSaleRefAndPromo.sol');
const assert = require("chai").assert;

contract('FITHTokenSaleReferrals', async accounts => { //function(accounts) {
	var tokenInstance;
	var tokenSaleInstance;
	var usdtInstance;
	var orFeedTestInstance;
	var owner = accounts[0];
	var buyer = accounts[1];
	var referer = accounts[2];
	var buyer2 = accounts[3];
	var tokenPrice = 4000000000; // in wei for 4 decimals token
	var tokensAvailable = 750000;
	var referralPercent = 5; //5% paid out to referers for bringing referrals
	var numberOfTokens;
	var gasRequired = 175000;
	
	//referer = referer.substring(2);
	
	
	// 'beforeEach' function will run before each test creating a new instance of the contract each time
	beforeEach('setup contract for each test', async () => {
		//tokenSaleInstance = await FITHTokenSaleReferrals.deployed();
		tokenSaleInstance = await FITHTokenSaleRefAndPromo.deployed();
		tokenInstance = await FITHToken.deployed();
		usdtInstance = await USDT.deployed();
		orFeedTestInstance = await OrFeedTest.deployed();
		//tokenInstance = await ERC20Token.new(1000000, {from: owner});
		//tokenSaleInstance = await FITHTokenSaleReferrals.new(tokenInstance.address, tokenPrice, {from: owner});
    });
	
	
	
	it('initializes the contract with the correct values', async () => {
		assert.notEqual(tokenSaleInstance.address, 0x0, 'has contract address');
		
		assert.equal(await tokenSaleInstance.usdtContractAddress(), usdtInstance.address, 'has correct USDT token contract address');
		assert.equal(await tokenSaleInstance.orFeedContractAddress(), orFeedTestInstance.address, 'has correct OrFeed contract address');
		assert.equal(await orFeedTestInstance.exRate(), 325680000, 'has correct eth exchange price in USDT tokens');
		//assert.equal(await tokenSaleInstance.ethPrice(), 23000, 'has correct eth price');
		assert.equal(await tokenSaleInstance.ethDiscountPercent(), 5000, 'has correct eth discount percent');
		
		// assert.equal(await usdtInstance.balanceOf(owner), web3.utils.toBN(10000000000 * Math.pow(10, 18)), 'owner has correct USDT balance');
		//assert.equal(await usdtInstance.balanceOf(owner), web3.utils.toBN('10000000000000000000000000000'), 'owner has correct USDT balance');
		console.log('*** owner has USDT: ' + (await usdtInstance.balanceOf(owner)));
	});
	
	
	
	it('owner can change OrFeed contract address', async () => {
		
		// backup OrFeed address
		let orFeed = await tokenSaleInstance.orFeedContractAddress();
		
		let newOrFeed = usdtInstance.address;
		
		// user trying to update OrFeed contract address should fail
		try {
			await tokenSaleInstance.setOrFeedAddress(newOrFeed, { from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be owner to update OrFeed address'));
		}
		
		let receipt = await tokenSaleInstance.setOrFeedAddress(newOrFeed, { from: owner });
		assert.equal(await tokenSaleInstance.orFeedContractAddress(), newOrFeed, 'has correct OrFeed address');
		
		// owner trying to set the same address should fail
		try {
			await tokenSaleInstance.setOrFeedAddress(newOrFeed, { from: owner });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'orfeed address must be different'));
		}
		
		// set OrFeed address back to what it was
		receipt = await tokenSaleInstance.setOrFeedAddress(orFeed, { from: owner });
		assert.equal(await tokenSaleInstance.orFeedContractAddress(), orFeed, 'has correct OrFeed address');
	});
	
	it('fund ICO smart contract with tokens', async () => {
		let receipt = await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: owner });
		numberOfTokens = 100;
		
		let refererTokens = numberOfTokens * (await tokenSaleInstance.referralPercent()) / 100.0;
		console.log('***refererTokens: ' + refererTokens + " for " + numberOfTokens + " purchased");
	});
	
	/*it('only admin/owner can update eth price in USDT (USD)', async () => {
		// we store integers
		let ethPrice = await tokenSaleInstance.ethPrice();
		let newEthPrice = ethPrice + 1;
		
		// user trying to update price should fail
		try {
			await tokenSaleInstance.updateEthPrice(newEthPrice, { from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be owner to update eth price'));
		}
		
		try {
			await tokenSaleInstance.updateEthPrice(ethPrice, { from: owner });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'eth price should be different than current'));
		}
		
		let receipt = await tokenSaleInstance.updateEthPrice(newEthPrice, { from: owner });
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'EthPriceUpdated', 'should be the "EthPriceUpdated" event');
		assert.equal(receipt.logs[0].args.admin, owner, 'logs the owner address that updated the eth price');
		assert.equal(receipt.logs[0].args.newEthPrice, newEthPrice, 'logs the new eth price');
		
		// set eth price back to what it was
		await tokenSaleInstance.updateEthPrice(ethPrice, { from: owner });
	});*/
	
	it('only admin/owner can update eth discount percent', async () => {
		// we store integers
		let ethDiscountPercent = await tokenSaleInstance.ethDiscountPercent();
		let newEthDiscountPercent = ethDiscountPercent.toNumber() + 1;
		
		// user trying to update percent should fail
		try {
			await tokenSaleInstance.updateEthDiscountPercent(newEthDiscountPercent, { from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be owner to update eth discount percent'));
		}
		
		try {
			await tokenSaleInstance.updateEthDiscountPercent(ethDiscountPercent, { from: owner });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'eth discount percent should be different than current'));
		}
		
		//valid range for discount percent: newEthDiscountPercent > 0 && newEthDiscountPercent < 10000
		try {
			await tokenSaleInstance.updateEthDiscountPercent(0, { from: owner });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'eth discount percent should be greater than zero'));
		}
		
		try {
			await tokenSaleInstance.updateEthDiscountPercent(10000, { from: owner });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'eth discount percent should be less than 10.000'));
		}
		
		console.log('> newEthDiscountPercent: ' + newEthDiscountPercent);
		let receipt = await tokenSaleInstance.updateEthDiscountPercent(newEthDiscountPercent, { from: owner });
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'EthDiscountPercentUpdated', 'should be the "EthDiscountPercentUpdated" event');
		assert.equal(receipt.logs[0].args.admin, owner, 'logs the owner address that updated the eth discount percent');
		assert.equal(receipt.logs[0].args.newEthDiscountPercent, newEthDiscountPercent, 'logs the new eth discount percent');
		
		// set eth discount percent back to what it was
		await tokenSaleInstance.updateEthDiscountPercent(ethDiscountPercent, { from: owner });
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
		let ethBalance = await tokenSaleInstance.ethBalances(buyer);
		assert.equal(ethBalance.toNumber(), 1*numberOfTokens * tokenPrice, 'eth balance for promo purchase');
		
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
		ethBalance = await tokenSaleInstance.ethBalances(buyer);
		assert.equal(ethBalance.toNumber(), 4 * numberOfTokens * tokenPrice, 'eth balance for promo purchase');
		
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
	
	
	
	it('test calculate eth wei cost and USDT for promo', async () => {
		numberOfTokens = 100;
		let ethWei = numberOfTokens * tokenPrice;
		
		//let ethPrice = await tokenSaleInstance.ethPrice();
		// one eth price in USDT
		//let ethPrice = await tokenSaleInstance.getEthUsdPrice(Math.pow(10,18));
		let ethPrice = 325680000; //6 decimals for USDT
		let ethDiscountPercent = 5000; //await tokenSaleInstance.ethDiscountPercent();
		
		//let expectedUSDTWei = ethWei * ethPrice / 100;
		let expectedUSDTWei = ethWei * ethPrice / Math.pow(10,18); //eth in USDT wei
		expectedUSDTWei = parseInt(expectedUSDTWei);
		
		let USDTWei = await tokenSaleInstance.calculateEthWeiCost.call(ethWei);
		console.log('>>> expectedUSDTWei: ' + expectedUSDTWei);
		console.log('>>>         USDTWei: ' + USDTWei);
		assert.equal(expectedUSDTWei, USDTWei, 'calculateEthWeiCost should match expected value');
		
		let expectedDiscountedUSDTWei = expectedUSDTWei * (10000 - ethDiscountPercent) / 10000;
		let discountedUSDTWei = await tokenSaleInstance.calculateUSDTWithDiscount.call(USDTWei);
		console.log('>>> expectedDiscountedUSDTWei: ' + expectedDiscountedUSDTWei);
		console.log('>>>         discountedUSDTWei: ' + discountedUSDTWei);
		assert.equal(expectedDiscountedUSDTWei, discountedUSDTWei, 'calculateUSDTWithDiscount should match expected value');
		
		
		
		let USDTWei2 = await tokenSaleInstance.checkEthWeiPromoCost.call(ethWei);
		console.log('>>> expectedDiscountedUSDTWei: ' + expectedDiscountedUSDTWei);
		console.log('>>>                  USDTWei2: ' + USDTWei2);
		assert.equal(expectedDiscountedUSDTWei, USDTWei2, 'checkEthWeiPromoCost should match expected value');
		
		/*
		let expectedDiscountedUSDTWei_Opt = ethWei * ethPrice * (10000 - ethDiscountPercent) / Math.pow(10,18)  / 10000;
		expectedDiscountedUSDTWei_Opt = parseInt(expectedDiscountedUSDTWei_Opt);
		let USDTWei3 = await tokenSaleInstance.checkEthWeiPromoCost_Opt.call(ethWei);
		console.log('>>> expectedDiscountedUSDTWei_Opt: ' + expectedDiscountedUSDTWei_Opt);
		console.log('>>>                      USDTWei3: ' + USDTWei3);
		assert.equal(expectedDiscountedUSDTWei_Opt, USDTWei3, 'checkEthWeiPromoCost_Opt should match expected value');*/
		
		
		/*
		// manually calculated discount
		// 1 eth = 25.000 FITH tokens = 250.000.000 raw FITH tokens
		let ethPrice1 = 325680000; //6 decimals for USDT
		// price per fith token * 100 (numberOfTokens)
		let manualEthWei = 4000000000 * 100; //Math.pow(10,18) / 250000000 * 100;
		
		let manualDiscountedUSDTWei = manualEthWei * ethPrice1 / Math.pow(10,18); //eth in USDT wei
		manualDiscountedUSDTWei = 0.8 * manualDiscountedUSDTWei; //20% discount
		manualDiscountedUSDTWei = parseInt(manualDiscountedUSDTWei);
		console.log('>>>   manualDiscountedUSDTWei: ' + manualDiscountedUSDTWei);
		assert.equal(discountedUSDTWei, manualDiscountedUSDTWei, 'manual discount should match expected value');*/
	});
	
	
	
	it('deposit and withdraw USDT test', async () => {
		let USDTWei = 100000;
		
		//transfer some USDT to buyer
		await usdtInstance.transfer(buyer, USDTWei, {from: owner});
		assert.equal((await usdtInstance.balanceOf(buyer)).toNumber(), USDTWei, 'buyer should have USDT wei by now');
		console.log('<<< STEP_1 >>>');
		
		/// USDT deposit test
		// trying to deposit without previous approval should fail
		try {
			await tokenSaleInstance.depositUSDTAfterApproval(USDTWei, {from: buyer});
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'approval needed first'));
		}
		console.log('<<< STEP_2 >>>');
		
		// first appove token sale contract to deposit USDT
		await usdtInstance.approve(tokenSaleInstance.address, USDTWei, {from: buyer});
		assert.equal(await usdtInstance.allowance(buyer, tokenSaleInstance.address), USDTWei, 'buyer should have approved token sale contract by now');
		console.log('<<< STEP_3 >>>');
		
		let tx = await tokenSaleInstance.depositUSDTAfterApproval(buyer, USDTWei, {from: buyer});
		console.log('<<< STEP_3_1 >>>');
		
		assert.equal(tx.logs.length, 1, 'triggers one event');
		assert.equal(tx.logs[0].event, 'USDTDeposit', 'should be the "USDTDeposit" event');
		assert.equal(tx.logs[0].args.from, buyer, 'logs the user address that made the USDT deposit');
		assert.equal(tx.logs[0].args.tokens, USDTWei, 'logs the USDT deposit amount');
		
		assert.equal(await tokenSaleInstance.usdtBalances(buyer), USDTWei, 'buyer should have deposited the correct amount of USDT tokens by now');
		console.log('<<< STEP_4 >>>');
		
		
		/// USDT withdraw test
		// trying to withdraw more USDT tokens than available should fail
		try {
			await tokenSaleInstance.withdrawUSDT(USDTWei + 1, {from: buyer});
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'can not withdraw more USDT tokens than available'));
		}
		console.log('<<< STEP_5 >>>');
		
		tx = await tokenSaleInstance.withdrawUSDT(USDTWei-1, {from: buyer});
		assert.equal(tx.logs.length, 1, 'triggers one event');
		assert.equal(tx.logs[0].event, 'USDTWithdrawal', 'should be the "USDTWithdrawal" event');
		assert.equal(tx.logs[0].args.from, buyer, 'logs the user address that made the USDT withdrawal');
		assert.equal(tx.logs[0].args.tokens, USDTWei-1, 'logs the USDT withdrawal amount');
		console.log('<<< STEP_6 >>>');
		
		//withdraw remaining USDT
		tx = await tokenSaleInstance.withdrawUSDT(1, {from: buyer});
		
		assert.equal(await tokenSaleInstance.usdtBalances(buyer), 0, 'buyer should have no USDT tokens available');
		console.log('<<< STEP_7 >>>');
		
		//transfer USDT back to owner
		await usdtInstance.transfer(owner, USDTWei, {from: buyer});
		assert.equal((await usdtInstance.balanceOf(buyer)).toNumber(), 0, 'buyer should have no USDT wei by now');
	});
	
	
	
	it('buy eth at discount test', async () => {
		console.log('<<< buy eth at discount test >>>');
		numberOfTokens = 100;
		let ethWeiFromTokenSale = 4 * numberOfTokens * tokenPrice;
		let ethPrice1 = await tokenSaleInstance.getEthUsdPrice.call(); //backup eth price
		console.log('[0]    ethWeiFromTokenSale: ' + ethWeiFromTokenSale);
		console.log('[0]    ethPrice1: ' + ethPrice1);
		// USDT tokens with 6 decimals equivalent for EthWeiFromTokenSale
		let USDTWei = ethWeiFromTokenSale * ethPrice1 / Math.pow(10,18);
		USDTWei = parseInt(USDTWei);
		//let USDTWei = await tokenSaleInstance.getEthUsdPrice(ethWeiFromTokenSale); //USDT 6 decimals
		// we can use 'getEthUsdPrice' or 'calculateEthWeiCost' functions, they are the same
		console.log('[1]    USDTWei: ' + USDTWei);
		
		//transfer some USDT to buyer
		await usdtInstance.transfer(buyer, USDTWei, {from: owner});
		let usdt_buyer = await usdtInstance.balanceOf(buyer);
		console.log(' usdt_buyer: ' + usdt_buyer);
		console.log('    USDTWei: ' + USDTWei);
		assert.equal(usdt_buyer.toNumber(), USDTWei, 'buyer should have USDT wei by now');
		
		// buyer should have correct eth balance for eth discount promo from fith token sale as he purchased fith tokens
		let ethBalance_buyer = await tokenSaleInstance.ethBalances(buyer);
		console.log('    ethBalance_buyer: ' + ethBalance_buyer);
		console.log(' ethWeiFromTokenSale: ' + ethWeiFromTokenSale);
		assert.equal(ethBalance_buyer, ethWeiFromTokenSale, 'buyer should have eth balance for promo purchase by now');
		
		
		
		// first appove token sale contract to deposit USDT
		await usdtInstance.approve(tokenSaleInstance.address, USDTWei, {from: buyer});
		assert.equal((await usdtInstance.allowance(buyer, tokenSaleInstance.address)).toNumber(), USDTWei, 'buyer should have approved token sale contract by now');
		console.log('<<< STEP_3 >>>');
		
		let tx = await tokenSaleInstance.depositUSDTAfterApproval(buyer, USDTWei, {from: buyer});
		console.log('<<< STEP_3_1 >>>');
		assert.equal((await tokenSaleInstance.usdtBalances(buyer)).toNumber(), USDTWei, 'buyer should have deposited the correct amount of USDT tokens by now');
		console.log('<<< STEP_4 >>>');
		
		
		
		let ethWei = 5 * numberOfTokens * tokenPrice;
		
		// trying to buy more eth at promo than used at token sale should fail
		try {
			await tokenSaleInstance.buyEthAtDiscount(ethWei, {from: buyer});
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'can not buy more eth from promo than avail from token sale'));
		}
		
		
		
		// buy half of available eth for this user at discount
		ethWei = 2 * numberOfTokens * tokenPrice;
		
		// having zero ethPrice should fail
		let ethPrice = (await orFeedTestInstance.exRate()).toNumber(); //backup eth price
		await orFeedTestInstance.setExRate(0, {from: owner});
		assert.equal(await orFeedTestInstance.exRate(), 0, 'eth price should be zero');
		
		try {
			tx = await tokenSaleInstance.buyEthAtDiscount(ethWei, {from: buyer});
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'can not buy more eth from promo than avail from token sale'));
		}
		
		// set eth price back to what it used to be
		await orFeedTestInstance.setExRate(ethPrice, {from: owner});
		assert.equal((await orFeedTestInstance.exRate()).toNumber(), ethPrice, 'eth price should match expected value');
		
		
		
		// read balances before the promo purchase
		let usdtBalance1_buyer = (await tokenSaleInstance.usdtBalances(buyer)).toNumber();
		let ethBalance1_buyer = (await tokenSaleInstance.ethBalances(buyer)).toNumber();
		let usdtBalance1_owner = (await tokenSaleInstance.usdtBalances(owner)).toNumber();
		console.log(' usdtBalance1_buyer: ' + usdtBalance1_buyer);
		console.log('  ethBalance1_buyer: ' + ethBalance1_buyer);
		console.log(' usdtBalance1_owner: ' + usdtBalance1_owner);
		
		// check balances match expected values before promo purchase
		assert.equal(usdtBalance1_buyer, USDTWei, 'USDT balance for buyer should match expected value');
		assert.equal(ethBalance1_buyer, ethWeiFromTokenSale, 'eth wei balance for buyer should match expected value');
		
		// calculate expected USDT cost given eth wei for promo purchase
		let USDTCost = await tokenSaleInstance.calculateEthWeiCost.call(ethWei);
		USDTCost = await tokenSaleInstance.calculateUSDTWithDiscount.call(USDTCost);
		USDTCost = USDTCost.toNumber();
		console.log('>>> USDTCost: ' + USDTCost);
		
		let buyerEthBalanceBefore = await web3.eth.getBalance(buyer);
		let tokenSaleEthBalanceBefore = await web3.eth.getBalance(tokenSaleInstance.address);
		console.log('>>>              buyerEthBalanceBefore: ' + buyerEthBalanceBefore);
		console.log('>>>          tokenSaleEthBalanceBefore: ' + tokenSaleEthBalanceBefore);
		
		// eth promo purchase at discount
		tx = await tokenSaleInstance.buyEthAtDiscount(ethWei, {from: buyer, gas: 350000});
		
		// check PromoEthBought event was emitted
		assert.equal(tx.logs.length, 1, 'triggers one event');
		assert.equal(tx.logs[0].event, 'PromoEthBought', 'should be the "PromoEthBought" event');
		assert.equal(tx.logs[0].args.user, buyer, 'logs the user address buying eth at promotion');
		assert.equal(tx.logs[0].args.ethWei, ethWei, 'logs the eth wei bought at promotion');
		assert.equal(tx.logs[0].args.usdtCost, USDTCost, 'logs the USDT wei spent to buy eth at promotion');
		
		// read balances after the promo purchase
		let usdtBalance2_buyer = (await tokenSaleInstance.usdtBalances(buyer)).toNumber();
		let ethBalance2_buyer = (await tokenSaleInstance.ethBalances(buyer)).toNumber();
		let usdtBalance2_owner = (await tokenSaleInstance.usdtBalances(owner)).toNumber();
		
		// check balances match expected values after promo purchase
		assert.equal(usdtBalance2_buyer, usdtBalance1_buyer - USDTCost, 'USDT balance for buyer should match expected value after promo');
		assert.equal(usdtBalance2_owner, usdtBalance1_owner + USDTCost, 'USDT wei balance for owner should match expected value after promo');
		assert.equal(ethBalance2_buyer, ethBalance1_buyer - ethWei, 'eth wei balance for buyer should match expected value after promo');
		
		// also check that eth bought at promotion are in buyer address
		let buyerEthBalanceAfter = await web3.eth.getBalance(buyer);
		let tokenSaleEthBalanceAfter = await web3.eth.getBalance(tokenSaleInstance.address);
		console.log('>>>                     buyerEthBalanceAfter: ' + buyerEthBalanceAfter);
		console.log('>>>           buyerEthBalanceBefore + ethWei: ' + (Number(buyerEthBalanceBefore) + Number(ethWei)));
		console.log('>>>                 tokenSaleEthBalanceAfter: ' + tokenSaleEthBalanceAfter);
		console.log('>>>       tokenSaleEthBalanceBefore - ethWei: ' + (Number(tokenSaleEthBalanceBefore) - Number(ethWei)));
		console.log('>>>                                   ethWei: ' + ethWei);
		let trx = await web3.eth.getTransaction(tx.tx);
		console.log('>>> gasPrice: ' + trx.gasPrice);
		console.log('>>>  gasUsed: ' + tx.receipt.gasUsed);
		let gasCost = Number(trx.gasPrice) * Number(tx.receipt.gasUsed);
		console.log('>>>  gasCost: ' + gasCost);
		console.log('>>> buyerEthBalanceBefore + ethWei - gasCost: ' + (Number(buyerEthBalanceBefore) + Number(ethWei) - Number(gasCost)));
		assert.equal(Number(buyerEthBalanceAfter), Number(buyerEthBalanceBefore) + Number(ethWei) - Number(gasCost), 'buyer eth balance should match expected value after promo purchase');
		assert.equal(Number(tokenSaleEthBalanceAfter), Number(tokenSaleEthBalanceBefore) - Number(ethWei), 'tokenSale eth balance should match expected value after promo purchase');
		
		
		// owner can withdraw USDT corporate profits
		USDTProfit = (await tokenSaleInstance.usdtBalances(owner)).toNumber();
		console.log('>>> owner withdraws USDT profit: ' + USDTProfit);
		tx = await tokenSaleInstance.withdrawUSDT(USDTProfit, {from: owner});
		assert.equal(await tokenSaleInstance.usdtBalances(owner), 0, 'USDT wei balance for owner should match expected value after promo');
		
		
		
		/// test withdraw remaining buyer USDT after token sale ends, it must be possible to withdraw USDT afterwards at anytime
		let USDTWeiLeft = (await tokenSaleInstance.usdtBalances(buyer)).toNumber();
		console.log('>>> buyer USDT wei left: ' + USDTWeiLeft);
	});
	
	
	
	it('ends token sale with referrals', async () => {
		// Try to end sale from account other than the owner
		try {
			await tokenSaleInstance.endSale({ from: buyer });
			assert.fail();
		} catch(error) {
			assert(error.message.indexOf('revert' >= 0, 'must be owner to end sale'));
		}
		
		let ownerEth_1 = await web3.eth.getBalance(owner);
		let tokenSaleEth_1 = await web3.eth.getBalance(tokenSaleInstance.address);
		console.log('>>>     ownerEth_1: ' + ownerEth_1);
		console.log('>>> tokenSaleEth_1: ' + tokenSaleEth_1);
		
		// End sale as owner
		let receipt = await tokenSaleInstance.endSale({ from: owner });
		let balance = await tokenInstance.balanceOf(owner);
		console.log('balance: ' + balance);
		assert.equal(balance.toNumber(), 99999999999595, 'returns all unsold dapp tokens to owner');
		
		// Check that the contract has no fith tokens
		balance = await tokenInstance.balanceOf(tokenSaleInstance.address);
		console.log('tokenSale balance: ' + balance);
		assert.equal(balance.toNumber(), 0, 'tokenSale contract fith token balance should be zero');
		
		// Check that the contract has no balance
		let balance2 = await web3.eth.getBalance(tokenSaleInstance.address);
		console.log('balance2: ' + balance2);
		assert.equal(balance2, 0, "token-sale contract eth balance must be zero");
		
		
		
		/// test withdraw remaining buyer USDT after token sale ended
		// buyer can withdraw remaining USDT
		let USDTWei = (await tokenSaleInstance.usdtBalances(buyer)).toNumber();
		console.log('>>> buyer withdraws USDT: ' + USDTWei);
		tx = await tokenSaleInstance.withdrawUSDT(USDTWei, {from: buyer});
		assert.equal(await tokenSaleInstance.usdtBalances(buyer), 0, 'USDT wei balance for buyer should match expected value after token sale ended');
	});
	
});
