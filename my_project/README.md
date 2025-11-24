# Zypher Career Assistant

This project is a lightweight **agentic CLI application** built using the **Zypher framework**.  
It simulates a simple AI career assistant that can:  
- Have natural multi-turn conversation  
- Recommend career paths based on user background (`/career`)
- Generate a 6-month personalized learning roadmap (`/roadmap`)
- Summarize the full session (`/summary`)

The goal of this project is to demonstrate practical usage of Zypher for building structured, tool-driven agent workflows.

---

## Features

| Feature | Command | Description |
|--------|---------|-------------|
| Chat mode | *(default chat)* | General conversation |
| Career analysis | `/career <profile>` | Suggests matching job roles based on background |
| Roadmap generator | `/roadmap` | Creates a 6-month actionable learning path |
| Conversation summary | `/summary` | Bullet-point recap of everything discussed |
| Exit | `/exit` | Quit the program |

---

## Tech Stack

- **Language:** TypeScript (Deno runtime)
- **Framework:** Zypher Agent Framework
- **Model provider:** Anthropic Claude (via `AnthropicModelProvider`)

---

## Setup Instructions

### 1 Install dependencies:

```bash
deno add jsr:@corespeed/zypher
deno add npm:rxjs-for-await
```

### 2 Create .env:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```
(See .env.example for reference.)

### 3 Run the agent:
```bash
deno run -A --env-file=.env main.ts
```

---

## Example Usage
```bash
You> /career background: CS master's student with interest in AI security and zk systems

Assistant> (career roles with explanation)

You> /roadmap

Assistant> (6-month roadmap)

You> /summary

```
## Future Extensions
- Persistent memory and profile files
- Web UI version
- Multi-model fusion and retrieval augmentation
- PDF resume parsing or LinkedIn import