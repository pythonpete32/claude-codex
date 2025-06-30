# Claude Code Tools Documentation

## Built-in Tools

### Core Development Tools

#### Task
- **Description**: Launch a new agent that has access to comprehensive tool suite for searches and research
- **Purpose**: Perform complex searches, file exploration, and research tasks autonomously
- **Usage**: When searching for keywords, files, or patterns across large codebases
- **Parameters**: description, prompt

#### Bash
- **Description**: Execute bash commands in persistent shell session
- **Purpose**: Run system commands, git operations, build processes, tests
- **Parameters**: command, description (optional), timeout (optional)
- **Features**: 
  - Persistent shell session
  - Proper path quoting for spaces
  - Git integration for commits and PRs
  - GitHub CLI support

### File Management Tools

#### Read
- **Description**: Read files from local filesystem
- **Purpose**: Access and view file contents
- **Parameters**: file_path, limit (optional), offset (optional)
- **Features**:
  - Supports images (PNG, JPG, etc.)
  - Line-numbered output
  - Handles large files with offset/limit
  - Screenshot reading capability

#### Write
- **Description**: Write content to files
- **Purpose**: Create new files or overwrite existing ones
- **Parameters**: file_path, content
- **Requirements**: Must read existing files before overwriting

#### Edit
- **Description**: Perform exact string replacements in files
- **Purpose**: Make precise edits to existing files
- **Parameters**: file_path, old_string, new_string, replace_all (optional)
- **Requirements**: Must read file before editing

#### MultiEdit
- **Description**: Make multiple edits to single file in one operation
- **Purpose**: Efficiently perform multiple find-and-replace operations
- **Parameters**: file_path, edits (array of edit objects)
- **Features**: Atomic operations - all edits succeed or none apply

### Search and Discovery Tools

#### Glob
- **Description**: Fast file pattern matching with glob patterns
- **Purpose**: Find files by name patterns
- **Parameters**: pattern, path (optional)
- **Examples**: "**/*.js", "src/**/*.ts"

#### Grep
- **Description**: Fast content search using regular expressions
- **Purpose**: Find files containing specific patterns
- **Parameters**: pattern, path (optional), include (optional)
- **Features**: Full regex support, file filtering

#### LS
- **Description**: List files and directories
- **Purpose**: Directory exploration
- **Parameters**: path, ignore (optional)
- **Requirements**: Must use absolute paths

### Jupyter Notebook Tools

#### NotebookRead
- **Description**: Read Jupyter notebook files (.ipynb)
- **Purpose**: Access notebook cells and outputs
- **Parameters**: notebook_path, cell_id (optional)

#### NotebookEdit
- **Description**: Edit Jupyter notebook cells
- **Purpose**: Modify notebook content
- **Parameters**: notebook_path, new_source, cell_id (optional), cell_type (optional), edit_mode (optional)
- **Modes**: replace, insert, delete

### Task Management Tools

#### TodoRead
- **Description**: Read current todo list for session
- **Purpose**: Track task progress and status
- **Parameters**: None
- **Usage**: Should be used frequently to maintain task awareness

#### TodoWrite
- **Description**: Create and manage structured task lists
- **Purpose**: Organize complex tasks and track progress
- **Parameters**: todos (array of todo objects)
- **Features**: Status tracking (pending, in_progress, completed), priority levels

### Web and Network Tools

#### WebFetch
- **Description**: Fetch and analyze web content
- **Purpose**: Retrieve and process web pages
- **Parameters**: url, prompt
- **Features**: HTML to markdown conversion, AI processing

#### WebSearch
- **Description**: Search the web for current information
- **Purpose**: Access up-to-date information beyond knowledge cutoff
- **Parameters**: query, allowed_domains (optional), blocked_domains (optional)
- **Availability**: US only

### Utility Tools

#### exit_plan_mode
- **Description**: Exit planning mode when ready to implement
- **Purpose**: Transition from planning to execution
- **Parameters**: plan
- **Usage**: Only for implementation tasks requiring code writing

## MCP (Model Context Protocol) Tools

### MCP Resource Management

#### ListMcpResourcesTool
- **Description**: List available resources from configured MCP servers
- **Parameters**: server (optional)
- **Purpose**: Discover available MCP resources

#### ReadMcpResourceTool
- **Description**: Read specific resource from MCP server
- **Parameters**: server, uri
- **Purpose**: Access MCP server resources

### Excalidraw Integration (mcp__mcp_excalidraw__)

#### mcp__mcp_excalidraw__create_element
- **Description**: Create new Excalidraw element
- **Parameters**: type, x, y, width, height, text, styling options
- **Element Types**: rectangle, ellipse, diamond, arrow, text, label, freedraw, line, arrowLabel

#### mcp__mcp_excalidraw__update_element
- **Description**: Update existing Excalidraw element
- **Parameters**: id, plus any updateable properties

#### mcp__mcp_excalidraw__delete_element
- **Description**: Delete Excalidraw element
- **Parameters**: id

#### mcp__mcp_excalidraw__query_elements
- **Description**: Query Excalidraw elements with filters
- **Parameters**: type (optional), filter (optional)

#### mcp__mcp_excalidraw__get_resource
- **Description**: Get Excalidraw resource
- **Parameters**: resource (scene, library, theme, elements)

#### mcp__mcp_excalidraw__group_elements
- **Description**: Group multiple elements together
- **Parameters**: elementIds (array)

#### mcp__mcp_excalidraw__ungroup_elements
- **Description**: Ungroup elements
- **Parameters**: groupId

#### mcp__mcp_excalidraw__align_elements
- **Description**: Align elements to specific position
- **Parameters**: elementIds, alignment (left, center, right, top, middle, bottom)

#### mcp__mcp_excalidraw__distribute_elements
- **Description**: Distribute elements evenly
- **Parameters**: elementIds, direction (horizontal, vertical)

#### mcp__mcp_excalidraw__lock_elements
- **Description**: Lock elements to prevent modification
- **Parameters**: elementIds

#### mcp__mcp_excalidraw__unlock_elements
- **Description**: Unlock elements to allow modification
- **Parameters**: elementIds

### Sequential Thinking (mcp__sequential-thinking__)

#### mcp__sequential-thinking__sequentialthinking
- **Description**: Dynamic problem-solving through structured thoughts
- **Purpose**: Break down complex problems, plan solutions, analyze step-by-step
- **Parameters**: 
  - thought (current thinking step)
  - nextThoughtNeeded (boolean)
  - thoughtNumber, totalThoughts
  - isRevision, revisesThought (optional)
  - branchFromThought, branchId (optional)
- **Features**: 
  - Adaptive thought count
  - Revision and branching support
  - Hypothesis generation and verification

### Context7 Library Documentation (mcp__context7__)

#### mcp__context7__resolve-library-id
- **Description**: Resolve package names to Context7-compatible library IDs
- **Parameters**: libraryName
- **Purpose**: Find correct library ID before fetching documentation

#### mcp__context7__get-library-docs
- **Description**: Fetch up-to-date library documentation
- **Parameters**: context7CompatibleLibraryID, tokens (optional), topic (optional)
- **Purpose**: Access current library documentation and examples

### Puppeteer Browser Automation (mcp__puppeteer__)

#### mcp__puppeteer__puppeteer_navigate
- **Description**: Navigate to URL in browser
- **Parameters**: url, launchOptions (optional), allowDangerous (optional)

#### mcp__puppeteer__puppeteer_screenshot
- **Description**: Take screenshot of page or element
- **Parameters**: name, selector (optional), width, height, encoded (optional)

#### mcp__puppeteer__puppeteer_click
- **Description**: Click element on page
- **Parameters**: selector

#### mcp__puppeteer__puppeteer_fill
- **Description**: Fill input field
- **Parameters**: selector, value

#### mcp__puppeteer__puppeteer_select
- **Description**: Select option from dropdown
- **Parameters**: selector, value

#### mcp__puppeteer__puppeteer_hover
- **Description**: Hover over element
- **Parameters**: selector

#### mcp__puppeteer__puppeteer_evaluate
- **Description**: Execute JavaScript in browser console
- **Parameters**: script

### Screenshot Management (mcp__snap-happy__)

#### mcp__snap-happy__GetLastScreenshot
- **Description**: Get most recent screenshot as base64 PNG
- **Parameters**: None

#### mcp__snap-happy__TakeScreenshot
- **Description**: Take new screenshot
- **Parameters**: windowId (optional, macOS only)
- **Purpose**: Capture full screen or specific window

#### mcp__snap-happy__ListWindows
- **Description**: List all visible windows (macOS only)
- **Parameters**: None
- **Purpose**: Get window IDs for targeted screenshots

### Supabase Integration (mcp__supabase__)

#### Project Management
- **mcp__supabase__list_organizations**: List user's organizations
- **mcp__supabase__get_organization**: Get organization details
- **mcp__supabase__list_projects**: List all Supabase projects
- **mcp__supabase__get_project**: Get project details
- **mcp__supabase__create_project**: Create new project (requires cost confirmation)
- **mcp__supabase__pause_project**: Pause project
- **mcp__supabase__restore_project**: Restore project

#### Branch Management
- **mcp__supabase__create_branch**: Create development branch
- **mcp__supabase__list_branches**: List project branches
- **mcp__supabase__delete_branch**: Delete branch
- **mcp__supabase__merge_branch**: Merge branch to production
- **mcp__supabase__reset_branch**: Reset branch migrations
- **mcp__supabase__rebase_branch**: Rebase branch on production

#### Database Operations
- **mcp__supabase__list_tables**: List database tables
- **mcp__supabase__list_extensions**: List database extensions
- **mcp__supabase__list_migrations**: List migrations
- **mcp__supabase__apply_migration**: Apply DDL migration
- **mcp__supabase__execute_sql**: Execute raw SQL queries

#### Utilities
- **mcp__supabase__get_cost**: Get cost estimates
- **mcp__supabase__confirm_cost**: Confirm cost understanding
- **mcp__supabase__get_logs**: Retrieve service logs
- **mcp__supabase__get_advisors**: Get security/performance advisories
- **mcp__supabase__get_project_url**: Get API URL
- **mcp__supabase__get_anon_key**: Get anonymous API key
- **mcp__supabase__generate_typescript_types**: Generate TypeScript types
- **mcp__supabase__search_docs**: Search Supabase documentation
- **mcp__supabase__list_edge_functions**: List Edge Functions
- **mcp__supabase__deploy_edge_function**: Deploy Edge Function

### Linear Project Management (mcp__linear__)

#### Issue Management
- **mcp__linear__get_issue**: Get issue details
- **mcp__linear__list_issues**: List issues with filters
- **mcp__linear__create_issue**: Create new issue
- **mcp__linear__update_issue**: Update existing issue
- **mcp__linear__list_my_issues**: List current user's issues

#### Comments
- **mcp__linear__list_comments**: Get issue comments
- **mcp__linear__create_comment**: Add comment to issue

#### Project Management
- **mcp__linear__list_projects**: List projects
- **mcp__linear__get_project**: Get project details
- **mcp__linear__create_project**: Create new project
- **mcp__linear__update_project**: Update project

#### Organization
- **mcp__linear__list_teams**: List teams
- **mcp__linear__get_team**: Get team details
- **mcp__linear__list_users**: List workspace users
- **mcp__linear__get_user**: Get user details
- **mcp__linear__list_issue_statuses**: List available statuses
- **mcp__linear__get_issue_status**: Get specific status
- **mcp__linear__list_issue_labels**: List available labels

#### Documentation
- **mcp__linear__list_documents**: List documents
- **mcp__linear__get_document**: Get document details
- **mcp__linear__search_documentation**: Search Linear docs

---

*This documentation covers all available tools in Claude Code as of the current session. Each tool includes its primary purpose, parameters, and key features for comprehensive reference.*