# Shipmate AI Benchmark Specification
**Version:** 0.1 — Draft  
**Purpose:** Objectively evaluate AI model performance on Shipmate's inference tasks; double as a labeled fine-tuning dataset for a future open-weight model.

---

## 1. Goals

1. Replace subjective capability scores with real pass/fail data on real games.
2. Identify which model performs best on each task type, not in aggregate.
3. Track regression when swapping models or adjusting system prompts.
4. Accumulate labeled examples for eventual fine-tuning of an open-weight model (Qwen 27B range).

---

## 2. Task Taxonomy

Six task types, each tested independently. A model scores on each separately — a strong screenshot model that's weak on structured questionnaires shouldn't be hidden by an aggregate score.

| ID | Task | Input type | Output type |
|----|------|-----------|-------------|
| T1 | Content rating classification | Game metadata text | Structured age rating + descriptors |
| T2 | Data collection disclosure | App capabilities + feature description | Structured privacy checklist |
| T3 | Business category classification | Game metadata text | Category enum + confidence |
| T4 | Screenshot quality & compliance | Screenshot image | Structured quality + compliance flags |
| T5 | Plist / entitlement inference | Extracted plist XML / entitlements text | Structured capability flags + submission notes |
| T6 | Edge-case guideline reasoning | Scenario description text | Reasoning trace + binary decision |

---

## 3. Dataset Size Targets

| Phase | Examples per task | Total labeled examples | Use |
|-------|------------------|-----------------------|-----|
| Pilot | 10 | 60 | Catch obviously wrong models, calibrate scoring |
| V1 benchmark | 50 | 300 | Statistically meaningful comparisons |
| Fine-tune ready | 200+ | 1,200+ | Enough to fine-tune a 7–27B model |

Start with the 10-example pilot using games you've already shipped or know well.  
V1 is the target before making any model switch decision.

---

## 4. Input Schemas

### T1 — Content Rating

```json
{
  "task": "content_rating",
  "platform": "ios" | "android" | "steam",
  "input": {
    "title": "string",
    "genre": "string",
    "description": "string (store description, ≤500 words)",
    "features": ["in_app_purchases", "online_multiplayer", ...],
    "developer_notes": "string (optional — edge-case context)"
  }
}
```

### T2 — Data Collection Disclosure

```json
{
  "task": "data_collection",
  "platform": "ios" | "android",
  "input": {
    "feature_list": ["account_creation", "analytics", "crash_reporting", ...],
    "third_party_sdks": ["Firebase", "Adjust", ...],
    "developer_notes": "string (optional)"
  }
}
```

### T3 — Business Category

```json
{
  "task": "business_category",
  "platform": "ios" | "android" | "steam",
  "input": {
    "title": "string",
    "description": "string",
    "tags": ["string"]
  }
}
```

### T4 — Screenshot Analysis

```json
{
  "task": "screenshot_analysis",
  "platform": "ios" | "android" | "steam",
  "input": {
    "image": "<base64 or URL>",
    "device_context": "6.7in iPhone" | "tablet" | ...,
    "slot_position": 1..10,
    "existing_screenshots": 3
  }
}
```

### T5 — Plist / Entitlement Inference

```json
{
  "task": "plist_inference",
  "platform": "ios",
  "input": {
    "info_plist": "string (full XML)",
    "entitlements": "string (XML, optional)",
    "embedded_frameworks": ["string"],
    "developer_notes": "string (optional)"
  }
}
```

### T6 — Edge-Case Guideline Reasoning

```json
{
  "task": "guideline_reasoning",
  "platform": "ios" | "android" | "steam",
  "difficulty": "easy" | "medium" | "hard",
  "input": {
    "scenario": "string (describe the specific feature/content/situation)",
    "question": "string (the binary or short-answer question)"
  }
}
```

---

## 5. Expected Output Schemas

### T1 — Content Rating (iOS example)

```json
{
  "rating": "4+" | "9+" | "12+" | "17+",
  "descriptors": ["Infrequent/Mild Cartoon Violence", ...],
  "reasoning": "string (1–3 sentences)",
  "confidence": "high" | "medium" | "low"
}
```

### T2 — Data Collection

```json
{
  "collects_data": true | false,
  "categories": {
    "contact_info": true | false,
    "identifiers": true | false,
    "usage_data": true | false,
    "diagnostics": true | false,
    "location": true | false,
    "purchases": true | false
  },
  "linked_to_identity": true | false,
  "used_for_tracking": true | false,
  "reasoning": "string"
}
```

### T3 — Business Category

```json
{
  "primary_category": "string (e.g. Games > Action)",
  "secondary_category": "string | null",
  "reasoning": "string"
}
```

### T4 — Screenshot Analysis

```json
{
  "compliance": {
    "passes": true | false,
    "flags": ["overlapping_device_frame", "text_too_small", ...]
  },
  "quality_score": 1..5,
  "quality_notes": "string",
  "recommendation": "keep" | "revise" | "replace"
}
```

### T5 — Plist Inference

```json
{
  "capabilities_detected": ["push_notifications", "icloud", "in_app_purchase", ...],
  "required_privacy_keys": ["NSCameraUsageDescription", ...],
  "submission_risks": ["string"],
  "reasoning": "string"
}
```

### T6 — Edge-Case Reasoning

```json
{
  "decision": "yes" | "no" | "requires_review",
  "reasoning": "string (detailed)",
  "relevant_guideline": "string (section reference if known)",
  "confidence": "high" | "medium" | "low"
}
```

---

## 6. Scoring Methodology

### Structured tasks (T1–T5): field-level accuracy

Score each field independently, then average. Don't collapse to pass/fail — a model that gets the age rating right but misses one descriptor is better than one that misses both.

| Field type | Scoring |
|-----------|---------|
| Enum (rating, category, decision) | 1 = exact match, 0 = wrong |
| Boolean (collects_data, linked_to_identity) | 1 = correct, 0 = wrong |
| Array (descriptors, capabilities, flags) | F1 score (precision × recall) |
| Confidence | Bonus: +0.1 if confidence = "high" and model is correct, −0.1 if "high" and wrong |

**Task score** = mean of field scores across all examples for that task.

### Reasoning task (T6): human-graded

Binary decision scored as above. Reasoning string scored by a human reviewer on a 1–3 scale:
- 3 = correct guideline identified, clear chain of logic
- 2 = correct conclusion but vague or incomplete reasoning
- 1 = wrong or no meaningful reasoning

**T6 score** = (decision accuracy × 0.6) + (reasoning quality / 3 × 0.4)

### Latency

Record p50 and p95 wall-clock time per call for each model. Report separately — don't fold into accuracy score, since speed/accuracy tradeoff is a product decision.

---

## 7. Difficulty Tiers

Each example gets a difficulty tag. Report scores broken down by tier.

| Tier | Description | Example |
|------|-------------|---------|
| Easy | Unambiguous, textbook case | Puzzle game, no violence, no IAP → 4+ |
| Medium | One ambiguous element | Cartoon violence + mild language — 9+ or 12+? |
| Hard | Platform-specific edge case, jurisdiction overlap, or unusual feature combination | Loot boxes + social features + location in EU → multiple policy sections collide |

Target mix for V1: 50% easy, 35% medium, 15% hard.  
Hard examples are most predictive of real-world failure — weight them more in your model-selection decision.

---

## 8. Dataset Collection Plan

### Sources (in priority order)

1. **Your shipped games** — you know the correct answers. Start here.
2. **Public App Store listings** — extract metadata + actual ratings as ground truth.
3. **Synthetic edge cases** — you write the scenario, a domain expert (or lawyer) confirms the correct answer. Tag as synthetic.
4. **Real Shipmate submissions** — once in production, flag disagreements between model output and what the developer confirmed as correct for review.

### Labeling format

One JSON file per example:

```
benchmark/
  t1_content_rating/
    001_easy.json
    002_medium.json
    ...
  t4_screenshot/
    001_easy/
      input.json
      screenshot.png
  ...
```

Each file: `{ "id": "t1_001", "difficulty": "easy", "input": {...}, "expected": {...}, "source": "shipped|public|synthetic", "notes": "string" }`

---

## 9. Running the Benchmark

```bash
# Pseudocode — implement in Python or Node

for model in [claude_sonnet_5, gemini_flash, qwen_27b, ...]:
  for example in benchmark_dataset:
    response = model.infer(system_prompt, example.input)
    scores[model][example.task] = score(response, example.expected)
    latency[model][example.id] = response.wall_time

report(scores, latency)
```

Use the same system prompt for all models on each task — the prompt itself is a variable you can iterate on separately. Keep a prompt version alongside each benchmark run.

---

## 10. Fine-Tuning Readiness

Once you have 200+ examples per task (1,200+ total):

- Format: OpenAI-compatible JSONL (`{"messages": [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", ...}]}`)
- Split: 80% train / 10% validation / 10% held-out test (never use held-out for training or prompt iteration)
- Recommended base model for first fine-tune: **Qwen2.5-32B-Instruct** (strong reasoning baseline, feasible to host on 2×A100 or 4×A10G)
- The benchmark dataset becomes your eval harness — fine-tuned model must beat base model by >5 points on the hard tier to justify the infrastructure cost

---

## 11. What to Build Next

1. **Pilot dataset** (10 examples per task, 60 total) — use shipped games you know cold
2. **Benchmark runner script** (Python, ~100 lines) — call each model API, record output + latency
3. **Score reporter** (simple HTML or CSV) — per-task, per-difficulty breakdown
4. **Prompt library** — one system prompt per task, versioned alongside benchmark runs

The benchmark runner and prompt library are the two most valuable things to build early — they make every future model evaluation a one-command operation instead of a manual exercise.
