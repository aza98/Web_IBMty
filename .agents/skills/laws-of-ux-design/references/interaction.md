# Interaction and Response

Concept summaries, with applications and checks proposed by this skill. Read for controls, forms, and asynchronous operations.

## Fitts’s Law

Reaching a target depends on its effective size and the distance of movement.

**Apply:** provide comfortable actionable areas, separation between actions that could be confused, and locations close to the working context. Consider the actual target area, not just its visible shape.

**Limit:** the law alone does not provide a universal minimum pixel size. Touch, pointer, and keyboard interaction require different considerations. Do not transfer conclusions about desktop edges directly to mobile.

**Check:** test presses near target edges, selection errors, and reachability on the intended device; also verify keyboard operation.

[Source](https://lawsofux.com/fittss-law/)

## Doherty Threshold

A sufficiently fast response supports continuity between person and system; the historical reference is around 400 ms.

**Apply:** acknowledge actions promptly and distinguish pending, success, and error states. For long operations, provide useful status and recovery. Prevent duplicate submissions.

**Limit:** 400 ms is neither a universal budget nor proof of performance. An indicator does not speed up an operation. Do not invent percentages or delay results to simulate work.

**Check:** measure initial feedback and completion separately under representative latency. Check failure, retry, and cancellation where relevant.

[Source](https://lawsofux.com/doherty-threshold/)

## Postel’s Law

In interfaces, accepting reasonable input variations and returning consistent results can reduce friction.

**Apply:** accept equivalent formats whose meaning is unambiguous, such as phone-number separators when context allows. Explain limits and preserve entered content when reporting errors.

**Limit:** tolerance does not mean ignoring validation or security. Do not guess ambiguous dates, amounts, or identities; request clarification. Do not silently modify passwords or data whose exact content matters.

**Check:** test valid variations, empty values, ambiguous input, and invalid input; confirm that normalization preserves meaning.

[Source](https://lawsofux.com/postels-law/)

## Parkinson’s Law

This is an observation about work expanding to fill available time; its application to UX serves as a heuristic, not a measured psychological limit.

**Apply:** reduce repetitive work through reviewable autofill, known values, and a clearly scoped task.

**Limit:** do not impose timers or remove necessary review steps to force speed. Time saved should reflect effort removed.

**Check:** compare overall duration, corrections, and repeated data entry before and after the change.

[Source](https://lawsofux.com/parkinsons-law/)
