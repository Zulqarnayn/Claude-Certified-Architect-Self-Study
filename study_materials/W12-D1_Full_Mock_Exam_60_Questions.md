---
layout: default
title: CCA Self-Study — Week 12, Day 1
---

# CCA Self-Study — Week 12, Day 1
## Full 60-Question Mock Exam

**Date completed:** _____________
**Time allowed:** 90 minutes (1.5 min per question)
**Instructions:** Answer ALL questions before checking the answer guide. Mark questions you're unsure about with ★. Review marked questions first after completing.

---

## Domain Distribution
- Domain 1 (Agentic Architecture): ~16 questions
- Domain 2 (Tool Design & MCP): ~11 questions
- Domain 3 (Claude Code): ~12 questions
- Domain 4 (Prompt Engineering): ~12 questions
- Domain 5 (Context & Reliability): ~9 questions

---

## SECTION A — Agentic Architecture & Orchestration (27%)

**Q1.** An agentic loop receives `stop_reason: "tool_use"`. The developer checks if `response.content[0].type == "tool_use"` and processes it. If the first content block is a text block followed by a tool_use block, what happens?

A) The text block is ignored and the tool_use block is processed correctly
B) The code crashes because content[0] is text, not tool_use
C) Both blocks are processed correctly
D) The tool_use block is skipped, causing the agent to terminate

> _(write here)_

---

**Q2.** A coordinator agent delegates to 3 subagents. Subagent A fails with a timeout. Subagents B and C succeed. The coordinator should:

A) Retry the entire pipeline including B and C
B) Fail the entire pipeline since all 3 results are required
C) Aggregate B and C's results with a caveat about A's unavailability
D) Escalate to human review since any failure invalidates the result

> _(write here)_

---

**Q3.** Which of the following is NOT a valid stop_reason from the Claude Messages API?

A) end_turn
B) tool_use
C) max_tokens
D) context_overflow

> _(write here)_

---

**Q4.** In a hub-and-spoke architecture, the coordinator delegates to a ResearchAgent. The coordinator passes its full 8,000-token messages array to the ResearchAgent. This causes:

A) Faster research because the ResearchAgent has more context
B) Context contamination — ResearchAgent may incorporate irrelevant coordinator history
C) A context window error since 8,000 tokens exceeds limits
D) No problem — context sharing between coordinator and subagents is standard practice

> _(write here)_

---

**Q5.** An agent is stuck calling `get_weather("London")` repeatedly with the same arguments 5 times in a row. The most effective intervention is:

A) Increase max_iterations to give it more chances
B) Inject a recovery prompt noting the repeated call and asking Claude to either use the result it has or try a different approach
C) Return a different (fake) result to break the loop
D) Switch to a more capable model

> _(write here)_

---

**Q6.** You need to enforce that a tool call that moves more than $1,000 always requires human approval. This rule should be implemented:

A) In the system prompt: "Never move more than $1,000 without approval"
B) As a pre-tool lifecycle hook that checks the amount before execution
C) As a post-tool hook that verifies the amount after execution
D) As a stop_sequence that Claude outputs when it detects large amounts

> _(write here)_

---

**Q7.** Two customers' support sessions run concurrently using async code. Both share a module-level `session_data = {}` dict that stores the current customer's info. What is the risk?

A) Slower processing due to dict contention
B) Race condition where Customer A's data overwrites Customer B's, causing wrong responses
C) Memory overflow from storing two sessions simultaneously
D) No risk — dicts are thread-safe in Python

> _(write here)_

---

**Q8.** An agent must complete a 15-step task. Each step requires one tool call. Your max_iterations is 10. The most appropriate response is:

A) Increase max_iterations to 20 and monitor
B) Redesign the task as a coordinator with 3 specialist subagents of 5 steps each
C) Add a summarisation step every 5 iterations to reduce context
D) Use a more powerful model that requires fewer steps

> _(write here)_

---

**Q9.** The lifecycle hook chain has 5 hooks. Hook 3 returns `HookDecision.BLOCK`. What happens to Hooks 4 and 5?

A) They run anyway to collect all issues
B) They are skipped — first BLOCK terminates the chain
C) Hook 4 runs but Hook 5 is skipped
D) All hooks always run regardless of decisions

> _(write here)_

---

**Q10.** A subagent's context should contain:

A) The coordinator's full message history for maximum context
B) Only the specific task and necessary context data for that task
C) All previous subagents' outputs for cross-reference
D) The user's full conversation history with the product

> _(write here)_

---

**Q11.** Which is the correct message structure after Claude makes a tool call?

A) `[user: task] → [user: tool_result]`
B) `[user: task] → [assistant: tool_use] → [user: tool_result]`
C) `[user: task] → [user: tool_result] → [assistant: tool_use]`
D) `[user: task] → [assistant: text + tool_use] → [user: text + tool_result]`

> _(write here)_

---

**Q12.** The "never crash the loop" rule means:

A) The agent loop should use try/catch around the entire loop body
B) Tool execution errors must be returned as structured error dicts, never as exceptions that propagate to the loop level
C) max_iterations must always be set to prevent loop exit
D) The model should never receive error messages

> _(write here)_

---

**Q13.** A coordinator receives results from 3 subagents. SubAgent A says the price is $29.99. SubAgent B says the price is $24.99. How should the coordinator handle this?

A) Use SubAgent A's result since it was first
B) Average the two prices
C) Explicitly note the contradiction to the user and recommend verifying directly
D) Discard both results and request new data

> _(write here)_

---

**Q14.** Which stop condition is always required regardless of other stop conditions?

A) Confidence threshold
B) External validation
C) Max iterations hard limit
D) Explicit completion signal (stop_sequence)

> _(write here)_

---

**Q15.** An agent loop that runs for 10 iterations and produces a correct final answer vs an agent loop that runs for 3 iterations and produces the same correct answer — which is preferred in production?

A) 10-iteration loop — more thorough reasoning produces more reliable answers
B) 3-iteration loop — fewer iterations means lower cost and latency with the same result
C) Either is equally valid as long as the answer is correct
D) 10-iteration loop only if it uses Haiku; 3-iteration if it uses Sonnet

> _(write here)_

---

**Q16.** A financial agent must not process transactions during market hours (9am-4pm EST). This constraint should be enforced:

A) In the system prompt: "Do not process transactions during market hours"
B) As a pre-tool hook that checks the current time before allowing transaction tools
C) As a stop_sequence the agent outputs when it detects market hours
D) In the tool's description: "Do not call during market hours"

> _(write here)_

---

## SECTION B — Tool Design & MCP (18%)

**Q17.** Which tool description best enables Claude to select the right tool?

A) "Gets data from the database"
B) "Retrieves customer account information including plan, billing status, and support history. Use when the user asks about their account, subscription, or billing. Returns: name, plan, next_billing_date, support_ticket_count."
C) "Customer tool — call when needed"
D) "Database query tool for customer data retrieval operations"

> _(write here)_

---

**Q18.** An MCP server has a tool called `manage_users` with an `action` parameter that accepts: create, update, delete, get. What is the main architectural problem?

A) The tool name is too generic
B) One tool doing multiple operations creates reasoning overload and can't enforce per-operation permissions
C) The action parameter should be a boolean
D) MCP servers should not have tools with parameters

> _(write here)_

---

**Q19.** Claude calls a tool that should return user profile data. The tool returns: `{"name": "Ahmed", "email": "ahmed@co.com", "ssn": "123-45-6789", "card_last4": "1234"}`. What should happen before this result reaches Claude's context?

A) Claude receives the full result — it's Claude's job to decide what to use
B) The tool implementation strips SSN and card_last4 before returning
C) A post-tool hook removes the SSN and card_last4 fields
D) Both B and C — data minimisation at tool level and hook-level stripping as defence in depth

> _(write here)_

---

**Q20.** An MCP server's `call_tool` handler raises an unhandled Python exception. What is the impact?

A) Only that specific tool call fails; other tools continue working
B) The MCP server process crashes, terminating all tool availability for that session
C) The exception is caught by the MCP protocol and returned as an error result
D) Claude retries the tool call automatically

> _(write here)_

---

**Q21.** You have 10 tools. Claude is over-calling `get_detailed_metrics` for simple queries that don't need detailed data. The description says "Get detailed performance metrics." How do you fix it?

A) Remove get_detailed_metrics and put its functionality in all other tools
B) Add exclusion language: "Only call when the user specifically requests detailed metrics or performance analysis. Do not call for general status queries."
C) Rename it to make it sound less appealing
D) Increase the number of required parameters

> _(write here)_

---

**Q22.** MCP uses stdio transport when:

A) The MCP server is a remote networked service
B) The MCP server is a local process on the same machine (like Claude Code's file access)
C) Authentication is required
D) The payload exceeds 1MB

> _(write here)_

---

**Q23.** A tool call returns `{"error": "timeout", "retry_recommended": true}`. Claude's next action should be:

A) Immediately retry the same tool call
B) Escalate to human review
C) Read the error information and decide whether to retry, try an alternative, or tell the user based on whether the task requires this data
D) Terminate the agent loop

> _(write here)_

---

**Q24.** Which is a valid reason to use inline tool definitions (not MCP)?

A) The tools are shared across multiple Claude applications
B) The tools are app-specific and only used in this one Claude application
C) The tools require authentication
D) The tools access a database

> _(write here)_

---

**Q25.** An MCP server handles 500 concurrent requests. The external API it calls has a 60 RPM rate limit. The correct architectural response is:

A) Scale the MCP server to 10 instances to handle load
B) Implement a server-side rate limiter that queues requests at 60/min to the external API
C) Return cached results for all requests beyond the rate limit
D) Increase the timeout value so requests wait longer before failing

> _(write here)_

---

**Q26.** A tool has two required parameters: `user_id` (string) and `start_date` (string, ISO 8601). Claude passes `start_date: "yesterday"`. What is the tool implementation's responsibility?

A) Accept "yesterday" since Claude's description says to use it
B) Reject the call and return an error with the expected format
C) Convert "yesterday" to an ISO 8601 date before processing
D) Both B and C — validate format strictly but provide a helpful error message

> _(write here)_

---

**Q27.** You define a write tool: `update_customer_email`. Which additional tool must always exist alongside it?

A) delete_customer_email
B) No additional tool is required
C) get_customer_profile (a read tool so Claude can verify before writing)
D) validate_email (to check format before updating)

> _(write here)_

---

## SECTION C — Claude Code Configuration (20%)

**Q28.** A CLAUDE.md file says "maximum 50 lines per function." A local CLAUDE.md in a legacy module says "maximum 200 lines per function (legacy code exception)." When Claude Code works in the legacy module directory, which rule applies?

A) The project CLAUDE.md (50 lines) — project rules always win
B) The local CLAUDE.md (200 lines) — more specific overrides less specific
C) The stricter rule (50 lines) — Claude Code always applies the stricter of two rules
D) Both rules are merged: 50 lines for new code, 200 lines for existing code

> _(write here)_

---

**Q29.** A developer runs `claude --no-interactive "Fix all test failures"` in CI. The command exits with code 1. This means:

A) Claude Code encountered an API error
B) Claude Code determined it could not fix all failures and the task failed
C) The CI runner doesn't have permissions to run Claude Code
D) Claude Code found critical issues in the code

> _(write here)_

---

**Q30.** Which belongs in a project CLAUDE.md (committed to git) vs a global `~/.claude/CLAUDE.md`?

A) Team Swift coding standards → project; Developer's preferred explanation verbosity → global
B) Developer's preferred explanation verbosity → project; Team standards → global
C) Both belong in project CLAUDE.md for consistency
D) Neither — all Claude Code configuration should be in `.claude/settings.json`

> _(write here)_

---

**Q31.** A slash command file contains `$ARGUMENTS` but the developer runs `/scaffold` with no arguments. What happens?

A) Claude Code throws an error because arguments are required
B) `$ARGUMENTS` is replaced with an empty string — Claude must handle the no-argument case in the command instructions
C) Claude Code prompts the developer to provide arguments
D) The command file is ignored

> _(write here)_

---

**Q32.** You want Claude Code to always run `swift lint` after any code change but NOT run it when only documentation files change. The CLAUDE.md instruction should be:

A) "Always run `swift lint` after every change"
B) "Run `swift lint` after changes to Swift files (.swift extension). Skip for documentation-only changes (.md, .txt files)."
C) "Run `swift lint` if the user requests it"
D) Add `swift lint` to the post-commit git hook instead of CLAUDE.md

> _(write here)_

---

**Q33.** A team of 8 developers all use Claude Code. Some want verbose explanations (for learning), others want concise responses (for efficiency). The team lead wants consistent code review quality for everyone. Which configuration handles this correctly?

A) Project CLAUDE.md: concise reviews. Global CLAUDE.md per developer: personal verbosity preference.
B) Project CLAUDE.md: verbose explanations. Override impossible — all developers get verbose.
C) Global CLAUDE.md: all developers must configure identically for consistency
D) `.claude/settings.json`: enforce concise for all developers

> _(write here)_

---

**Q34.** Claude Code reads a 200-file iOS project. The developer asks "explain the authentication flow." Claude Code:

A) Reads all 200 files and summarises
B) Uses selective reading — scans directory structure, then reads only files relevant to authentication
C) Cannot answer without reading all files
D) Returns an error if the project exceeds 50 files

> _(write here)_

---

**Q35.** A `/review` command in `.claude/commands/review.md` contains explicit instructions to check for force unwraps, missing error handling, and MVVM violations. A developer runs `/review ViewController.swift`. What context does Claude have for this review?

A) Only the review.md command contents
B) The review.md instructions + the content of ViewController.swift (read by Claude Code)
C) The review.md instructions + the entire codebase
D) Only the file contents — command instructions are not available during tool execution

> _(write here)_

---

**Q36.** Which is NOT a valid use of `--no-interactive` mode?

A) Running Claude Code in a GitHub Actions CI pipeline
B) Automating code documentation generation on a schedule
C) Interactive pair programming where the developer approves each change
D) Automated test generation after a PR is merged

> _(write here)_

---

**Q37.** A CLAUDE.md quality gate says "do not mark the task complete unless all tests pass." Claude Code fixes a bug, runs tests, 3 tests fail (unrelated to the fix), and marks the task complete anyway. What should have been added to the CLAUDE.md?

A) "Run tests after every change" (more explicit)
B) "All tests must pass, including tests unrelated to the change, before marking complete. If unrelated tests are failing, report them but do not mark the task complete."
C) "Only run tests related to the change"
D) Nothing — Claude Code should understand "all tests" means all tests

> _(write here)_

---

**Q38.** Claude Code's permission system in `.claude/settings.json` sets `deny_write: ["*.lock"]`. A developer asks Claude Code to update dependencies, which would modify `Package.resolved` (a lock file). What happens?

A) Claude Code updates the dependencies and ignores the lock file rule
B) Claude Code refuses to update dependencies since it can't write the lock file
C) Claude Code runs the package update command (which modifies the lock file indirectly via the package manager), but cannot directly write to the lock file
D) Claude Code asks the developer for permission override

> _(write here)_

---

**Q39.** You want to enforce that every PR reviewed by Claude Code must have its review findings logged to a centralised audit system. The correct implementation is:

A) Add logging instructions to the CLAUDE.md
B) Add a post-review script to the CI pipeline that reads Claude Code's output and sends it to the audit system
C) Ask Claude Code to log to the audit system as part of the review task
D) Both B and C — Claude Code logs and CI logs for redundancy

> _(write here)_

---

## SECTION D — Prompt Engineering & Structured Output (20%)

**Q40.** You need Claude to always return valid JSON with exactly these keys: `{sentiment, confidence, tags}`. The most reliable approach is:

A) System prompt: "Return JSON with sentiment, confidence, and tags"
B) System prompt with schema definition + negative prompting ("no other text") + assistant prefill (`{`)
C) Few-shot examples of correct JSON output
D) Both B and C — schema + examples + prefill for maximum reliability

> _(write here)_

---

**Q41.** A JSON validation failure is best described to Claude in a retry message as:

A) "Your response was incorrect. Please try again."
B) "JSON parse error at position 47: unexpected '}'. Your response: [raw response]. Correct format: {schema}. Output ONLY valid JSON."
C) "Please output the correct format."
D) "Error in your response. Check your JSON."

> _(write here)_

---

**Q42.** Chain of thought prompting HURTS performance when:

A) The task requires multi-step reasoning
B) The task is simple classification (positive/negative/neutral) at high volume
C) The task involves calculations
D) The answer must be verified before delivery

> _(write here)_

---

**Q43.** You want Claude to write a formal legal memo. The most important prompt element for achieving the correct tone is:

A) `temperature: 0` for consistent output
B) A detailed role definition: "You are a senior partner at a prestigious law firm writing for a federal judge"
C) The constraint "use formal language"
D) A stop_sequence at the end of the memo

> _(write here)_

---

**Q44.** A system prompt has 50 rules. Rule 23 says "never use passive voice." Claude occasionally uses passive voice. The most likely cause is:

A) Claude doesn't understand what passive voice is
B) Rule 23 is buried in the middle of the prompt — attention is weakest in the middle of long prompts
C) The rule needs to be stated more firmly
D) Passive voice is impossible to prevent with prompting

> _(write here)_

---

**Q45.** Which task should use prose output (not structured JSON)?

A) Classifying support tickets into categories
B) Extracting invoice line items for database entry
C) Answering "should I pivot my product from B2C to B2B?" for a founder
D) Detecting sentiment in product reviews

> _(write here)_

---

**Q46.** A few-shot example set has 4 examples. One example is an edge case that differs significantly from the other 3. Claude now produces output matching the edge case for 40% of inputs (most should match the other 3). What is happening?

A) The edge case example is confusing Claude about the task
B) Claude is averaging all 4 examples equally — the edge case has too much weight
C) The other 3 examples are poorly written
D) Claude needs more examples to overcome the edge case confusion

> _(write here)_

---

**Q47.** `temperature: 0` is most appropriate for:

A) Creative product description writing
B) JSON data extraction from documents
C) Brainstorming feature ideas
D) Writing engaging marketing copy

> _(write here)_

---

**Q48.** You want to prevent Claude from adding disclaimers to every response. The most effective negative prompt is:

A) "Don't add unnecessary content"
B) "Do not add disclaimers, caveats, or suggestions to consult professionals unless the user has specifically asked for them"
C) "Be direct"
D) "Keep it short"

> _(write here)_

---

**Q49.** Claude returns `{"confidence": "high"}` when you needed `{"confidence": 0.87}`. What prompt change fixes this?

A) Add "confidence must be a number"
B) Add "confidence: a float between 0.0 and 1.0. Example correct: 0.87. Example incorrect: 'high'. Do not use string values for this field."
C) Use assistant prefill to force numeric format
D) Both B and C

> _(write here)_

---

**Q50.** A complex analysis requires Claude to reason through 5 steps before reaching a conclusion. You want the user to see only the final recommendation. The correct pattern is:

A) Ask Claude to summarise its reasoning after completing the full analysis
B) Use scratchpad pattern: `<thinking>` for reasoning (hidden), `<answer>` for final output (shown)
C) Use two separate API calls: one for reasoning, one for the formatted conclusion
D) Both B and C are valid — B is simpler, C gives you the reasoning for logging

> _(write here)_

---

**Q51.** Which is the correct characterisation of prompt injection?

A) A vulnerability where attackers inject code into Claude's training data
B) An attack where user input attempts to override or bypass system prompt instructions
C) A technique for improving prompt performance through iteration
D) An error that occurs when the system prompt is too long

> _(write here)_

---

## SECTION E — Context Management & Reliability (15%)

**Q52.** Prompt caching has a 5-minute TTL. Your system makes API calls every 8 minutes. What is the effective cache hit rate?

A) 50%
B) 75%
C) ~0% — cache expires between every call
D) 100% — cache persists for the session

> _(write here)_

---

**Q53.** A customer support agent's responses start referencing previous customers' account details after 300 turns of operation. The most likely cause is:

A) Claude is accessing a shared database
B) The messages array is not being reset between customer sessions
C) The system prompt has become corrupted
D) The knowledge base contains previous customer data

> _(write here)_

---

**Q54.** For a 5,000-token system prompt with 1,000 API calls/day (Sonnet pricing, $3/M input tokens), the monthly cost WITHOUT caching is:

A) ~$45/month
B) ~$450/month
C) ~$4,500/month
D) ~$45,000/month

> _(write here)_

---

**Q55.** You implement `cache_control: {"type": "ephemeral"}` on your system prompt. On the second API call (30 seconds after the first), you see `cache_read_input_tokens: 0`. What happened?

A) The cache is working — 0 means it's using the cached version for free
B) The cache is NOT working — cache reads show the cached token count, not 0
C) The cache write failed on the first call
D) Caching is not available for system prompts

> _(write here)_

---

**Q56.** A long-running agent session must be paused and resumed 4 hours later. The most appropriate handoff pattern is:

A) Save the complete raw messages array and load it on resume
B) Create a structured state object with only the essential progress information and restart with fresh context
C) Summarise the entire session into one message and prepend to new messages
D) Both B and C — structured state for recent progress, summary for historical context

> _(write here)_

---

**Q57.** Claude returns a response with `stop_reason: "max_tokens"` when the expected response length is 200 tokens and `max_tokens` is set to 150. The correct fix is:

A) Reduce the complexity of the prompt to get shorter responses
B) Increase `max_tokens` to at least 250 (buffer above expected length)
C) Add "respond in under 150 tokens" to the system prompt
D) Switch to a model with a larger output window

> _(write here)_

---

**Q58.** Confidence calibration monitoring shows your 0.9+ confidence responses are only right 60% of the time. This means:

A) Claude is not well-calibrated — recalibrate routing thresholds downward
B) Your ground truth verification is incorrect
C) 60% accuracy at 0.9 confidence is expected and acceptable
D) Increase the confidence threshold to 0.95

> _(write here)_

---

**Q59.** A multi-turn conversation has 30 turns. Each turn is 200 tokens. The system prompt is 1,000 tokens. What is the approximate input token count for Turn 30?

A) 1,200 tokens
B) 7,000 tokens
C) 8,000 tokens
D) 13,000 tokens

> _(write here)_

---

**Q60.** Which handoff pattern is most appropriate for transferring findings from a 50-turn research agent to a writing agent?

A) Pass the complete 50-turn messages array
B) Pass only the final answer from Turn 50
C) Extract a structured state object (confirmed facts, constraints, open questions) from across all 50 turns
D) Summarise the last 10 turns only

> _(write here)_

---

## Answer Key

| Q | A | Q | A | Q | A | Q | A |
|---|---|---|---|---|---|---|---|
| 1 | B | 16 | B | 31 | B | 46 | B |
| 2 | C | 17 | B | 32 | B | 47 | B |
| 3 | D | 18 | B | 33 | A | 48 | B |
| 4 | B | 19 | D | 34 | B | 49 | D |
| 5 | B | 20 | B | 35 | B | 50 | D |
| 6 | B | 21 | B | 36 | C | 51 | B |
| 7 | B | 22 | B | 37 | B | 52 | C |
| 8 | B | 23 | C | 38 | C | 53 | B |
| 9 | B | 24 | B | 39 | B | 54 | B |
| 10 | B | 25 | B | 40 | D | 55 | B |
| 11 | B | 26 | D | 41 | B | 56 | D |
| 12 | B | 27 | C | 42 | B | 57 | B |
| 13 | C | 28 | B | 43 | B | 58 | A |
| 14 | C | 29 | B | 44 | B | 59 | C |
| 15 | B | 30 | A | 45 | C | 60 | C |

---

## Score Interpretation

| Score | Assessment | Action |
|---|---|---|
| 54-60 (90%+) | Exam ready | Schedule your exam |
| 48-53 (80-89%) | Strong — minor gaps | Review wrong answers by domain |
| 42-47 (70-79%) | Near ready | Deep review of weakest domain |
| 36-41 (60-69%) | Needs work | Re-study weeks with most wrong answers |
| Below 36 | Not ready | Full curriculum review |

---

## Wrong Answer Analysis Template

For each wrong answer, complete this:

**Q[N]:** _(your wrong answer)_ → _(correct answer)_
**Why my answer was wrong:** _(write)_
**Why the correct answer is right:** _(write)_
**Key principle to remember:** _(write)_

> _(write all wrong answers here)_

---

## Domain Score Breakdown

| Domain | Questions | My Score | % |
|---|---|---|---|
| D1: Agentic Architecture | Q1-16 | /16 | % |
| D2: Tool Design & MCP | Q17-27 | /11 | % |
| D3: Claude Code | Q28-39 | /12 | % |
| D4: Prompt Engineering | Q40-51 | /12 | % |
| D5: Context & Reliability | Q52-60 | /9 | % |
| **Total** | **60** | **/60** | **%** |

Focus your final review time on your lowest domain score.

---

## Status

- [ ] All 60 questions answered (untimed first attempt)
- [ ] Timed attempt (90 minutes)
- [ ] Answer key checked
- [ ] Wrong answers analysed
- [ ] Domain scores calculated
- [ ] Weakest domain identified for final review

---

## Coming Up — Week 12, Day 2 onwards

**Review your weakest domain.** Go back to the relevant week's lessons and re-read the answer guides. Then re-attempt the questions you got wrong without looking at the answers.

**Apply for the exam:** claudecertifications.com → Claude Partner Network (free) → Schedule proctored exam.

**You are ready.** 🎓

---

*CCA Self-Study Log · Asif · Phase 5 of 5 · Week 12 of 12*
