# COMPONENT DECOMPOSITION - Building Problem Solving Mode

## Component 1: Assumption Gate

- **Responsibility:** Validate Layer 1 has explicit assumption
- **Inputs:** Layer 1 artifact
- **Outputs:** {valid: boolean, gaps: string[]}
- **Requirements:** Explicit assumption, reasoning chain, success criteria

## Component 2: Action Gate

- **Responsibility:** Validate Layer 2 has exact command
- **Inputs:** Layer 2 artifact
- **Outputs:** {valid: boolean, gaps: string[]}
- **Requirements:** Exact command, expected output, environment state

## Component 3: Evidence Gate

- **Responsibility:** Validate Layer 3 has raw evidence
- **Inputs:** Layer 3 artifact
- **Outputs:** {valid: boolean, gaps: string[]}
- **Requirements:** Raw evidence (copied), logs checked, comparison

## Component 4: Gap Gate

- **Responsibility:** Validate Layer 4 has gap analysis
- **Inputs:** Layer 4 artifact
- **Outputs:** {valid: boolean, gaps: string[]}
- **Requirements:** Expected/Actual/Therefore, updated hypothesis

## Component 5: Pattern Gate

- **Responsibility:** Validate Layer 5 has pattern extraction
- **Inputs:** Layer 5 artifact
- **Outputs:** {valid: boolean, gaps: string[]}
- **Requirements:** What I should have done, pattern, systemic issue

## Component 6: Verification Gate

- **Responsibility:** Validate Layer 6 has target environment test
- **Inputs:** Layer 6 artifact
- **Outputs:** {valid: boolean, gaps: string[]}
- **Requirements:** Target execution, behavior match, no regressions