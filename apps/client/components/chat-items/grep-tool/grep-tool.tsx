import React from 'react';
import { TerminalWindow } from '@/components/ui/terminal';

interface SearchMatch {
  line: number;
  content: string;
  beforeContext?: string[];
  afterContext?: string[];
  matchStart: number;
  matchEnd: number;
}

interface FileMatch {
  filePath: string;
  matches: SearchMatch[];
  totalMatches: number;
}

export interface GrepToolProps {
  pattern: string;
  searchPath: string;
  fileMatches: FileMatch[];
  command?: string;
  description?: string;
  status?: 'pending' | 'completed' | 'error';
  timestamp?: string;
  onMatchClick?: (filePath: string, lineNumber: number) => void;
  className?: string;
}

export const GrepTool: React.FC<GrepToolProps> = ({
  pattern,
  searchPath,
  fileMatches,
  command = `grep -r "${pattern}" "${searchPath}"`,
  description,
  status = 'completed',
  timestamp,
  onMatchClick,
  className,
}) => {
  // Format grep output like terminal grep -n
  const formatGrepOutput = () => {
    const results: React.ReactNode[] = [];
    
    fileMatches.forEach(fileMatch => {
      fileMatch.matches.forEach(match => {
        const before = match.content.slice(0, match.matchStart);
        const matchText = match.content.slice(match.matchStart, match.matchEnd);
        const after = match.content.slice(match.matchEnd);
        
        results.push(
          <div 
            key={`${fileMatch.filePath}:${match.line}`}
            className="font-mono text-sm hover:bg-gray-800/30 px-1 cursor-pointer"
            onClick={() => onMatchClick?.(fileMatch.filePath, match.line)}
          >
            <span className="text-purple-400">{fileMatch.filePath}</span>
            <span className="text-gray-500">:</span>
            <span className="text-blue-400">{match.line}</span>
            <span className="text-gray-500">:</span>
            <span className="text-gray-300 ml-1">
              {before}
              <span className="bg-yellow-600 text-black px-1 rounded">
                {matchText}
              </span>
              {after}
            </span>
          </div>
        );
      });
    });

    if (results.length === 0) {
      results.push(
        <div key="no-results" className="text-gray-500 italic">
          grep: no matches found
        </div>
      );
    }

    return results;
  };

  const output = (
    <div className="space-y-0 max-h-80 overflow-y-auto">
      {formatGrepOutput()}
    </div>
  );

  const totalMatches = fileMatches.reduce((sum, file) => sum + file.totalMatches, 0);
  const enhancedDescription = description || `Found ${totalMatches} matches in ${fileMatches.length} files`;

  return (
    <div className={className}>
      <TerminalWindow
        command={command}
        description={enhancedDescription}
        output={output}
        status={status}
        timestamp={timestamp}
        foldable={totalMatches > 10}
        defaultFolded={totalMatches > 20}
        maxHeight="400px"
      />
    </div>
  );
};