# Mental Model - Deep Planning Mode

## One-Sentence Explanation

Deep Planning Mode is a structured thinking machine that forces agents to reason deeply before producing plans, using mechanical gates to prevent shallow reasoning.

## Key Abstraction

**Layers as Depth, Not Phases**

Most planners treat planning as a sequence: do research → make plan → done.

Deep Planning treats each layer as a depth level:
- Layer 1: Understand the problem deeply
- Layer 2: Decompose the solution deeply
- Layer 3: Document for others deeply

You iterate on each layer before moving down.

## How To Think About It

Think of Deep Planning Mode as a **thinking pressure system**:

1. **Gates are pressure valves** - They prevent shallow output from escaping
2. **Iterations are compression** - Each pass compresses more understanding
3. **Templates are molds** - They shape output into injectable form

The output isn't a plan - it's a complete reasoning chain that ANOTHER agent can follow to implement the plan.

## The Deep Planning Principle

> "You don't understand something until you've stated it three different ways and identified why each might fail."

Deep Planning Mode operationalizes this through:
- 3 layers of increasingly detailed reasoning
- Structural requirements that force multiple perspectives
- Iteration until verification passes