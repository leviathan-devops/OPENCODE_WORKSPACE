# BUILD CHECKLIST: HIVE-SKELETON v2

**This is the a-priori checklist for the Build Agent. Do not mark as complete until verified.**

## [ ] PHASE 1: THE PURGE
- [ ] Create `~/.hermes/profiles/{profile}/workspace/`
- [ ] All `memory` tool entries migrated to L2 files.
- [ ] All `user` tool entries migrated to profile-root files.
- [ ] Global `memory` and `user` targets purged/cleared.

## [ ] PHASE 2: INDEXING
- [ ] `.abstract.md` (L0) created for all L2 files.
- [ ] `.overview.md` (L1) created for all directories.
- [ ] All L0/L1 content uploaded to OpenViking.
- [ ] `MASTER_INDEX.md` generated for the profile.

## [ ] PHASE 3: GUARDRAILS
- [ ] `read_file` path validation implemented.
- [ ] Profile-cross-access blocked.
- [ ] `01_STATUS.md` "Check-In" protocol operational.

## [ ] PHASE 4: VERIFICATION
- [ ] Path-based retrieval verified (L0 $\rightarrow$ L1 $\rightarrow$ L2).
- [ ] Memory isolation verified (Profile A cannot read Profile B).
- [ ] Temporal delta tracking verified (L1 `01_STATUS.md` updates).
