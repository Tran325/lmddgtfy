Sandwich Bot

## Overview

A sandwich bot on the BSC (Binance Smart Chain) is a trading bot designed to exploit price fluctuations by placing front-running and back-running transactions around a target trade. 
It works by detecting pending transactions in the mempool, inserting buy orders before the target (front-running), and selling immediately after (back-running) to profit from the price impact. 
The BSC's lower fees and high transaction volume make it a popular chain for sandwich attacks. However, such bots operate in a legal gray area and may face scrutiny from regulators and exchanges. 

## About
This is a high-frequency MEV (Maximal Extractable Value) sandwich bot operating on the Binance Smart Chain (BSC). The bot exploits price movements by front-running and back-running victim transactions, profiting from slippage and price impact.

## Key Features
- `PGA (Price Gas Auction)`: Competes with other bots by optimizing gas bids to ensure transaction priority.
- `ARC (Active Rug Combat)`: Detects and cancels transactions if a "rug pull" or malicious attack is detected before block finalization.
- `Next-Block Simulation`: Uses Geth API calls to simulate the next block and identify profitable sandwich opportunities.
- `Binary Search for Parameters`: Dynamically adjusts sandwich parameters (gas, slippage, profit thresholds) for optimal execution.
- `Fast Mempool Access (bloXroute)`: Ensures low-latency transaction monitoring and submission. 


# Future versions
This is v1 of my sandwich code. And one of many on-chain bots I wrote. ALL versions and ALL bots share the same structure:
1. A geth client
2. A contract
3. A caller code with heuristics and checks
4. Monitoring


Future versions of this sandwich bot followed better software engineering principles, were distributed, used my own
network of nodes instead of bloxroute, optimized contracts (suicide and golfing), multi-chain and a lot more monitoring
and dashboard like tools. I encourage you to build them for yourself.

# Personal Notes & Advice
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


## On-chain Data is All you Need
To develop a competitive MEV bot, there are no guides, no tutorials, no research papers, no books that can help you find
an unique alpha. Resources might help learn but resources won't help win and make money.
All you have is on-chain data and all you need is on-chain data. Stay away from online communities and discord groups
like plague. They are noise distracting you from doing what's important -- learn to code and read on-chain data.

## Programming
I am assuming you are at least familiar with a CS undergrad course. If not, get an undergraduate degree. After that,
read the following: 

Before jumping into MEV, C++ and Python were the only languages I was familiar with. I had to learn basics of Go, solidity
and JS (better for async programming than python). I never formally learned these languages, I simply thought of logic
and my hands automatically translated them to code (with the help of internet and references). LLMs make this even easier now.

If I didn’t need structured lessons to learn new languages back then, you definitely don’t need them now -- especially with
LLMs that can write most of your code. Don’t get stuck on learning syntax or watching hours of lectures. Focus on
developing ideas and alpha first. Translating them into code is the easy part.

Develop thoughts and language would follow. Develop alpha and converting that into code is the last thing you need to
worry about. For e.g., obsessing over Solidity gas optimizations is mostly a distraction. If someone frontruns your
contract's functions using gas tricks, you can almost always reverse engineer what they did from the bytecode. Learning
everything bottom up is inefficient. Prioritize what matters. This approach has worked well for me and it might work
for you too.

## Lack of meaning
Developing MEV bots brought no meaning to my life. The world of MEV and high-frequency trading is built on secrecy,
zero-sum games, and exploiting asymmetries in information. This goes against my principles of knowledge sharing and
creating value for making the world a better place. Creating money without creating value is meaningless and hollow to me.

*It was fun but so are video games. I stopped doing both for now.*

Today, I work as an AI engineer at a startup, and the contrast is stark. I work on creating value, I can share what I
learn, collaborate freely, and take pride in the fact that my work is pushing technology forward in a way that benefits
more than just a privileged few.

There’s joy in that. Working with a team, being part of a community, helping and being helped by others outside of
arcane on-chain communication and rather through real-world meetings and code is comfortably rewarding. I feel happier.

## FUCK YOU & THANK YOU
To all other sandwich bots ciompeting with and targeting me (you know who are you): FUCK YOU and THANK YOU for all the fun.