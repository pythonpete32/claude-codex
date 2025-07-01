import { BashTool } from "@/components/tools/bash-tool";
import type { BashToolProps } from "@claude-codex/types";

// Sample fixture data from bash-tool-new.json
const sampleBashProps: BashToolProps = {
  id: "toolu_01YC53jvPk1RQ4MmDhkQUogS",
  uuid: "e8c7d3c3-2a78-4ac9-81cd-027d7ca9806f",
  parentUuid: "e8c7d3c3-2a78-4ac9-81cd-027d7ca9806f",
  timestamp: "2025-06-30T13:02:18.515Z",
  duration: 156,
  status: {
    normalized: "completed",
    original: "completed"
  },
  command: "echo \"Testing bash tool for log generation\"",
  output: "Testing bash tool for log generation",
  exitCode: 0,
  workingDirectory: "/Users/abuusama/Desktop/temp/test-data"
};

const sampleErrorBashProps: BashToolProps = {
  id: "toolu_02ErrorCommand123",
  uuid: "f9d8e4d4-3b89-5bca-92de-c738c851f762",
  timestamp: "2025-06-30T13:05:23.721Z",
  duration: 89,
  status: {
    normalized: "failed",
    original: "failed"
  },
  command: "ls /nonexistent/directory",
  output: "",
  errorOutput: "ls: /nonexistent/directory: No such file or directory",
  exitCode: 1,
  workingDirectory: "/Users/abuusama/Desktop/temp/test-data"
};

const sampleLongOutputProps: BashToolProps = {
  id: "toolu_03LongOutput456",
  uuid: "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6",
  timestamp: "2025-06-30T13:08:45.312Z",
  duration: 2340,
  status: {
    normalized: "completed",
    original: "completed"
  },
  command: "npm install --verbose",
  output: `Installing dependencies...
├─ react@18.2.0
├─ react-dom@18.2.0
├─ typescript@5.1.6
├─ @types/react@18.2.14
├─ @types/react-dom@18.2.7
└─ next@13.4.12

Added 1247 packages in 2.34s

npm notice created a lockfile as package-lock.json
npm notice save exact versions to package-lock.json`,
  exitCode: 0,
  workingDirectory: "/Users/abuusama/Desktop/temp/project"
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Claude Codex</h1>
          <p className="text-xl text-muted-foreground">
            DDD Architecture for Claude Code Tool Logs
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Bash Tool Examples</h2>
            <div className="space-y-6">
              
              {/* Successful command */}
              <div>
                <h3 className="text-lg font-medium mb-2 text-muted-foreground">✅ Successful Command</h3>
                <BashTool props={sampleBashProps} />
              </div>

              {/* Error command */}
              <div>
                <h3 className="text-lg font-medium mb-2 text-muted-foreground">❌ Failed Command</h3>
                <BashTool props={sampleErrorBashProps} />
              </div>

              {/* Long output command */}
              <div>
                <h3 className="text-lg font-medium mb-2 text-muted-foreground">📦 Long Output Command</h3>
                <BashTool props={sampleLongOutputProps} />
              </div>

            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
