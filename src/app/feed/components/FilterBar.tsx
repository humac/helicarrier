'use client';

import React from 'react';
import { FilterType } from '@/lib/types';

interface FilterBarProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  itemCounts: {
    all: number;
    user: number;
    assistant: number;
    tool: number;
  };
}

export default function FilterBar({ selectedFilter, onFilterChange, itemCounts }: FilterBarProps) {
  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'user', label: 'User' },
    { id: 'assistant', label: 'Assistant' },
    { id: 'tool', label: 'Tools' },
  ];

  return (
    <div className="flex items-center gap-2 p-4 bg-gray-950 border-b border-gray-800">
      {filters.map((filter) => {
        const count = filter.id === 'all' ? itemCounts.all : itemCounts[filter.id];
        const isSelected = selectedFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center gap-2
              ${isSelected
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-300'}
            `}
          >
            {filter.label}
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full
              ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}
            `}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
