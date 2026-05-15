# While* Language Support for VS Code

A VS Code extension for While* - an educational programming language designed for teaching programming fundamentals, type systems, and formal program verification.

## What is While*?

While* is a simple imperative programming language used in computer science education. It's intentionally minimal so students can focus on core concepts like:
- Basic imperative programming (variables, loops, conditionals)
- Type systems and type safety
- Formal verification using Hoare logic
- Program analysis and control-flow reasoning

Useful links:
- [Online While* editor](https://wiz.cs.tu-dortmund.de)
- [While* project at AQUA](https://github.com/tudo-aqua/whilestar)

## What does this extension do?

This extension turns VS Code into a complete development environment for While*. You get:

- 🎨 **Syntax highlighting** - Your code looks nice with proper colors
- ⚡ **Live error checking** - Typos and mistakes are underlined as you type
- ▶️ **Run programs** - Execute your While* code and see the output
- 🐛 **Visual debugger** - Step through code line-by-line with inline variable values
- ✅ **Type checker** - Verify your program is type-correct
- 🔍 **Proof verifier** - Check formal correctness proofs (for Hoare logic assignments)
- 📊 **Dataflow analyses** - Run liveness, reachability, reaching-definitions, and taint analyses
- 🕸️ **Mermaid CFG visualization** - View rendered control-flow and transition graphs directly in the extension
- 🔁 **Transition CFG support** - Inspect the transition system used for program reasoning

## Supported While* Features

The extension supports modern While* workflows beyond editing and execution:

- Program execution and interactive debugging
- Type checking and Hoare-style proof checking
- Dataflow analyses:
  - Liveness analysis
  - Reachability analysis
  - Reaching definitions analysis
  - Taint analysis
- Transition CFG generation
- Visual graph rendering for CFG-based analyses

## Installation from VSIX

1. Download the `.vsix` file
2. Open VS Code
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
4. Type "Install from VSIX" and select it
5. Choose the downloaded file
6. Reload VS Code

Done! No other setup needed - everything is bundled.

## Quick Start

1. Create a new file called `test.wstar`
2. Write some While* code (example below)
3. Press `Ctrl+Shift+P` and type "WhileStar: Run Code"
4. See your output!

**Example WhileStar program:**
```
vars:
pre: (false)
code:
  print "Hello world!";
post: (true)
```

## Available Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for:

- **WhileStar: Open Interpreter** - Opens visual interpreter
- **WhileStar: Run Code** - Execute your program and see output
- **WhileStar: Debug Code** - Step through your code with visual debugging
- **WhileStar: Type Check Code** - Verify your program's types are correct
- **WhileStar: Proof Check Code** - Verify Hoare logic proofs (if your code has annotations)
- **WhileStar: Run Liveness Analysis** - Compute liveness information
- **WhileStar: Run Reachability Analysis** - Compute reachable program states
- **WhileStar: Run Reaching Definitions Analysis** - Inspect reaching definitions
- **WhileStar: Run Taint Analysis** - Inspect information-flow/taint propagation
- **WhileStar: Show Transition CFG** - Show the transition control-flow graph


## Local Development

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- VS Code

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build the extension:
```bash
pnpm run build
```

3. Start debugging:
   - Press `F5` in VS Code or run "Debug: Start Debugging" command
   - This opens a new VS Code window with the extension loaded
   - Test your changes there

## Authors

- [Richard Stewing](https://github.com/haetze)
- [Assanali Uzakov](https://github.com/asanali-uzakov)

## Credits

This extension builds on:
- **wvm** - The While* interpreter and verifier
- **Langium** - Parser generator framework
- Previous work on While* language tooling

Originally developed as a Bachelor thesis project at TU Dortmund University.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---
