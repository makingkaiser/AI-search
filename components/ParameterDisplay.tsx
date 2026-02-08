'use client';

import { useState } from 'react';
import { getToolParameters, type ParameterConfig } from '@/lib/tools';

interface ParameterDisplayProps {
  toolName: string;
  args: Record<string, unknown>;
  onChange: (newArgs: Record<string, unknown>) => void;
  editable?: boolean;
  onDoneEditing?: () => void;
}

// Section labels and order
const sectionLabels: Record<string, string> = {
  search: 'Search',
  filters: 'Filters',
  contents: 'Contents',
};

const sectionOrder = ['search', 'filters', 'contents'];

// Select options for different parameter types
const selectOptions: Record<string, string[]> = {
  type: ['auto', 'neural', 'fast'],
  category: ['company', 'research paper', 'news', 'pdf', 'github', 'tweet', 'personal site', 'people', 'financial report'],
};

export function ParameterDisplay({ toolName, args, onChange, editable = false, onDoneEditing }: ParameterDisplayProps) {
  const [editMode, setEditMode] = useState(false);
  const [showAllParams, setShowAllParams] = useState(false);
  
  // Get available parameters for this tool from metadata
  const availableParams = getToolParameters(toolName);
  
  // Group parameters by section
  const paramsBySection = availableParams.reduce((acc, param) => {
    const section = param.section || 'search';
    if (!acc[section]) acc[section] = [];
    acc[section].push(param);
    return acc;
  }, {} as Record<string, ParameterConfig[]>);

  const handleChange = (key: string, value: unknown) => {
    onChange({ ...args, [key]: value });
  };

  const isParamUsed = (key: string): boolean => {
    const value = args[key];
    return value !== undefined && value !== null && value !== '';
  };

  const renderValue = (param: ParameterConfig) => {
    const value = args[param.key];
    const isUsed = isParamUsed(param.key);

    if (!isUsed) {
      // Show default if available, otherwise "not set"
      if (param.default !== undefined) {
        return (
          <span className="text-gray-400">
            {String(param.default)} <span className="italic">(default)</span>
          </span>
        );
      }
      return <span className="text-gray-300 italic">not set</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-300 italic">none</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
              {String(v)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-600 font-medium' : 'text-gray-400'}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    return <span className="text-gray-900 font-medium">{String(value)}</span>;
  };

  const renderInput = (param: ParameterConfig) => {
    const value = args[param.key];

    switch (param.type) {
      case 'select':
        return (
          <select
            value={String(value || '')}
            onChange={(e) => handleChange(param.key, e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)]"
          >
            <option value="">Not set{param.default ? ` (default: ${param.default})` : ''}</option>
            {(param.options || selectOptions[param.key] || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? Number(value) : ''}
            onChange={(e) => handleChange(param.key, e.target.value ? Number(e.target.value) : undefined)}
            placeholder={param.default !== undefined ? `Default: ${param.default}` : undefined}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)]"
          />
        );

      case 'boolean':
        return (
          <button
            onClick={() => handleChange(param.key, !value)}
            className={`px-2 py-1 text-xs rounded ${
              value 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {value ? 'Yes' : 'No'}
          </button>
        );

      case 'date':
        return (
          <input
            type="date"
            value={String(value || '')}
            onChange={(e) => handleChange(param.key, e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)]"
          />
        );

      case 'array':
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : ''}
            onChange={(e) => {
              const arr = e.target.value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
              handleChange(param.key, arr.length > 0 ? arr : undefined);
            }}
            placeholder="Comma-separated values"
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)]"
          />
        );

      default:
        return (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => handleChange(param.key, e.target.value || undefined)}
            placeholder={param.description}
            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)]"
          />
        );
    }
  };

  // Get used and unused parameters
  const usedParams = availableParams.filter(p => isParamUsed(p.key));
  const unusedParams = availableParams.filter(p => !isParamUsed(p.key));
  const hasUnusedParams = unusedParams.length > 0;

  // Render a single parameter row
  const renderParamRow = (param: ParameterConfig, isUsed: boolean) => (
    <div 
      key={param.key} 
      className={`flex items-start gap-2 py-1 ${!isUsed ? 'opacity-50' : ''}`}
    >
      <dt className="text-xs font-medium text-gray-500 min-w-[110px] shrink-0 pt-0.5">
        {param.label}
        {param.required && <span className="text-red-400 ml-0.5">*</span>}:
      </dt>
      <dd className="flex-1 text-xs">
        {editMode && editable ? (
          renderInput(param)
        ) : (
          renderValue(param)
        )}
      </dd>
    </div>
  );

  // If no available params from metadata, fall back to displaying args directly
  if (availableParams.length === 0) {
    const displayArgs = Object.entries(args).filter(([, v]) => v !== undefined && v !== null);
    return (
      <div className="space-y-2">
        <dl className="space-y-1">
          {displayArgs.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <dt className="text-xs font-medium text-gray-500 min-w-[110px] shrink-0 pt-1">
                {key}:
              </dt>
              <dd className="flex-1 text-xs text-gray-900">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </dd>
            </div>
          ))}
        </dl>
        {displayArgs.length === 0 && (
          <p className="text-xs text-gray-400 italic">No parameters</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with edit toggle */}
      {editable && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditMode(!editMode);
              // If transitioning from edit mode to view mode, trigger done callback
              if (editMode && onDoneEditing) {
                onDoneEditing();
              }
            }}
            className="text-xs text-[var(--brand-default)] hover:underline"
          >
            {editMode ? 'Done editing' : 'Edit parameters'}
          </button>
        </div>
      )}

      {/* Render parameters grouped by section */}
      {sectionOrder.map(section => {
        const sectionParams = paramsBySection[section];
        if (!sectionParams || sectionParams.length === 0) return null;

        // In collapsed view, only show used params
        const paramsToShow = showAllParams || editMode 
          ? sectionParams 
          : sectionParams.filter(p => isParamUsed(p.key));
        
        if (paramsToShow.length === 0 && !showAllParams && !editMode) return null;

        return (
          <div key={section} className="space-y-1">
            <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {sectionLabels[section] || section}
            </h5>
            <dl className="space-y-0.5">
              {paramsToShow.map(param => renderParamRow(param, isParamUsed(param.key)))}
            </dl>
          </div>
        );
      })}

      {/* Toggle to show all available parameters */}
      {hasUnusedParams && !editMode && (
        <button
          onClick={() => setShowAllParams(!showAllParams)}
          className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          {showAllParams ? (
            <>
              <span>Hide unused parameters</span>
              <span className="text-gray-300">({unusedParams.length} hidden)</span>
            </>
          ) : (
            <>
              <span>Show all available parameters</span>
              <span className="text-gray-300">({unusedParams.length} more)</span>
            </>
          )}
        </button>
      )}

      {/* Show message if no params used */}
      {usedParams.length === 0 && !showAllParams && !editMode && (
        <p className="text-xs text-gray-400 italic">Using default parameters</p>
      )}
    </div>
  );
}
