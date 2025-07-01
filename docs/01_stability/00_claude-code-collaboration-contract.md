# Agent Collaboration Contract & Template Scaffold

**PURPOSE**: Lightweight contract and scaffold for structured human-AI agent collaboration  
**VERSION**: 1.0  
**CREATED**: 2025-06-30  
**CURRENT AGENT**: Claude Code 

## The Problem with "Vibe Coding"

### Current State
- **Vibe coding** is fun and immediate, but becomes unmaintainable at scale
- Code decisions are made without human partnership or understanding
- Humans lose ownership and knowledge of their own codebase
- Long-term maintainability suffers when humans can't understand the code

### The Reality
- **Modern AI agents are better programmers than 90%+ of developers** at writing code
- **But** agents are not great at long-term, long-horizon thinking
- **The code is still YOUR code** - you must own and understand it
- **Collaboration beats pure automation** for building maintainable systems

## The Vision: Lightweight Collaboration Scaffold

### Core Components
```
agent-collaboration-template/
├── /commands/                # 2-3 essential slash commands
├── CLAUDE.md                 # Project-specific AI agent instructions
└── docs/work-template/       # Collaboration templates
    ├── collaboration-contract.md
    ├── architectural-design-template.md
    └── implementation-tracking-template.md
```

### Design Principles
- **Lightweight & Unopinionated**: Minimal structure that grows organically
- **Contract-Based**: Clear shared understanding between human and AI
- **Ownership-Focused**: Human maintains code ownership and understanding
- **Collaborative**: Partner with AI agent, don't delegate to AI agent

## The Human-Agent Collaboration Contract

### 🔍 **Rule #1: Review Every Single Change**
- **MUST look at every file the agent changes or creates**
- Don't need to read every line in super detail, but review every chunk
- Keep iterations small: **Max 20 files per review cycle**
- This is especially critical when first starting with a codebase

### ❓ **Rule #2: Stay Inquisitive**
- **Ask questions when you don't understand something**
- If code doesn't look right or smell right, speak up
- When the agent explains something you don't grasp, ask qualifying questions
- **Always refer back to the objective** - does this serve our goal?

### 📋 **Rule #3: Understand the Plan Before Coding**
- Review and approve architectural decisions before implementation
- Break down complex tasks into reviewable chunks
- Maintain shared understanding of the approach and reasoning

### 🎯 **Rule #4: Maintain Context and Ownership**
- Keep track of decisions and why they were made
- Document deviations and architectural changes
- Learn as you go - this is YOUR code

## Template Structure & Usage

### Minimal Scaffold Components

#### 1. Essential Slash Commands 
```bash
# Example commands for organic development
/plan    # Collaborative planning session
/review  # Code review and discussion
/track   # Progress tracking and status
```

#### 2. CLAUDE.md Configuration
- Project-specific instructions for the AI agent
- Coding standards and architectural preferences
- Essential commands and workflows
- Context about the codebase and objectives

#### 3. Work Templates
- **Collaboration Contract**: This document
- **Architectural Design**: Systematic design template
- **Implementation Tracking**: Progress and decision tracking

### Growing the Scaffold Organically
- **Start minimal**: Use basic templates and 2-3 commands
- **Evolve naturally**: Add components as needed for your workflow
- **Stay personal**: Customize to your working style and project needs
- **Keep it simple**: Resist the urge to over-engineer the process

## Collaboration Workflow

### 1. **Planning Phase**
```
Human: Reviews objective and constraints
↓
Collaborative: Discuss approach and architecture
↓
Agent: Proposes technical implementation plan
↓
Human: Reviews, questions, and approves plan
```

### 2. **Implementation Phase**
```
Agent: Implements code in small, reviewable chunks
↓
Human: Reviews every change (≤20 files per iteration)
↓
Human: Asks questions about anything unclear
↓
Both: Adjust approach based on learnings
↓
Repeat: Continue with next chunk
```

### 3. **Ownership Phase**
```
Human: Understands all code changes and decisions
↓
Human: Can explain and maintain the implemented solution  
↓
Human: Commits and pushes code they understand and own
```

## Success Indicators

### ✅ **Good Collaboration**
- Human can explain every major architectural decision
- Human understands the purpose of each component/file
- Code quality remains high and maintainable
- Both human and agent contribute their strengths

### ❌ **Poor Collaboration**  
- Human doesn't understand large portions of the codebase
- Decisions were made without human input or approval
- Code review cycles are too large or infrequent
- Human feels disconnected from their own code

## Implementation Guidelines

### Starting a New Project
1. **Copy this template** to your project directory
2. **Customize CLAUDE.md** with project-specific context
3. **Begin with collaborative planning** using the design template  
4. **Establish review cadence** (small, frequent iterations)
5. **Stay inquisitive** throughout the process

### For Existing Projects
1. **Audit current understanding** - what don't you know about your code?
2. **Implement review process** for all future changes
3. **Document architectural decisions** you've already made
4. **Start asking questions** about code you don't understand

## Anti-Patterns to Avoid

### 🚫 **The "Magic Box" Anti-Pattern**
- Agent writes large amounts of code without human review
- Human doesn't understand the implementation approach
- Changes are committed without proper understanding

### 🚫 **The "Speed Over Understanding" Anti-Pattern**  
- Prioritizing fast iteration over code comprehension
- Skipping review cycles to move faster
- Accepting code changes without questioning the approach

### 🚫 **The "Delegation Without Partnership" Anti-Pattern**
- Not participating in architectural decisions
- Losing ownership of the codebase

## Key Insights

### On AI Agent Capabilities
- **AI agents excel at**: Code implementation, pattern matching, syntax, debugging
- **AI agents struggle with**: Long-term horizon execution, business context
- **Humans excel at**: System thinking, business requirements, long-term maintainability, ownership

### On Code Ownership
- **Your code is YOUR code** regardless of who wrote it
- **Understanding is ownership** - if you can't explain it, you don't own it
- **Partnership preserves ownership** while leveraging AI agent capabilities

### On Sustainable Development
- **Speed without understanding creates technical debt**
- **Small, reviewed iterations beat large, unchecked changes**
- **Questions and curiosity prevent future maintenance nightmares**

---

**This contract establishes the foundation for productive, sustainable collaboration between humans and AI agents, ensuring both leverage their strengths while maintaining code ownership and understanding.**