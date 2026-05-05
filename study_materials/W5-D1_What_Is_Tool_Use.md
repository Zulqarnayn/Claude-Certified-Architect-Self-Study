---
layout: default
title: CCA Self-Study — Week 5, Day 1
---

# CCA Self-Study — Week 5, Day 1
## What Is Tool Use?

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 2 — Building with Claude
**Exam domain:** Domain 2 · Tool Design & MCP Integration

---

## Core Concept

Until now, Claude has been a responder — you send text, Claude returns text. Tool use changes this fundamentally. With tools, Claude becomes an **actor** — it can take actions in the world, retrieve real information, and interact with external systems.

Tool use is the bridge between Claude as a language model and Claude as an agent.

---

## The Analogy — A Brilliant Analyst With No Computer Access

Imagine hiring the world's most brilliant analyst. They can reason about any problem, synthesise complex information, and make sophisticated recommendations. But there's a catch: they're locked in a room with no computer, no internet, no phone. They can only work with information you physically hand them.

That's Claude without tool use. Brilliant, but limited to what's in the conversation.

Now give that analyst a computer with access to your database, a web browser, a calculator, and your company's internal tools. Suddenly they can look things up, verify facts, run calculations, and take actions.

That's Claude with tools.

---

## How Tool Use Works — The Loop

Tool use is a request-response loop between you and Claude:

```
┌─────────────────────────────────────────────────────┐
│  1. You define tools (name, description, schema)    │
│  2. You send a message + tool definitions to Claude │
│  3. Claude decides: can I answer with what I know?  │
│     YES → responds directly (end_turn)              │
│     NO  → requests a tool call (tool_use)           │
│  4. You receive the tool_use request                │
│  5. YOU execute the tool (Claude cannot do this)    │
│  6. You send the tool result back to Claude         │
│  7. Claude uses the result to form its response     │
│  8. Loop back to step 3 if Claude needs more tools  │
└─────────────────────────────────────────────────────┘
```

**Critical insight:** Claude does not execute tools. Claude *requests* tool execution. You execute the tool. You are the hands. Claude is the brain.

---

## Your First Tool Definition

A tool is defined with three things: name, description, and input schema.

```python
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a specific city. "
                       "Use this when the user asks about weather conditions, "
                       "temperature, or forecast for a location.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The city name, e.g. 'Dhaka', 'London', 'New York'"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit. Default: celsius"
                }
            },
            "required": ["city"]
        }
    }
]
```

---

## Making a Tool Call — Full Example

```python
import anthropic
import json

client = anthropic.Anthropic()

# Step 1: Define your tools
tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        }
    }
]

# Step 2: Send message with tools
messages = [
    {"role": "user", "content": "What's the weather like in Dhaka right now?"}
]

response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=1024,
    tools=tools,
    messages=messages
)

print(f"Stop reason: {response.stop_reason}")
# → "tool_use"

# Step 3: Claude requests a tool call
tool_use_block = response.content[0]
print(f"Tool requested: {tool_use_block.name}")
# → "get_weather"
print(f"Tool input: {tool_use_block.input}")
# → {"city": "Dhaka"}

# Step 4: YOU execute the tool (this is your code, not Claude's)
def get_weather(city: str, unit: str = "celsius") -> dict:
    # In reality, call a weather API here
    # For now, return mock data
    return {
        "city": city,
        "temperature": 32,
        "unit": unit,
        "condition": "Humid and partly cloudy",
        "humidity": 78
    }

tool_result = get_weather(**tool_use_block.input)

# Step 5: Send tool result back to Claude
messages.append({"role": "assistant", "content": response.content})
messages.append({
    "role": "user",
    "content": [
        {
            "type": "tool_result",
            "tool_use_id": tool_use_block.id,
            "content": json.dumps(tool_result)
        }
    ]
})

# Step 6: Claude uses the result to respond
final_response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=1024,
    tools=tools,
    messages=messages
)

print(final_response.content[0].text)
# → "The weather in Dhaka right now is 32°C with humid and partly cloudy conditions..."
```

---

## The stop_reason Signal

| stop_reason | Meaning | What you do |
|---|---|---|
| `end_turn` | Claude has a final answer | Display the response |
| `tool_use` | Claude needs a tool | Execute tool, send result, continue loop |
| `max_tokens` | Response cut off | Increase max_tokens |
| `stop_sequence` | Custom stop signal | Handle per your design |

The `tool_use` stop_reason is the heartbeat of every agentic system. Your loop continues as long as Claude keeps requesting tools.

---

## Why Tool Descriptions Are the Interface

Claude reads your tool description to decide:
1. Whether to use the tool at all
2. Which tool to use (when you have multiple)
3. What arguments to pass

The description IS the API contract between you and Claude.

```
❌ Bad description:
"name": "db_query"
"description": "Queries the database"

Claude has no idea when to use this, what database, or what kinds of queries.

✅ Good description:
"name": "search_products"
"description": "Search the product catalog by name, category, or price range. 
Use this when the user asks about available products, pricing, or product details. 
Returns a list of matching products with name, price, and availability."

Claude knows exactly when to use this and what to expect back.
```

We go deep on tool description design in Week 5 D3.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Tool use | Claude requesting execution of developer-defined functions |
| Tool definition | Name + description + input schema that tells Claude what a tool does |
| tool_use stop_reason | Signal that Claude wants to call a tool |
| Tool result | The output of your tool execution, sent back to Claude |
| Agentic loop | The cycle of Claude requesting tools, you executing them, Claude continuing |

---

## Hands-On Task 🛠️

Build your first tool-using system.

**Task 1:** Define a tool called `get_app_info` that takes an `app_name` string and returns mock data about an iOS app (version, rating, downloads, last_updated).

**Task 2:** Send Claude the message: *"Tell me about the ScreenshotAI app"*. Confirm Claude requests the `get_app_info` tool with `app_name: "ScreenshotAI"`.

**Task 3:** Return mock data and let Claude formulate a response. Read the final response.

**Task 4:** Ask a question that should NOT trigger the tool: *"What is the capital of France?"*. Confirm `stop_reason == "end_turn"` and no tool is called.

**Your implementation and observations:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** Claude cannot execute tools — you execute them. Why is this architectural separation important? What would go wrong if Claude could execute code directly?

> **Your answer:**
> _(write here)_

---

**Q2.** You define 5 tools for your agent. Claude receives a user message and decides none of the tools are needed. What is the `stop_reason`, and what does the response look like?

> **Your answer:**
> _(write here)_

---

**Q3.** Your tool returns an error — the weather API is down and returns a 500. What should you send back as the tool result, and how should Claude handle it?

> **Your answer:**
> _(write here)_

---

**Q4.** Claude calls the same tool twice in a row with different arguments. What does the `messages` array look like after both tool calls are processed?

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're building an iOS app store research tool. Users ask questions like "Which weather apps have the best ratings under $5?" You have access to: a product search API, a pricing API, and a reviews API. How do you decide whether to build one tool or three separate tools?

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Why Claude can't execute tools directly**

**Safety and control:** If Claude could directly execute code, it could take arbitrary actions in your system — delete files, make API calls with real money, modify databases — without your oversight. By requiring you to execute tools, you control every action. You can validate, log, rate-limit, and block any tool call before it executes.

**Security boundaries:** Your tool implementation runs in your infrastructure with your credentials. Claude never sees your database password, API keys, or internal network. The tool result is all Claude receives.

**Determinism vs probabilistic:** Your tool code is deterministic — it behaves the same way every time. Claude's reasoning is probabilistic. For actions that must happen correctly every time (database writes, financial transactions), deterministic code is essential. Claude drives the decision of what to do; your code does the doing.

**Auditability:** Every tool call goes through your code, giving you a complete audit trail of what actions were taken, by whom, and when.

---

**Q2 — No tool needed**

`stop_reason == "end_turn"` — Claude answered directly from its knowledge.

The response content is a single text block with Claude's answer:
```json
{
  "stop_reason": "end_turn",
  "content": [
    {
      "type": "text",
      "text": "The capital of France is Paris."
    }
  ]
}
```

No `tool_use` blocks appear in the content. Your loop should check `stop_reason` first — if `end_turn`, display the text content and exit the loop. Only if `tool_use` do you look for tool blocks.

---

**Q3 — Tool returns an error**

Send the error as the tool result content. Claude can read it and respond appropriately:

```python
messages.append({
    "role": "user",
    "content": [
        {
            "type": "tool_result",
            "tool_use_id": tool_use_block.id,
            "content": json.dumps({
                "error": "weather_api_unavailable",
                "message": "The weather service is currently down. Please try again later.",
                "status_code": 500
            }),
            "is_error": True  # Optional flag to signal error to Claude
        }
    ]
})
```

Claude will see the error and typically respond gracefully: *"I tried to check the weather for Dhaka but the weather service is currently unavailable. Please try again in a few minutes."*

Never return an empty result or raise an exception that crashes your loop — always return something meaningful so Claude can respond to the user helpfully.

---

**Q4 — Messages array after two tool calls**

```python
messages = [
    # Original user message
    {"role": "user", "content": "Compare weather in Dhaka and London"},
    
    # Claude's response requesting first tool call
    {"role": "assistant", "content": [
        {"type": "tool_use", "id": "tool_1", "name": "get_weather", 
         "input": {"city": "Dhaka"}}
    ]},
    
    # Your first tool result
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "tool_1", 
         "content": '{"temperature": 32, "condition": "humid"}'}
    ]},
    
    # Claude's response requesting second tool call
    {"role": "assistant", "content": [
        {"type": "tool_use", "id": "tool_2", "name": "get_weather",
         "input": {"city": "London"}}
    ]},
    
    # Your second tool result
    {"role": "user", "content": [
        {"type": "tool_result", "tool_use_id": "tool_2",
         "content": '{"temperature": 15, "condition": "cloudy"}'}
    ]}
    
    # → Claude now has both results and will produce final response
]
```

Each tool call/result pair is a separate user/assistant exchange in the messages array. Claude can see all results when formulating its final comparison response.

---

**Q5 — One tool or three?**

**Build three separate tools.**

**Principle: One tool, one responsibility.**

`search_products` — takes query, returns list of apps with names and IDs
`get_pricing` — takes app_id, returns price and purchase model
`get_reviews` — takes app_id, returns rating and review summary

**Why not one `research_apps` mega-tool?**

1. **Reasoning overload:** One tool with complex parameters and multiple return types confuses Claude about when and how to use it. Simple, focused tools are easier for Claude to reason about.

2. **Reusability:** The pricing tool is useful in other queries ("Is X app free?"). The reviews tool is useful for "What do people say about X?" Each focused tool is reusable across different user queries.

3. **Error isolation:** If the reviews API is down, your search and pricing still work. One mega-tool fails entirely if any sub-component fails.

4. **Selective calling:** For a simple query ("Is X app free?"), Claude only needs to call search + pricing. With a mega-tool, it must call everything. Separate tools = lower cost per query.

**Rule:** If a tool does more than one logically distinct thing, split it.

---

## Status

- [ ] Concept read and understood
- [ ] Task 1 completed (get_app_info tool defined)
- [ ] Task 2 completed (tool_use stop_reason confirmed)
- [ ] Task 3 completed (mock data returned, response read)
- [ ] Task 4 completed (non-tool question confirmed end_turn)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 2 started — Defining Your First Tool

---

## Coming Up — Week 5, Day 2

**Topic:** Defining Your First Tool
Write a tool definition with precision: name conventions, description quality, input schema types. Connect your tool definition to a real Python or JavaScript function and handle the full request-response cycle.

---

*CCA Self-Study Log · Asif · Phase 2 of 5 · Week 5 of 12*
