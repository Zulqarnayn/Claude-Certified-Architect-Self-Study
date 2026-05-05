---
layout: default
title: CCA Self-Study — Week 4, Day 3
---

# CCA Self-Study — Week 4, Day 3
## Streaming Responses

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 4 & 5 · API + Reliability

---

## Core Concept

Streaming is the difference between watching a YouTube video load completely before playing vs watching it stream in real time. The total data transferred is identical — but the user experience is completely different.

Without streaming, a user submits a question and stares at a blank screen for 5–15 seconds while Claude generates the full response, then sees it appear all at once. With streaming, tokens appear as they're generated — the user sees Claude "thinking" in real time.

For production user-facing systems, streaming is not optional. It's the expected standard.

---

## The Analogy — Live Subtitles vs Post-Production Captions

Post-production captions: the entire video is recorded, then a subtitler reads it all and creates the caption file, then both are released together. You wait for the whole thing.

Live subtitles: as the speaker talks, the subtitler types in real time. You see the text appear word-by-word as it's spoken. Same information, completely different experience.

Claude without streaming = post-production captions.
Claude with streaming = live subtitles.

---

## How Streaming Works Under the Hood

Without streaming:
```
You → API request → [Claude generates all tokens] → API response → You
                    ←————————— 5-10 seconds ——————————→
```

With streaming:
```
You → API request → token → token → token → token → token → ... → [done]
                     ↑ each token arrives as Claude generates it
                     ↑ first token in ~500ms
```

The API sends Server-Sent Events (SSE) — a stream of small chunks, each containing one or more tokens. Your code processes each chunk as it arrives.

---

## Streaming Implementation

### Basic Streaming

```python
import anthropic

client = anthropic.Anthropic()

# Method 1: Context manager (recommended)
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain quantum computing simply."}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)  # Print each token immediately
    
    # After stream completes, access final message
    final_message = stream.get_final_message()
    print(f"\n\nTotal tokens: {final_message.usage.input_tokens} in, "
          f"{final_message.usage.output_tokens} out")
```

### Streaming with Event Handling

```python
# Method 2: Event-by-event (more control)
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Write a short story."}]
) as stream:
    
    for event in stream:
        
        if event.type == "content_block_start":
            # Claude is starting a new content block
            pass
        
        elif event.type == "content_block_delta":
            # A new token (or tokens) arrived
            if event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
        
        elif event.type == "content_block_stop":
            # Content block finished
            print()  # New line
        
        elif event.type == "message_delta":
            # Final metadata (stop_reason, usage)
            print(f"\nStop reason: {event.delta.stop_reason}")
        
        elif event.type == "message_stop":
            # Stream is complete
            pass
```

---

## Streaming for Web Applications

In a web app (API server → browser), you typically use Server-Sent Events to relay Claude's stream to the browser:

```python
# FastAPI example
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import anthropic

app = FastAPI()
client = anthropic.Anthropic()

@app.post("/chat")
async def chat(message: str):
    
    def generate():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": message}]
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {text}\n\n"  # SSE format
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

```javascript
// Browser JavaScript — receive the stream
const response = await fetch('/chat', {
    method: 'POST',
    body: JSON.stringify({message: userInput})
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const token = line.slice(6);
            if (token !== '[DONE]') {
                appendToUI(token);  // Update the UI with each token
            }
        }
    }
}
```

---

## When to Use Streaming vs Non-Streaming

| Use Streaming | Don't Use Streaming |
|---|---|
| User-facing chat interfaces | Background batch processing |
| Any UI where the user waits for a response | Pipeline steps where output feeds another process |
| Long responses (summaries, explanations, code) | Short responses (classifications, labels) |
| When perceived performance matters | When actual latency doesn't matter |
| Real-time collaborative tools | Scheduled jobs and cron tasks |

**The rule:** If a human is watching and waiting, stream. If a machine is processing, don't bother.

---

## Streaming + Tool Use — The Complication

When Claude uses tools inside a streaming response, the stream pauses at the tool use block:

```
Streaming: "I'll search for that information..."
→ [tool_use block appears]
→ Stream pauses — waiting for tool result
→ You execute the tool
→ You send tool result back
→ Stream resumes: "Based on the search results..."
```

This requires handling the `tool_use` event type in your stream loop:

```python
with client.messages.stream(..., tools=[search_tool]) as stream:
    collected_content = []
    
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "text_delta":
                print(event.delta.text, end="", flush=True)
                collected_content.append(event.delta.text)
        
        elif event.type == "content_block_start":
            if event.content_block.type == "tool_use":
                # Claude wants to call a tool
                tool_name = event.content_block.name
                tool_input = {}  # Collect input from subsequent deltas
    
    final = stream.get_final_message()
    
    # Check if we need to handle tool calls
    if final.stop_reason == "tool_use":
        # Execute the tool and continue the conversation
        tool_result = execute_tool(final.content)
        # Make a new API call with tool result...
```

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Streaming | Receiving Claude's output token-by-token as it's generated |
| Server-Sent Events (SSE) | The protocol used to stream tokens from server to browser |
| Time to first token | Time from request to first token arriving (~500ms with streaming) |
| Perceived performance | How fast a system feels, regardless of actual total time |
| Stream pause | When streaming stops at a tool_use block awaiting tool result |

---

## Hands-On Task 🛠️

**Task 1:** Implement basic streaming. Ask Claude to write a 200-word product description. Watch tokens appear in real time. Measure time to first token vs time to last token.

**Task 2:** Ask Claude the same question without streaming. Measure total wait time vs the time to first token in streaming mode. Note the UX difference.

**Task 3:** Build a streaming response that stops mid-stream using a stop sequence. Confirm the stream terminates cleanly.

**Task 4 (stretch):** If you have a web app or can set up a simple FastAPI server — implement the server-side streaming endpoint above.

**Your observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** Time to first token with streaming is ~500ms. Total time for a 500-token response might be 8 seconds. Without streaming, the user waits 8 seconds then sees everything. With streaming, they see the first token in 500ms then the rest over 7.5 seconds. Why does this feel dramatically faster to users even though the total time is the same?

> **Your answer:**
> _(write here)_

---

**Q2.** You're building a batch pipeline that classifies 10,000 customer emails overnight. Should you use streaming? Why or why not?

> **Your answer:**
> _(write here)_

---

**Q3.** Your streaming implementation shows tokens to the user as they appear. Claude produces this output mid-stream: *"The answer is definitely..."* — then your schema validation triggers and you need to retry. The user has already seen the partial response. How do you handle this UX problem?

> **Your answer:**
> _(write here)_

---

**Q4.** What is the difference between `stream.text_stream` and handling `content_block_delta` events manually? When would you use each?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're building a Claude-powered coding assistant in a web IDE (like a browser-based VSCode). Users ask Claude to refactor their code, which can take 20–30 seconds. Design the complete streaming UX — what the user sees, when, and how errors are handled mid-stream.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Why streaming feels faster (same total time)**

This is a psychology of UX principle called "perceived performance." Humans are much more tolerant of ongoing progress than of blank waiting.

When a user stares at a blank screen for 8 seconds, their brain registers: "Is something happening? Is it broken? Should I refresh?" Every second of blankness increases anxiety and the perception of slowness.

When the first token appears in 500ms, the brain registers: "It's working." The subsequent 7.5 seconds of tokens appearing feels like reading — an active, engaging experience rather than passive waiting. The user is processing content while more content arrives. The total wait is the same; the experience is completely different.

This is why every major AI chat product (ChatGPT, Gemini, Claude.ai) uses streaming. It's not a technical optimisation — it's a UX requirement.

---

**Q2 — Streaming for batch email classification**

**No — don't use streaming.**

Batch processing has no user watching and waiting. The emails are processed overnight by a machine that reads the complete classification result and writes it to a database. Streaming provides zero benefit:

1. No UI to update — the output goes to a database, not a screen
2. Complexity increase — streaming requires more code to handle the event loop
3. No latency benefit — the batch job's constraint is throughput, not time-to-first-token
4. Token collection is messier — you have to accumulate streamed tokens before you can parse the JSON classification

Use the standard `client.messages.create()` (non-streaming) for batch jobs. Use streaming only when a human is watching.

---

**Q3 — Partial response shown before retry**

This is a real UX problem in streaming + validation systems. Three approaches:

**Approach 1 — Buffer before showing (recommended for critical output):**
Don't stream directly to the UI. Buffer the full response, validate it, then display all at once. You lose the streaming UX benefit but eliminate the partial-display problem. Use for structured data extraction where correctness matters more than UX.

**Approach 2 — Clear and retry with indication:**
If validation fails mid-stream, clear the partial output from the UI and show: "Rethinking..." or a loading indicator, then stream the retry. Most users accept this gracefully if it happens rarely.

**Approach 3 — Progressive display with validation checkpoint:**
Stream the response into a buffer. Display it progressively to the user. At completion, validate. If valid — the display is already showing the correct output. If invalid — show a correction animation that replaces the invalid content. Complex to implement but smoothest UX.

**Practical rule:** If the output can be partially wrong in a way that confuses or misleads the user, buffer it. If partial output is harmless (like a story draft), stream it directly.

---

**Q4 — text_stream vs content_block_delta**

**`stream.text_stream`** is a high-level helper that yields only the text content — filtering out all other event types (tool_use blocks, metadata, etc.). It's simple and clean for text-only use cases.

```python
for text in stream.text_stream:
    print(text, end="")
# Simple, but you lose all event metadata
```

**`content_block_delta` events** give you lower-level access to every event type — including `tool_use` deltas, `input_json_delta` (for structured tool inputs), and metadata events. Use this when you need to:
- Handle tool calls during streaming
- Access stop_reason mid-stream
- Process structured content blocks (not just text)
- Build complex streaming UIs that respond differently to different event types

**When to use each:**
- `text_stream` → simple chat UI, prose generation, no tools
- `content_block_delta` events → agentic systems with tool calls, complex UIs, anywhere you need event metadata

---

**Q5 — Streaming UX for coding assistant**

**The complete design:**

**Phase 1 — Acknowledgement (0–500ms):**
When the user submits their refactoring request, immediately show:
- A loading indicator: "Claude is analysing your code..."
- The request is in a "processing" state — prevent duplicate submissions

**Phase 2 — Streaming begins (~500ms):**
- Hide the loading indicator
- Show a diff view panel (left: original, right: Claude's version)
- As tokens stream in, append them to the right side of the diff view
- Show a subtle streaming indicator (pulsing cursor)
- Token counter: "Generating... 127 tokens"

**Phase 3 — Completion:**
- Stop the streaming indicator
- Show: "Done ✓ — 312 tokens generated in 28 seconds"
- Enable action buttons: "Apply changes" | "Reject" | "Ask for modifications"
- Run syntax validation on the output — highlight any syntax errors immediately

**Error handling mid-stream:**
- If the stream errors (network drop, API error): show "Connection interrupted. Click to retry." — preserve what was generated so far
- If validation fails after completion: show the diff with a warning banner: "Some changes may need review" with specific issues highlighted

**The key principle:** Give the user information and agency at every phase. Never leave them with a blank screen or an unexplained state change.

---

## Status

- [ ] Concept read and understood
- [ ] Task 1 completed (basic streaming)
- [ ] Task 2 completed (streaming vs non-streaming comparison)
- [ ] Task 3 completed (stop sequence mid-stream)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 4 started — Token Counting & Cost

---

## Coming Up — Week 4, Day 4

**Topic:** Token Counting & Cost
Count tokens before sending. Estimate cost per request. Build a cost-aware architecture. Why token awareness is a core architect skill that separates good systems from expensive ones.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 4 of 12*
