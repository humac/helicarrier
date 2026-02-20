import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAgentStore, LogEntry } from '@/store/agentStore';
import { List, ListImperativeAPI } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { Play, Pause, Trash2, Terminal } from 'lucide-react';
import { clsx } from 'clsx';

// Update Row component to match new react-window API
// It receives index, style, and whatever we pass in rowProps (data)
const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: LogEntry[] }) => {
  const log = data[index];
  
  const levelColor = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    debug: 'text-gray-500',
  }[log.level] || 'text-gray-300';

  return (
    <div style={style} className="flex items-start px-4 py-1 hover:bg-gray-900 font-mono text-xs border-b border-gray-900/50">
      <span className="text-gray-600 mr-2 shrink-0 select-none">
        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
      </span>
      <span className={clsx("uppercase font-bold mr-2 w-12 shrink-0 text-[10px]", levelColor)}>
        {log.level}
      </span>
      <span className="text-gray-300 truncate leading-tight w-full" title={log.message}>
        {log.message}
      </span>
    </div>
  );
};

export default function LogViewer() {
  const { logs, selectedAgentId, clearLogs } = useAgentStore();
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<ListImperativeAPI>(null);

  const filteredLogs = useMemo(() => {
    if (!selectedAgentId) return logs;
    return logs.filter(l => l.agentId === selectedAgentId);
  }, [logs, selectedAgentId]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToRow({ index: filteredLogs.length - 1, align: 'end' });
    }
  }, [filteredLogs.length, autoScroll]);

  if (!selectedAgentId && filteredLogs.length === 0) {
     return (
       <div className="flex flex-col items-center justify-center h-full bg-gray-950 text-gray-500 text-sm">
         <Terminal className="mb-2 opacity-20" size={48} />
         <p>Select an agent to view logs</p>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-800 shrink-0 h-14 bg-gray-950">
         <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} /> Live Logs
            </h2>
            {selectedAgentId && (
              <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50 font-mono">
                {selectedAgentId.slice(0, 8)}
              </span>
            )}
         </div>
         <div className="flex items-center gap-2">
           <button 
             onClick={() => setAutoScroll(!autoScroll)}
             className={clsx(
               "p-1.5 rounded hover:bg-gray-800 transition-colors",
               autoScroll ? "text-green-500" : "text-gray-500"
             )}
             title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
           >
             {autoScroll ? <Pause size={14} /> : <Play size={14} />}
           </button>
           <button 
             onClick={clearLogs}
             className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
             title="Clear Logs"
           >
             <Trash2 size={14} />
           </button>
         </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <AutoSizer
          renderProp={({ height, width }) => (
            <List<{ data: LogEntry[] }>
              listRef={listRef}
              style={{ height, width }}
              rowCount={filteredLogs.length}
              rowHeight={24}
              rowComponent={Row}
              rowProps={{ data: filteredLogs }}
              overscanCount={20}
            />
          )}
        />
      </div>
    </div>
  );
}
