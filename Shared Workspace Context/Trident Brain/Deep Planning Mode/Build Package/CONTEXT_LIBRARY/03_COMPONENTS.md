# Components - Deep Planning Mode

## Component: Layer Orchestrator

- **Purpose:** Manages layer progression and gate enforcement
- **Inputs:** Current state, layer artifacts
- **Outputs:** Next layer or complete signal
- **Boundaries:** Starts at Layer 1, ends at Layer 3 completion

## Component: Template Engine

- **Purpose:** Generates structured markdown from templates
- **Inputs:** Template type, context data
- **Outputs:** Filled markdown artifacts
- **Boundaries:** Produces Layer 1/2/3 outputs

## Component: State Manager

- **Purpose:** Tracks iteration count and layer attempts
- **Inputs:** State transitions
- **Outputs:** State snapshot for persistence
- **Boundaries:** Handles V1.0 → V1.1 → V1.2 transitions

## Component: Artifact Generator

- **Purpose:** Produces injectable context library
- **Inputs:** All layer outputs
- **Outputs:** Complete markdown library (01-10 files)
- **Boundaries:** Final output of Layer 3

## Component: Gate Validator

- **Purpose:** Enforces structural requirements before layer advancement
- **Inputs:** Current layer artifact
- **Outputs:** Valid/invalid + reasons
- **Boundaries:** Checked on each layer transition

## Component: Read Access Bridge

- **Purpose:** Provides unified read access to external context
- **Inputs:** File paths, search queries
- **Outputs:** Context data for synthesis
- **Boundaries:** Limited to read-only operations