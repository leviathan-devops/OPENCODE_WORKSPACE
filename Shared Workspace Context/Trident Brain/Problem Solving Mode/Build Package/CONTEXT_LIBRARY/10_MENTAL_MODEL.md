# Mental Model - Problem Solving Mode

## One-Sentence Explanation

Problem Solving Mode is an evidence-based debugging machine that forces agents to prove their assumptions before acting and show their work before claiming success.

## Key Abstraction

**Debugging as Scientific Method**

Most debugging is:
1. Try something
2. Hope it works
3. Move on

Problem Solving Mode is:
1. State what you think is wrong (assumption)
2. Predict what will happen if you're right (action)
3. Show what actually happened (evidence)
4. Explain what the difference means (gap)
5. Learn what you should have done (pattern)
6. Prove it actually works (verification)

## How To Think About It

Think of Problem Solving Mode as a **proof machine**:

1. **Assumption = Hypothesis** - You must state it explicitly
2. **Evidence = Proof** - Raw, not described
3. **Gap = Learning** - Each failure teaches something
4. **Pattern = Generalization** - What applies elsewhere?

The output is a debugging chain that PROVES the problem was solved correctly.