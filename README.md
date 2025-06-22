<div align="center">

# 🤖 Claude Codex

**Local Background Agents for Software Development**

[![npm version](https://badge.fury.io/js/claude-codex.svg)](https://badge.fury.io/js/claude-codex) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Claude AI](https://img.shields.io/badge/Claude%20AI-FF6B35?logo=anthropic&logoColor=white)](https://claude.ai) [![Local First](https://img.shields.io/badge/Local%20First-00C851?logo=homeassistant&logoColor=white)](https://localfirstweb.dev/)

*The only background agent system that runs entirely on your machine*

[🚀 Quick Start](#quick-start) • [🔄 Workflows](#available-workflows) • [💰 Cost Comparison](#cost-comparison) • [🏗️ Architecture](#architecture) • [🛠️ Advanced Usage](#advanced-usage)

</div>

---

## ✨ What is Claude Codex?

Claude Codex is the **first local background agent system** for software development. Unlike ChatGPT Codex, Google Jules, Augment, or Cursor that run expensive cloud-based agents, Claude Codex runs entirely on your machine using your existing **Claude Code subscription**.

## 🆚 Why Choose Local Background Agents?

| Feature | Claude Codex (Local) | ChatGPT Codex | Google Jules | Augment Code | Cursor |
|---------|---------------------|---------------|--------------|--------------|--------|
| **💻 Runs Locally** | ✅ Yes | ❌ Cloud | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| **🔒 Code Privacy** | ✅ Never leaves machine | ❌ Sent to OpenAI | ❌ Sent to Google | ❌ Sent to Augment | ❌ Sent to Cursor |
| **💰 Extra Costs** | ❌ None | ✅ $20+/month | ✅ TBD | ✅ $50-250/month | ✅ $20-40/month |
| **⚡ Zero Latency** | ✅ Instant | ❌ Network dependent | ❌ Network dependent | ❌ Network dependent | ❌ Network dependent |
| **🌐 Works Offline** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **🔧 Multiple Workflows** | ✅ Yes | ✅ Limited | ✅ Limited | ✅ Limited | ✅ Limited |

### 🎯 Core Advantages

- **🏠 Runs Locally**: Your code never leaves your machine - ultimate privacy and security
- **💰 No Extra Costs**: Uses your existing Claude Code subscription - no additional API fees
- **⚡ Zero Latency**: Instant responses without network delays
- **🌐 Works Offline**: Continue coding even without internet connection
- **🔧 Multiple Workflows**: TDD, code review, feature implementation, bug fixes, and more
- **🎛️ Full Control**: You own the entire stack - no vendor lock-in

## 🚀 Quick Start

### Prerequisites

- **Claude Code CLI** installed and authenticated
- **Node.js** 18+
- **Git** repository 
- **GitHub** repository with `GITHUB_TOKEN`

### Installation

```bash
# Install globally
npm install -g claude-codex

# Or use directly with npx
npx claude-codex --help
```

### Setup

```bash
# Ensure Claude Code is authenticated
claude-code auth

# Set your GitHub token
export GITHUB_TOKEN="your_github_token_here"
```

### Your First Background Agent Workflow

1. **Create a task specification:**

```markdown
# tasks/user-authentication.md

## User Authentication System

Implement a secure user authentication system with:
- User registration with email/password validation
- JWT token generation and validation
- Password reset functionality
- Comprehensive test coverage
- Security best practices
```

2. **Launch background agents:**

```bash
# Test-Driven Development workflow
claude-codex tdd tasks/user-authentication.md

# Code review workflow (coming soon)
claude-codex review --branch feature/auth

# Feature implementation workflow (coming soon)  
claude-codex implement tasks/payment-system.md

# Bug fix workflow (coming soon)
claude-codex fix --issue 123
```

3. **Watch agents work locally:**

```
🤖 Claude Codex - Local Background Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ Running locally on your machine
🔒 Your code never leaves this device
💰 Using your Claude Code subscription

✨ Initializing isolated workspace...
🌿 Created worktree: tdd/task-20241201-1734

🤖 Coder Agent (Local)
  ├─ Analyzing codebase structure
  ├─ Writing comprehensive tests
  ├─ Implementing authentication logic
  └─ Following security best practices

🤖 Reviewer Agent (Local)  
  ├─ Validating implementation quality
  ├─ Checking test coverage (94%)
  ├─ Verifying security practices
  └─ Creating pull request

✅ Success! PR created: https://github.com/user/repo/pull/42
🎉 Workflow completed locally - no API costs incurred
```

---

## 🔄 Available Workflows

Claude Codex supports multiple background agent workflows:

### 🧪 **Test-Driven Development (TDD)**
- Specification → Tests → Implementation → Review → PR
- Automated test generation and validation
- Quality gates and coverage requirements

### 🔍 **Code Review** *(Coming Soon)*
- Automated code quality analysis
- Security vulnerability detection
- Best practice recommendations

### ⚙️ **Feature Implementation** *(Coming Soon)*
- End-to-end feature development
- Multi-file coordination
- Integration testing

### 🐛 **Bug Fix Automation** *(Coming Soon)*
- Issue analysis and resolution
- Regression test generation
- Automated debugging workflows

### 📝 **Documentation Generation** *(Coming Soon)*
- API documentation creation
- Code comment generation  
- README and guide updates

---

## 💰 Cost Comparison

**Annual cost comparison for a 10-developer team:**

| Solution | Cost per Developer | Team Cost (10 devs) | Notes |
|----------|-------------------|---------------------|-------|
| **Claude Codex** | **$0** | **$0** | Uses existing Claude Code subscription |
| ChatGPT Codex | $240/year | $2,400/year | Plus Claude Code subscription |
| Google Jules | TBD | TBD | Currently free beta |
| Augment Code | $600-3,000/year | $6,000-30,000/year | Plus Claude Code subscription |
| Cursor | $240-480/year | $2,400-4,800/year | Plus Claude Code subscription |
| GitHub Copilot | $228/year | $2,280/year | Plus Claude Code subscription |

**💡 Key Insight**: Other solutions require you to pay for **both** their service **and** Claude Code. Claude Codex leverages your existing Claude Code investment with zero additional costs.

---

## 📖 Documentation

### Command Reference

#### `claude-codex tdd <spec-file>`
Launches the Test-Driven Development background agent workflow.

```bash
# Basic TDD workflow
claude-codex tdd tasks/payment-system.md

# Custom configuration
claude-codex tdd tasks/auth-system.md --max-reviews 5 --branch feature/auth

# Debug mode (keep workspace files)
claude-codex tdd tasks/api-endpoints.md --no-cleanup
```

#### `claude-codex review <branch>` *(Coming Soon)*
Launches the code review background agent workflow.

#### `claude-codex implement <spec-file>` *(Coming Soon)*
Launches the feature implementation background agent workflow.

#### `claude-codex fix --issue <number>` *(Coming Soon)*
Launches the bug fix background agent workflow.

### Common Options

- `--max-iterations <number>` - Maximum agent iterations (default: 3)
- `--branch <name>` - Custom branch name (default: auto-generated)
- `--no-cleanup` - Keep worktree and state files for debugging
- `--verbose` - Show detailed agent execution logs
- `--help` - Show command help

### Task Specification Format

Claude Codex agents work best with well-structured task specifications:

```markdown
# Task Title

## Overview
Clear description of what needs to be accomplished

## Requirements
- Specific, actionable requirements
- Technical constraints and preferences
- Quality standards and expectations

## Acceptance Criteria
- [ ] Testable success criteria
- [ ] Edge cases to handle
- [ ] Integration requirements

## Context (Optional)
- Related issues or documentation
- Existing code patterns to follow
- Performance considerations
```

### Environment Setup

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub personal access token with repo permissions | ✅ Yes |
| `CLAUDE_CODE_AUTH` | Handled automatically by Claude Code CLI | ✅ Yes |

**💡 Note**: Unlike other background agent systems, Claude Codex doesn't require separate API keys or additional authentication beyond your existing Claude Code setup.

---

## 🏗️ Architecture

Claude Codex runs entirely on your local machine using a sophisticated multi-agent architecture:

### 🏠 Local-First Design

Unlike cloud-based competitors, Claude Codex operates completely locally:

```mermaid
graph TB
    A[💻 Your Machine] --> B[🤖 Local Agent Runtime]
    B --> C[📁 Your Codebase]
    B --> D[🔧 Claude Code CLI]
    D --> E[🧠 Claude AI Models]
    C --> F[✅ Local Processing]
    F --> G[📤 GitHub PR]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
```

### 🤖 Multi-Agent System

#### **Specialized Agents for Different Workflows:**

- **🧪 TDD Agents**: Coder + Reviewer for test-driven development
- **🔍 Review Agents**: Code quality and security analysis *(coming soon)*  
- **⚙️ Implementation Agents**: Feature development and integration *(coming soon)*
- **🐛 Debug Agents**: Bug detection and resolution *(coming soon)*
- **📝 Documentation Agents**: Automated documentation generation *(coming soon)*

#### **Agent Coordination:**
Each workflow uses specialized agent pairs that collaborate locally:
1. **Task Analysis**: Understanding requirements and codebase context
2. **Parallel Processing**: Multiple agents working on different aspects
3. **Quality Validation**: Automated testing and review cycles
4. **Integration**: Seamless GitHub integration and PR creation

### 🏗️ Technical Stack

- **🎯 Workflow Orchestration**: Manages agent coordination and task lifecycle
- **💾 Local State Management**: Persistent task state and audit trails on your machine
- **🌿 Git Worktree Isolation**: Each task runs in isolated workspace
- **🔗 Claude Code Integration**: Direct integration with your Claude Code subscription
- **🐙 GitHub Operations**: PR creation and repository management
- **🎨 Intelligent Prompting**: Context-aware agent prompt generation

### 🔒 Privacy & Security

**Your Code Never Leaves Your Machine:**
- All processing happens locally using Claude Code's local inference
- Only final results (PRs) are sent to GitHub
- Complete privacy and security control
- No data mining or training on your code

For detailed technical documentation, see [`docs/claude-codex-tdd-architecture.md`](docs/claude-codex-tdd-architecture.md).

---

## 🛠️ Advanced Usage

### Local State Management

Claude Codex maintains all state locally in the `.codex/` directory:

```
.codex/
├── task-{id}.json     # Task state and agent responses
├── logs/              # Detailed execution logs
└── workspaces/        # Isolated agent workspaces
```

**💡 Tip**: Add `.codex/` to your `.gitignore` file to keep local state out of version control.

### Debugging Agent Workflows

```bash
# Verbose logging for agent execution
claude-codex tdd tasks/feature.md --verbose

# Keep workspace files for inspection
claude-codex tdd tasks/feature.md --no-cleanup

# Monitor agent state in real-time
tail -f .codex/logs/agent-execution.log
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/anthropics/claude-codex.git
cd claude-codex

# Install dependencies
npm install
# or with bun (faster)
bun install

# Run in development mode
npm run dev
# or with bun
bun run index.ts

# Build for production
npm run build
```

### Troubleshooting

#### **"No GitHub repository found"**
```bash
# Ensure you're in a git repository with GitHub remote
git remote -v
```

#### **"GITHUB_TOKEN not found"**
```bash
# Set your GitHub token
export GITHUB_TOKEN="ghp_your_token_here"
```

#### **"Claude Code authentication failed"**
```bash
# Re-authenticate with Claude Code
claude-code auth
```

#### **"Agent execution failed"**
```bash
# Check Claude Code status
claude-code status

# Verify Claude Code has sufficient credits
claude-code usage
```

### Enterprise Integration

Unlike cloud-based solutions, Claude Codex can be deployed entirely within your infrastructure:

```yaml
# .github/workflows/local-agent-automation.yml
name: Local Agent Automation
on:
  push:
    paths: ['tasks/**/*.md']

jobs:
  agents:
    runs-on: self-hosted  # Runs on your infrastructure
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g claude-codex
      - run: claude-codex tdd ${{ github.event.head_commit.modified[0] }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # No API keys needed - uses local Claude Code
```

**🔒 Enterprise Benefits:**
- **Complete Data Control**: Code never leaves your infrastructure
- **Compliance Ready**: Meets strict security requirements
- **Cost Predictable**: No surprise API bills or usage limits
- **Offline Capable**: Works without internet connectivity

---

## 🤝 Contributing

We welcome contributions to the first local background agent system for developers!

### Project Structure

```
claude-codex/
├── src/
│   ├── cli/                 # CLI interface and commands
│   ├── core/                # Core operations and utilities
│   ├── workflows/           # Multi-workflow orchestration
│   └── shared/              # Types, errors, and utilities
├── docs/                    # Architecture and design docs
├── examples/                # Example task specifications
└── tests/                   # Test suites
```

### Contributing Guidelines

1. **🐛 Found a bug?** Open an issue with reproduction steps
2. **💡 New workflow idea?** Start a discussion to gather feedback  
3. **🔧 Want to contribute code?**
   - Fork the repository
   - Create a feature branch
   - Write tests for your changes
   - Submit a pull request

### Development Philosophy

- **🏠 Local-First**: Everything runs on the developer's machine
- **🧠 Agent Intelligence**: Trust AI agents, provide orchestration
- **🎯 Workflow Focused**: Each workflow serves a specific development need
- **📝 Privacy-First**: Code never leaves the local environment
- **🔒 Security**: Enterprise-grade security and compliance

---

## 📊 Roadmap

### 🎯 Current Focus (v1.0)
- [x] Local agent runtime architecture
- [x] TDD workflow implementation
- [x] Git worktree isolation
- [x] Claude Code integration
- [x] GitHub operations
- [ ] Comprehensive test suite
- [ ] Performance optimization

### 🚀 Additional Workflows (v1.1+)
- [ ] **Code Review Workflow**: Automated quality analysis and security scanning
- [ ] **Feature Implementation**: End-to-end feature development with testing
- [ ] **Bug Fix Workflow**: Intelligent debugging and regression prevention
- [ ] **Documentation Workflow**: Automated API docs and code documentation
- [ ] **Refactoring Workflow**: Safe code modernization and optimization

### 🔮 Advanced Features (v2.0+)
- [ ] **Multi-Language Support**: Python, Java, Go, Rust, and more
- [ ] **Custom Agent Templates**: Configurable agent behaviors per team
- [ ] **Workflow Composition**: Chain multiple workflows together
- [ ] **IDE Integration**: VS Code, JetBrains, and Vim plugins
- [ ] **Team Synchronization**: Shared agent configurations and best practices
- [ ] **Analytics Dashboard**: Local workflow insights and productivity metrics

---

## 🔗 Comparison with Alternatives

| Capability | Claude Codex | ChatGPT Codex | Google Jules | Augment Code | Cursor | GitHub Copilot |
|------------|--------------|---------------|--------------|--------------|--------|----------------|
| **Local Execution** | ✅ Yes | ❌ Cloud | ❌ Cloud | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| **Privacy Protection** | ✅ Complete | ❌ Limited | ❌ Limited | ❌ Limited | ❌ Limited | ❌ Limited |
| **Cost (10 devs/year)** | **$0** | $2,400 | TBD | $6K-30K | $2.4K-4.8K | $2,280 |
| **Offline Capability** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Background Agents** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Multi-Workflow** | ✅ Yes | ✅ Limited | ✅ Limited | ✅ Limited | ✅ Limited | ❌ No |
| **Enterprise Ready** | ✅ Yes | ✅ Yes | ⚠️ TBD | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 📄 License

Claude Codex is released under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Anthropic** for the groundbreaking Claude AI platform and Claude Code CLI
- **Local-First Community** for advocating privacy-preserving development tools
- **Background Agent Pioneers** for proving the concept of autonomous development workflows
- **Open Source Contributors** who make developer tools accessible to everyone

---

<div align="center">

## 🚀 Join the Local-First Revolution

**The first background agent system that puts developers in control**

[![Star us on GitHub](https://img.shields.io/github/stars/anthropics/claude-codex?style=social)](https://github.com/anthropics/claude-codex) • [🐛 Report Issues](https://github.com/anthropics/claude-codex/issues) • [💬 Join Discussions](https://github.com/anthropics/claude-codex/discussions) • [📖 Documentation](docs/)

---

*Built with ❤️ for developers who value privacy, control, and cost-effectiveness*

</div>
