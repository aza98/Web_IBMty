# Decisions, Conflicts, and Validation

These criteria are operational guidance proposed by this skill. They are not additional laws or claims that a solution will achieve a guaranteed result.

## Resolve tensions

| Tension | Practical criterion |
| --- | --- |
| Jakob versus novelty | Keep operation recognizable and build visual identity around it. Introduce a new interaction when it addresses a concrete need and its learning cost is justified. |
| Hick versus Tesler | Reduce unnecessary decisions; preserve those required by the task. Compare total effort and errors, not just visible buttons. |
| Occam versus working memory | An additional summary can simplify use by removing recall demands. Evaluate task simplicity, not visual emptiness. |
| Proximity versus Fitts | Preserve visual relationships without bringing targets so close that accidental presses occur. |
| Similarity versus Von Restorff | Establish a consistent baseline and a semantically justified exception for the local priority. |
| Aesthetics versus accessibility | Adjust visual treatment to preserve legibility, operation, and meaning. Do not present accessibility as an optional sacrifice. |
| Doherty versus accuracy | Respond promptly with a pending state; confirm success only after it occurs. Use optimistic updates only when the domain allows failures to be reconciled without confusion. |
| Progress versus autonomy | Make real progress visible and support pausing, exiting, or resuming; do not invent urgency or obligations. |
| Pareto versus critical cases | Frequency helps prioritize, but the impact of errors, exclusion, or data loss also matters. |

## Evaluate a finding

Record exact evidence: screen, component, screenshot, reproducible step, or file. Distinguish:

- **Observed:** directly inspected behavior or layout.
- **Hypothesis:** a likely effect on people, pending research.
- **Measured:** a result with its available method, sample, and conditions.

Example: “Password help disappears when typing begins” can be observed; “this causes abandonment” remains a hypothesis without data. Recommending persistent help is verifiable without inventing an improvement rate.

Prioritize by impact and known frequency. A blocker, incorrect action, or data loss outweighs a decorative inconsistency. Do not turn the number of laws cited into severity. For an audit of all 30 entries, use the SKILL.md index and an applicability matrix; consolidate repeated problems into a single finding.

## Proportionate checks

- **Inspection:** labels, groupings, states, realistic content, and consistency. This does not establish human behavior.
- **Functional testing:** primary task, errors, recovery, and relevant empty, pending, and final states. This is not equivalent to usability testing with participants.
- **Accessibility and adaptation:** keyboard access, focus, semantic names and relationships, contrast, reading under magnification, long content, and representative screens appropriate to the changes. State tool and coverage limitations.
- **User testing:** neutral tasks with people from the target audience, observing success, errors, assistance, and effort; avoid questions that reveal where to act. Use an appropriate study size without promising statistical significance from an arbitrary sample.
- **Comparative measurement:** the same task under comparable conditions. For an experiment, define the primary outcome, adverse effects, and decision criterion before measuring; do not present a proposal as an executed experiment.

If only a screenshot is available, state what cannot be checked. Without baseline metrics, define observable criteria and a brief plan; do not block a reversible design because a formal study is unavailable.
