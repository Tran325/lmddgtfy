# Logic Structure
1. Simulate Future Blocks
Continuously monitor the mempool and simulate potential future blocks for identifying sandwich opportunities

2. Optimize Sandwich Parameters via Binary Search
For each identified opportunity:
   - Perform binary search over input amounts
   - Maximize the profitable `frontrun` and `backrun` spread

1. Submit Frontrun Transaction

2. Submit Backrun Transactions
   - Prepare multiple backrun variants with adjusted parameters

3. Parallel Process: PGA (Priority Gas Auction)
   - Monitor for competitor bots entering the same opportunity
   - Dynamically escalate gas price to outbid competitors

4. Parallel Process: ARC (Active Rug Combat)
   - Detect victim-side manipulations (e.g., rugpull, salmonella tokens)
   - On detection, launch a cancel transaction
   - Blacklist address will be saved in contract to not exectute trades for this bad token again

5. Logging & State Management
   - Log:
       - Opportunity metadata
       - Transaction outcomes (success, revert, profit)
       - Meta data on PGA bitches fighting you
       - Meta data on token rug assholes
   - Update:
       - Blacklists for malicious contracts or bait tokens

# Code Structure


- `blockrunner.js`: This simulates the next block with our added sandwich transaction to launch one. Then it also helps with ARC (Active rug combat), by simulating the block iteratively untilt it's unsafe (cancel transaction) or block is mined. Calling `debug_traceMultiCall` is the alpha here. To read more about `debug_traceMultiCall` see `geth_fork` directory.
- `bloxroute.js`: Bloxroute API. Bloxroute is a very fast blockchain network. Expensive but worth the money.
- `config.js`: Configs for sandwich parameters, addresses, function signatures and node stuff.
- `trader.js`: Trader class that launches all sorts of transactions
- `dexevents.js`: An infinite loop that the dex and launches event for when an opportunity is identified
- `mempool.js`: Mempool reader
- `optimality.js`: Compute optimal sandwich size with binary search
- `PGA.js`: Async PGA service
- `run.js`: Entrypoint

others...