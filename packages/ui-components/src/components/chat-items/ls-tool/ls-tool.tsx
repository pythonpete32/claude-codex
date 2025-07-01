import React from 'react';
import { TerminalWindow } from '@/components/ui/terminal';
import { cn } from '@/lib/utils';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  permissions?: string;
  modified?: string;
  hidden?: boolean;
  extension?: string;
}

export interface LsToolProps {
  path: string;
  files: FileItem[];
  command?: string;
  description?: string;
  status?: 'pending' | 'completed' | 'error';
  timestamp?: string;
  showHidden?: boolean;
  onPathClick?: (path: string) => void;
  onFileClick?: (file: FileItem) => void;
  className?: string;
}



const getFileColor = (file: FileItem) => {
  if (file.type === 'directory') {
    return 'text-blue-400';
  }
  
  const ext = file.extension?.toLowerCase();
  switch (ext) {
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
    case '.py':
    case '.java':
    case '.cpp':
    case '.c':
    case '.go':
    case '.rs':
      return 'text-green-400';
    case '.txt':
    case '.md':
    case '.json':
    case '.yaml':
    case '.yml':
      return 'text-gray-400';
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.svg':
      return 'text-purple-400';
    case '.mp4':
    case '.mov':
    case '.avi':
      return 'text-red-400';
    case '.mp3':
    case '.wav':
    case '.flac':
      return 'text-orange-400';
    case '.zip':
    case '.tar':
    case '.gz':
      return 'text-amber-400';
    default:
      return 'text-gray-500';
  }
};

export const LsTool: React.FC<LsToolProps> = ({
  path,
  files,
  command = `ls -la "${path}"`,
  description,
  status = 'completed',
  timestamp,
  showHidden = false,
  onFileClick,
  className,
}) => {
  const visibleFiles = files.filter(file => showHidden || !file.hidden);
  const directories = visibleFiles.filter(f => f.type === 'directory').sort((a, b) => a.name.localeCompare(b.name));
  const regularFiles = visibleFiles.filter(f => f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
  const sortedFiles = [...directories, ...regularFiles];

  // Format file listing like terminal ls -la output
  const formatLsOutput = () => {
    
    return sortedFiles.map(file => {
      const permissions = file.permissions || (file.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--');
      const size = file.size ? file.size.toString().padStart(8) : '     -';
      const modified = file.modified || 'Jan  1 12:00';
      const name = file.name;
      const color = getFileColor(file);
      
      return (
        <div 
          key={file.name}
          className={cn(
            "hover:bg-gray-800/50 px-1 cursor-pointer font-mono",
            file.hidden && "opacity-60"
          )}
          onClick={() => onFileClick?.(file)}
        >
          <span className="text-gray-400">{permissions}</span>
          <span className="text-gray-500 ml-3">{size}</span>
          <span className="text-gray-500 ml-3">{modified}</span>
          <span className={cn("ml-3", color)}>{name}</span>
          {file.type === 'directory' && <span className={color}>/</span>}
        </div>
      );
    });
  };

  const output = (
    <div className="space-y-0">
      {formatLsOutput()}
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
        foldable={sortedFiles.length > 10}
        defaultFolded={sortedFiles.length > 20}
        maxHeight="300px"
      />
    </div>
  );
};