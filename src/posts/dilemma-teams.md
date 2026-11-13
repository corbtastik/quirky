---
title: "Dilemma Tournament: Team Introductions"
date: 2025-06-26
description: "The four strategies in the tournament, and why each one is worth a slot."
tags: [artificial-intelligence, games]
---

Four strategies, picked to cover the interesting corners rather than to be
exhaustive.

## Tit for Tat

```python
def move(history):
    if not history:
        return COOPERATE
    return history[-1].opponent
```

Cooperates first and then mirrors. It is *nice* (never defects first),
*retaliatory* (punishes immediately), *forgiving* (stops punishing the moment
you stop), and *clear* (one round of watching tells you everything). Those
four properties are most of what makes a strategy work here.

## Forgiving

Tit for Tat with one change: it ignores an isolated defection and only
retaliates when it sees two in a row.

That sounds like a small tweak and it is not. Tit for Tat against itself is
perfect cooperation - until one defection appears, after which the two copies
alternate punishments forever, each one retaliating for the retaliation. A
strategy that can absorb a single bad round is the only kind that can get out.

## Grudger

Cooperates until the first defection, then defects forever. Worth a slot
because it isolates the variable: it is exactly as retaliatory as Tit for Tat
and not at all forgiving, so the gap between them is the price of holding a
grudge.

## Always Defect

```python
def move(history):
    return DEFECT
```

The control. It wins every individual matchup it plays and should finish last
overall. If it does not, something is wrong with the scoring.
