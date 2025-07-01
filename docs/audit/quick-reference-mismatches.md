# Quick Reference: Parser-UI Mismatches

## Status System
| Parser | UI Components |
|--------|---------------|
| ✅ pending | ✅ pending |
| ✅ running | ⚠️ BashTool only |
| ✅ completed | ✅ completed |
| ✅ failed | ❌ uses "error" |
| ✅ interrupted | ❌ not supported |
| ✅ unknown | ❌ not supported |

## Component Mismatches at a Glance

### 🔧 BashTool
- ❌ Missing: `errorOutput`, `exitCode`, `workingDirectory`, `interrupted`
- ❌ Wrong field name: `promptText` → `description`
- ⚠️ Different architecture (no TerminalWindow)

### ✏️ EditTool  
- ❌ Missing: correlation IDs, `fileType` usage, `wordWrap`
- ⚠️ Redundant: UI recalculates diff that parser already provides

### 🔍 GlobTool
- ❌ Wrong structure: `input.pattern` vs flat `pattern`
- ❌ Wrong type: `results` (strings) vs `matches` (objects)
- ❌ Missing: search statistics

### 🔎 GrepTool
- ❌ Wrong structure: nested `input` vs flat props
- ❌ Missing: UI statistics, `onRefineSearch`
- ⚠️ Similar but incompatible result types

### 📁 LsTool
- ❌ Wrong structure: `results.entries` vs flat `files`
- ❌ Different types: `FileEntry` vs `FileItem`
- ❌ Missing: entry counts, statistics

### ✂️ MultiEditTool
- ❌ Wrong structure: parser has separate input/results
- ❌ Missing: detailed results, success/failure tracking
- ❌ Missing: edit statistics

### 📖 ReadTool
- ❌ Missing: `language`, `truncated`, `errorMessage`
- ❌ Missing: UI controls (`maxHeight`)

## Duplication Issues

1. **All components except BashTool duplicate TerminalWindow features**
2. **Status color mapping repeated 7 times**
3. **File type detection in multiple places**
4. **Similar animation logic across components**

## Top Priority Fixes

1. 🚨 **Align status values** - Components can't display parser statuses correctly
2. 🚨 **Fix data structures** - Components expect different shapes than parsers provide  
3. 🚨 **Add correlation tracking** - No way to link tool calls and results
4. ⚠️ **Refactor BashTool** - Should use TerminalWindow like others
5. ⚠️ **Extract shared utilities** - Reduce duplication