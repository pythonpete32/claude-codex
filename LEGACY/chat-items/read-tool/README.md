# @dao/chat-items-read-tool

[![JSR](https://jsr.io/badges/@dao/chat-items-read-tool)](https://jsr.io/@dao/chat-items-read-tool)
[![JSR Score](https://jsr.io/badges/@dao/chat-items-read-tool/score)](https://jsr.io/@dao/chat-items-read-tool)

chat-items/read-tool atomic package for the Daobox Codex ecosystem.

## Features

- 🚀 **TypeScript First**: Written in TypeScript with full type safety
- 📦 **Zero Dependencies**: Lightweight and self-contained
- 🌐 **Cross-Runtime**: Works in Deno, Node.js, Bun, and browsers
- 📖 **Well Documented**: Complete JSDoc documentation

## Installation

### JSR (Recommended)

```bash
# Deno
deno add @dao/chat-items-read-tool

# Bun
bun add @dao/chat-items-read-tool@jsr

# Node.js (with JSR CLI)
npx jsr add @dao/chat-items-read-tool

# Node.js (manual)
npm install @jsr/dao__chat-items-read-tool
```

### Import

```typescript
// JSR
import { chatItems/readTool } from "@dao/chat-items-read-tool";

// npm (Node.js)
import { chatItems/readTool } from "@jsr/dao__chat-items-read-tool";
```

## Usage

### Basic Example

```typescript
import { chatItems/readTool } from "@dao/chat-items-read-tool";

const result = chatItems/readTool();
console.log(result); // "Hello from chat-items/read-tool!"
```

### Advanced Usage

```typescript
// Add your advanced usage examples here
import { chatItems/readTool } from "@dao/chat-items-read-tool";

// Example with custom parameters
const customResult = chatItems/readTool();
console.log(customResult);
```

## API Reference

### `chatItems/readTool()`

Main exported function for chat-items/read-tool.

**Returns:** `string` - A greeting message

**Example:**

```typescript
const result = chatItems/readTool();
console.log(result); // "Hello from chat-items/read-tool!"
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
