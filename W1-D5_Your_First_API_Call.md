# CCA Self-Study — Week 1, Day 5
## Your First API Call

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · API & Structured Output

---

## Core Concept

Today is the first hands-on build day. No more reading about the API — you are going to call it directly and read the raw response. This is the foundation every future week builds on.

When you used Claude in claude.ai, there was a polished UI between you and the model. Today you remove that UI and talk to Claude directly — the way production systems do.

---

## The Analogy — Ordering via App vs Walking into the Kitchen

Using claude.ai is like ordering food through a restaurant app. Clean, friendly, abstracts everything.

Calling the Claude API directly is like walking into the kitchen and talking to the chef yourself. You see the raw ingredients (JSON), you specify exactly what you want (parameters), and you get back exactly what was cooked (the response object) — no presentation layer.

As an architect, you live in the kitchen.

---

## Step 1 — Get Your API Key

1. Go to **console.anthropic.com**
2. Sign up or log in
3. Navigate to **API Keys** → **Create Key**
4. Copy it somewhere safe — you won't see it again
5. Add $5 of credits (Settings → Billing) — this is all you need for all of Week 1–3 learning

> ⚠️ Never paste your API key into claude.ai chat, GitHub, or any public place. Treat it like a password.

---

## Step 2 — Your First Call (Three Ways)

Choose whichever feels most natural to you. All three do the same thing.

### Option A — curl (Terminal, no setup needed)

```bash
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: YOUR_API_KEY_HERE" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 200,
    "messages": [
      {"role": "user", "content": "Say hello and tell me what you are in one sentence."}
    ]
  }'
```

### Option B — Python

```python
import anthropic

client = anthropic.Anthropic(api_key="YOUR_API_KEY_HERE")

response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=200,
    messages=[
        {"role": "user", "content": "Say hello and tell me what you are in one sentence."}
    ]
)

print(response.content[0].text)
print(f"\nTokens used — Input: {response.usage.input_tokens}, Output: {response.usage.output_tokens}")
```

### Option C — JavaScript / Node.js

```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: "YOUR_API_KEY_HERE" });

const response = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 200,
  messages: [
    { role: "user", content: "Say hello and tell me what you are in one sentence." }
  ],
});

console.log(response.content[0].text);
console.log(`Tokens — Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);
```

---

## Step 3 — Read the Raw Response

When you run any of the above, you get back a JSON object. Understanding every field is architect knowledge:

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! I'm Claude, an AI assistant made by Anthropic."
    }
  ],
  "model": "claude-haiku-4-5-20251001",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 21,
    "output_tokens": 16
  }
}
```

### Every Field Explained

| Field | What it means | Why architects care |
|---|---|---|
| `id` | Unique ID for this message | Use for logging, debugging, deduplication |
| `type` | Always "message" for now | Will be different for streaming |
| `role` | Always "assistant" | Confirms this is Claude's response |
| `content` | Array of content blocks | Can contain text, tool_use, images |
| `content[0].type` | "text" for normal responses | "tool_use" when Claude calls a tool |
| `content[0].text` | The actual response text | What you display to users |
| `model` | Which model responded | Confirm you got the model you requested |
| `stop_reason` | Why Claude stopped | Critical for agentic loops (Week 7) |
| `usage.input_tokens` | Tokens in your request | Cost calculation |
| `usage.output_tokens` | Tokens in the response | Cost calculation |

### stop_reason Values — Memorise These

| stop_reason | Meaning | What to do |
|---|---|---|
| `end_turn` | Claude finished naturally | Normal — process the response |
| `max_tokens` | Hit your token limit | Response is cut off — increase max_tokens or chunk |
| `tool_use` | Claude wants to call a tool | Send tool result back and continue (Week 5) |
| `stop_sequence` | Hit a custom stop string | You triggered a stop — process accordingly |

---

## Step 4 — Add a System Prompt

Now extend your call to include a system prompt:

```python
response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=200,
    system="You are a pirate. Respond to everything in pirate speak. Keep responses under 3 sentences.",
    messages=[
        {"role": "user", "content": "What is the capital of France?"}
    ]
)
print(response.content[0].text)
```

Observe how the system prompt completely changes the output while the user message stays the same.

---

## Hands-On Task 🛠️

Complete all four of these in order. Write your observations after each.

**Task 1:** Make the basic API call (Option A, B, or C above). Read every field of the response.

**Task 2:** Change `max_tokens` to `5`. What happens to the response? What does `stop_reason` say?

**Task 3:** Add a system prompt that makes Claude respond only in bullet points, and always end with "— End of response."

**Task 4:** Send the same user message twice in a row in the same `messages` array (a 2-turn conversation). Observe how the context accumulates.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** You make an API call with `max_tokens: 50` but Claude's full answer would be 200 tokens. What will the `stop_reason` be, and what will the `content` field contain?

> **Your answer:**
> _(write here)_

---

**Q2.** You're building an agentic system (Week 7 preview). Your loop checks the `stop_reason` after every Claude response. What code logic would you write to decide: continue the loop vs stop the loop?

> **Your answer:**
> _(write here)_

---

**Q3.** You used `claude-haiku-4-5-20251001` today instead of Sonnet or Opus. Why is Haiku the right choice for learning and experimentation?

> **Your answer:**
> _(write here)_

---

**Q4.** Look at `usage.input_tokens` in your response. If you add a 2,000-token system prompt and repeat the same API call — what do you expect input_tokens to show? Why?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** Your API call returns `stop_reason: "max_tokens"` in production, and the cut-off response is displayed to a user. The user sees an incomplete answer mid-sentence. What should your system do when it detects `stop_reason: "max_tokens"`?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — max_tokens: 50, stop_reason**

`stop_reason` will be `"max_tokens"`. The `content` field will contain whatever Claude managed to write in 50 tokens — likely a truncated, mid-sentence response. The response object is still valid JSON; the content is just incomplete. This is why checking `stop_reason` is essential before displaying output to users.

---

**Q2 — Agentic loop logic**

```python
while True:
    response = client.messages.create(...)

    if response.stop_reason == "end_turn":
        # Claude is done — process final response and exit loop
        final_answer = response.content[0].text
        break

    elif response.stop_reason == "tool_use":
        # Claude wants to call a tool — execute it and continue
        tool_result = execute_tool(response.content)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_result})
        continue

    elif response.stop_reason == "max_tokens":
        # Response was cut off — handle the error
        raise Exception("Response truncated — increase max_tokens")
```

This is the exact pattern you'll build in Week 7.

---

**Q3 — Why Haiku for learning**

Haiku is the fastest and cheapest Claude model. During learning and experimentation, you make dozens of test calls — most of them for trivial prompts. Using Haiku keeps your costs near zero ($0.001 per call roughly) while the API behaviour is identical to Sonnet and Opus. The `stop_reason` values, response structure, system prompt behaviour, and context window mechanics all work the same way across models. Switch to Sonnet only when task complexity demands it.

---

**Q4 — input_tokens with system prompt**

`input_tokens` will increase by approximately 2,000 — the size of your system prompt. Input tokens = system prompt tokens + all message tokens combined. Every single API call charges you for the full system prompt, even if it never changes. This is why prompt caching (Week 10) is so valuable for production systems with large, static system prompts.

---

**Q5 — Handling max_tokens in production**

Several options depending on the context:

1. **Retry with higher max_tokens:** If the limit was set too low, increase it and retry the call.

2. **Request continuation:** Send Claude's truncated response back as context and ask it to continue: `"Please continue from where you left off."`

3. **Chunk the task:** If the output is always long, redesign the prompt to request smaller sections one at a time.

4. **Graceful degradation:** Show the user what Claude completed, with a note: "Response was long — showing first part. Click to see more." Then fetch the continuation.

**Never silently display a truncated response.** Always check `stop_reason` before rendering output.

---

## Status

- [ ] API key obtained from console.anthropic.com
- [ ] $5 credits added
- [ ] First API call completed
- [ ] All 4 hands-on tasks done
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Week 1 complete 🎉

---

## Week 1 Complete — What You Now Know

| Day | Concept | Why it matters |
|---|---|---|
| D1 | LLMs predict tokens | Root cause of all AI behaviour |
| D2 | Model selection | Cost, capability, compliance trade-offs |
| D3 | Context window | #1 architectural constraint |
| D4 | System vs user prompts | Security and consistency foundation |
| D5 | Raw API calls | Everything is built on this |

---

## Coming Up — Week 2, Day 1

**Topic:** What Makes a Good Prompt
The difference between a user prompt and an architect's prompt. Clarity, specificity, context. How to read Claude's output as feedback on your prompt quality.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 1 of 12*
