---
id: lifecycle
number: "03"
title: Review and finish gates
shortTitle: Review gates
kind: State machine
diagram: lifecycle
description: Implementation becomes reviewable and is reviewed. FAILURE leads to a fix, a new commit, and review again. SUCCESS approves only the frozen commit. An approved source can finish directly or optionally submit a pull request before finishing. A new commit invalidates the approval.
---

FAILURE requires a fix and another review. SUCCESS applies to the reviewed commit. Submission is optional before finish; a new commit invalidates the verdict.
