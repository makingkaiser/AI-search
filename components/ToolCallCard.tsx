'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  SlidersHorizontal, 
  Code, 
  Building2, 
  Globe,
  Copy,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getToolMetadata } from '@/lib/tools';
import { ParameterDisplay } from './ParameterDisplay';

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  onRerun?: (newArgs: Record<string, unknown>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  SlidersHorizontal,
  Code,
  Building2,
  Globe,
  Copy,
};

export function ToolCallCard({ 
  toolName, 
  args, 
  result, 
  status,
  onRerun 
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const [editedArgs, setEditedArgs] = useState(args);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Sync editedArgs when args prop changes (e.g., when tool input becomes available after streaming)
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setEditedArgs(args);
    }
  }, [args, hasUnsavedChanges]);
  
  const metadata = getToolMetadata(toolName);
  const IconComponent = iconMap[metadata.icon] || Search;

  const statusColors = {
    pending: 'text-gray-400',
    running: 'text-blue-500',
    completed: 'text-green-500',
    error: 'text-red-500',
  };

  const StatusIcon = {
    pending: () => <div className="w-4 h-4 rounded-full border-2 border-gray-300" />,
    running: () => <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
    completed: () => <CheckCircle className="w-4 h-4 text-green-500" />,
    error: () => <XCircle className="w-4 h-4 text-red-500" />,
  }[status];

  const handleRerun = () => {
    if (onRerun) {
      onRerun(editedArgs);
      setHasUnsavedChanges(false);
    }
  };

  const handleArgsChange = (newArgs: Record<string, unknown>) => {
    setEditedArgs(newArgs);
    setHasUnsavedChanges(true);
  };

  const handleDoneEditing = () => {
    // Auto-trigger re-run when done editing
    if (hasUnsavedChanges) {
      handleRerun();
    }
  };

  // Get the primary parameter to show in collapsed view
  const primaryParam = args.query || args.url || (args.urls as string[] | undefined)?.[0] || '';
  
  // Get key parameters summary for collapsed view
  const getParamsSummary = (): string[] => {
    const summary: string[] = [];
    if (args.type && args.type !== 'auto') summary.push(`type: ${args.type}`);
    if (args.category) summary.push(`category: ${args.category}`);
    if (args.numResults && args.numResults !== 5) summary.push(`results: ${args.numResults}`);
    if (args.includeDomains && (args.includeDomains as string[]).length > 0) {
      summary.push(`domains: ${(args.includeDomains as string[]).join(', ')}`);
    }
    if (args.startPublishedDate || args.endPublishedDate) {
      summary.push('date filter');
    }
    return summary;
  };
  
  const paramsSummary = getParamsSummary();

  // Category to color mapping
  const getCategoryColors = () => {
    switch (metadata.category) {
      case 'search':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'extract':
        return { bg: 'bg-orange-100', text: 'text-orange-600' };
      case 'similar':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'research':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };
  
  const categoryColors = getCategoryColors();

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        {/* Expand/Collapse chevron */}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
        
        {/* Tool icon */}
        <div className={`p-1.5 rounded-md ${categoryColors.bg}`}>
          <IconComponent className={`w-4 h-4 ${categoryColors.text}`} />
        </div>
        
        {/* Tool name, endpoint, and primary param */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900">
              {metadata.displayName}
            </span>
            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              {metadata.endpoint}
            </span>
            <StatusIcon />
          </div>
          {primaryParam && (
            <p className="text-xs text-gray-500 truncate">
              {String(primaryParam).slice(0, 60)}
              {String(primaryParam).length > 60 ? '...' : ''}
            </p>
          )}
          {/* Show params summary in collapsed view */}
          {!isExpanded && paramsSummary.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {paramsSummary.slice(0, 3).map((param, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  {param}
                </span>
              ))}
              {paramsSummary.length > 3 && (
                <span className="text-[10px] text-gray-400">+{paramsSummary.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        
        {/* Status text */}
        <span className={`text-xs ${statusColors[status]} shrink-0`}>
          {status === 'running' ? 'Searching...' : 
           status === 'completed' ? 'Done' : 
           status === 'error' ? 'Failed' : 'Pending'}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Parameters section */}
          <div className="px-4 py-3 bg-gray-50">
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              Parameters
            </h4>
            <ParameterDisplay 
              toolName={toolName}
              args={editedArgs}
              onChange={handleArgsChange}
              editable={status === 'completed' || status === 'error'}
              onDoneEditing={handleDoneEditing}
            />
            
            {/* Re-run button */}
            {onRerun && (status === 'completed' || status === 'error') && (
              <button
                onClick={handleRerun}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-[var(--brand-default)] border border-[var(--brand-default)] rounded-md hover:bg-[var(--brand-fainter)] transition-colors"
              >
                Re-run with changes
              </button>
            )}
          </div>

          {/* Result preview */}
          {result && (
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setIsResultExpanded(!isResultExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                {isResultExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span className="uppercase tracking-wide">Result Preview</span>
                <span className="text-gray-400 normal-case font-normal">
                  ({result.length.toLocaleString()} chars)
                </span>
              </button>
              
              {isResultExpanded && (
                <div className="mt-2 p-3 bg-gray-900 rounded-md overflow-auto max-h-64">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {result.slice(0, 2000)}
                    {result.length > 2000 && (
                      <span className="text-gray-500">
                        {'\n\n... truncated ({result.length - 2000} more characters)'}
                      </span>
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
