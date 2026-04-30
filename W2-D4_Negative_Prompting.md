# CCA Self-Study — Week 2, Day 4
## Negative Prompting

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Claude has default behaviours — things it does automatically unless told otherwise. It adds caveats. It writes introductory paragraphs. It hedges uncertain claims. It suggests consulting a professional. It uses bullet points for lists. It offers to help with follow-up questions.

These defaults are helpful in general conversation. In production systems, they are often noise that breaks your output format, inflates token cost, and makes your validation logic fail.

**Negative prompting** is the practice of explicitly telling Claude what NOT to do — eliminating defaults that don't serve your system.

---

## The Analogy — A New Employee's Default Behaviours

Imagine a new employee joins your team. They have good instincts — they follow up on everything, document every decision, CC everyone on emails, add a friendly greeting to every message.

These are good defaults in most offices. But you run a startup that prizes speed. You tell them:
- *"Don't CC the whole team on every email — only the people directly involved."*
- *"Don't add a greeting paragraph to internal Slack messages — just the content."*
- *"Don't create a document for every decision — only for decisions above $10,000."*

You're not saying they're bad. You're eliminating defaults that don't fit your context.

Claude is the new employee. Your negative prompts are the onboarding instructions.

---

## Claude's Common Defaults (and When They're Problems)

| Default behaviour | When it's a problem |
|---|---|
| Adds disclaimer ("I am not a lawyer...") | When your system already has legal disclaimers built in |
| Writes an introductory paragraph | When you're extracting structured data — the intro breaks your parser |
| Hedges with "however," "on the other hand" | When you need decisive recommendations, not balanced analysis |
| Offers to help further ("Let me know if you have questions") | When output feeds into a pipeline — the offer adds noise |
| Uses markdown (bold, headers, bullets) | When output is displayed in plain text environments |
| Asks clarifying questions | When you need a response, not a dialogue |
| Provides multiple options | When you need one specific answer |

---

## How to Write Effective Negative Prompts

### Rule 1: Be specific, not general

```
❌ Weak: "Don't add unnecessary content."
   → Claude decides what's "unnecessary" — same result

✅ Strong: "Do not write an introduction paragraph. 
            Begin your response with the first bullet point."
```

### Rule 2: State the consequence

```
✅ Even stronger: "Do not write an introduction paragraph. 
                   Begin your response with the first bullet point.
                   Any text before the first bullet will cause a parsing error."
```

Claude responds to context. Knowing *why* a constraint exists often makes it more reliable.

### Rule 3: Pair negatives with positives

```
❌ Only negative: "Don't give balanced views."
✅ Paired: "Do not give balanced views. Give one clear recommendation 
            based on the data provided."
```

Negative prompts remove behaviours. Positive prompts specify what replaces them. Use both together.

### Rule 4: Put critical negatives at the end of the system prompt

Claude's attention is strongest at the beginning and end of its context. Bury a critical "do not" in the middle of a long system prompt and it may be missed. Put it at the end, immediately before the user message.

---

## Negative Prompting for Structured Output

This is where negative prompting earns its keep in production systems.

When you need pure JSON output, Claude's defaults actively break your parser:

```
❌ Without negative prompting, Claude might output:

"Sure! Here's the analysis you requested in JSON format:

```json
{
  "sentiment": "positive",
  "score": 0.87
}
```

Let me know if you'd like a different format!"
```

Every word outside the JSON object breaks `JSON.parse()`.

```
✅ With negative prompting:

System: "Output ONLY valid JSON. No introduction. No explanation.
         No markdown code fences. No text after the closing brace.
         Your entire response must be parseable by JSON.parse()."

Output:
{"sentiment": "positive", "score": 0.87}
```

---

## The "Not" Problem — A Subtle Trap

Here's something counterintuitive: Claude sometimes processes negative instructions by first activating the concept, then suppressing it. Saying *"don't think about pink elephants"* briefly makes you think about pink elephants.

For critical constraints, rephrase negatives as positives where possible:

```
❌ "Don't be verbose."
✅ "Be concise. Maximum 2 sentences."

❌ "Don't use technical jargon."
✅ "Use plain English suitable for a 10-year-old."

❌ "Don't give medical advice."
✅ "Direct all medical questions to: 'Please consult your healthcare provider.'"
```

The positive framing tells Claude exactly what to do, rather than what to suppress.

---

## Key Concepts Learned Today

| Term | Definition |
|---|---|
| Default behaviours | Things Claude does automatically unless told otherwise |
| Negative prompting | Explicitly instructing Claude what NOT to do |
| Positive framing | Rephrasing negatives as positive instructions for reliability |
| Output cleanliness | Ensuring Claude's response contains only what your system needs |
| Parsing safety | Designing prompts so Claude output is always machine-readable |

---

## Hands-On Task 🛠️

**Task:** Get Claude to output a pure JSON object with zero extra text.

**Step 1:** Ask Claude WITHOUT negative prompting:
> *"Analyse this review and return sentiment. Review: 'The product broke after two days, terrible quality.' Return: {sentiment, confidence_score, key_issue}"*

Note how much extra text wraps the JSON.

**Step 2:** Add negative prompting to eliminate every piece of extra text. Iterate until `JSON.parse(claude_output)` would succeed without any pre-processing.

**Step 3:** Try this edge case — add to your prompt: *"Even if you're uncertain, output the JSON."* Test with an ambiguous review: *"It's... fine I guess."*

**Your iterations and final prompt:**
> _(write here)_

---

## Q&A — Self-Assessment

---

**Q1.** What is a "default behaviour" in Claude, and why do they exist? Give two examples of defaults that are helpful in chat but harmful in a production pipeline.

> **Your answer:**
> _(write here)_

---

**Q2.** You want Claude to always give ONE recommendation — not a list, not pros/cons, just one clear choice. Write the negative and positive instructions you'd include in your system prompt.

> **Your answer:**
> _(write here)_

---

**Q3.** Why is *"Don't be verbose"* a weaker instruction than *"Maximum 2 sentences per response"?* What is the difference in how Claude processes each?

> **Your answer:**
> _(write here)_

---

**Q4.** Your pipeline extracts Claude's JSON output with `response.content[0].text` and immediately parses it. Claude keeps occasionally adding a sentence after the closing brace. Write the specific system prompt instructions that eliminate this.

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Scenario.** You're building a children's educational app. Claude is the tutor. You need to ensure Claude never discusses violence, politics, adult relationships, or anything off-curriculum. Write the negative prompting section of your system prompt, using both negative and positive framing techniques from today's lesson.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Q1 — Default behaviours**

Default behaviours are Claude's trained tendencies — what it does when your prompt doesn't specify otherwise. They exist because Claude was trained on human communication patterns where these behaviours are generally positive. Humans appreciate caveats, hedging, offers to help further, and balanced analysis.

**Two examples harmful in production pipelines:**

1. **Disclaimer addition:** Claude adds *"Please note I am not a financial advisor"* — useful in a chat product, but it breaks JSON parsing when your pipeline expects `{"recommendation": "buy"}` and gets a paragraph of caveats instead.

2. **Clarifying question:** Claude asks *"Could you provide more context about your situation?"* — helpful in a conversation, but in an automated pipeline there's no human to answer the question. The pipeline stalls.

---

**Q2 — One recommendation, no lists**

```
Negative: "Do not provide lists, pros and cons, or multiple options. 
           Do not use the phrases 'it depends,' 'on the other hand,' or 'alternatively.'"

Positive: "Give exactly one recommendation. State it in the first sentence. 
           Follow with one sentence of justification. Nothing else."
```

The pairing is important — the negative removes Claude's default (balanced options), and the positive specifies exactly what replaces it.

---

**Q3 — "Don't be verbose" vs "Maximum 2 sentences"**

*"Don't be verbose"* is relative — Claude decides what counts as verbose. A response Claude considers appropriately detailed might have 8 sentences. Without an absolute benchmark, Claude uses its own judgment, which varies.

*"Maximum 2 sentences"* is absolute and measurable. Claude can count sentences. You can validate with code: `len(response.split('.')) <= 2`. There's no ambiguity about what compliance looks like.

Architect principle: Good constraints are checkable. If you can't write code to verify compliance, your constraint is too vague.

---

**Q4 — Eliminate text after closing brace**

```
"Your entire response must consist of exactly one valid JSON object.
Start your response with '{'. End your response with '}'.
Do not write any text before the opening brace or after the closing brace.
Do not wrap the JSON in markdown code fences (no backticks).
Do not add explanations, summaries, or follow-up offers.
Every character in your response must be part of the JSON object."
```

The redundancy is intentional — state the same constraint multiple ways to reinforce it. For machine-to-machine output, over-specifying is better than under-specifying.

---

**Q5 — Children's educational app system prompt**

```
You are Milo, a friendly tutor for children aged 6–10 learning basic maths and reading.

TOPICS YOU COVER:
- Addition, subtraction, multiplication, division at elementary level
- Phonics, spelling, and basic reading comprehension
- Encouraging children to try again when they get something wrong

WHAT TO DO WHEN ASKED ANYTHING ELSE:
If a child asks about anything outside maths and reading, say exactly:
"That's a great question! Let's keep our focus on [maths/reading] today. 
What would you like to practise?"

Do not engage with, explain, or acknowledge questions about:
violence, weapons, news events, relationships, adult topics, or any topic 
not directly related to elementary maths or reading.

Redirect, don't refuse. Children should always feel safe and encouraged.
Use language a 6-year-old can understand. Maximum 2 sentences per response.
Always end with an encouraging phrase or a question that continues the lesson.
```

Note the pattern: specify what TO do (redirect with exact phrasing), specify what NOT to engage with (list of off-limit topics), and give Claude a positive replacement behaviour (redirect rather than refuse).

---

## Status

- [ ] Concept read and understood
- [ ] Step 1 completed (without negative prompting)
- [ ] Step 2 completed (iterated to clean JSON)
- [ ] Step 3 completed (edge case tested)
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Day 5 started — Prompt Iteration Practice

---

## Coming Up — Week 2, Day 5

**Topic:** Prompt Iteration Practice
The full iteration workflow applied to a real problem. You'll take one weak prompt and improve it through 5 structured iterations — learning to diagnose and fix prompt failures systematically.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 2 of 12*
