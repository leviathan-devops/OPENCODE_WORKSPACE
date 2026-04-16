export enum WorkflowStep {
  PLAN = 0,
  BUILD = 1,
  TEST = 2,
  VERIFY = 3,
  SHIP = 4
}

export const STEP_NAMES = ['Plan', 'Build', 'Test', 'Verify', 'Ship'];

export enum BlockReason {
  NOT_STARTED,
  INCOMPLETE,
  FAILED_TESTS,
  VERIFICATION_FAILED
}
