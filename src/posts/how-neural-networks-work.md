---
title: "How Neural Networks Work"
date: 2026-02-03
tags: ["ai", "neural-networks"]
description: "A Brain Analogy 🧠"
---

Our brain has about
[80-90 billion neurons](https://en.wikipedia.org/wiki/Neuron). Each one
receives signals, decides if they matter, and passes a message forward. A
[neural network](https://en.wikipedia.org/wiki/Artificial_neural_network) does
the same thing with math.

## Architecture

### Layers

Our brain processes information in stages. Light hits my eyes 👁️. One region
detects edges. Another recognizes shapes. Another says "squirrel!" 🐿️

A neural network has
**[layers](https://en.wikipedia.org/wiki/Layer_(deep_learning))** that work the
same way. A network can have many. The inner ones are called "hidden."

<svg class="diagram" viewBox="0 0 700 265" role="img" aria-label="Four input neurons x1 to x4 connect to four hidden neurons h1 to h4, which connect to two output neurons y1 and y2. Every neuron links to every neuron in the next layer, and the links vary in strength."><line class="dg-edge" x1="107" y1="70" x2="333" y2="70" stroke-opacity="0.43"/><line class="dg-edge" x1="107" y1="70" x2="333" y2="120" stroke-opacity="0.50"/><line class="dg-edge" x1="107" y1="70" x2="333" y2="170" stroke-opacity="0.75"/><line class="dg-edge" x1="107" y1="70" x2="333" y2="220" stroke-opacity="0.44"/><line class="dg-edge" x1="107" y1="120" x2="333" y2="70" stroke-opacity="0.47"/><line class="dg-edge" x1="107" y1="120" x2="333" y2="120" stroke-opacity="0.52"/><line class="dg-edge" x1="107" y1="120" x2="333" y2="170" stroke-opacity="0.25"/><line class="dg-edge" x1="107" y1="120" x2="333" y2="220" stroke-opacity="0.47"/><line class="dg-edge" x1="107" y1="170" x2="333" y2="70" stroke-opacity="0.55"/><line class="dg-edge" x1="107" y1="170" x2="333" y2="120" stroke-opacity="0.66"/><line class="dg-edge" x1="107" y1="170" x2="333" y2="170" stroke-opacity="0.18"/><line class="dg-edge" x1="107" y1="170" x2="333" y2="220" stroke-opacity="0.33"/><line class="dg-edge" x1="107" y1="220" x2="333" y2="70" stroke-opacity="0.18"/><line class="dg-edge" x1="107" y1="220" x2="333" y2="120" stroke-opacity="0.67"/><line class="dg-edge" x1="107" y1="220" x2="333" y2="170" stroke-opacity="0.59"/><line class="dg-edge" x1="107" y1="220" x2="333" y2="220" stroke-opacity="0.15"/><line class="dg-edge" x1="367" y1="70" x2="593" y2="95" stroke-opacity="0.79"/><line class="dg-edge" x1="367" y1="70" x2="593" y2="170" stroke-opacity="0.78"/><line class="dg-edge" x1="367" y1="120" x2="593" y2="95" stroke-opacity="0.56"/><line class="dg-edge" x1="367" y1="120" x2="593" y2="170" stroke-opacity="0.54"/><line class="dg-edge" x1="367" y1="170" x2="593" y2="95" stroke-opacity="0.23"/><line class="dg-edge" x1="367" y1="170" x2="593" y2="170" stroke-opacity="0.13"/><line class="dg-edge" x1="367" y1="220" x2="593" y2="95" stroke-opacity="0.48"/><line class="dg-edge" x1="367" y1="220" x2="593" y2="170" stroke-opacity="0.16"/><g class="dg-n is-in"><circle class="dg-node is-in" cx="90" cy="70" r="17"/><text class="dg-nlabel" x="90" y="74" text-anchor="middle">x1</text></g><g class="dg-n is-in"><circle class="dg-node is-in" cx="90" cy="120" r="17"/><text class="dg-nlabel" x="90" y="124" text-anchor="middle">x2</text></g><g class="dg-n is-in"><circle class="dg-node is-in" cx="90" cy="170" r="17"/><text class="dg-nlabel" x="90" y="174" text-anchor="middle">x3</text></g><g class="dg-n is-in"><circle class="dg-node is-in" cx="90" cy="220" r="17"/><text class="dg-nlabel" x="90" y="224" text-anchor="middle">x4</text></g><text class="dg-layer" x="90" y="30" text-anchor="middle">input layer</text><g class="dg-n "><circle class="dg-node " cx="350" cy="70" r="17"/><text class="dg-nlabel" x="350" y="74" text-anchor="middle">h1</text></g><g class="dg-n "><circle class="dg-node " cx="350" cy="120" r="17"/><text class="dg-nlabel" x="350" y="124" text-anchor="middle">h2</text></g><g class="dg-n "><circle class="dg-node " cx="350" cy="170" r="17"/><text class="dg-nlabel" x="350" y="174" text-anchor="middle">h3</text></g><g class="dg-n "><circle class="dg-node " cx="350" cy="220" r="17"/><text class="dg-nlabel" x="350" y="224" text-anchor="middle">h4</text></g><text class="dg-layer" x="350" y="30" text-anchor="middle">hidden layer</text><g class="dg-n is-out"><circle class="dg-node is-out" cx="610" cy="95" r="17"/><text class="dg-nlabel" x="610" y="99" text-anchor="middle">y1</text></g><g class="dg-n is-out"><circle class="dg-node is-out" cx="610" cy="170" r="17"/><text class="dg-nlabel" x="610" y="174" text-anchor="middle">y2</text></g><text class="dg-layer" x="610" y="30" text-anchor="middle">output layer</text></svg>
<span class="diagram-caption">Input, hidden, output. Every neuron talks to the next layer.</span>

### Neurons

Inside each layer sit
**[neurons](https://en.wikipedia.org/wiki/Artificial_neuron)**. In our nervous
system a neuron is a cell. It collects signals and fires when they are strong
enough ⚡. In a network a neuron is a small math function. It adds up inputs
and decides how strong to respond.

<svg class="diagram" viewBox="0 0 700 240" role="img" aria-label="Three inputs each pass through a weight, w1, w2 and w3. The weighted inputs feed a box that sums them and adds a bias. That feeds an activation box, which produces the output."><defs><marker id="nn-tip1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/></marker></defs><text class="dg-mono" x="20" y="64">input1</text><circle class="dg-node" cx="150" cy="60" r="17"/><text class="dg-mono" x="150" y="64" text-anchor="middle">w1</text><path class="dg-line" d="M86 60 H131"/><path class="dg-line" d="M169 60 L254 120" marker-end="url(#nn-tip1)"/><text class="dg-mono" x="20" y="124">input2</text><circle class="dg-node" cx="150" cy="120" r="17"/><text class="dg-mono" x="150" y="124" text-anchor="middle">w2</text><path class="dg-line" d="M86 120 H131"/><path class="dg-line" d="M169 120 L254 120" marker-end="url(#nn-tip1)"/><text class="dg-mono" x="20" y="184">input3</text><circle class="dg-node" cx="150" cy="180" r="17"/><text class="dg-mono" x="150" y="184" text-anchor="middle">w3</text><path class="dg-line" d="M86 180 H131"/><path class="dg-line" d="M169 180 L254 120" marker-end="url(#nn-tip1)"/><g class="dg-box"><rect x="258" y="92" width="130" height="56" rx="6"/><text class="dg-strong" x="323" y="117" text-anchor="middle">sum + bias</text><text class="dg-small" x="323" y="135" text-anchor="middle">add it all up</text></g><path class="dg-line" d="M388 120 H428" marker-end="url(#nn-tip1)"/><g class="dg-box"><rect x="432" y="92" width="130" height="56" rx="6"/><text class="dg-strong" x="497" y="117" text-anchor="middle">activation</text><text class="dg-small" x="497" y="135" text-anchor="middle">how hard to fire</text></g><path class="dg-line" d="M562 120 H612" marker-end="url(#nn-tip1)"/><text class="dg-mono" x="620" y="124">output</text><text class="dg-layer" x="150" y="226" text-anchor="middle">weights</text></svg>
<span class="diagram-caption">Weighted inputs in, one decision out.</span>

### Weights

Not every signal matters equally.

We would (*hopefully*) pay more attention to smoke 💨 than to background
music 🎵. **[Weights](https://en.wikipedia.org/wiki/Synaptic_weight)** control
this. They are numbers on every connection. They say "listen to this" or
"ignore that."

### Biases

Our brain has baseline tendencies. Maybe I startle easily. Maybe I don't.
Maybe I favor right turns over left when I'm lost. These are
**[Biases](https://en.wikipedia.org/wiki/Bias_(statistics))**. A bias nudges a
neuron to fire more, or less, whatever the input.

### Activation Function

Each neuron also has an
**[activation function](https://en.wikipedia.org/wiki/Activation_function)**.
It is a rule for how strong to respond. Think of our pain threshold. A light
tap does nothing. A hard knock makes us pull away. The activation function
sets that threshold.

<svg class="diagram" viewBox="0 0 620 260" role="img" aria-label="An S-shaped activation curve. Output stays near zero for small inputs, rises steeply through the middle, then flattens near one for large inputs."><defs><marker id="nn-tip2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/></marker></defs><path class="dg-line" d="M90 210 V46" marker-end="url(#nn-tip2)"/><path class="dg-line" d="M90 210 H544" marker-end="url(#nn-tip2)"/><polyline class="dg-line" points="90.0 209.6 95.5 209.6 101.0 209.5 106.5 209.4 112.0 209.3 117.5 209.2 123.0 209.1 128.5 208.9 134.0 208.8 139.5 208.6 145.0 208.4 150.5 208.1 156.0 207.8 161.5 207.4 167.0 207.0 172.5 206.6 178.0 206.0 183.5 205.4 189.0 204.7 194.5 203.8 200.0 202.9 205.5 201.8 211.0 200.6 216.5 199.1 222.0 197.5 227.5 195.7 233.0 193.6 238.5 191.3 244.0 188.7 249.5 185.8 255.0 182.6 260.5 179.1 266.0 175.3 271.5 171.1 277.0 166.6 282.5 161.9 288.0 156.8 293.5 151.6 299.0 146.2 304.5 140.6 310.0 135.0 315.5 129.4 321.0 123.8 326.5 118.4 332.0 113.2 337.5 108.1 343.0 103.4 348.5 98.9 354.0 94.7 359.5 90.9 365.0 87.4 370.5 84.2 376.0 81.3 381.5 78.7 387.0 76.4 392.5 74.3 398.0 72.5 403.5 70.9 409.0 69.4 414.5 68.2 420.0 67.1 425.5 66.2 431.0 65.3 436.5 64.6 442.0 64.0 447.5 63.4 453.0 63.0 458.5 62.6 464.0 62.2 469.5 61.9 475.0 61.6 480.5 61.4 486.0 61.2 491.5 61.1 497.0 60.9 502.5 60.8 508.0 60.7 513.5 60.6 519.0 60.5 524.5 60.4 530.0 60.4"/><path class="dg-line" d="M90 60 H530" stroke-dasharray="4 4" stroke-opacity="0.45"/><text class="dg-mono" x="80" y="64" text-anchor="end">1</text><text class="dg-mono" x="80" y="214" text-anchor="end">0</text><text class="dg-layer" x="310" y="244" text-anchor="middle">input</text><text class="dg-layer" x="50" y="135" text-anchor="middle" transform="rotate(-90 50 135)">output</text><text class="dg-small" x="156" y="170" text-anchor="middle">small inputs:</text><text class="dg-small" x="156" y="184" text-anchor="middle">neuron stays quiet</text><text class="dg-small" x="464" y="100" text-anchor="middle">large inputs:</text><text class="dg-small" x="464" y="114" text-anchor="middle">neuron fires</text></svg>
<span class="diagram-caption">Quiet until it is not. The curve sets the threshold.</span>

### Forward Pass

A signal moves through every layer, input to output. That is the
**[forward pass](https://en.wikipedia.org/wiki/Feedforward_neural_network)**.
It is the network "thinking," not learning (yet).

Just signal in, answer out.

## Learning

### Loss Function

The network starts with random weights. It guesses wrong. The
**[loss function](https://en.wikipedia.org/wiki/Loss_function)** measures how
wrong, like the sting of touching a hot stove 🔥. Bigger mistake, bigger
sting.

### Backpropagation

Now it needs to fix itself.
**[Backpropagation](https://en.wikipedia.org/wiki/Backpropagation)** traces the
error backward through the network. It works out which weights did the most
damage. We do this too: "I should have checked the burner before touching."

<svg class="diagram" viewBox="0 0 700 250" role="img" aria-label="On the top row an input flows forward through three layers to a prediction. The prediction is compared to the right answer, which produces a loss. On the bottom row the blame travels back through the same three layers to adjust the weights."><defs><marker id="nn-tip3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/></marker></defs><text class="dg-mono" x="20" y="64">input</text><path class="dg-line" d="M70 60 H146" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="150" y="36" width="110" height="48" rx="6"/><text class="dg-strong" x="205" y="66" text-anchor="middle">layer</text></g><path class="dg-line" d="M260 60 H296" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="300" y="36" width="110" height="48" rx="6"/><text class="dg-strong" x="355" y="66" text-anchor="middle">layer</text></g><path class="dg-line" d="M410 60 H446" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="450" y="36" width="110" height="48" rx="6"/><text class="dg-strong" x="505" y="66" text-anchor="middle">layer</text></g><path class="dg-line" d="M560 60 H604" marker-end="url(#nn-tip3)"/><text class="dg-mono" x="612" y="64">prediction</text><text class="dg-layer" x="20" y="24">forward pass &#8212; thinking</text><path class="dg-line" d="M648 76 V108" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="560" y="112" width="130" height="46" rx="6"></rect><text class="dg-small" x="625" y="130" text-anchor="middle">compare to</text><text class="dg-small" x="625" y="146" text-anchor="middle">the right answer</text></g><path class="dg-line" d="M648 158 V186" marker-end="url(#nn-tip3)"/><g class="dg-note"><rect x="586" y="190" width="78" height="38" rx="6"/><text class="dg-strong" x="625" y="214" text-anchor="middle">loss</text></g><path class="dg-line" d="M586 209 H564" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="450" y="186" width="110" height="46" rx="6"/><text class="dg-strong" x="505" y="215" text-anchor="middle">layer</text></g><path class="dg-line" d="M450 209 H414" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="300" y="186" width="110" height="46" rx="6"/><text class="dg-strong" x="355" y="215" text-anchor="middle">layer</text></g><path class="dg-line" d="M300 209 H264" marker-end="url(#nn-tip3)"/><g class="dg-box"><rect x="150" y="186" width="110" height="46" rx="6"/><text class="dg-strong" x="205" y="215" text-anchor="middle">layer</text></g><path class="dg-line" d="M150 209 H112" marker-end="url(#nn-tip3)"/><text class="dg-mono" x="8" y="213">adjust weights</text><text class="dg-layer" x="20" y="174">backpropagation &#8212; learning</text></svg>
<span class="diagram-caption">Forward to a guess. Backward to a fix.</span>

### Gradient

The **[gradient](https://en.wikipedia.org/wiki/Gradient)** tells each weight
which direction to move and how far. Picture standing on a hill in fog 🌫️.
You can't see the bottom, but you feel the slope under your feet.

### Gradient Descent

**[Gradient descent](https://en.wikipedia.org/wiki/Gradient_descent)** is the
act of stepping downhill ⛰️ — adjusting every weight to reduce the error.

<svg class="diagram" viewBox="0 0 620 262" role="img" aria-label="A loss curve starting high on the left and falling steeply, then flattening out toward a minimum on the right. Three points are marked: a steep big gradient near the start, a flat small gradient in the middle, and the minimum at the end."><defs><marker id="nn-tip4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/></marker></defs><path class="dg-line" d="M80 220 V44" marker-end="url(#nn-tip4)"/><path class="dg-line" d="M80 220 H576" marker-end="url(#nn-tip4)"/><polyline class="dg-line" points="80.0 60.0 85.0 65.0 90.0 69.9 95.0 74.6 100.0 79.2 105.0 83.6 110.0 87.8 115.0 92.0 120.0 96.0 125.0 99.8 130.0 103.5 135.0 107.1 140.0 110.6 145.0 114.0 150.0 117.3 155.0 120.4 160.0 123.5 165.0 126.4 170.0 129.3 175.0 132.1 180.0 134.7 185.0 137.3 190.0 139.8 195.0 142.2 200.0 144.6 205.0 146.8 210.0 149.0 215.0 151.2 220.0 153.2 225.0 155.2 230.0 157.1 235.0 158.9 240.0 160.7 245.0 162.5 250.0 164.1 255.0 165.8 260.0 167.3 265.0 168.9 270.0 170.3 275.0 171.7 280.0 173.1 285.0 174.4 290.0 175.7 295.0 177.0 300.0 178.2 305.0 179.3 310.0 180.5 315.0 181.5 320.0 182.6 325.0 183.6 330.0 184.6 335.0 185.5 340.0 186.5 345.0 187.3 350.0 188.2 355.0 189.0 360.0 189.8 365.0 190.6 370.0 191.4 375.0 192.1 380.0 192.8 385.0 193.5 390.0 194.2 395.0 194.8 400.0 195.4 405.0 196.0 410.0 196.6 415.0 197.1 420.0 197.7 425.0 198.2 430.0 198.7 435.0 199.2 440.0 199.7 445.0 200.1 450.0 200.6 455.0 201.0 460.0 201.4 465.0 201.8 470.0 202.2 475.0 202.6 480.0 202.9 485.0 203.3 490.0 203.6 495.0 203.9 500.0 204.3 505.0 204.6 510.0 204.9 515.0 205.1 520.0 205.4 525.0 205.7 530.0 206.0 535.0 206.2 540.0 206.4 545.0 206.7 550.0 206.9 555.0 207.1 560.0 207.3"/><circle class="dg-node is-in" cx="142.4" cy="112.3" r="7"/><text class="dg-small" x="160.4" y="106.3">big gradient (steep)</text><circle class="dg-node" cx="300.8" cy="178.4" r="7"/><text class="dg-small" x="316.8" y="168.4">small gradient (flat)</text><circle class="dg-node is-out" cx="560.0" cy="207.3" r="8"/><text class="dg-small" x="554.0" y="189.3" text-anchor="end">minimum (goal)</text><text class="dg-layer" x="46" y="140" text-anchor="middle" transform="rotate(-90 46 140)">loss</text><text class="dg-layer" x="320" y="254" text-anchor="middle">weight adjustment &#8594;</text></svg>
<span class="diagram-caption">Steep at first, then smaller steps toward the bottom.</span>

### Learning Rate

The **[learning rate](https://en.wikipedia.org/wiki/Learning_rate)** controls
step size. Too big and you overshoot. Too small and you barely move. The right
pace finds the bottom.

Repeat this thousands of times. The weights are trained and the network
learns 🎓.

---

## Summary

**Structural Primitives** 🏗️

| Neural Network | Human Brain |
| --- | --- |
| [Layers](https://en.wikipedia.org/wiki/Layer_(deep_learning)) | Processing stages: senses - recognition - understanding |
| [Neurons](https://en.wikipedia.org/wiki/Artificial_neuron) | Brain cells that collect signals and fire |
| [Weights](https://en.wikipedia.org/wiki/Synaptic_weight) | How much attention we give each signal |
| [Biases](https://en.wikipedia.org/wiki/Bias_(statistics)) | Tendencies: naturally jumpy or calm |
| [Activation Function](https://en.wikipedia.org/wiki/Activation_function) | Our threshold for reacting |
| [Forward Pass](https://en.wikipedia.org/wiki/Feedforward_neural_network) | Thinking: signal in, answer out |

**Learning Mechanics** 📚

| Neural Network | Human Brain |
| --- | --- |
| [Loss Function](https://en.wikipedia.org/wiki/Loss_function) | The sting of being wrong |
| [Backpropagation](https://en.wikipedia.org/wiki/Backpropagation) | Tracing the blame — "I should have checked the burner" |
| [Gradient](https://en.wikipedia.org/wiki/Gradient) | Feeling which way is downhill and how steep |
| [Gradient Descent](https://en.wikipedia.org/wiki/Gradient_descent) | Actually stepping downhill — adjusting to make fewer mistakes |
| [Learning Rate](https://en.wikipedia.org/wiki/Learning_rate) | How big my steps are — overcorrect and I panic, undercorrect and I never learn |
