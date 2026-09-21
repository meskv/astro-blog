---
title: "A Small Experiment: How Ideas Become Models"
description: "A practical experiment in turning observations into models, with code, mathematics, images, and a few questions along the way."
pubDate: "2026-09-21"
category: "Technology"
imageUrl: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg"
imageCredit: "Pexels"
---
## 1. Start with a question
Most useful models begin with a surprisingly simple question.
Why does something happen?
At first, the question may not look mathematical at all. We observe something in the real world, notice a pattern, and then try to describe that pattern using a smaller set of ideas.
A model is therefore not reality itself. It is a simplified representation of reality.
> The purpose of a model is not to reproduce everything. It is to make something understandable.
That distinction becomes important very quickly.
---
## 2. From observation to abstraction
Imagine that we are observing the movement of an object.
We could record its position every second:
- 0 seconds → 0 metres
- 1 second → 5 metres
- 2 seconds → 10 metres
- 3 seconds → 15 metres
- 4 seconds → 20 metres
There are many ways to describe this data.
One simple possibility is:
\\\[<br>x(t) = 5t<br>\\\]
where:
- \\(x\\) is position,
- \\(t\\) is time,
- 5 is the rate at which position changes.
The interesting part is not the equation itself.
The interesting part is that a collection of observations has been compressed into a single relationship.
---
## 3. A little mathematics
Suppose the position of an object is given by
\\\[<br>x(t) = 3t\^2 + 2t + 1<br>\\\]
The velocity is the rate at which position changes with time.
Therefore:
\\\[<br>v(t) = \\frac\{dx\}\{dt\}<br>\\\]
and differentiating the equation gives:
\\\[<br>v(t) = 6t + 2<br>\\\]
The acceleration is then:
\\\[<br>a(t) = \\frac\{dv\}\{dt\}<br>\\\]
so:
\\\[<br>a(t) = 6<br>\\\]
This gives us a compact description of the entire motion.
Instead of storing every position separately, the model gives us a rule from which we can calculate the position, velocity, and acceleration.
---
## 4. The same idea appears in code
A mathematical model can often be translated into a computational model.
For example:
```python
def position(t):
    return 3 * t**2 + 2 * t + 1


def velocity(t):
    return 6 * t + 2


for t in range(5):
    print(t, position(t), velocity(t))
```
