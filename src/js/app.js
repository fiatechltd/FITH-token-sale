App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 0,
	tokensSold: 0,
	tokensAvailable: 0,
	tokenInstanceDecimals: 0, //FITH token decimals
	contractsDir: './contracts/',
	//contractsDir: './',
	//tokenContractAddress: "0x075d7fafbe8c7df07b157394d60c6a6848de5076", //LIVE address
	//tokenSaleContractAddress: "0x594c87A86e86643cF3feDC7DebDAb10Fd8ccdAB2", //LIVE address
	tokenContractAddress: "0xB8F96073a30677D3D8E8d5Ad81F2d55E86F673f4", //ganache-test address
	tokenSaleContractAddress: "0x07be40dfa2721d8c2d022fceb7a76323c4e99fb5", //ganache-test address
	
	/*init: function() {
		console.log("App initialized...")
		return App.initWeb3();
	},*/
	
	/*initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			// If a web3 instance is already provided by Meta Mask.
			App.web3Provider = web3.currentProvider;
			web3 = new Web3(web3.currentProvider);
		} else {
			// Specify default instance if no web3 instance provided
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
			web3 = new Web3(App.web3Provider);
		}
		return App.initContracts();
	},*/
	
	load: async () => {
		console.log("loadWeb3...");
		await App.loadWeb3();
		console.log("loadAccount...");
		await App.loadAccount();
		console.log("listenForAccountChange...");
		await App.listenForAccountChange();
		console.log("loadContract...");
		await App.loadContract();
		console.log("loadTokensDecimals...");
		await App.loadTokensDecimals();
		console.log("loadIcoTokens...");
		await App.loadIcoTokens();
		console.log("render...");
		await App.render();
		console.log("end...");
	},
	
	// https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
	loadWeb3: async () => {
		if (typeof web3 !== 'undefined') {
			App.web3Provider = web3.currentProvider
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
			App.web3Provider = web3.currentProvider
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
		App.account = web3.eth.accounts[0];
		console.log("App.account: " + App.account);
	},
	
	listenForAccountChange: async () => {
		// listen for new account selected
		setInterval(() => {
			if (web3.eth.accounts[0] !== App.account) {
				App.account = web3.eth.accounts[0];
				App.loadAccount();
				App.renderAccount();
				App.render();
			}
		}, 1000);
	},
	
	/*initContracts: function() {
		$.getJSON(App.contractsDir + "FITHTokenSale.json", function(fithTokenSale) {
			App.contracts.FITHTokenSale = TruffleContract(fithTokenSale);
			App.contracts.FITHTokenSale.setProvider(App.web3Provider);
			App.contracts.FITHTokenSale.deployed().then(function(fithTokenSale) {
				console.log("FITH Token Sale Address:", fithTokenSale.address);
			});
		}).done(function() {
			$.getJSON("DappToken.json", function(dappToken) {
				App.contracts.DappToken = TruffleContract(dappToken);
				App.contracts.DappToken.setProvider(App.web3Provider);
				App.contracts.DappToken.deployed().then(function(dappToken) {
					console.log("Dapp Token Address:", dappToken.address);
				});
				
				App.listenForEvents();
				return App.render();
			});
		})
	},*/
	
	loadContract: async () => {
		//return;
		
		// Create a JavaScript version of the smart contract
		/*const securedLoan = await $.getJSON('SecuredLoanSimple.json')
		App.contracts.SecuredLoanSimple = TruffleContract(securedLoan)
		App.contracts.SecuredLoanSimple.setProvider(App.web3Provider)
		
		// Hydrate the smart contract with values from the blockchain
		App.securedLoan = await App.contracts.SecuredLoanSimple.deployed()*/
		
		//const contractFullPath = App.contractsDir + "FITHTokenSale.json";
		const contractFullPath = App.contractsDir + "FITHTokenSaleRefAndPromo.json";
		console.log("loadContract.contractFullPath => " + contractFullPath);
		let abi = (await $.getJSON(contractFullPath)).abi;
		const fithTokenSaleContract = web3.eth.contract(abi); //, tokenSaleContractAddress);
		App.contracts.tokenSale = fithTokenSaleContract.at(App.tokenSaleContractAddress);
		App.contracts.tokenSale.TokensBought(App.TokensBoughtEventCallback);
		App.contracts.tokenSale.TokenPriceUpdate(App.TokenPriceUpdateEventCallback);
		App.tokenSale = App.contracts.tokenSale;
		
		const tokenContractFullPath = App.contractsDir + "FITHToken.json";
		console.log("loadContract.tokenContractFullPath => " + tokenContractFullPath);
		abi = (await $.getJSON(tokenContractFullPath)).abi;
		const fithTokenContract = web3.eth.contract(abi);
		App.contracts.tokenInstance = fithTokenContract.at(App.tokenContractAddress);
		App.contracts.tokenInstance.Transfer(App.TransferEventCallback);
		App.tokenInstance = App.contracts.tokenInstance;
	},
	
	// Listen for events emitted from the contract
	/*listenForEvents: function() {
		App.contracts.DappTokenSale.deployed().then(function(instance) {
			instance.TokensBought({}, {
				fromBlock: 0,
				toBlock: 'latest',
			}).watch(function(error, event) {
				console.log("event triggered", event);
				App.render();
			})
		})
	},*/
	
	setLoading: (boolean) => {
		App.loading = boolean
		const loader = $('#loader')
		const content = $('#content')
		if (boolean) {
			loader.show()
			content.hide()
		} else {
			loader.hide()
			content.show()
		}
	},
	
	TokensBoughtEventCallback: async (err, res) => {
		if (err) {
			console.log("***TokensBoughtEventCallback err: " + JSON.stringify(err));
			return;
		}
		var buyer = res.args._buyer;
		var amount = res.args._amount;
		var tokensSold = res.args._tokensSold.toNumber();
		console.log("TokensBoughtEventCallback => buyer: " + buyer + " | amount: " + amount + " | tokensSold: " + tokensSold);
		
		App.tokensSold = tokensSold;
		await App.renderTokensSold();
		
		await App.loadTokensBought();
		await App.loadIcoTokens();
		await App.updateTokensSoldPercent();
	},
	
	TokenPriceUpdateEventCallback: async (err, res) => {
		if (err) {
			console.log("***TokenPriceUpdateEventCallback err: " + JSON.stringify(err));
			return;
		}
		var admin = res.args._admin;
		var tokenPrice = res.args._tokenPrice.toNumber();
		console.log("TokenPriceUpdateEventCallback => admin: " + admin + " | tokenPrice: " + tokenPrice);
		
		App.tokenPrice = tokenPrice;
		await App.renderTokenPrice();
	},
	
	// FITH token Transfer event callback
	TransferEventCallback: async (err, res) => {
		if (err) {
			console.log("***TransferEventCallback err: " + JSON.stringify(err));
			return;
		}
		var sender = res.args.from;
		var to = res.args.to;
		var tokens = res.args.tokens;
		console.log("TransferEventCallback => sender: " + sender + " | to: " + to + " | tokens: " + tokens);
	},
	
	renderAccount: async () => {
		// Render Account
		$('#account').html(App.account)
	},
	
	renderTokenPrice: async () => {
		$('.token-price').html(web3.fromWei(App.tokenPrice * (Math.pow(10, App.tokenInstanceDecimals)), "ether"));
	},
	
	renderTokensSold: async () => {
		$('.tokens-sold').html(App.tokensSold / (Math.pow(10, App.tokenInstanceDecimals)));
	},
	
	renderTokensTotal: async () => {
		$('.tokens-total').html((App.tokensSold + App.tokensAvailable) / (Math.pow(10, App.tokenInstanceDecimals)));
	},
	
	renderTokensSoldPercent: async () => {
		$('#progress').css('width', App.tokensSoldPercent + '%');
	},
	
	loadTokenPrice: async () => {
		App.tokenSale.tokenPrice(
		(err, res) => {
			if (err) {
				console.log("loadTokenPrice ERROR: " + JSON.stringify(err));
				return;
			}
			
			var tokenPrice = res.toNumber();
			console.log("loadTokenPrice => tokenPrice: " + tokenPrice);
			
			App.tokenPrice = tokenPrice;
			App.renderTokenPrice();
		});
	},
	
	loadTokensSold: async () => {
		App.tokenSale.tokensSold(
		(err, res) => {
			if (err) {
				console.log("loadTokensSold ERROR: " + JSON.stringify(err));
				return;
			}
			
			var tokensSold = res.toNumber();
			console.log("loadTokensSold => tokensSold: " + tokensSold);
			
			App.tokensSold = tokensSold;
			App.renderTokensSold();
			App.renderTokensTotal();
			App.updateTokensSoldPercent();
		});
	},
	
	updateTokensSoldPercent: async () => {
		var tokensTotal = (App.tokensSold + App.tokensAvailable);
		console.log("updateTokensSoldPercent => App.tokensSold / tokensTotal: " + App.tokensSold + " / " + tokensTotal);
		if (tokensTotal > 0) {
			var progressPercent = (Math.ceil(App.tokensSold) / tokensTotal) * 100;
			App.tokensSoldPercent = progressPercent;
			App.renderTokensSoldPercent();
		}
	},
	
	loadIcoTokens: async () => {
		App.tokenInstance.balanceOf(App.tokenSaleContractAddress,
		(err, res) => {
			if (err) {
				console.log("loadIcoTokens ERROR: " + JSON.stringify(err));
				return;
			}
			
			var tokens = res.toNumber();
			console.log("loadIcoTokens => available for sale: " + tokens);
			
			App.tokensAvailable = tokens;
			App.renderTokensTotal();
			App.updateTokensSoldPercent();
		});
	},
	
	loadTokensBought: async () => {
		App.tokenInstance.balanceOf(App.account,
		(err, res) => {
			if (err) {
				console.log("loadTokensBought.balanceOf ERROR: " + JSON.stringify(err));
				return;
			}
			
			var balance = res.toNumber();
			console.log("loadTokensBought.balanceOf => balance: " + balance);
			
			$('.user-balance').html(balance / Math.pow(10, App.tokenInstanceDecimals));
		});
	},
	
	loadTokensDecimals: async () => {
		App.tokenInstance.decimals(
		(err, res) => {
			let decimals = 0;
			if (err) {
				console.log("loadTokensDecimals ERROR: " + JSON.stringify(err));
			}
			else {
				decimals = res.toNumber();
			}
			
			App.tokenInstanceDecimals = decimals;
			console.log("loadTokensDecimals => decimals: " + decimals);
		});
	},
	
	render: async () => {
		// Prevent double render
		/*if (App.loading) {
			return
		}*/
		
		// Update app loading state
		App.setLoading(true);
		
		// Render Account
		await App.renderAccount();
		
		await App.loadTokenPrice();
		
		await App.loadTokensSold();
		
		await App.loadIcoTokens();
		
		await App.loadTokensBought();
		
		await App.updateTokensSoldPercent();
		
		App.setLoading(false);
		
		// Update loading state
		//App.setLoading(false)
	},
	
	buyTokens: async () => {
		App.setLoading(true);
		
		var numberOfTokens = $('#numberOfTokens').val();
		var nTokens = numberOfTokens * (Math.pow(10, App.tokenInstanceDecimals));
		var ethValue = nTokens * App.tokenPrice;
		console.log("buyTokens => buying tokens: " + numberOfTokens + " for " + web3.fromWei(ethValue, "ether") + " eth");
		
		App.tokenSale.buyTokens(nTokens, {
			from: App.account,
			value: ethValue,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			App.setLoading(false);
			if (err) {
				console.log("buyTokens ERROR: " + JSON.stringify(err));
				App.err = err;
				return;
			}
			console.log("buyTokens => bought " + numberOfTokens + " tokens!");
			
			$('form').trigger('reset'); // reset number of tokens in form
			// Wait for Sell event
		});
	},
	
	buyTokensSendingEther: async () => {
		App.setLoading(true);
		
		var eth = $('#numberOfTokens').val();
		let wei = web3.toWei(eth.toString(), "ether");
		
		console.log("buyTokensSendingEther => buying tokens for " + eth + " ether");
		
		web3.eth.sendTransaction({
			from: App.account,
			to: App.tokenSaleContractAddress,
			value: wei,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			App.setLoading(false);
			if (err) {
				console.log("buyTokensSendingEther ERROR: " + JSON.stringify(err));
				App.err = err;
				return;
			}
			console.log("buyTokensSendingEther => bought tokens for " + eth + " ether!");
			
			$('form').trigger('reset'); // reset number of tokens in form
			// Wait for Sell event
		});
	},
	
	/* admin debug and test functions */
	loadTokensOnTokenSaleContract: async () => {
		console.log("loadTokensOnTokenSaleContract...");
		
		var numberOfTokens = $('#numberOfTokens').val();
		var nTokens = numberOfTokens * (Math.pow(10, App.tokenInstanceDecimals));
		
		App.tokenInstance.transfer(App.tokenSaleContractAddress, nTokens, {
			from: App.account,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			if (err) {
				console.log("loadTokensOnTokenSaleContract ERROR: " + JSON.stringify(err));
				return;
			}
			console.log("loadTokensOnTokenSaleContract => " + numberOfTokens + " tokens loaded to token-sale contract!");
			
			$('form').trigger('reset') // reset number of tokens in form
		});
	},
	
	checkICOtokens: async () => {
		console.log("checkICOtokens...");
		
		App.tokenInstance.balanceOf(App.tokenSaleContractAddress, {
			from: App.account,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			if (err) {
				console.log("checkICOtokens ERROR: " + JSON.stringify(err));
				return;
			}
			var tokens = res.toNumber() / (Math.pow(10, App.tokenInstanceDecimals));
			console.log("checkICOtokens => " + tokens);
			return tokens;
		});
	},
	
	updateTokenPrice: async () => {
		//App.setLoading(true);
		
		var tokenPrice = $('#numberOfTokens').val();
		console.log("updateTokenPrice to " + tokenPrice);
		
		App.tokenSale.updateTokenPrice(tokenPrice, {
			from: App.account,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			//App.setLoading(false);
			if (err) {
				console.log("updateTokenPrice ERROR: " + JSON.stringify(err));
				return;
			}
			console.log("updateTokenPrice => token price updated!");
		});
	},
	
	/*withdrawTokens: async () => {
		//App.setLoading(true);
		
		var numberOfTokens = $('#numberOfTokens').val();
		var nTokens = numberOfTokens * (Math.pow(10, App.tokenInstanceDecimals));
		console.log("withdrawTokens " + numberOfTokens);
		
		App.tokenSale.withdrawTokens(nTokens, {
			from: App.account,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			//App.setLoading(false);
			if (err) {
				console.log("withdrawTokens ERROR: " + JSON.stringify(err));
				return;
			}
			console.log("withdrawTokens => done!");
		});
	},*/
	
	checkPromoEth: async () => {
		console.log("checkPromoEth...");
		
		App.tokenSale.ethBalances(App.account,
		(err, res) => {
			if (err) {
				console.log("checkPromoEth ERROR: " + JSON.stringify(err));
				return;
			}
			var wei = res.toNumber() / (Math.pow(10, 18));
			console.log("checkPromoEth => " + wei);
			return wei;
		});
	},
	
	endICO: async () => {
		//App.setLoading(true);
		
		console.log("endICO...");
		
		App.tokenSale.endSale({
			from: App.account,
			gas: 500000 // Gas limit
		},
		(err, res) => {
			//App.setLoading(false);
			if (err) {
				console.log("endICO ERROR: " + JSON.stringify(err));
				return;
			}
			console.log("endICO => done!");
		});
	},
}

$(function() {
  $(window).load(function() {
    App.load();
  })
});
