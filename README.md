# Solana Sandwich Finder
## Overview
Slot range: [329614220, 335662220]
### Global Metrics
|Metric|Value|
|---|---|
|Proportion of sandwich-inclusive block|2.858%|
|Average sandwiches per block|0.04020|
|Standard Deviation of sandwiches per block|0.31385|


### Stake pool dsitribution (Epoch 777):
|Pool|Stake (SOL)|Pool Share|
|---|---|---|
|Marinade (overall)|4,769,581|53.10%|
| - Marinade Liquid|2,394,101|49.62%|
| - Marinade Native|2,375,480|57.14%|
|Jito|4,802,602|27.59%|
|xSHIN|271,700|27.22%|
|SFDP|4,931,260|12.70%|
|JPool|83,242|7.71%|
|BlazeStake|50,520|4.59%|
|The Vault|17,952|1.14%|
|Aero|1,831|0.36%|

### Honourable Mention
These are hand-picked, visible to the naked eye colluders. If you're staking to them, you should unstake because you placed your trust on validators actively breaking trust.

If your validator is on this list, check the docs of your favourite Solana validator flavour, compile the binaries yourself and make sure to apply any command line arguments as indicated.

|Validator|Stake|Observed Leader Blocks|Weighted Sandwich-inclusive blocks|Weighted Sandwiches|
|---|---|---|---|---|
|Haus – Guaranteed Best APY & No Fees|2,005,970|31,492|1,528.50|1,907.67|
|AG 0% fee + ALL MEV profit share|1,463,103|23,640|2,043.83|2,461.58|
|HM5H...dMRA|1,037,426|14,852|1,128.42|1,635.42|
|BT8L...gziD|807,033|12,284|4,916.08|11,013.92|
|[Marinade Customer] 9fgw...zsXs|362,150|2,704|1,251.92|3,258.25|
|[Marinade/Jito Customer] AltaBlock|276,158|1,932|725.00|1,373.83|
|Blocksmith 🗝️|265,604|5,276|437.50|533.42|

## Preface
Sandwiching refers to the action of forcing the earlier inclusion of a transaction (frontrun) before a transaction published earlier (victim), with another transaction after the victim transaction to realise a profit (backrun), while abusing the victim's slippage settings. We define a sandwich as "a set of transactions that include exactly one frontrun and exactly one backrun transaction, as well as at least one victim transaction", a sandwicher as "a party that sandwiches", and a colluder as "a validator that forwards transactions they receive to a sandwicher".

Some have [mentioned that](https://discord.com/channels/938287290806042626/938287767446753400/1325923301205344297) users should issue transactions with lower slippage instead but it's not entirely possible when trading token pairs with extremely high volatility. Being forced to issue transactions with low slippage may lead to higher transaction failure rates and missed opportunities, which is also suboptimal.

The reasons why sandwiching is harmful to the ecosystem had been detailed by [another researcher](https://github.com/a-guard/malicious-validators/blob/main/README.md#why-are-sandwich-attacks-harmful) and shall not be repeated in detail here, but it mainly boils down to breaking trust, transparency and fairness.

We believe that colluder identification should be a continuous effort since [generating new keys](https://docs.anza.xyz/cli/wallets/file-system) to run a new validator is essentially free, and with a certain stake pool willing to sell stake to any validator regardless of operating history, one-off removals will prove ineffective. This repository aims to serve as a tool to continuously identify sandwiches and colluders such that relevant parties can remove stake from sandwichers as soon as possible.

## Methodology
### Why we believe this works
Law of large numbers - the average of the results obtained from a large number of independent random samples converges to the true value, if it exists [[source]](https://en.wikipedia.org/wiki/Law_of_large_numbers). In other words, an average validator running the average software should produce average numbers in the long run, the longer the run, the closer the validator's average is to the global average.

In this application, we consider an observation of "how many sandwiches are in the block" and "is there a sandwich in the block" a sample. Forus to apply LLM here we need to be reasonably sure that:
1. The samples are independent;
2. The average exists.

It's clear that the average clearly exists - it should be very close to the observered cluster average given the large number of slots we're aggregating over.

According to [Anza's docs](https://docs.anza.xyz/consensus/leader-rotation#leader-schedule-generation-algorithm), the distribution of leader slots is random but stake-weighted. While it's possible to influence the distribution (e.g. maximise the chances that a certain set of validators' slots follows another set's) by strategically creating stake accounts, and technically it would be beneficial to avoid having leader slots after validators known to be less performant to avoid skipped slots (therefore missing out of block rewards), this has nothing to do with sandwiching as validators are economically incentivised to leave the transactions that pay the most to themselves. This also applies to sandwichable transactions, if a validator knows that a transaction is sandwichable and is willing to exploit it, its only option would be to exploit the transaction itself, or forward it to a sandwicher. In other words, sandwicher colluders (RPCs validators alike) normally won't forward sandwich-able transactions to the next leader "just to mess with their numbers". As such, the leader slot distribution depends entirely on the cluster's actions and is considered random.

Another important factor to consider is the difference between transaction delivery across nodes. Some transaction senders may decide to not have their transactions sent directly from RPC nodes to certain validators due to different concerns, such as being sandwiched, but it's unlikely that any given transaction sender will blacklist the majority of the validators to supress their sandwiching numbers. If and when such facilities are used, it'll most likely decrease the number of transactions reaching known sandwacher colluders, supressing their numbers instead. There is little data on the usage of such facilities but we expect their usage to not affect the independence of the sampling. 

From our analysis above, we're confident that LLM can be applied to sandwicher colluder identification as the average we're looking for exists, and the samples (or at least groups of 4 samples, corresponding a leader group) are independent. Which means, if your sandwiching numbers deviate from the cluster average significantly, we're pretty sure (but not 100% as with any statistics-based hypothesis) you're engaged with something related to sandwiching.

### Sandwich identification
A sandwich is defined by a set of transactions that satisfies all of the following:

1. Has at least 3 transactions of strictly increasing inclusion order (frontrun-victims-backrun);
2. The frontrun and the victim transactions trades in the same direction, the backrun's one is in reverse;
3. Output of backrun >= Input of frontrun and Output of frontrun >= Input of backrun (profitability constraint);
4. All transactions use the same AMM;
5. Each victim transaction's signer differs from the frontrun's and the backrun's;
6. A wrapper program is present in the frontrun and backrun and are the same;
   
For each sandwich identified in newly emitted blocks by the cluster, we insert that to a database for report generation.

Note that we don't require the frontrun and the backrun to have the same signer as it's a valid strategy to use multiple wallets to evade detection by moving tokens across wallets.

### Report generation
With the sandwich dataset, we're able to calculate the cluster wide and per validator proportion of sandwich-inclusive blocks and sandwich per block. Our hypothesis is that colluders will exhibit above cluster average values on both metrics. Due to transaction landing delays, the report generation tool also "credits" sandwiches to earlier slots.

The hypothesises are as follows:<br />
Null hypothesis: At least one metric is in line with the cluster average<br />
Alternative hypothesis: Both metrics exceeds cluster average<br />

For the proportion of sandwich-inclusive blocks metric, each block is treated as a Bernoulli trial, where success means a block is sandwich-inclusive and failure means the otherwise. For each validator, the number of blocks emitted (N) and the number of sandwich-inclusive blocks (k) is used to calculate a 99.99% confidence interval of their true proportion of sandwich-inclusion blocks. A validator will be deemed to be above cluster average if the lower bound of the confidence interval is above the cluster average.

For the sandwiches per block metric, the mean and standard deviation of the cluster wide number of sandwiches per block is taken, and a 99.99% confidence interval of the expected number of sandwiches per block should the validator is in line with the cluster wide average is calculated. A validator will be deemed to be above cluster average if the validator's metric is above the confidence interval's upper bound.

Validators satisfying the alternative hypothesis, signaling collusion for an extended period, will be flagged.

For flagging on [Hanabi Staking's dashboard](https://hanabi.so/marinade-stake-selling), flagged validators with fewer than 50 blocks as well as those only exceeding the thresholds marginally but reputable are excluded.

## Report Interpretation
The reports consist of 14 columns and their meanings are as follows:
|Column(s)|Meaning|
|---|---|
|leader/vote|The validator's identity and vote account pubkeys|
|name|The validator's name according to onchain data|
|Sc|"Score", normalised weighted number of sandwiches|
|Sc_p|"Presence score", normalised number of blocks with sandwiches, which roughly means proportion of sandwich inclusive blocks|
|R-Sc/R-Sc_p|Unnormalised Sc and Sc_p|
|slots|Number of leader slots observed for the validator|
|Sc_p_{lb\|ub}|Bounds of the confidence interval of the validator's true proportion of sandwich inclusive blocks. Flagged if the lower bound is above the cluster mean|
|Sc_{lb\|ub}|Bounds of the confidence interval of which the validator is considered to have an "average" number of sandwiches per block. Flagged if Sc_p is above the upper bound|
{Sc_p\|Sc}_flag|True if the validator is being flagged due to the respective metric, false otherwise|

## Dataset Access
For dataset access, [join the Hanabi Staking Discord](https://discord.gg/VpJuWFRJfb) and open a ticket.