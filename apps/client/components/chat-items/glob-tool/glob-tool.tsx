import React from 'react';
import { TerminalWindow } from '@/components/ui/terminal';

interface GlobMatch {
  filePath: string;
  isDirectory?: boolean;
}

export interface GlobToolProps {
  pattern: string;
  matches: GlobMatch[];
  command?: string;
  description?: string;
  status?: 'pending' | 'completed' | 'error';
  timestamp?: string;
  className?: string;
}

export const GlobTool: React.FC<GlobToolProps> = ({
  pattern,
  matches,
  command = `glob "${pattern}"`,
  description,
  status = 'completed',
  timestamp,
  className,
}) => {
  // Format glob output like terminal find/ls
  const formatGlobOutput = () => {
    const results: React.ReactNode[] = [];
    
    matches.forEach((match, index) => {
      const color = match.isDirectory ? 'text-blue-400' : 'text-gray-300';
      const suffix = match.isDirectory ? '/' : '';
      
      results.push(
        <div 
          key={index}
          className="font-mono text-sm hover:bg-gray-800/30 px-1"
        >
          <span className={color}>
            {match.filePath}{suffix}
          </span>
        </div>
      );
    });

    if (results.length === 0) {
      results.push(
        <div key="no-results" className="text-gray-500 italic">
          glob: no matches found for pattern "{pattern}"
        </div>
      );
    }

    return results;
  };

  const output = (
    <div className="space-y-0 max-h-80 overflow-y-auto">
      {formatGlobOutput()}
    </div>
  );

  const enhancedDescription = description || `Found ${matches.length} matches for pattern "${pattern}"`;

  return (
    <div className={className}>
      <TerminalWindow
        command={command}
        description={enhancedDescription}
        output={output}
        status={status}
        timestamp={timestamp}
        foldable={matches.length > 15}
        defaultFolded={matches.length > 30}
        maxHeight="400px"
      />
    </div>
  );
};