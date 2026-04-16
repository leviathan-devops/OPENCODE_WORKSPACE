import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { HermesAgentConfigSchema } from "./schema.js";
const CONFIG_PATH = resolve(process.env.HOME ?? "~", ".hermes", "settings.json");
const DEFAULTS = {
    permissions: {
        mode: "auto",
        allow: [],
        deny: [],
    },
    modelTiering: {
        cheap: "qwen3.6-turbo",
        standard: "qwen3.6-plus-preview",
        capable: "qwen3.6-plus-preview:free",
    },
    compaction: {
        microcompactInterval: 10,
        autocompactThreshold: 0.80,
        emergencyThreshold: 0.95,
    },
    workspace: "~/hermes-workspace",
    phase: "idle",
};
export function loadHermesConfig() {
    try {
        if (!existsSync(CONFIG_PATH)) {
            return DEFAULTS;
        }
        const raw = readFileSync(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        const result = HermesAgentConfigSchema.parse(parsed);
        return { ...DEFAULTS, ...result };
    }
    catch {
        return DEFAULTS;
    }
}
export function resolvePath(path) {
    if (path.startsWith("~/")) {
        return resolve(path.replace("~", process.env.HOME ?? "~"));
    }
    return resolve(path);
}
