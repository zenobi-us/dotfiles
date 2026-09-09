# Process

How to do the work so the result survives review. These are not facts about the
game - they are the ways a piece of work about the game goes wrong, and what to
do instead.

## Evidence discipline

Before a claim leaves the session: was the search wide enough, did the command
run, and could the evidence have come out any other way?

- [An empty result is the absence of evidence, and it looks exactly like a finding](/process/an-empty-result-is-not-a-finding) - nothing found and nothing run look identical, and so do "nothing there" and "nothing in the one layer I opened"
- [Evidence that cannot tell your two hypotheses apart](/process/evidence-that-does-not-discriminate) - three agreeing cases prove nothing when both rules predict the same winner
- [Prove absence in a file too large to read](/process/proving-absence-in-a-huge-file) - two searches settle what a partial read cannot, and absence is only proved for the spellings you searched
- [A workaround gets written down and outlives the fault it was written for](/process/a-workaround-outlives-the-fault) - if it works for thousands of others, something here is wrong; find it
- [A capacity read from the wrong API comes back plausible, and nothing about it looks wrong](/process/a-capacity-read-from-the-wrong-api) - a saturated integer looks exactly like a measurement, and everything downstream inherits it silently
- [Whether a download is a main file, an add-on or a patch is only answerable from the hosting API](/process/a-file-category-comes-from-the-api) - two hypotheses that predict an identical filesystem, and the endpoint that separates them

## Tools, and what their output licenses

- [A passing validator has checked structure, not truth](/process/a-passing-check-is-not-a-true-claim) - every semantic bug in one large pass was caught by hand, and a report that mixes actionable with harmless teaches its reader to skim
- [A generator needs three guards, and all of them are cheap](/process/writing-a-generator-that-cannot-eat-its-own-source) - refusing the shipping tree two ways, declaring whether the output may be overwritten, and never hardcoding one machine
- [An inventory of somebody's install is personal data, and sanitising it means reframing rather than deleting](/process/generated-output-is-personal-data) - keep the numbers and the failure story, generalise the instruction

## Work that other people read

- [Documenting a large mod list without producing a report nobody can trust](/process/running-a-documentation-pass) - partitioning writers, repairing a collision, and the four ways a confident article turns out to be wrong
- [Ask for the viewport rather than detecting the display](/process/asking-for-the-viewport) - six layers between a panel and the real space, and why the answer is an input rather than a gate
- [A fit measurement can be true and useless](/process/a-fit-measurement-can-be-true-and-useless) - a height with the viewport as its floor, and two faults only a rendering shows
- [A third-party program's menus cannot be recalled](/process/a-third-party-ui-cannot-be-recalled) - five programs, five fabricated menu paths, five corrections; and why the cost lands on everything true you say afterwards
- [Proximity is not evidence until you know how dense the thing is](/process/proximity-is-not-evidence-without-a-base-rate) - a mod placed 313 markers, which made "within 40 m of one" the ordinary case rather than a lead
- [The deployment manifest says who ships what](/process/the-deployment-manifest-says-who-ships-what) - filenames and dates are labels, not statements about ownership or precedence
