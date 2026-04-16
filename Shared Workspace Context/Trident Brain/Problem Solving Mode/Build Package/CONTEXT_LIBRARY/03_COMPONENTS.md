# Components - Problem Solving Mode

## Component: Evidence Collector

- **Purpose:** Gather raw evidence from external systems
- **Inputs:** Command execution, log reading, file inspection
- **Outputs:** Raw evidence data
- **Boundaries:** READ operations only

## Component: Gap Analyzer

- **Purpose:** Compare expected vs actual, derive gap
- **Inputs:** Expected output, actual output
- **Outputs:** Gap analysis with updated hypothesis
- **Boundaries:** Analysis only, no execution

## Component: Pattern Extractor

- **Purpose:** Identify systemic issues from iteration history
- **Inputs:** All iterations' gap analyses
- **Outputs:** Generalizable patterns
- **Boundaries:** Pattern recognition only

## Component: Gate Validator (x6)

- **Purpose:** Enforce structural requirements per layer
- **Inputs:** Current layer artifact, layer requirements
- **Outputs:** {valid: boolean, gaps: string[]}
- **Boundaries:** Validation only, one per layer

## Component: Iteration Manager

- **Purpose:** Track iteration count and layer attempts
- **Inputs:** State transitions
- **Outputs:** Updated iteration/attempt count
- **Boundaries:** State tracking only

## Component: Debugging Chain Generator

- **Purpose:** Produce injectable debugging chain
- **Inputs:** All layer outputs across iterations
- **Outputs:** Formatted debugging chain markdown
- **Boundaries:** Output generation only