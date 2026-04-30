# CCA Self-Study — Week 2, Day 5
## Prompt Iteration Practice

**Date completed:** _____________
**Study time:** 30–45 mins
**Curriculum phase:** Phase 1 — Claude Fundamentals
**Exam domain:** Domain 4 · Prompt Engineering & Structured Output

---

## Core Concept

Today is a pure practice day. No new concepts. You apply everything from Week 2 — the 5 elements, role prompting, CoT, negative prompting — in a structured iteration workflow on a real-world problem.

This is the most important skill in prompt engineering: **systematic diagnosis and iteration**. Most prompt engineers try random changes and hope something works. Architects iterate with intention — changing one element at a time, reading output as feedback, and converging on a reliable solution.

---

## The Iteration Workflow (Memorise This)

```
1. OBSERVE — What exactly is wrong with the output?
             (Too long? Wrong format? Missing info? Off-topic? Hallucinated?)

2. DIAGNOSE — Which element caused it?
              (Role? Task? Context? Format? Constraint? CoT missing?)

3. HYPOTHESISE — What specific change would fix it?
                 (Be precise — "I'll add a length constraint of 2 sentences")

4. CHANGE — Make ONE change only

5. TEST — Run the new prompt

6. COMPARE — Is the output better? Worse? Different problem?

7. REPEAT — Until output matches intent
```

---

## The Prompt to Iterate

**Scenario:** You're building an iOS app review responder. App store reviews come in, and Claude needs to respond to each one in a way that:
- Sounds human and empathetic
- Addresses the specific issue mentioned
- Includes a CTA (call to action) to contact support for serious issues
- Fits within App Store character limits (500 chars)
- Never promises features that don't exist

**Starting (weak) prompt:**
> *"Respond to this app review."*

**Test review:**
> *"This app crashes every time I try to upload a photo. I've tried reinstalling three times. 1 star."*

---

## Your 5 Iterations

Work through each iteration yourself before reading the Answer Guide.

### Iteration 1
**Problem identified in current output:** _(observe and write)_
**Element to fix:** _(diagnose)_
**Change made:** _(hypothesise and write new prompt)_
**Result:** _(test and observe)_

> _(write here)_

### Iteration 2
**Problem identified:** _(observe)_
**Element to fix:** _(diagnose)_
**Change made:** _(write updated prompt)_
**Result:** _(observe)_

> _(write here)_

### Iteration 3
**Problem identified:** _(observe)_
**Element to fix:** _(diagnose)_
**Change made:** _(write updated prompt)_
**Result:** _(observe)_

> _(write here)_

### Iteration 4
**Problem identified:** _(observe)_
**Element to fix:** _(diagnose)_
**Change made:** _(write updated prompt)_
**Result:** _(observe)_

> _(write here)_

### Iteration 5 — Final
**Your final prompt:**
> _(write the complete, final prompt here)_

**Final output:**
> _(write Claude's response here)_

---

## What "Good" Looks Like

A successful final response to the test review should:
- [ ] Be under 500 characters
- [ ] Address the photo upload crash specifically
- [ ] Sound like a real human, not a bot
- [ ] Include a CTA for support
- [ ] Not promise a fix ("We'll fix this in the next update" is a bad promise)
- [ ] Not use generic phrases like "We're sorry for the inconvenience"

---

## Q&A — Self-Assessment

These questions test your understanding of the iteration process, not just your final prompt.

---

**Q1.** During your iterations, which element had the biggest impact on output quality? Why do you think that element was the highest-leverage change?

> **Your answer:**
> _(write here)_

---

**Q2.** If you had changed two things simultaneously in one iteration — how would you know which change caused the improvement?

> **Your answer:**
> _(write here)_

---

**Q3.** Your final prompt works perfectly for the test review. But in production, 500 different reviews come in — different languages, different issues, different tones. What's the risk, and how would you test for it?

> **Your answer:**
> _(write here)_

---

**Q4.** You want to make this system bulletproof for the App Store review responder. What would you add to your prompt to handle these edge cases:
- A 5-star review with no text
- A review written entirely in Japanese
- A review that contains profanity

> **Your answer:**
> _(write here)_

---

**Q5 — Architect Reflection.** You've now spent a week on prompt engineering. In a production Claude system, what percentage of your engineering effort do you think should be spent on the prompt vs on code (validation, error handling, retry logic)? Justify your answer.

> **Your answer:**
> _(write here)_

---

## Answer Guide — Claude's Reference Answers

---

**Sample Iteration Path**

Here's one way the iterations might progress. Yours may differ — there's no single correct path.

**Starting prompt:** *"Respond to this app review."*
**Starting output:** Generic, long, promises a fix, uses "We're sorry for the inconvenience"

**Iteration 1 — Add role + task:**
```
You are a customer support specialist for a mobile app company.
Write a response to this App Store review that addresses the user's specific issue.

Review: [review text]
```
*Output improved — more focused, but still too long and generic.*

**Iteration 2 — Add format constraint:**
```
[previous prompt]
Keep your response under 500 characters.
```
*Output now fits the character limit but uses "We're sorry for the inconvenience."*

**Iteration 3 — Add negative prompting:**
```
[previous prompt]
Do not use the phrase "We're sorry for the inconvenience" or similar generic apologies.
Do not promise fixes or feature releases.
```
*Output improved — more specific, but doesn't include support CTA.*

**Iteration 4 — Add missing element (CTA):**
```
[previous prompt]
Always end with a call to action directing the user to contact support at support@yourapp.com
for urgent technical issues like crashes.
```
*Output now includes CTA. Still sounds slightly robotic.*

**Iteration 5 — Add tone guidance + few-shot:**
```
You are a customer support specialist for a mobile app company.
Respond to App Store reviews with empathy and specificity.

Rules:
- Under 500 characters total
- Address the specific issue mentioned (crashes, bugs, feature requests)
- Sound like a real human — warm but professional
- For technical issues: include "Email us at support@yourapp.com — we'll fix this for you"
- Never promise feature releases or fix timelines
- Never use: "We're sorry for the inconvenience," "We value your feedback," 
  or "Thank you for your review"

Example of a good response to a crash report:
"Crashes on photo upload — that's on us, not you. We've seen this on a few devices 
and our team is actively working on it. Email support@yourapp.com and we'll personally 
make sure your account is sorted. Sorry this happened."

Now respond to this review:
[review text]
```

---

**Q1 — Highest-leverage element**

Usually **negative prompting** has the highest impact on output quality for structured production systems. Why? Because Claude's default behaviours (generic apologies, promises, long responses) actively break the output requirements. Removing the defaults unlocks the value that role and task prompting created.

Your mileage may vary — if your starting prompt had no role, adding role might have been your biggest improvement. The pattern to notice: the highest-leverage change is always the one that removes the biggest gap between Claude's defaults and your requirements.

---

**Q2 — Why change one thing at a time**

If you change two things simultaneously and the output improves — you don't know which change caused it. If the output gets worse — you don't know which change broke it. You might delete a good change while trying to undo a bad one.

One change per iteration means every improvement is attributed. Over 5 iterations, you build a cause-effect map of what each element does to your specific output. This knowledge compounds — you get better at diagnosing prompt problems the more iterations you complete.

---

**Q3 — Testing against 500 real reviews**

The risk is **distribution shift** — your prompt was optimised for one test case. Edge cases include: 5-star positive reviews (does the CTA instruction still apply?), very short reviews ("Great app!"), reviews in other languages, reviews that mention multiple issues, reviews with profanity.

**How to test:**
1. Collect 50–100 real reviews with diverse characteristics
2. Run your prompt against all of them
3. Build a simple rubric (the checklist from "What Good Looks Like")
4. Score each output — flag ones that fail any rubric criterion
5. Look for patterns in failures — which type of input most often breaks your prompt
6. Fix the prompt for the most common failure pattern and re-test

In production: add automated checks for response length and banned phrases. Route responses that fail checks to human review before posting.

---

**Q4 — Edge case handling**

```
Edge case handling (add to system prompt):

- If the review has no text (only a star rating): 
  Respond with: "Thanks for the rating! If you ever have feedback or 
  run into issues, we'd love to hear from you at support@yourapp.com"
  
- If the review is not in English: 
  Detect the language and respond in the same language. 
  Apply all other rules identically.
  
- If the review contains profanity: 
  Respond to the underlying issue professionally. 
  Do not acknowledge or reference the profanity.
  Do not mirror aggressive language.
```

The principle: anticipate every input variant and specify exactly what Claude should do in each case. Unhandled edge cases are where production systems fail.

---

**Q5 — Prompt vs code effort**

A thoughtful answer acknowledges both sides:

**The case for more prompt effort (30–40%):** A well-designed prompt prevents problems before they occur. Every failure mode you design out of the prompt is one you don't need to handle in code. Prompt quality is a force multiplier — it reduces the validation and retry logic needed downstream.

**The case for more code effort (60–70%):** Prompts are probabilistic. No matter how good your prompt is, Claude will occasionally produce output that doesn't match your intent. Code-based validation, retry logic, and error handling are deterministic — they always catch failures. Production reliability cannot depend on Claude always getting it right.

**Balanced architect answer:** Invest heavily in prompt quality to minimise failure rate, then build code-based validation and retry logic to catch the failures that remain. The ratio depends on the application — high-stakes systems (medical, legal, financial) need more code-side validation; lower-stakes systems (creative tools, summaries) can rely more on prompt quality.

Neither alone is sufficient. Both are required.

---

## Week 2 Complete — What You Now Know

| Day | Concept | Architect skill |
|---|---|---|
| D1 | 5 elements of strong prompts | Removing ambiguity systematically |
| D2 | Role prompting & persona | Activating specialist patterns reliably |
| D3 | Chain of Thought | When reasoning improves accuracy vs adds cost |
| D4 | Negative prompting | Eliminating Claude's defaults that break pipelines |
| D5 | Prompt iteration | Diagnosing and fixing prompt failures systematically |

---

## Status

- [ ] All 5 iterations completed
- [ ] Final prompt tested against the checklist
- [ ] Q1 answered
- [ ] Q2 answered
- [ ] Q3 answered
- [ ] Q4 answered
- [ ] Q5 answered
- [ ] Answer guide reviewed
- [ ] Week 3 ready to start 🎉

---

## Coming Up — Week 3, Day 1

**Topic:** Few-Shot Examples
Why giving Claude examples of what you want often outperforms instructions alone. How to choose good examples. The difference between few-shot for format vs few-shot for reasoning.

---

*CCA Self-Study Log · Asif · Phase 1 of 5 · Week 2 of 12*
