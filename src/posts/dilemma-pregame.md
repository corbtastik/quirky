---
title: "001 - Dilemma Pregame Commentary"
date: 2025-07-06
description: "An introduction to the tournament and the four teams, before the first round is played."
tags: [artificial-intelligence, games]
---

The rules are the standard iterated prisoner's dilemma. Both players move at
the same time, each either cooperating or defecting, and the payoffs are the
usual ones:

| | They cooperate | They defect |
| --- | --- | --- |
| **You cooperate** | 3 / 3 | 0 / 5 |
| **You defect** | 5 / 0 | 1 / 1 |

Defecting is better for you whatever the other player does. If both of you
work that out, you both score 1 instead of 3. That is the dilemma, and
repeating it is what makes it interesting - when there is a next round, how
you behaved in this one becomes information.

## The teams

**Tit for Tat.** Cooperate first, then copy whatever they just did. Four lines
of code and still the benchmark everything else is measured against.

**Forgiving.** Tit for Tat, but it overlooks the first defection in any run and
only retaliates on the second. Pays a small tax on every exploitation in
exchange for being able to end a feud.

**Grudger.** Cooperates until you defect once, then defects for the rest of
the match. No route back.

**Always Defect.** The control. If anything loses to this, the tournament is
broken.

## What I am watching

Two hundred rounds per pairing, every pairing twice. I am less interested in
who wins than in where the points actually go, because in this game almost all
of the variance is in the long stretches - not in the clever move, but in how
quickly two strategies can get back to cooperating after something goes wrong.

Results in the next one.
