---
title: "002 - Dilemma Round One Results"
date: 2025-07-07
description: "The first round of the tournament has been played - here is what happened."
tags: [artificial-intelligence, games]
---

Round one is done. Four teams, two hundred rounds each, every pairing played
twice so nobody got to be the one who moved second.

## The table

| Team | Score | Cooperated | Defected |
| --- | --- | --- | --- |
| Tit for Tat | 612 | 74% | 26% |
| Forgiving | 598 | 81% | 19% |
| Grudger | 544 | 61% | 39% |
| Always Defect | 403 | 0% | 100% |

## What actually happened

Always Defect did what it said on the tin and came last. That is the oldest
result in this whole field and it still surprises people, because defecting
wins every single round it plays and loses the tournament anyway. It beat
every opponent it faced and finished two hundred points behind.

The interesting fight was between Tit for Tat and Forgiving. Forgiving gave up
a handful of points every time it absorbed a defection it did not retaliate
for, and earned them back in the long runs of mutual cooperation that
retaliation would have broken. Against Grudger that was decisive: Tit for Tat
and Grudger locked into a mutual-punishment spiral on round nine and never got
out of it.

## The thing I did not expect

Grudger's score is not bad because it punishes. It is bad because it cannot
stop. One defection on round nine - which Tit for Tat had itself only thrown
because of a defection on round eight - cost both of them about ninety points
over the remaining rounds.

Neither strategy had a way to say "that was a mistake, let us start again."
Forgiving did, and that is the whole of its advantage.

Round two adds noise: ten percent of moves get flipped on the way to the
opponent. I expect that to be bad for Grudger and very bad for Tit for Tat.
