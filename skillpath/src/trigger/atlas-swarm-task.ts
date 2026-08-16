import { executeAtlasAgentRun } from '../../lib/atlas/atlas-dag-runner';
import type { AtlasSessionState } from '../../lib/atlas/orchestrator';

let task: any = null;
try {
  task = require('@trigger.dev/sdk/v3').task;
} catch {
  task = (config: any) => config;
}

export interface SwarmTaskPayload {
  agentId: string;
  params?: Record<string, any>;
  sessionState: AtlasSessionState;
}

export const executeAtlasSwarmTask = typeof task === 'function'
  ? task({
      id: 'atlas-swarm-execution',
      retry: {
        maxAttempts: 3,
        factor: 2,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 10000,
      },
      run: async (payload: SwarmTaskPayload) => {
        console.log(`[Trigger.dev Task] Executing agent task: ${payload.agentId}`);
        const result = await executeAtlasAgentRun({
          agentId: payload.agentId,
          params: payload.params,
          sessionState: payload.sessionState,
        });
        return result;
      },
    })
  : null;
