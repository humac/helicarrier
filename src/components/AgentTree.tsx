import React, { useMemo } from 'react';
import { useAgentStore, Agent } from '@/store/agentStore';
import { Activity, Circle, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { AgentActions } from './AgentActions';

interface AgentWithChildren extends Agent {
  children: AgentWithChildren[];
}

interface AgentNodeProps {
  agent: AgentWithChildren;
  depth: number;
}

const AgentNode = ({ agent, depth }: AgentNodeProps) => {
  const { selectedAgentId, selectAgent } = useAgentStore();
  const isSelected = selectedAgentId === agent.id;

  const statusColors: Record<string, string> = {
    idle: 'text-gray-400',
    running: 'text-green-500',
    paused: 'text-yellow-500',
    error: 'text-red-500',
    terminated: 'text-gray-600',
  };
  const statusColor = statusColors[agent.status] || 'text-gray-400';

  return (
    <div className="flex flex-col">
      <div
        className={clsx(
          "flex items-center p-2 rounded cursor-pointer transition-colors hover:bg-gray-800 border-l-4 group relative",
          isSelected ? "bg-gray-800 border-blue-500" : "border-transparent hover:border-gray-700"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => selectAgent(agent.id)}
      >
        <div className={`mr-2 ${statusColor}`}>
          <Circle size={10} fill="currentColor" strokeWidth={0} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-200 truncate">{agent.name || 'Unnamed Agent'}</span>
            {agent.model && (
              <span className="ml-2 text-[10px] text-gray-500 bg-gray-900 px-1 rounded truncate max-w-[80px]">
                {agent.model}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[10px] text-gray-600 font-mono truncate">{agent.id.slice(0, 8)}</span>
            
            {/* Action buttons (only visible on hover) */}
            <AgentActions agentId={agent.id} isTerminated={agent.status === 'terminated'} />
          </div>
        </div>
      </div>
      {agent.children && agent.children.length > 0 && (
        <div className="flex flex-col mt-1 space-y-1">
          {agent.children.map((child) => (
            <AgentNode
              key={child.id}
              agent={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AgentTree() {
  const { agents } = useAgentStore();

  const tree = useMemo(() => {
    const agentList = Object.values(agents);
    const agentMap = new Map<string, AgentWithChildren>();

    // First pass: create nodes
    agentList.forEach(a => {
      agentMap.set(a.id, { ...a, children: [] });
    });

    const roots: AgentWithChildren[] = [];

    // Second pass: build tree
    agentList.forEach(a => {
      const node = agentMap.get(a.id)!;
      if (a.parentId && agentMap.has(a.parentId)) {
        agentMap.get(a.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [agents]);

  if (Object.keys(agents).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 text-sm text-center">
        <Activity className="mb-2 opacity-20" size={32} />
        <p>No active agents</p>
        <p className="text-xs mt-1 opacity-50">Waiting for connection...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 border-r border-gray-800">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between shrink-0 h-14">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Terminal size={14} /> Agent Hierarchy
        </h2>
        <span className="text-[10px] font-mono bg-gray-900 px-1.5 py-0.5 rounded text-gray-400 border border-gray-800">
          {Object.keys(agents).length} ACTIVE
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tree.map((root) => (
          <AgentNode
            key={root.id}
            agent={root}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}
