# Manta Agent - System Breakage Report

## Summary of Discovered Breaks

The following architectural breaks were uncovered through systematic reproduction testing.

### 1. Premature BUILD $\rightarrow$ TEST Transition
* **Symptom**: Any `write_file` operation (even for non-implementation files like `config.json`) triggers an immediate transition to the `TEST` gate.
* **Impact**: The agent may enter the `TEST` gate before the implementation is actually complete.

### 2. Premature TEST $\rightarrow$ VERIFY Transition
* **Symptom**: Running common terminal commands like `ls` during the `TEST` gate triggers an immediate transition to the `VERIFY` gate.
* **Impact**: The agent may enter the `VERIFY` gate before any actual testing or verification has occurred.

### 3. Weak AUDIT $\rightarrow$ DELIVERY Transition
* **Symptom**: Any terminal command (e.g., `cat README.md`) during the `AUDIT` gate triggers an immediate transition to the `DELIVERY` gate.
* **Impact**: The agent may skip the actual security/audit process and move straight to delivery.

### 4. False Positive VERIFY Failure
* **Symptom**: The `VERIFY` gate's failure detection logic is overly sensitive. It detects "failure" in non-error contexts (e.g., "The failure was expected").
* **Impact**: Unnecessary iteration loops and escalation to new iterations.

### 5. Narrow VERIFY $\rightarrow$ AUDIT Detection
* **Symptom**: The transition from `VERIFY` to `AUDIT` only triggers on `SPEC.md` reads or specific SAST command patterns.
* **Impact**: While not a "break" per se, it makes the transition brittle and dependent on specific agent behaviors.

## Reproduction Script Results
All breaks were confirmed using the `repro_breaks.ts` script.
