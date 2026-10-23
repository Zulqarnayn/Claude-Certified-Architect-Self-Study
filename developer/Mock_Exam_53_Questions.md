---
layout: note
title: "CCDV-F Mock Exam (53 Q)"
id: DEV-MOCK
part: developer
domain: context
order: 8014
kind: mock
book: true
minutes: "120"
---

**Exam:** Claude Certified Developer – Foundations (CCDV-F): 53 questions, 120 minutes, pass = 720/1000 scaled
**Last verified:** 2026-10

---

## How to Use

- Practice instrument written from the published domain list and weights (third-party mirror of the v1.0 guide, July 2026). It is not an official item bank. **Read the official exam guide from the Partner Academy before relying on any detail.**
- Answer on paper under time. Pass bar for you: **≥ 80% overall and ≥ 70% per domain**.

| Domain | Weight | Questions here |
|---|---|---|
| Applications & Integration | 33.1% | 18 |
| Model Selection & Optimization | 16.8% | 9 |
| Agents & Workflows | 14.7% | 8 |
| Prompt & Context Engineering | 11.0% | 6 |
| Tools & MCPs | 10.6% | 5 |
| Security & Safety | 8.1% | 4 |
| Claude Code | 3.1% | 2 |
| Eval, Testing & Debugging | 2.6% | 1 |

---

## Questions

**Q1.** *[Applications & Integration]* A request fails with HTTP 404 `not_found_error` mentioning the model. What should the service do?

A) Retry on a different region
B) Retry with exponential backoff
C) Switch to non-streaming
D) Fail fast and alert: it is a configuration bug (bad model ID), not retryable

**Q2.** *[Applications & Integration]* Which error class chain is best for a Python service calling the Messages API?

A) Most-specific first: NotFoundError → RateLimitError → APIStatusError → APIConnectionError
B) A single `except Exception`
C) Only `except APIStatusError`
D) `except RateLimitError` only

**Q3.** *[Applications & Integration]* The API is stateless. How should a chat backend keep conversation context?

A) Send only the latest user message
B) Rely on the API to remember by user ID
C) Store history in the system prompt of the first call only
D) Store messages server-side and resend the relevant history on every request

**Q4.** *[Applications & Integration]* A request with `max_tokens=128000` times out in non-streaming mode. Best fix?

A) Disable retries
B) Increase the HTTP library's read timeout only
C) Use streaming (`messages.stream`) and `get_final_message()` if you only need the full result
D) Reduce temperature

**Q5.** *[Applications & Integration]* A mobile app needs Claude. Where should the API key live?

A) In app remote config
B) Hard-coded in the app, obfuscated
C) Only on your backend; the app calls your authenticated API
D) In a QR code the user scans

**Q6.** *[Applications & Integration]* A response has `stop_reason: "max_tokens"` and you must return JSON. What now?

A) Ignore it
B) Treat output as truncated: raise the limit, stream, or continue; do not parse the partial JSON as valid
C) Retry the identical request forever
D) Parse what you have and fill missing fields with null

**Q7.** *[Applications & Integration]* Which values should you log for every call to debug cost and support issues?

A) The full prompt and the user's PII
B) Model, usage (incl. cache read/write), stop_reason, latency, and the response request ID
C) Nothing, to protect privacy
D) Only the HTTP status

**Q8.** *[Applications & Integration]* You receive 429s during traffic bursts. Which combination is best?

A) Retry immediately in a tight loop
B) Switch every call to the largest model
C) Queue/shed load, back off with jitter honoring retry-after, move non-urgent work to Batches, reduce tokens with caching
D) Increase `max_tokens`

**Q9.** *[Applications & Integration]* Which call shape suits a nightly job classifying 3M tickets?

A) Managed Agents session per ticket
B) Interactive `messages.create` in 3M sequential calls
C) Message Batches with a small model
D) Streaming with the largest model

**Q10.** *[Applications & Integration]* A tool-using chat is resumed from a database. What must be stored to keep the next request valid?

A) Only assistant text
B) Only the final answer
C) Only tool names
D) The full assistant content including `tool_use` blocks and the matching `tool_result` blocks

**Q11.** *[Applications & Integration]* What does the SDK do by default on 429 and 5xx responses?

A) Retries only 4xx
B) Retries automatically (default 2 retries) with backoff
C) Never retries
D) Retries indefinitely

**Q12.** *[Applications & Integration]* You need typed, validated JSON from a document extraction call in Python. Preferred API?

A) `tool_choice` forced to a dummy tool
B) `client.messages.parse(..., output_format=PydanticModel)` and read `parsed_output`
C) Prompt "reply with JSON" and `json.loads`
D) Prefill `{` in the assistant turn

**Q13.** *[Applications & Integration]* How should an application find a model's context window at runtime?

A) Infer from the model name
B) Use `tiktoken`
C) Query the Models API (`client.models.retrieve(id)` → `max_input_tokens`)
D) Hard-code 200,000

**Q14.** *[Applications & Integration]* Why does an interactive UI usually stream responses?

A) Time to first token improves perceived latency, and long outputs avoid HTTP timeouts
B) Streaming disables rate limits
C) Streaming guarantees valid JSON
D) Streaming is cheaper per token

**Q15.** *[Applications & Integration]* You want to reuse a 40-page PDF across many requests without re-uploading. What do you use?

A) Base64 in every request
B) Batch API only
C) Files API: upload once, reference by `file_id`
D) Paste text in the system prompt of each request

**Q16.** *[Applications & Integration]* How do you count tokens before sending a large request?

A) `tiktoken`
B) Characters divided by 4 as a guarantee
C) `client.messages.count_tokens(...)`
D) Words times 1.3

**Q17.** *[Applications & Integration]* A client disconnects mid-stream. What should the backend do?

A) Ignore the disconnect
B) Cancel the upstream stream and stop work; record usage so far
C) Keep generating to completion
D) Retry the whole request

**Q18.** *[Applications & Integration]* A web search server tool fails inside a request. What does your code observe?

A) HTTP 200 with a result block whose content is an error object; no exception is raised
B) A timeout exception
C) An `APIStatusError` 500
D) Nothing; the tool silently succeeds

**Q19.** *[Model Selection & Optimization]* Which model tier is the best first candidate for high-volume ticket classification?

A) Haiku 5.5, verified on a labeled eval
B) Whichever is newest
C) Fable 5.1
D) Opus 5.5 at max effort

**Q20.** *[Model Selection & Optimization]* Why should you not switch models mid-conversation to save cost?

A) It violates the terms of service
B) The API forbids it
C) It always lowers quality
D) Prompt caches are model-scoped, so you lose the cached prefix (and thinking blocks may not transfer)

**Q21.** *[Model Selection & Optimization]* Before building a multi-model cascade, what should you test first?

A) The stronger model at lower effort on your eval
B) A larger context window
C) Fine-tuning
D) Disabling caching

**Q22.** *[Model Selection & Optimization]* Which is the right metric for comparing two configurations?

A) Cost per request
B) Prompt length
C) Output tokens per second
D) Cost per completed (correct) task

**Q23.** *[Model Selection & Optimization]* You need thinking depth control on Opus 5.5. Which parameter?

A) `temperature`
B) `thinking.budget_tokens`
C) `output_config: {effort: ...}` with adaptive thinking
D) `top_k`

**Q24.** *[Model Selection & Optimization]* Which statement about Batches is correct?

A) Asynchronous, about half price, results keyed by `custom_id`
B) Fast mode compatible
C) Results always in request order
D) Synchronous with streaming

**Q25.** *[Model Selection & Optimization]* Your cache hit rate dropped to zero right after a deploy. Most likely cause?

A) The model got slower
B) A change in the prompt prefix (e.g., a timestamp or reordered tools)
C) `max_tokens` was lowered
D) Batches are enabled

**Q26.** *[Model Selection & Optimization]* Migrating code from an older model to Sonnet 5.5, which setting will most likely cause a 400?

A) `thinking: {type: "disabled"}`, `budget_tokens`, a forced `tool_choice`, or prefill
B) Streaming
C) `max_tokens=4096`
D) A system prompt

**Q27.** *[Model Selection & Optimization]* What is a reasonable step-down for cost on a quality-tolerant route?

A) Disable stop-reason checks
B) Lower `max_tokens` to 10
C) Remove the system prompt
D) Lower `effort` (e.g., `medium`) and measure on the eval

**Q28.** *[Agents & Workflows]* When is an agent the wrong choice?

A) When the steps are known and fixed: use a workflow with model calls per step
B) When the path cannot be specified in advance
C) When the task is open-ended
D) When tool use is needed

**Q29.** *[Agents & Workflows]* What does a subagent return to its parent?

A) Its tool results
B) Its full transcript
C) Nothing
D) Its final summary only; the working context stays isolated

**Q30.** *[Agents & Workflows]* Which approach supplies both the agent loop and managed deployment?

A) Agent SDK
B) Managed Agents
C) Manual loop
D) Tool Runner

**Q31.** *[Agents & Workflows]* In Managed Agents, where is the system prompt configured?

A) On each session
B) In the event stream
C) On the agent (versioned); sessions reference the agent
D) On the environment

**Q32.** *[Agents & Workflows]* An agent keeps calling the same failing tool. What stops it?

A) Iteration caps and repeat detection in code, with escalation
B) A bigger context window
C) A prompt saying "do not loop"
D) Higher temperature

**Q33.** *[Agents & Workflows]* Independent research subtasks should be:

A) Merged into one huge prompt
B) Delegated in parallel to isolated subagents
C) Skipped
D) Run one at a time on one agent

**Q34.** *[Agents & Workflows]* How should a human-approval step be enforced for refunds above a threshold?

A) Deterministically (approval gate, `always_ask` policy, or hook)
B) Only in the prompt
C) By lowering effort
D) By raising temperature

**Q35.** *[Agents & Workflows]* The tool runner loop ends when:

A) When `max_tokens` is reached
B) After exactly three iterations
C) When the first tool returns
D) Claude returns a response with no more tool calls

**Q36.** *[Prompt & Context Engineering]* How should long reference documents be placed relative to the question in a prompt?

A) Question buried in the middle
B) No delimiters
C) Documents first (clearly delimited), question after
D) Question first, documents truncated

**Q37.** *[Prompt & Context Engineering]* You want stable behavior across turns, with the rules cached. Where do they go?

A) Appended to each user message with timestamps
B) In random order each call
C) In the last message only
D) In the system prompt, kept byte-stable at the front of the prefix

**Q38.** *[Prompt & Context Engineering]* Which few-shot set generalizes best?

A) Many near-duplicate easy examples
B) Examples in a different format
C) One example
D) Diverse examples including edge cases, in the exact target format

**Q39.** *[Prompt & Context Engineering]* An operator instruction must change mid-conversation without losing the cache. What fits (supported models)?

A) Edit the top-level `system` field
B) Restart the conversation
C) Append a `{"role": "system"}` message to `messages`
D) Switch models

**Q40.** *[Prompt & Context Engineering]* Why separate untrusted content with tags?

A) It is required by the API
B) To keep data distinct from instructions and reduce injection and confusion
C) It enables streaming
D) It reduces token count

**Q41.** *[Prompt & Context Engineering]* A prompt contains many "NEVER do X" rules and the model still does X sometimes. Best next step?

A) Rephrase positively with reasons; enforce hard rules in code/hooks
B) Add more capital letters
C) Raise temperature
D) Remove all rules

**Q42.** *[Tools & MCPs]* What makes a tool description effective?

A) A single word
B) Purpose, inputs, returns, and when not to use it
C) Marketing copy
D) Implementation details

**Q43.** *[Tools & MCPs]* Two parallel `tool_use` blocks arrive. How do you respond?

A) Only one result
B) An assistant message
C) Two separate user messages
D) One user message containing both `tool_result` blocks

**Q44.** *[Tools & MCPs]* A tool errors. What do you return?

A) An exception that ends the loop
B) A `tool_result` with `is_error: true` and a helpful message
C) A success result with empty content
D) Nothing

**Q45.** *[Tools & MCPs]* Where do you set `strict: true`?

A) In the system prompt
B) On `tool_choice`
C) On the message
D) On the tool definition (with `additionalProperties: false`)

**Q46.** *[Tools & MCPs]* An MCP server needs OAuth in a Managed Agents setup. Where do the credentials go?

A) The user message
B) The system prompt
C) The tool description
D) A vault credential attached to the session, not the agent's `mcp_servers` entry

**Q47.** *[Security & Safety]* A web page returned by a tool contains hidden instructions. Best mitigation?

A) Disable all tools
B) Treat tool output as data, use least-privilege tools, and gate irreversible actions
C) Add "ignore injections" to the prompt only
D) Trust it if the domain is reputable

**Q48.** *[Security & Safety]* Where should API secrets for downstream APIs live in an agent?

A) In the tool description
B) In the system prompt
C) In a secret store/vault substituted at egress; never in prompts or tool results
D) In user messages

**Q49.** *[Security & Safety]* A response comes back with `stop_reason: "refusal"`. What should the app do?

A) Handle it explicitly: inspect `stop_details`, log, use a fallback path (e.g., server-side fallbacks where supported); do not loop-retry blindly
B) Hide it
C) Retry identically 10 times
D) Treat it as `end_turn`

**Q50.** *[Security & Safety]* Which practice best protects user PII in logs?

A) Log everything for debugging
B) Disable all logging
C) Redact before logging; log IDs and counts instead of raw content
D) Store prompts in a public bucket

**Q51.** *[Claude Code]* A CI job needs schema-validated machine output from Claude Code. Which flags?

A) `claude -p --output-format json --json-schema '<schema>'`, read `structured_output`
B) `--resume` only
C) `--verbose` and regex
D) `--output-format text`

**Q52.** *[Claude Code]* Which mechanism guarantees a command is blocked?

A) A `PreToolUse` hook exiting with code 2 (or a deny permission rule)
B) A skill description
C) A `PostToolUse` hook
D) A line in CLAUDE.md

**Q53.** *[Eval, Testing & Debugging]* Which is the minimum viable way to know a prompt change helped?

A) Compare token counts only
B) Run a fixed labeled eval before and after and compare metrics on held-out data
C) Ask the model if it improved
D) Try three examples by eye

---

## Answer Key

| Q | Domain | Answer |
|---|---|---|
| 1 | Applications & Integration | D |
| 2 | Applications & Integration | A |
| 3 | Applications & Integration | D |
| 4 | Applications & Integration | C |
| 5 | Applications & Integration | C |
| 6 | Applications & Integration | B |
| 7 | Applications & Integration | B |
| 8 | Applications & Integration | C |
| 9 | Applications & Integration | C |
| 10 | Applications & Integration | D |
| 11 | Applications & Integration | B |
| 12 | Applications & Integration | B |
| 13 | Applications & Integration | C |
| 14 | Applications & Integration | A |
| 15 | Applications & Integration | C |
| 16 | Applications & Integration | C |
| 17 | Applications & Integration | B |
| 18 | Applications & Integration | A |
| 19 | Model Selection & Optimization | A |
| 20 | Model Selection & Optimization | D |
| 21 | Model Selection & Optimization | A |
| 22 | Model Selection & Optimization | D |
| 23 | Model Selection & Optimization | C |
| 24 | Model Selection & Optimization | A |
| 25 | Model Selection & Optimization | B |
| 26 | Model Selection & Optimization | A |
| 27 | Model Selection & Optimization | D |
| 28 | Agents & Workflows | A |
| 29 | Agents & Workflows | D |
| 30 | Agents & Workflows | B |
| 31 | Agents & Workflows | C |
| 32 | Agents & Workflows | A |
| 33 | Agents & Workflows | B |
| 34 | Agents & Workflows | A |
| 35 | Agents & Workflows | D |
| 36 | Prompt & Context Engineering | C |
| 37 | Prompt & Context Engineering | D |
| 38 | Prompt & Context Engineering | D |
| 39 | Prompt & Context Engineering | C |
| 40 | Prompt & Context Engineering | B |
| 41 | Prompt & Context Engineering | A |
| 42 | Tools & MCPs | B |
| 43 | Tools & MCPs | D |
| 44 | Tools & MCPs | B |
| 45 | Tools & MCPs | D |
| 46 | Tools & MCPs | D |
| 47 | Security & Safety | B |
| 48 | Security & Safety | C |
| 49 | Security & Safety | A |
| 50 | Security & Safety | C |
| 51 | Claude Code | A |
| 52 | Claude Code | A |
| 53 | Eval, Testing & Debugging | B |

## Rationales

**Q1 — D.** 4xx errors other than 408/409/429 are not transient.

**Q2 — A.** Retryable and non-retryable failures need different handling.

**Q3 — D.** Every request must carry the context you want the model to see.

**Q4 — C.** Large outputs should be streamed to avoid HTTP timeouts.

**Q5 — C.** Keys in client binaries are extractable.

**Q6 — B.** Check `stop_reason` before using content.

**Q7 — B.** IDs and token counts are enough to investigate; redact content.

**Q8 — C.** Respect limits and reduce demand.

**Q9 — C.** Async, ~50% cheaper, no latency need.

**Q10 — D.** Missing tool_use/tool_result pairing makes the request invalid.

**Q11 — B.** Defaults: `max_retries=2`; also retries timeouts and connection errors.

**Q12 — B.** Schema-enforced structured outputs; prefill and forced tool choice are not supported on current models.

**Q13 — C.** There is no `context_window` field; use `max_input_tokens`.

**Q14 — A.** Streaming is a UX and timeout tool, not a cost tool.

**Q15 — C.** Files API is GA and avoids re-sending.

**Q16 — C.** Tokenizers differ by model; use the API.

**Q17 — B.** Avoid paying for output nobody will read.

**Q18 — A.** Server-tool errors are returned in-band.

**Q19 — A.** Right-size to the task, then measure.

**Q20 — D.** Use a subagent or separate request for the cheaper step.

**Q21 — A.** Lower effort on newer models often matches older models at high effort, with one cache namespace.

**Q22 — D.** Retries and extra turns hide in per-request cost.

**Q23 — C.** `budget_tokens` is removed on current models.

**Q24 — A.** Batch is for non-latency-sensitive volume.

**Q25 — B.** Any prefix byte change invalidates later cache.

**Q26 — A.** Several legacy parameters were removed or restricted.

**Q27 — D.** Effort is the first quality-trading lever after free wins.

**Q28 — A.** Start with the simplest tier.

**Q29 — D.** Context isolation keeps the parent clean.

**Q30 — B.** Tool Runner and Agent SDK are harness-only.

**Q31 — C.** Agent once, session every run.

**Q32 — A.** Termination is a code concern.

**Q33 — B.** Parallelism and isolation.

**Q34 — A.** Prompts are not guarantees.

**Q35 — D.** Iteration stops automatically when no tool calls remain.

**Q36 — C.** Clear structure helps attention and enables caching of the stable part.

**Q37 — D.** Stable-first ordering preserves caching.

**Q38 — D.** Diversity and format fidelity.

**Q39 — C.** Top-level system edits invalidate the cache.

**Q40 — B.** Delimiting untrusted data is basic hardening.

**Q41 — A.** Prompts shape; code guarantees.

**Q42 — B.** Descriptions drive tool selection.

**Q43 — D.** Splitting teaches the model not to parallelize.

**Q44 — B.** Every tool_use needs a result.

**Q45 — D.** It guarantees input validates against the schema.

**Q46 — D.** Vaults handle auth and refresh.

**Q47 — B.** Architectural controls, not just prompts.

**Q48 — C.** Secrets in context can leak.

**Q49 — A.** Refusals are a first-class outcome.

**Q50 — C.** Minimize and redact.

**Q51 — A.** Validated object in `structured_output`.

**Q52 — A.** Deterministic enforcement beats advisory text.

**Q53 — B.** Evals make changes measurable.

## Score Sheet

| Domain | Correct | Total | % |
|---|---|---|---|
| Applications & Integration | | 18 | |
| Model Selection & Optimization | | 9 | |
| Agents & Workflows | | 8 | |
| Prompt & Context Engineering | | 6 | |
| Tools & MCPs | | 5 | |
| Security & Safety | | 4 | |
| Claude Code | | 2 | |
| Eval, Testing & Debugging | | 1 | |
| **Overall** | | 53 | |
