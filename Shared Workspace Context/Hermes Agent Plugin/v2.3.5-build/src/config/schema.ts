import { z } from "zod";

const PermissionsSchema = z.object({
  mode: z.enum(["auto", "manual"]),
  allow: z.array(z.string()),
  deny: z.array(z.string()),
});

const ModelTieringSchema = z.object({
  cheap: z.string(),
  standard: z.string(),
  capable: z.string(),
});

const CompactionSchema = z.object({
  microcompactInterval: z.number(),
  autocompactThreshold: z.number(),
  emergencyThreshold: z.number(),
});

export const HermesAgentConfigSchema = z.object({
  permissions: PermissionsSchema.optional(),
  modelTiering: ModelTieringSchema.optional(),
  compaction: CompactionSchema.optional(),
  workspace: z.string(),
  phase: z.enum([
    "idle",
    "analyze",
    "plan",
    "build",
    "review",
    "debug",
    "complete",
  ]),
});

export type HermesAgentConfig = z.infer<typeof HermesAgentConfigSchema>;
