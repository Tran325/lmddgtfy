# Sandwich Bot

## Overview

A sandwich bot on the BSC (Binance Smart Chain) is a trading bot designed to exploit price fluctuations by placing front-running and back-running transactions around a target trade. 
It works by detecting pending transactions in the mempool, inserting buy orders before the target (front-running), and selling immediately after (back-running) to profit from the price impact. 
The BSC's lower fees and high transaction volume make it a popular chain for sandwich attacks. However, such bots operate in a legal gray area and may face scrutiny from regulators and exchanges. 

## Let's Connect!,

<a href="mailto:fenrow325@gmail.com" target="_blank">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Gmail">
</a>
<a href="https://t.me/fenrow" target="_blank">
  <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram">
</a>
<a href="https://discord.com/users/fenrow_325" target="_blank">
  <img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
</a>

## About
This is a high-frequency MEV (Maximal Extractable Value) sandwich bot operating on the Binance Smart Chain (BSC). The bot exploits price movements by front-running and back-running victim transactions, profiting from slippage and price impact.

## Key Features
- `PGA (Price Gas Auction)`: Competes with other bots by optimizing gas bids to ensure transaction priority.
- `ARC (Active Rug Combat)`: Detects and cancels transactions if a "rug pull" or malicious attack is detected before block finalization.
- `Next-Block Simulation`: Uses Geth API calls to simulate the next block and identify profitable sandwich opportunities.
- `Binary Search for Parameters`: Dynamically adjusts sandwich parameters (gas, slippage, profit thresholds) for optimal execution.
- `Fast Mempool Access (bloXroute)`: Ensures low-latency transaction monitoring and submission. 


## Risk
- Other Bots: Many sandwich bots operate on BSC, leading to intense PGA battles—higher gas means higher priority but lower profit margins.
- Rug Pulls & Salmonella Attacks: Malicious tokens can drain funds; ARC helps mitigate losses by aborting bad trades.
- Non-Atomic Execution: Unlike Arbitrage (ARB) bots, sandwich trades are not atomic, requiring careful monitoring.

## Generalized MEV Bot – Conceptual Overview
Let the actual sequence of transactions in the next block be denoted by:

```
T = {t₀, t₁, t₂, ..., tₙ}
```

However, since the true contents of the next block are unknowable in advance, we rely on our *best* mempool view, which gives us an estimated block:

```
T' = {t′₀, t′₁, t′₂, ..., t′ₘ}

```

A generalized MEV (Maximal Extractable Value) bot** aims to insert a set of its own transactions:

```

X = {x₀, x₁, ..., xₖ}

```

The goal is to construct a modified transaction sequence (i.e., a candidate block):

```
B = {t′₀, x₀, x₁, t′₁, t′₂, x₂, ...}
```
We aim for `B` to be as close to `T` as possible. This is achieved using a good distributed nodes infrastructure like bloxroute or something of your own.
On BSC, some miners cheat and have lower delta between `B` and `T`, centralization is unfair on the chain. This was the case 4-5 years ago, I am not sure how much has the community changed since then.

The set of all possible such blocks `B` is effectively infinite due to the combinatorial explosion of insert positions
and transaction variations. Therefore, brute-force search over all possible blocks is intractable.

---

You can then run the following algorithm:
```

1. Check initial balance
2. For each candidate block b ∈ B:
   While b is not yet mined:
    a. Simulate execution of b
    b. Check resulting balance
    c. If balance increased:
   Add b to list of profitable blocks
3. From the profitable blocks, execute the one with the highest gain

```
---

Due to the intractability of |B|, generalized MEV bots use heuristics to narrow down the search space. Common tactics include:

- **Sandwiching**: Placing a buy and sell order around a victim's trade.
- **Copy-trading bots**: Replicating profitable trades from observed mempool activity.
- **Arbitrage bots**: Exploiting price differences across DEXs or pools.
- **Sniping bots**: Front-running token launches or NFTs.

These heuristics enable MEV bots to act efficiently under latency and compute constraints.
You also need a reliable mempool view, this would require setting up infra costing thousands of dollars. Good investment.

## Known Competitors on BSC

- EigenPhi Bots – Detects and competes with sandwich attacks.

- Frontier Bots – Aggressive gas auctions and high-frequency trading.

- SushiSwap MEV Bots – Some Sushi-related bots also engage in sandwiching.

- Private Bots – Many undisclosed bots run by MEV searchers.

---

## 📞 Contact Information
For questions, feedback, or collaboration opportunities, feel free to reach out:

<div align="left">

📧 **Email**: [fenrow325@gmail.com](mailto:fenrow325@gmail.com)  
📱 **Telegram**: [@fenroW](https://t.me/fenrow)  
🎮 **Discord**: [@fenroW](https://discord.com/users/fenrow_325)  

</div>

---