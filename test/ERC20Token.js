var ERC20Token = artifacts.require("./ERC20Token.sol");

contract('ERC20Token', function(accounts) {
	var tokenInstance;
	
	it('initializes the contract with the correct values', function() {
		return ERC20Token.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.name();
		}).then(function(name) {
			assert.equal(name, 'FITH Token', 'has the correct name');
			return tokenInstance.symbol();
		}).then(function(symbol) {
			assert.equal(symbol, 'FITH', 'has the correct symbol');
			return tokenInstance.standard();
		}).then(function(standard) {
			assert.equal(standard, 'FITH Token v1.0', 'has the correct standard');
		});
	});
	
	it('allocates the initial supply upon deployment', function() {
		return ERC20Token.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.totalSupply();
		}).then(function(totalSupply) {
			assert.equal(totalSupply.toNumber(), 10000000000, 'sets the total supply to 10,000,000,000');
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(adminBalance) {
			assert.equal(adminBalance.toNumber(), 10000000000, 'it allocates the initial supply to the admin account');
		});
	});
	
	it('transfers token ownership', async () => {
		tokenInstance = await ERC20Token.deployed();
		// Test `require` statement first by transferring something larger than the sender's balance
		try {
			await tokenInstance.transfer.call(accounts[1], 99999999999);
			assert.fail();
		} catch(error) {
			console.log('error: ' + JSON.stringify(error));
			assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
		}
		
		let success = await tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
		assert.equal(success, true, 'it returns true');
		
		let receipt = await tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
		assert.equal(receipt.logs[0].args.from, accounts[0], 'logs the account the tokens are transferred from');
		assert.equal(receipt.logs[0].args.to, accounts[1], 'logs the account the tokens are transferred to');
		assert.equal(receipt.logs[0].args.tokens, 250000, 'logs the transfer amount');
		
		let balance = await tokenInstance.balanceOf(accounts[1]);
		assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
		
		let balance2 = await tokenInstance.balanceOf(accounts[0]);
		assert.equal(balance2.toNumber(), 9999750000, 'deducts the amount from the sending account');
	});
	
	it('approves tokens for delegated transfer', function() {
		return ERC20Token.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.approve.call(accounts[1], 100);
		}).then(function(success) {
			assert.equal(success, true, 'it returns true');
			return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
			assert.equal(receipt.logs[0].args.owner, accounts[0], 'logs the account the tokens are authorized by');
			assert.equal(receipt.logs[0].args.spender, accounts[1], 'logs the account the tokens are authorized to');
			assert.equal(receipt.logs[0].args.tokens, 100, 'logs the transfer amount');
			return tokenInstance.allowance(accounts[0], accounts[1]);
		}).then(function(allowance) {
			assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated trasnfer');
		});
	});
	
	it('handles delegated token transfers', function() {
		return ERC20Token.deployed().then(function(instance) {
			tokenInstance = instance;
			fromAccount = accounts[2];
			toAccount = accounts[3];
			spendingAccount = accounts[4];
			// Transfer some tokens to fromAccount
			return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
		}).then(function(receipt) {
			// Approve spendingAccount to spend 10 tokens form fromAccount
			return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
		}).then(function(receipt) {
			// Try transferring something larger than the sender's balance
			return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
			// Try transferring something larger than the approved amount
			return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
			return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
		}).then(function(success) {
			assert.equal(success, true);
			return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
			assert.equal(receipt.logs[0].args.from, fromAccount, 'logs the account the tokens are transferred from');
			assert.equal(receipt.logs[0].args.to, toAccount, 'logs the account the tokens are transferred to');
			assert.equal(receipt.logs[0].args.tokens, 10, 'logs the transfer amount');
			return tokenInstance.balanceOf(fromAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
			return tokenInstance.balanceOf(toAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 10, 'adds the amount from the receiving account');
			return tokenInstance.allowance(fromAccount, spendingAccount);
		}).then(function(allowance) {
			assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
		});
	});
});
