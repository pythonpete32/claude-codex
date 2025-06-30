# @dao/chat-items-glob-tool

[![JSR](https://jsr.io/badges/@dao/chat-items-glob-tool)](https://jsr.io/@dao/chat-items-glob-tool)
[![JSR Score](https://jsr.io/badges/@dao/chat-items-glob-tool/score)](https://jsr.io/@dao/chat-items-glob-tool)

chat-items/glob-tool atomic package for the Daobox Codex ecosystem.

## Features

- 🚀 **TypeScript First**: Written in TypeScript with full type safety
- 📦 **Zero Dependencies**: Lightweight and self-contained
- 🌐 **Cross-Runtime**: Works in Deno, Node.js, Bun, and browsers
- 📖 **Well Documented**: Complete JSDoc documentation

## Installation

### JSR (Recommended)

```bash
# Deno
deno add @dao/chat-items-glob-tool

# Bun
bun add @dao/chat-items-glob-tool@jsr

# Node.js (with JSR CLI)
npx jsr add @dao/chat-items-glob-tool

# Node.js (manual)
npm install @jsr/dao__chat-items-glob-tool
```

### Import

```typescript
// JSR
import { chatItems/globTool } from "@dao/chat-items-glob-tool";

// npm (Node.js)
import { chatItems/globTool } from "@jsr/dao__chat-items-glob-tool";
```

## Usage

### Basic Example

```typescript
import { chatItems/globTool } from "@dao/chat-items-glob-tool";

const result = chatItems/globTool();
console.log(result); // "Hello from chat-items/glob-tool!"
```

### Advanced Usage

```typescript
// Add your advanced usage examples here
import { chatItems/globTool } from "@dao/chat-items-glob-tool";

// Example with custom parameters
const customResult = chatItems/globTool();
console.log(customResult);
```

## API Reference

### `chatItems/globTool()`

Main exported function for chat-items/glob-tool.

**Returns:** `string` - A greeting message

**Example:**

```typescript
const result = chatItems/globTool();
console.log(result); // "Hello from chat-items/glob-tool!"
```

## Development

### Prerequisites

- [Bun](https://bun.sh) or [Deno](https://deno.land)
- TypeScript 5.0+

### Scripts

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Publish to JSR
bun run publish:jsr
```

### Project Structure

```
.
├── src/
│   └── index.ts          # Main module
├── tests/
│   └── index.test.ts     # Test suite
├── jsr.json             # JSR configuration
├── package.json         # Package configuration  
├── tsconfig.json        # TypeScript configuration
├── README.md           # This file
└── LICENSE             # MIT License
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository from [DAOresearch](https://github.com/DAOresearch)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [DAO Codex](https://github.com/DAOresearch/codex) - Main repository
- [Atomic Workflow](https://github.com/DAOresearch/atomic-workflow) - Workflow system

---

Made with ❤️ by [DAOresearch](https://github.com/DAOresearch)
