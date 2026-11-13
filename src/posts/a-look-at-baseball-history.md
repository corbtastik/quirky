---
title: "A Look at Baseball History"
date: 2025-12-25
tags: ["history", "sports", "data", "americana"]
description: "From the Knickerbocker Rules to Moneyball, exploring the data and soul of America's Pastime."
parks:
  - src: "https://placehold.co/200x200/27ae60/ffffff?text=Fenway+Park"
    description: "Fenway"
  - src: "https://placehold.co/200x200/2980b9/ffffff?text=Wrigley+Field"
    description: "Wrigley"
  - src: "https://placehold.co/200x200/c0392b/ffffff?text=Oracle+Park"
    description: "Oracle"
---

## The Myth and The Reality

For decades, schools taught that **Abner Doubleday** invented baseball.
Cooperstown, New York. 1839. It is a lovely story. A Civil War hero dreams up
the national pastime in a cow pasture.

**It is also false.**

Nobody invented baseball. It evolved, the way software does. It grew out of
older bat-and-ball games like *cricket* and *rounders*.

![Vintage Baseball Team](https://placehold.co/800x400/2c3e50/ecf0f1?text=Vintage+Baseball+Team+1860s)

*Figure 1: Early clubs came for the company as much as the contest.*

### The Alexander Cartwright Commit (v1.0)

Every project has a lead developer. Baseball had **Alexander Cartwright**. In
1845 he wrote down the **Knickerbocker Rules**. They gave us:

* Diamond-shaped field
* Three strikes for an out
* Tagging runners rather than throwing the ball at them (thank goodness)

---

## Eras of the Game

Baseball history splits into versions. Call them eras.

| Era | Timeframe | Characteristics | Notable Figure |
| :--- | :---: | :--- | :--- |
| **Dead Ball** | 1900–1919 | Low scoring, emphasis on speed/defense | Ty Cobb |
| **Live Ball** | 1920–1941 | Power hitting, home runs become king | Babe Ruth |
| **Integration** | 1947–1960 | Breaking the color barrier | Jackie Robinson |
| **Expansion** | 1961–1990 | League grows, artificial turf, free agency | Hank Aaron |
| **Steroid** | 1990s–2000s | Massive power numbers, controversy | Barry Bonds |
| **Analytics** | 2010–Present | Sabermetrics, shift, launch angle | Mike Trout |

> "Baseball is ninety percent mental. The other half is physical."
>
> — **Yogi Berra**

---

## The Code Behind the Game (Sabermetrics)

No sport carries more data than baseball. Batting Average no longer cuts it. We
read **WAR** (Wins Above Replacement) and **OPS+** instead.

Here is *On-base Plus Slugging* in JavaScript.

```javascript
/**
 * Calculate OPS (On-base Plus Slugging)
 * @param {number} hits
 * @param {number} walks
 * @param {number} hbp (hit by pitch)
 * @param {number} ab (at bats)
 * @param {number} sf (sacrifice flies)
 * @param {number} totalBases
 */
const calculateOPS = (hits, walks, hbp, ab, sf, totalBases) => {
  // 1. Calculate On-Base Percentage (OBP)
  const obp = (hits + walks + hbp) / (ab + walks + hbp + sf);

  // 2. Calculate Slugging Percentage (SLG)
  const slg = totalBases / ab;

  // 3. OPS
  return (obp + slg).toFixed(3);
};

console.log(calculateOPS(150, 80, 5, 500, 5, 250)); 
// Output: Roughly .900 (MVP caliber!)
```

---

## The Cathedral of Green

**No two fields are the same.** A basketball court is a basketball court. A
football field never changes. A ballpark does as it pleases. The walls run high
or low, near or far, and bend where they like.

{% imageGrid "parks", 3 %}

### Unwritten Rules

Baseball runs on soft code. These rules sit in no rulebook. The players enforce
them anyway.

1. Don't bunt to break up a no-hitter.
2. Don't steal a base when you are winning by 10 runs.
3. Never walk across the pitcher's mound.

Maybe you love a pitcher's duel. Maybe you wait nine innings for a walk-off.
Either way, baseball holds a mirror up to America. Tangled, always changing, and
full of numbers.
