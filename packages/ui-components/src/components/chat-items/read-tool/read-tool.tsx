import React from 'react';
import { TerminalWindow } from '@/components/ui/terminal';

export interface ReadToolProps {
  filePath: string;
  content: string;
  command?: string;
  description?: string;
  status?: 'pending' | 'completed' | 'error';
  timestamp?: string;
  totalLines?: number;
  startLine?: number;
  endLine?: number;
  fileSize?: number;
  isBinary?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

export const ReadTool: React.FC<ReadToolProps> = ({
  filePath,
  content,
  command = `cat "${filePath}"`,
  description,
  status = 'completed',
  timestamp,
  totalLines,
  startLine = 1,
  endLine,
  fileSize,
  isBinary = false,
  showLineNumbers = true,
  className,
}) => {
  if (isBinary) {
    const output = (
      <div className="text-center py-4">
        <div className="text-red-400 mb-2">cat: {filePath.split('/').pop()}: binary file matches</div>
        <div className="text-gray-500">Binary file - cannot display content</div>
        {fileSize && (
          <div className="text-gray-500 text-sm mt-1">
            File size: {Math.round(fileSize / 1024)} KB
          </div>
        )}
      </div>
    );

    return (
      <div className={className}>
        <TerminalWindow
          command={command}
          description={description}
          output={output}
          status={status}
          timestamp={timestamp}
          foldable={false}
        />
      </div>
    );
  }

  // Format content with line numbers like cat -n
  const formatCatOutput = () => {
    const lines = content.split('\n');
    const effectiveStartLine = startLine || 1;
    
    return lines.map((line, index) => {
      const lineNumber = effectiveStartLine + index;
      const paddedLineNumber = lineNumber.toString().padStart(6, ' ');
      
      return (
        <div 
          key={index}
          className="font-mono text-sm hover:bg-gray-800/30 px-1"
        >
          {showLineNumbers && (
            <span className="text-gray-500 select-none mr-2">
              {paddedLineNumber}
            </span>
          )}
          <span className="text-gray-300 whitespace-pre-wrap">{line}</span>
        </div>
      );
    });
  };

  const output = (
    <div className="space-y-0 max-h-80 overflow-y-auto">
      {formatCatOutput()}
      {endLine && totalLines && totalLines > (endLine - startLine + 1) && (
        <div className="text-gray-500 text-sm mt-2 px-1">
          ... ({totalLines - (endLine - startLine + 1)} more lines)
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <TerminalWindow
        command={command}
        description={description}
        output={output}
        status={status}
        timestamp={timestamp}
        foldable={content.split('\n').length > 20}
        defaultFolded={content.split('\n').length > 50}
        maxHeight="400px"
      />
    </div>
  );
};