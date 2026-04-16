// src/shared/agent-identity.ts
var VANILLA_AGENTS = new Set(["plan", "build", "general", "explore"]);
var MANTA_AGENTS = new Set(["manta"]);
var MANTA_PREFIX = "manta_";
function isMantaAgent(agentName) {
  if (!agentName)
    return false;
  if (MANTA_AGENTS.has(agentName))
    return true;
  if (agentName.startsWith(MANTA_PREFIX))
    return true;
  return false;
}
function isVanillaAgent(agentName) {
  return VANILLA_AGENTS.has(agentName ?? "");
}
function isOtherPluginAgent(agentName) {
  if (!agentName)
    return false;
  return !VANILLA_AGENTS.has(agentName) && !isMantaAgent(agentName);
}
export {
  isVanillaAgent,
  isOtherPluginAgent,
  isMantaAgent
};
