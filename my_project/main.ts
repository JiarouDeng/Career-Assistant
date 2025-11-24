// main.ts
// Zypher Career Agent – chat + career recommendation + roadmap + summary

import {
  AnthropicModelProvider,
  createZypherContext,
  ZypherAgent,
} from "@corespeed/zypher";
import { eachValueFrom } from "rxjs-for-await";

// ---------- env helpers ----------

// Safely read required env vars
function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

// On Windows, Zypher may need HOME – fallback to USERPROFILE
function ensureHomeEnv() {
  if (!Deno.env.get("HOME")) {
    const userProfile = Deno.env.get("USERPROFILE");
    if (userProfile) {
      Deno.env.set("HOME", userProfile);
    }
  }
}

// ---------- conversation state ----------

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const transcript: ChatTurn[] = [];
let lastCareerResult = "";

// Convert transcript to plain text for summary prompt
function buildTranscriptText(turns: ChatTurn[]): string {
  return turns
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
    .join("\n");
}

// ---------- agent helpers ----------

async function createAgent(): Promise<ZypherAgent> {
  ensureHomeEnv();

  const context = await createZypherContext(Deno.cwd());

  const provider = new AnthropicModelProvider({
    apiKey: getRequiredEnv("ANTHROPIC_API_KEY"),
  });

  const agent = new ZypherAgent(context, provider, {
    config: {
      maxIterations: 1,
      maxTokens: 2048,
      taskTimeoutMs: 60_000,
    },
  });

  // 注意：当前版本不需要 agent.init()
  return agent;
}

// Run a Zypher task and stream text to terminal, return full text
async function runTaskAndStreamText(agent: ZypherAgent, task: string) {
  const modelName = "claude-sonnet-4-20250514"; // 官方示例里的模型名

  const event$ = agent.runTask(task, modelName);
  let finalText = "";

  for await (const event of eachValueFrom(event$)) {
    if (event.type === "text") {
      // 增量输出
      const chunk = event.content;
      await Deno.stdout.write(new TextEncoder().encode(chunk));
      finalText += chunk;
    }
  }

  return finalText.trim();
}

// ---------- main loop ----------

async function main() {
  console.log("=== Zypher Career Agent ===");
  console.log("Commands:");
  console.log("  /career <your profile>  - get career recommendations");
  console.log("  /roadmap                - 6-month roadmap based on last career result");
  console.log("  /summary                - summarize conversation so far");
  console.log("  /exit                   - quit");
  console.log("----------------------------------------");

  const agent = await createAgent();

  while (true) {
    const input = prompt("\nYou> ");

    if (input === null) break; // Ctrl+D
    const trimmed = input.trim();
    if (!trimmed) continue;

    // ---- exit ----
    if (trimmed === "/exit") {
      console.log("Goodbye!");
      break;
    }

    // ---- summary ----
    if (trimmed === "/summary") {
      if (transcript.length === 0) {
        console.log("Assistant> No conversation yet to summarize.");
        continue;
      }

      console.log("Assistant (summary)> ");

      const historyText = buildTranscriptText(transcript);
      const summaryPrompt = `
You are a helpful meeting assistant.

Given the following chat transcript between a user and an AI assistant,
produce a concise summary in bullet points. Focus on:
- main questions or topics
- key answers or decisions
- any follow-up actions

Chat transcript:
${historyText}
`;
      const summary = await runTaskAndStreamText(agent, summaryPrompt);
      transcript.push({ role: "assistant", content: summary });
      continue;
    }

    // ---- career recommendation ----
    if (trimmed.startsWith("/career")) {
      const profile = trimmed.replace("/career", "").trim();
      if (!profile) {
        console.log(
          "Assistant> Please provide a short profile, e.g. `/career CS master's, interested in AI security, some ZKP experience`",
        );
        continue;
      }

      console.log("Assistant (career recommendation)> ");

      const promptText = `
You are a professional career advisor and mentor.

Analyze the user's profile and provide:
- 3–5 specific career paths that fit them
- 1–2 sentence justification for each path
- key skills required for each path
- optional: typical work settings or industries

User profile:
${profile}
`;
      const answer = await runTaskAndStreamText(agent, promptText);
      lastCareerResult = answer;
      transcript.push({ role: "user", content: trimmed });
      transcript.push({ role: "assistant", content: answer });
      continue;
    }

    // ---- roadmap based on last career result ----
    if (trimmed === "/roadmap") {
      if (!lastCareerResult) {
        console.log(
          "Assistant> No career context yet. Use `/career <your profile>` first.",
        );
        continue;
      }

      console.log("Assistant (6-month roadmap)> ");

      const promptText = `
You are a practical career coach.

Based on the following career recommendations, create a realistic 6-month roadmap.

Requirements:
- Organize by Month 1, Month 2, ..., Month 6
- For each month, list 3–5 concrete actions (learning, projects, networking, applications)
- Keep it focused and feasible for a busy student

Career recommendations:
${lastCareerResult}
`;
      const roadmap = await runTaskAndStreamText(agent, promptText);
      lastCareerResult = roadmap; // 更新为最新上下文（可选）
      transcript.push({ role: "user", content: trimmed });
      transcript.push({ role: "assistant", content: roadmap });
      continue;
    }

    // ---- default: normal chat ----
    transcript.push({ role: "user", content: trimmed });

    console.log("Assistant> ");

    const chatPrompt = `
    You are a friendly but concise career and life advice assistant.
    Answer the user's question clearly and helpfully.

    User message:
    ${trimmed}
    `; 

      const reply = await runTaskAndStreamText(agent, chatPrompt);
      transcript.push({ role: "assistant", content: reply });
        }
    }

    if (import.meta.main) {
      main().catch((err) => {
        console.error("Fatal error:", err);
        Deno.exit(1);
      });
    }