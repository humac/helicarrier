import { Agent } from '@/store/agentStore';

// Base URL for the OpenClaw Gateway API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:18789';

// Define the API error type
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Generic API call function with error handling
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('Unknown API error occurred');
  }
}

// Kill a specific agent session
export async function killAgent(agentId: string): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>(`/api/sessions/${agentId}/kill`, {
    method: 'POST',
  });
}

// Steer an agent with a message
export async function steerAgent(agentId: string, message: string): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>(`/api/sessions/${agentId}/steer`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// Global kill all agents (emergency stop)
export async function killAllAgents(): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>('/api/sessions/kill-all', {
    method: 'POST',
  });
}

// Get agent details
export async function getAgentDetails(agentId: string): Promise<Agent> {
  return apiCall<Agent>(`/api/sessions/${agentId}`, {
    method: 'GET',
  });
}