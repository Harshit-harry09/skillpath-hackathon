/**
 * ATLAS 2.0 PROMPT VERSION CONTROL STORE
 * Persists prompt versions and enables seamless rollbacks or live prompt deployment.
 */

export interface PromptVersion {
  agentId: string;
  versionNumber: number;
  promptText: string;
  createdAt: number;
  testResults: { total: number; passed: number };
  isActive: boolean;
  rollbackVersion?: number;
}

const promptVersionRegistry: Map<string, PromptVersion[]> = new Map();

/**
 * Retrieves the currently active prompt version for an agent.
 */
export function getActivePrompt(agentId: string, defaultPrompt: string): string {
  const versions = promptVersionRegistry.get(agentId) || [];
  const active = versions.find((v) => v.isActive);
  return active ? active.promptText : defaultPrompt;
}

/**
 * Registers a new prompt version.
 */
export function registerPromptVersion(
  agentId: string,
  promptText: string,
  testResults: { total: number; passed: number }
): PromptVersion {
  const versions = promptVersionRegistry.get(agentId) || [];
  const nextVersion = versions.length + 1;

  // Deactivate previous versions
  versions.forEach((v) => (v.isActive = false));

  const newVersion: PromptVersion = {
    agentId,
    versionNumber: nextVersion,
    promptText,
    createdAt: Date.now(),
    testResults,
    isActive: true,
    rollbackVersion: versions.length > 0 ? versions[versions.length - 1].versionNumber : undefined,
  };

  versions.push(newVersion);
  promptVersionRegistry.set(agentId, versions);
  console.log(`[PromptStore] Registered version v${nextVersion} for agent ${agentId} (${testResults.passed}/${testResults.total} tests passed)`);
  return newVersion;
}

/**
 * Rolls back an agent to the previous stable prompt version.
 */
export function rollbackPrompt(agentId: string): boolean {
  const versions = promptVersionRegistry.get(agentId);
  if (!versions || versions.length < 2) return false;

  const current = versions.find((v) => v.isActive);
  if (current && current.rollbackVersion) {
    current.isActive = false;
    const previous = versions.find((v) => v.versionNumber === current.rollbackVersion);
    if (previous) {
      previous.isActive = true;
      console.log(`[PromptStore] Rolled back agent ${agentId} to version v${previous.versionNumber}`);
      return true;
    }
  }
  return false;
}
