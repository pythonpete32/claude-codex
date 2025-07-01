"use client";

import { type BashToolProps } from "@claude-codex/types";
import { cn } from "@/lib/utils";
import { Terminal } from "@/components/magicui/terminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Terminal as TerminalIcon, Clock, FolderOpen } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface BashToolComponentProps {
  props: BashToolProps;
}

const StatusBadge = ({ status }: { status: BashToolProps["status"] }) => {
  const variant = {
    completed: "default",
    failed: "destructive", 
    running: "secondary",
    pending: "outline",
    interrupted: "secondary",
    unknown: "outline"
  }[status.normalized] as "default" | "destructive" | "secondary" | "outline";

  const color = {
    completed: "text-green-600 dark:text-green-400",
    failed: "text-red-600 dark:text-red-400",
    running: "text-yellow-600 dark:text-yellow-400", 
    pending: "text-gray-600 dark:text-gray-400",
    interrupted: "text-orange-600 dark:text-orange-400",
    unknown: "text-gray-600 dark:text-gray-400"
  }[status.normalized];

  return (
    <Badge variant={variant} className={cn("text-xs", color)}>
      {status.normalized}
    </Badge>
  );
};

const CopyButton = ({ text, className }: { text: string; className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={cn("h-8 px-2", className)}
    >
      <Copy className="h-4 w-4" />
      {copied && <span className="ml-1 text-xs">Copied!</span>}
    </Button>
  );
};

export const BashTool = ({ props }: BashToolComponentProps) => {
  const {
    id,
    timestamp,
    duration,
    status,
    command,
    output,
    exitCode,
    workingDirectory,
    errorOutput,
    interrupted,
    showCopyButton = true,
    showPrompt = true,
    promptText = "$"
  } = props;

  const isSuccess = status.normalized === "completed" && exitCode === 0;
  const isError = status.normalized === "failed" || (exitCode !== undefined && exitCode !== 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Bash Command</CardTitle>
              </div>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{duration}ms</span>
                </div>
              )}
              {workingDirectory && (
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{workingDirectory}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Command Input */}
          <div className="mt-3">
            <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Command
            </CardDescription>
            <div className="relative">
              <div className="flex items-center bg-muted/50 rounded-lg p-3 font-mono text-sm">
                {showPrompt && (
                  <span className="text-green-600 dark:text-green-400 mr-2 select-none">
                    {promptText}
                  </span>
                )}
                <code className="flex-1">{command}</code>
                {showCopyButton && (
                  <CopyButton text={command} className="ml-2" />
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Output Terminal */}
          {(output || errorOutput) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                  Output
                </CardDescription>
                {showCopyButton && output && (
                  <CopyButton text={output} />
                )}
              </div>
              
              <Terminal className={cn(
                "w-full",
                isError && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
                isSuccess && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
              )}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {errorOutput && (
                    <div className="text-red-400 dark:text-red-300 mb-2">
                      {errorOutput.split('\n').map((line, i) => (
                        <div key={`error-${i}-${line.substring(0, 10)}`}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  )}
                  
                  {output && (
                    <div className={cn(
                      "whitespace-pre-wrap",
                      isError ? "text-red-300" : "text-foreground"
                    )}>
                      {output.split('\n').map((line, i) => (
                        <motion.div
                          key={`output-${i}-${line.substring(0, 10)}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          {line || '\u00A0'}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </Terminal>
            </div>
          )}

          {/* Status Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>ID: {id}</span>
              {exitCode !== undefined && (
                <span className={cn(
                  "flex items-center gap-1",
                  exitCode === 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  Exit Code: {exitCode}
                </span>
              )}
              {interrupted && (
                <Badge variant="secondary" className="text-xs">
                  Interrupted
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};