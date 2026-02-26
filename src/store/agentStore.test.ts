import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgentStore } from './agentStore';
import * as api from '@/lib/api';

// Mock the API module
vi.mock('@/lib/api', () => ({
  killAgent: vi.fn(),
  steerAgent: vi.fn(),
  killAllAgents: vi.fn(),
}));

describe('agentStore Actions', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agents: {},
      logs: [],
      selectedAgentId: null,
      isOperatorMode: false,
    });
    vi.clearAllMocks();
  });

  it('should toggle operator mode', () => {
    const store = useAgentStore.getState();
    expect(store.isOperatorMode).toBe(false);

    store.toggleOperatorMode();
    expect(useAgentStore.getState().isOperatorMode).toBe(true);
    
    store.toggleOperatorMode();
    expect(useAgentStore.getState().isOperatorMode).toBe(false);
  });

  it('should call killAgent API when killAgentAction is invoked', async () => {
    const store = useAgentStore.getState();
    const agentId = 'test-agent-1';

    // Mock successful API call
    vi.mocked(api.killAgent).mockResolvedValue({ success: true });

    const result = await store.killAgentAction(agentId);

    expect(api.killAgent).toHaveBeenCalledWith(agentId);
    expect(result).toBe(true);
  });

  it('should return false if killAgent API fails', async () => {
    const store = useAgentStore.getState();
    const agentId = 'test-agent-1';

    // Mock failed API call
    vi.mocked(api.killAgent).mockRejectedValue(new Error('API Error'));

    const result = await store.killAgentAction(agentId);

    expect(api.killAgent).toHaveBeenCalledWith(agentId);
    expect(result).toBe(false);
  });

  it('should call steerAgent API with correct arguments', async () => {
    const store = useAgentStore.getState();
    const agentId = 'test-agent-1';
    const message = 'stop everything';

    vi.mocked(api.steerAgent).mockResolvedValue({ success: true });

    const result = await store.steerAgentAction(agentId, message);

    expect(api.steerAgent).toHaveBeenCalledWith(agentId, message);
    expect(result).toBe(true);
  });

  it('should call killAllAgents API for emergency stop', async () => {
    const store = useAgentStore.getState();

    vi.mocked(api.killAllAgents).mockResolvedValue({ success: true });

    const result = await store.killAllAgentsAction();

    expect(api.killAllAgents).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
