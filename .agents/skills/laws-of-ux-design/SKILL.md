---
name: laws-of-ux-design
description: Design, redesign, and audit web or mobile interfaces using Laws of UX for navigation, visual hierarchy, forms, and flows. Use for usability, friction, cognitive load, or requests about Jakob's, Hick's, Fitts's, and other principles in the collection. Do not trigger UX audits for backend changes or fixes with no interaction impact.
---

# Laws of UX for Design

Turn principles of perception, learning, and behavior into verifiable interface decisions. Respond in the user's language and preserve the product's visual identity, audience, and constraints.

The foundation is [Laws of UX](https://lawsofux.com/), Jon Yablonski's collection. It includes 30 entries verified on October 23, 2026: laws, effects, heuristics, and concepts with different scopes and evidence. Jakob's Law is associated with Jakob Nielsen; do not attribute the entire collection to him. The applications and checks in the references are this skill's operational guidance, not quotations or experimental findings from the website.

## Choose the task

- **Design:** produce the requested flow, layout, prototype, or implementation, including the UX decisions needed to complete it.
- **Redesign or implement:** inspect the existing interface and components first; preserve what works and address problems within the authorized scope.
- **Audit:** inspect and report evidence-based findings; do not change files when only a review was requested.
- **Explain or compare:** apply the concepts to concrete examples or alternatives without turning the question into an implementation project.

Do not assume a particular framework, browser, MCP, design tool, or other skill. Use available resources. A screenshot supports evaluating layout and visible cues, but does not establish keyboard behavior, performance, or interaction behavior. Request an indispensable missing reference; for minor gaps, state an assumption and proceed.

## Start from the user's task

1. **Establish minimum context.** Identify the audience, primary task, device, prior experience, and success condition from the request and existing materials. Ask only when missing information materially changes the solution.
2. **Inspect the journey.** Follow entry → choice → action → response → recovery or completion. Distinguish observations, product data, and hypotheses. Do not invent interviews, metrics, or audience preferences.
3. **Select principles that explain a decision.** Read the relevant references in the table. Applying all 30 entries to every screen is unnecessary. When a comprehensive audit is requested, review them all and record applicable, not applicable, or unverifiable, with a brief reason.
4. **Connect evidence to change.** For each important decision, describe the observed element, likely effort or error, applicable principle, concrete change, and verification method. Naming a law alone does not justify a redesign.
5. **Deliver and verify.** If implementation was requested, make the change and check the affected flow and relevant states. If only design was requested, specify behavior, content, and states as well as appearance. State what was actually checked and what still requires user validation.

## References by problem

| Problem | Read | Coverage |
| --- | --- | --- |
| Learning, conventions, onboarding | [Familiarity](references/familiarity.md) | Jakob, Mental Model, Paradox of the Active User |
| Choosing, remembering, simplifying | [Decision and memory](references/decision-memory.md) | Choice Overload, Chunking, Cognitive Bias, Cognitive Load, Hick, Miller, Working Memory, Occam, Tesler |
| Grouping, hierarchy, differentiation | [Perception](references/perception.md) | Aesthetic-Usability, Common Region, Proximity, Prägnanz, Similarity, Uniform Connectedness, Selective Attention, Von Restorff |
| Acting, waiting, entering data | [Interaction](references/interaction.md) | Fitts, Doherty, Postel, Parkinson |
| Progress, completion, prioritization | [Journey](references/journey.md) | Flow, Goal-Gradient, Peak-End, Serial Position, Zeigarnik, Pareto |
| Resolving tensions or validating | [Decision criteria](references/criteria.md) | Conflicts between principles, evidence, priority, and checks |

## Overriding criteria

- Treat principles as context-dependent design hypotheses. Usage evidence and accessibility needs can justify exceptions.
- Preserve familiar interaction conventions without imposing a generic aesthetic. Differentiate the brand through composition, typography, imagery, and voice without making controls ambiguous.
- Do not use Miller as a seven-item quota, Pareto as a product statistic, Doherty as a universal performance guarantee, or recall as a synonym for conversion.
- Do not remove necessary information to create an appearance of simplicity. Reduce total effort, errors, and recall demands, even when a solution requires an additional step.
- Distinguish visual perception from semantics and operation. Where relevant, check accessible names, keyboard access, focus, contrast, reading, reduced motion, and adaptation to screen size. Do not claim standards compliance without reviewing the criteria and performing the corresponding checks.
- Progress must represent real work. Do not design false urgency, concealed consent, hidden cancellation, or interruptions to exploit these effects.
- Do not assume that citing a law proves improvement. Explain the expected benefit and retain uncertainty until it is measured.

## Proportionate deliverables

Start with the outcome or main problem. For a small change, provide the change, rationale, and verification. For broad audits, use a table: **priority · evidence/location · impact · principle · recommendation · validation**. Group by problem rather than law, and avoid repeating a finding under several names.

When prioritizing, distinguish blockers or serious errors, frequent friction, and minor improvements. State confidence based on available evidence; do not invent an overall compliance score. When two principles suggest different solutions, consult the criteria and explain the tradeoff that matters to the task.
