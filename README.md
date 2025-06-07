# Sandwich Bot BSC

WARNING: I provide no guarantee of even a single line of code in this repo. This is outdated by at least 4 years and is
only open-sourced for educational purposes. Most of the code is undocumented since I am a solo-developer. Use AI!

I wasn't proud of this code 4 years ago, I am even less proud of this code now. But it printed $$$.

# About
For a few discontinuous months in between 2020-2021 I ran a bunch of bots primarily on bscscan. Sandwiching was one of them.
This repo has code for the version 1 of a sandwich bot that was competitive for around a week. It was wildly profitable.

I am a solo developer and being competitive on-chain is more than a fulltime job, I had several sleepless nights.
However, developing MEV bots is a hyper-learning experience. I would recommend every programmer to do it at least once in their
life. You will learn distributed computing, parallel programming, optimization techniques, reliable system design and more.
The thrill of fighting with code on-chain is unmatched. It's addicting, it's tiring, it's thrilling, it's humbling.

Following is the alpha for my sandwich bot:
1. PGA: Price Gas Auction -- You're not the only sandwich bot on chain, you need to out-gas others. PGA helps!
2. ARC: Active Rug Combat -- Salmonella attacks and rugs are common, you need to actively combat them and cancel your transactions before the block is mined. Unlike ARB bots, transactions aren't atomic here. I wasn't using flashbot bundles.
3. Simulating the next block with a new geth API call -- I use some heuristics to identify targets and binary search to find my sandwich parameters. This is a very powerful tool, this is the entry-way to generalized MEV bots. The world is your oyester!
4. Fast mempool (bloxroute)

# Directory Structure
- `contract`: Solidity code for the sandwich contract bot
- `geth_fork`: My fork of geth with an additional API for simulating the next block
- `client`: NodeJS client code actually running the bot, it reads the mempool to identify opportunities and makes calls to our contract using ethers/web3js


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