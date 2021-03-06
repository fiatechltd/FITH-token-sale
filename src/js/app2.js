App2 = {
	web3Provider: null,
	loading: false,
	contracts: {},
	//contractsDir: './build/contracts/',
	contractsDir: './contracts/',
	usdtContractAddress: "0xdb5993Bc9E9256B4fB33D5E937A05B7379CeDa85", //local test address
	tokenSaleContractAddress: "0x07be40dfa2721d8c2d022fceb7a76323c4e99fb5", //local test address, make sure it's all lowercase
	//usdtContractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", //LIVE address
	//tokenSaleContractAddress: "", //LIVE address
	account: '0x0',
	usdtContractDecimals: 6,
	ethDecimals: 18,
	usdtContractUserBalance: 0, //user USDT balance available in his own wallet
	usdtContractUserAllowance: 0, //user approved amount for deposit to token-sale contract for eth promo
	tokenSaleUserUSDTDeposit: 0, //user USDT balance deposited to token-sale contract for eth promo
	ethPromoUserBalance: 0, //eth available for user to buy at promotion
	
	load: async () => {
		console.log("loadWeb3...");
		await App2.loadWeb3()
		console.log("loadAccount...");
		await App2.loadAccount()
		await App2.listenForAccountChange()
		console.log("loadContract...");
		await App2.loadContract()
		console.log("App2.usdtContractDecimals: " + App2.usdtContractDecimals);
		console.log("App2.ethDecimals: " + App2.ethDecimals);
		console.log("loadBalances...");
		await App2.loadBalances()
		console.log("render...");
		await App2.render()
		//await App2.showHomepage();
		console.log("end...");
	},
	
	// https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
	loadWeb3: async () => {
		if (typeof web3 !== 'undefined') {
			App2.web3Provider = web3.currentProvider
			web3 = new Web3(web3.currentProvider)
		} else {
			window.alert("Please connect to Metamask.")
		}
		// Modern dapp browsers...
		if (window.ethereum) {
			window.web3 = new Web3(ethereum)
			try {
				// Request account access if needed
				await ethereum.enable()
				// Accounts now exposed
				console.log('window.ethereum => Accounts now exposed');
				///web3.eth.sendTransaction({/* ... */})
				console.log('window.ethereum => Accounts now exposed2');
			} catch (error) {
				// User denied account access...
			}
		}
		// Legacy dapp browsers...
		else if (window.web3) {
			App2.web3Provider = web3.currentProvider
			window.web3 = new Web3(web3.currentProvider)
			// Accounts always exposed
			console.log('window.web3 => Accounts always exposed');
			///web3.eth.sendTransaction({/* ... */})
			console.log('window.web3 => Accounts always exposed2');
		}
		// Non-dapp browsers...
		else {
			console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
		}
	},
	
	loadAccount: async () => {
		// Set the current blockchain account
		App2.account = web3.eth.accounts[0]
		console.log("App2.account: " + App2.account);
	},
	
	listenForAccountChangeLoopFn: async () => {
		if (web3.eth.accounts[0] !== App2.account) {
			await App2.loadAccount();
			await App2.loadBalances();
			await App2.render();
		}
	},
	
	listenForAccountChange: async () => {
		// listen for new account selected
		setInterval(() => { App2.listenForAccountChangeLoopFn(); }, 1000);
	},
	
	loadContract: async () => {
		// Create a JavaScript version of the smart contract
		const usdtFullPath = App2.contractsDir + "USDT.json";
		console.log("loadContract.usdtFullPath => " + usdtFullPath);
		let abi = (await $.getJSON(usdtFullPath)).abi;
		const usdtContract = web3.eth.contract(abi);
		App2.usdtContract = usdtContract.at(App2.usdtContractAddress);
		App2.usdtContract.Approval(App2.USDTApprovalEventCallback);
		
		const tokenSaleFullPath = App2.contractsDir + "FITHTokenSaleRefAndPromo.json";
		console.log("loadContract.tokenSaleFullPath => " + tokenSaleFullPath);
		abi = (await $.getJSON(tokenSaleFullPath)).abi;
		const tokenSaleContract = web3.eth.contract(abi);
		App2.tokenSaleContract = tokenSaleContract.at(App2.tokenSaleContractAddress);
		App2.tokenSaleContract.USDTDeposit(App2.USDTDepositEventCallback);
		App2.tokenSaleContract.USDTWithdrawal(App2.USDTWithdrawalEventCallback);
		App2.tokenSaleContract.PromoEthBought(App2.PromoEthBoughtEventCallback);
		//var promoEthBoughtEvent = App2.tokenSaleContract.PromoEthBought();
		//promoEthBoughtEvent.watch(App2.PromoEthBoughtEventCallback);
	},
	
	// USDT Approval event callback
	/*USDTApprovalEventCallback: async (err, res) => {
		if (err) {
			console.log("***USDTApprovalEventCallback err: " + JSON.stringify(err));
			return;
		}
		var owner = res.args.owner;
		var spender = res.args.spender;
		var tokens = res.args.tokens.toNumber(); //'value' is on USDT interface on the blockchain
		//console.log("USDTApprovalEventCallback => owner: " + owner + " | spender: " + spender + " | tokens: " + tokens);
		
		if (owner !== App2.account || spender !== App2.tokenSaleContractAddress) {
			//console.log("*USDTApprovalEventCallback: waiting for this user approval on this contract");
			return;
		}
		console.log("USDTApprovalEventCallback => owner: " + owner + " | spender: " + spender + " | tokens: " + tokens);
		
		await App2.loadUSDTContractUserAllowance();
		await App2.renderBalances();
	},*/
	
	// USDTDeposit event callback
	USDTDepositEventCallback: async (err, res) => {
		if (err) {
			console.log("***USDTDepositEventCallback err: " + JSON.stringify(err));
			return;
		}
		var sender = res.args.from;
		var tokens = res.args.tokens;
		console.log("USDTDepositEventCallback => sender: " + sender + " | usdt: " + tokens);
		
		if (sender !== App2.account) {
			console.log("*USDTDepositEventCallback: waiting for this user event");
			return;
		}
		
		await App2.loadUSDTContractUserBalance();
		//await App2.loadUSDTContractUserAllowance();
		await App2.loadTokenSaleUserUSDTDeposit();
		await App2.renderBalances();
	},
	
	// USDTWithdrawal event callback
	USDTWithdrawalEventCallback: async (err, res) => {
		if (err) {
			console.log("***USDTWithdrawalEventCallback err: " + JSON.stringify(err));
			return;
		}
		var sender = res.args.from;
		var tokens = res.args.tokens;
		console.log("USDTWithdrawalEventCallback => sender: " + sender + " | usdt: " + tokens);
		
		if (sender !== App2.account) {
			console.log("*USDTWithdrawalEventCallback: waiting for this user event");
			return;
		}
		
		await App2.loadUSDTContractUserBalance();
		await App2.loadTokenSaleUserUSDTDeposit();
		await App2.renderBalances();
	},
	
	// PromoEthBought event callback
	PromoEthBoughtEventCallback: async (err, res) => {
		if (err) {
			console.log("***PromoEthBoughtEventCallback err: " + JSON.stringify(err));
			return;
		}
		var sender = res.args.user;
		var ethWei = res.args.ethWei;
		var usdtCost = res.args.usdtCost;
		console.log("PromoEthBoughtEventCallback => sender: " + sender + " | ethWei: " + ethWei + " | usdtCost: " + usdtCost);
		
		if (sender !== App2.account) {
			console.log("*PromoEthBoughtEventCallback: waiting for this user event");
			return;
		}
		
		await App2.loadTokenSaleUserUSDTDeposit();
		await App2.loadTokenSaleUserEthBalance();
		await App2.renderBalances();
	},
	
	
	
	loadBalances: async () => {
		try {
			await App2.loadUSDTContractUserBalance();
			//await App2.loadUSDTContractUserAllowance();
			await App2.loadTokenSaleUserUSDTDeposit();
			await App2.loadTokenSaleUserEthBalance();
		} catch(err) {
			console.log("loadBalances err: " + err.toString());
		}
	},
	
	loadUSDTContractUserBalance: async () => {
		// get USDT user balance
		let promiseFn1 = () => {
			return new Promise((resolve, reject) => {
				App2.usdtContract.balanceOf.call(App2.account, (err, res) => {
					if (err) {
						console.log("App2.usdtContract.balanceOf(" + App2.account + ") ERROR: " + JSON.stringify(err));
						reject(err);
					}
					let num = res.toNumber() / Math.pow(10, App2.usdtContractDecimals);
					App2.usdtContractUserBalance = num;
					console.log('App2.usdtContractUserBalance: ' + App2.usdtContractUserBalance);
					resolve(App2.usdtContractUserBalance);
				});
			});
		};
		
		try {
			await promiseFn1();
		} catch(err) {
			console.log("loadUSDTContractUserBalance err: " + err.toString());
		}
	},
	
	/*loadUSDTContractUserAllowance: async () => {
		// get USDT user allowance for deposit to token-sale
		let promiseFn1 = () => {
			return new Promise((resolve, reject) => {
				App2.usdtContract.allowance.call(App2.account, App2.tokenSaleContractAddress, (err, res) => {
					if (err) {
						console.log("App2.usdtContract.balanceOf(" + App2.account + ") ERROR: " + JSON.stringify(err));
						reject(err);
					}
					let num = res.toNumber() / Math.pow(10, App2.usdtContractDecimals);
					App2.usdtContractUserAllowance = num;
					console.log('App2.usdtContractUserAllowance: ' + App2.usdtContractUserAllowance);
					resolve(App2.usdtContractUserAllowance);
				});
			});
		};
		
		try {
			await promiseFn1();
		} catch(err) {
			console.log("loadUSDTContractUserAllowance err: " + err.toString());
		}
	},*/
	
	loadTokenSaleUserUSDTDeposit: async () => {
		// get USDT user deposit on token-sale
		let promiseFn1 = () => {
			return new Promise((resolve, reject) => {
				App2.tokenSaleContract.usdtBalances.call(App2.account, (err, res) => {
					if (err) {
						console.log("App2.tokenSaleContract.usdtBalances(" + App2.account + ") ERROR: " + JSON.stringify(err));
						reject(err);
					}
					let num = res.toNumber() / Math.pow(10, App2.usdtContractDecimals);
					App2.tokenSaleUserUSDTDeposit = num;
					console.log('App2.tokenSaleUserUSDTDeposit: ' + App2.tokenSaleUserUSDTDeposit);
					resolve(App2.tokenSaleUserUSDTDeposit);
				});
			});
		};
		
		try {
			await promiseFn1();
		} catch(err) {
			console.log("loadTokenSaleUserUSDTDeposit err: " + err.toString());
		}
	},
	
	loadTokenSaleUserEthBalance: async () => {
		// get ETH available for user to buy at promotion with discount on the token-sale contract
		let promiseFn1 = () => {
			return new Promise((resolve, reject) => {
				App2.tokenSaleContract.ethBalances.call(App2.account, (err, res) => {
					if (err) {
						console.log("App2.tokenSaleContract.ethBalances(" + App2.account + ") ERROR: " + JSON.stringify(err));
						reject(err);
					}
					let num = res.toNumber() / Math.pow(10, App2.ethDecimals);
					App2.ethPromoUserBalance = num;
					console.log('App2.ethPromoUserBalance: ' + App2.ethPromoUserBalance);
					resolve(App2.ethPromoUserBalance);
				});
			});
		};
		
		try {
			await promiseFn1();
		} catch(err) {
			console.log("loadTokenSaleUserEthBalance err: " + err.toString());
		}
	},
	
	
	
	renderAccount: async () => {
		// Render Account
		$('#accountAddress').html(App2.account)
	},
	
	renderBalances: async () => {
		// Render balances
		//$('.new-token-balance').val(App2.oldContractUserBalance.toString()); //this is for input text field
		$('.usdt-user-balance').html(App2.usdtContractUserBalance);
		//$('.usdt-allowance').html(App2.usdtContractUserAllowance);
		$('.usdt-deposit-balance').html(App2.tokenSaleUserUSDTDeposit);
		$('.eth-promo-available').html(App2.ethPromoUserBalance);
	},
	
	render: async () => {
		// Prevent double render
		if (App2.loading) {
			return
		}
		
		// Update App2 loading state
		App2.setLoading(true)
		
		// Render Account
		App2.renderAccount()
		
		// Render balances
		App2.renderBalances()
		
		// Update loading state
		App2.setLoading(false)
	},
	
	setLoading: (boolean) => {
		App2.loading = boolean
		const loader = $('#loader')
		const content = $('#content')
		
		/*if (boolean) {
			loader.show()
			content.hide()
		} else {
			loader.hide()
			content.show()
		}*/
	},
	
	updateLastTx: async (tx_hash) => {
		let tx_link = 'https://etherscan.io/tx/' + tx_hash;
		console.log('updateLastTx >> ' + tx_link);
		
		$('.last-tx-info').prop('hidden', false);
		$('.last-tx-link')
		.prop('text', tx_hash)
		.prop('href', tx_link);
	},
	
	/*test_updateLastTx: async () => {
		let hash = '0x79fb4fbdfe33491ff00e6c9aa8bf117e7465de725612193edea852c65953b75b';
		await App2.updateLastTx(hash);
	},*/
	
	/*approveUSDTDeposit: async () => {
		var promise1 = new Promise((resolve, reject) => {
			let rawUsdtToAllow = $('.usdt-approve-to-deposit').val() * Math.pow(10, App2.usdtContractDecimals);
			//rawUsdtToAllow = window.web3.toBigNumber(rawUsdtToAllow);
			console.log('***approveUSDTDeposit.rawUsdtToAllow type: ' + typeof(rawUsdtToAllow));
			console.log('***approveUSDTDeposit.rawUsdtToAllow: ' + rawUsdtToAllow);
			console.log('***approveUSDTDeposit.App2.tokenSaleContractAddress: ' + App2.tokenSaleContractAddress);
			
			App2.usdtContract.approve(App2.tokenSaleContractAddress, rawUsdtToAllow, {from: App2.account, gas: 150000},
			(err, res) => {
				if (err) {
					var err1 = "App2.usdtContract.approve(" + App2.tokenSaleContractAddress + ", " + rawUsdtToAllow + ") ERROR: " + JSON.stringify(err);
					console.log(err1);
					reject(err1);
				}
				resolve(res);
			});
		});
		
		try {
			let tx = await promise1;
			console.log('***approveUSDTDeposit.promise1 return >>');
			console.log(JSON.stringify(tx));
			await App2.updateLastTx(tx);
			//await App2.loadUSDTContractUserAllowance();
			//await App2.renderBalances();
		} catch(err) {
			console.log('approveUSDTDeposit.promise1 err: ' + err.toString());
		}
	},*/
	
	depositUSDT: async () => {
		let usdtToDeposit = $('.usdt-to-deposit').val() * Math.pow(10, App2.usdtContractDecimals);
		
		var promise1 = new Promise((resolve, reject) => {
			//let rawUsdtToAllow = $('.usdt-approve-to-deposit').val() * Math.pow(10, App2.usdtContractDecimals);
			let rawUsdtToAllow = usdtToDeposit;
			//rawUsdtToAllow = window.web3.toBigNumber(rawUsdtToAllow);
			console.log('***approveUSDTDeposit.rawUsdtToAllow type: ' + typeof(rawUsdtToAllow));
			console.log('***approveUSDTDeposit.rawUsdtToAllow: ' + rawUsdtToAllow);
			console.log('***approveUSDTDeposit.App2.tokenSaleContractAddress: ' + App2.tokenSaleContractAddress);
			
			App2.usdtContract.approve(App2.tokenSaleContractAddress, rawUsdtToAllow, {from: App2.account, gas: 150000},
			(err, res) => {
				if (err) {
					var err1 = "App2.usdtContract.approve(" + App2.tokenSaleContractAddress + ", " + rawUsdtToAllow + ") ERROR: " + JSON.stringify(err);
					console.log(err1);
					reject(err1);
				}
				resolve(res);
			});
		});
		
		var promise2 = new Promise((resolve, reject) => {
			let rawUsdtToDeposit = usdtToDeposit;
			rawUsdtToDeposit = parseInt(rawUsdtToDeposit);
			console.log('***depositUSDT.rawUsdtToDeposit type: ' + typeof(rawUsdtToDeposit));
			console.log('***depositUSDT.rawUsdtToDeposit: ' + rawUsdtToDeposit);
			console.log('***depositUSDT.App2.tokenSaleContractAddress: ' + App2.tokenSaleContractAddress);
			
			App2.tokenSaleContract.depositUSDTAfterApproval(App2.account, rawUsdtToDeposit, {from: App2.account, gas: 150000},
			(err, res) => {
				if (err) {
					var err1 = "App2.tokenSaleContract.depositUSDTAfterApproval(" + App2.account + ", " + rawUsdtToDeposit + ") ERROR: " + JSON.stringify(err);
					console.log(err1);
					reject(err1);
				}
				resolve(res);
			});
		});
		
		try {
			let tx1 = await promise1;
			console.log('***approveUSDTDeposit.promise return >>');
			console.log(JSON.stringify(tx1));
			//await App2.updateLastTx(tx1);
		} catch(err) {
			console.log('approveUSDTDeposit.promise err: ' + err.toString());
		}
		
		try {
			let tx2 = await promise2;
			console.log('***depositUSDT.promise return >>');
			console.log(JSON.stringify(tx2));
			await App2.updateLastTx(tx2);
		} catch(err) {
			console.log('depositUSDT.promise err: ' + err.toString());
		}
	},
	
	withdrawUSDT: async () => {
		var promise1 = new Promise((resolve, reject) => {
			let rawUsdtToWithdraw = $('.usdt-to-withdraw').val() * Math.pow(10, App2.usdtContractDecimals);
			console.log('***withdrawUSDT.rawUsdtToWithdraw: ' + rawUsdtToWithdraw);
			console.log('***withdrawUSDT.App2.tokenSaleContractAddress: ' + App2.tokenSaleContractAddress);
			
			App2.tokenSaleContract.withdrawUSDT(rawUsdtToWithdraw, {from: App2.account, gas: 150000},
			(err, res) => {
				if (err) {
					var err1 = "App2.tokenSaleContract.withdrawUSDT(" + rawUsdtToWithdraw + ") ERROR: " + JSON.stringify(err);
					console.log(err1);
					reject(err1);
				}
				resolve(res);
			});
		});
		
		try {
			let tx = await promise1;
			console.log('***withdrawUSDT.promise1 return >>');
			console.log(JSON.stringify(tx));
			await App2.updateLastTx(tx);
			//await App2.loadUSDTContractUserBalance();
			//await App2.loadTokenSaleUserUSDTDeposit();
			//await App2.renderBalances();
		} catch(err) {
			console.log('withdrawUSDT.promise1 err: ' + err.toString());
		}
	},
	
	buyEthPromo: async () => {
		var promise1 = new Promise((resolve, reject) => {
			let ethWeiToBuy = $('.eth-promo-to-buy').val() * Math.pow(10, App2.ethDecimals);
			console.log('***buyEthPromo.ethWeiToBuy: ' + ethWeiToBuy);
			console.log('***buyEthPromo.App2.tokenSaleContractAddress: ' + App2.tokenSaleContractAddress);
			
			App2.tokenSaleContract.buyEthAtDiscount(ethWeiToBuy, {from: App2.account, gas: 350000},
			(err, res) => {
				if (err) {
					var err1 = "App2.tokenSaleContract.buyEthAtDiscount(" + ethWeiToBuy + ") ERROR: " + JSON.stringify(err);
					console.log(err1);
					reject(err1);
				}
				resolve(res);
			});
		});
		
		try {
			let tx = await promise1;
			console.log('***buyEthPromo.promise1 return >>');
			console.log(JSON.stringify(tx));
			await App2.updateLastTx(tx);
			//await App2.loadTokenSaleUserUSDTDeposit();
			//await App2.loadTokenSaleUserEthBalance();
			//await App2.renderBalances();
		} catch(err) {
			console.log('buyEthPromo.promise1 err: ' + err.toString());
		}
	},
	
	checkPromoEthCost: async () => {
		console.log("checkPromoEthCost...");
		
		let ethWeiToBuy = $('.eth-promo-to-buy').val() * Math.pow(10, App2.ethDecimals);
		
		App2.tokenSaleContract.checkEthWeiPromoCost(ethWeiToBuy,
		(err, res) => {
			if (err) {
				console.log("checkPromoUSDTBalance ERROR: " + JSON.stringify(err));
				return;
			}
			var usdt = res.toNumber() / Math.pow(10, App2.usdtContractDecimals);
			console.log("checkPromoUSDTBalance => " + usdt);
			return usdt;
		});
	},
	
	checkPromoUSDTBalance: async () => {
		console.log("checkPromoUSDTBalance...");
		
		App2.tokenSaleContract.usdtBalances(App2.account,
		(err, res) => {
			if (err) {
				console.log("checkPromoUSDTBalance ERROR: " + JSON.stringify(err));
				return;
			}
			var usdt = res.toNumber() / Math.pow(10, App2.usdtContractDecimals);
			console.log("checkPromoUSDTBalance => " + usdt);
			return usdt;
		});
	},
	
	checkPromoEth: async () => {
		console.log("checkPromoEth...");
		
		App2.tokenSaleContract.ethBalances(App2.account,
		(err, res) => {
			if (err) {
				console.log("checkPromoEth ERROR: " + JSON.stringify(err));
				return;
			}
			var wei = res.toNumber() / (Math.pow(10, App2.ethDecimals));
			console.log("checkPromoEth => " + wei);
			return wei;
		});
	},
	
	checkMyEth: async () => {
		console.log("checkMyEth...");
		
		web3.eth.getBalance(App2.account,
		(err, res) => {
			if (err) {
				console.log("checkMyEth ERROR: " + JSON.stringify(err));
				return;
			}
			var wei = res.toNumber() / (Math.pow(10, App2.ethDecimals));
			console.log("checkMyEth => " + wei);
			return wei;
		});
	},
	
	checkTokenSaleEth: async () => {
		console.log("checkTokenSaleEth...");
		
		web3.eth.getBalance(App2.tokenSaleContractAddress,
		(err, res) => {
			if (err) {
				console.log("checkTokenSaleEth ERROR: " + JSON.stringify(err));
				return;
			}
			var wei = res.toNumber() / (Math.pow(10, App2.ethDecimals));
			console.log("checkTokenSaleEth => " + wei);
			return wei;
		});
	},
	
	simEthPromo: async () => {
		console.log("simEthPromo...");
		let ethWei = $('.eth-promo-sim').val() * Math.pow(10, App2.ethDecimals);
		
		App2.tokenSaleContract.checkEthWeiPromoCost.call(ethWei, {from: App2.account},
		(err, res) => {
			if (err) {
				console.log("simEthPromo ERROR: " + JSON.stringify(err));
				return;
			}
			console.log("simEthPromo.res => " + res);
			var usdt = res.toNumber() / Math.pow(10, App2.usdtContractDecimals);
			console.log("simEthPromo => " + usdt);
			
			$('.usdt-promo-sim').html(usdt);
			
			return usdt;
		});
	},
}

$(() => {
	$(window).load(() => {
		App2.load()
	})
})