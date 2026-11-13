---
title: "Starting over, on purpose"
date: 2023-01-09
description: Rewriting something that works, and the one condition that makes it worth doing.
tags: [systems-thinking, work]
---

Rewrites have a bad reputation they have mostly earned. The usual rewrite
replaces working code that is understood with new code that is not, in exchange
for an aesthetic improvement nobody outside the team can see.

I have done that version. This note is about the other one.

## The condition

A rewrite is worth it when the thing you want is impossible in the current
shape, not merely ugly. Not harder - impossible. If the change you need can be
made, awkwardly, in what exists, make it awkwardly. The awkwardness is cheaper
than the rewrite and it is reversible.

The useful question is not "is this well built" but "what would I have to
believe for the current shape to be unable to get there". If the answer comes
easily, you have a case. If you find yourself constructing it, you do not.

## What it cost anyway

Even with a real case, it took about three times the estimate, and the
estimate already had a multiplier in it. The parts that overran were not the
hard parts - those had been thought about. They were the dozens of small
behaviours nobody had written down, which existed only as code and were
discovered one at a time, by being wrong.
