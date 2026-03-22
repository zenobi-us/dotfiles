An agent made file changes (write/edit tool calls detected). Review the tool call history below.

{{ tool_calls }}

Known commit anti-patterns:
{{ patterns }}

{{ instructions }}

Determine:
1. Did the agent run a git commit? Look for [call bash] with git commit in the arguments.
2. If committed, was the commit message detailed and specific? Generic messages like 'update files', 'fix bug', 'changes' are violations.
3. If committed, does the message avoid prohibited language (see patterns)?

{% if iteration > 0 %}
NOTE: You have steered {{ iteration }} time(s) already this session.
The agent's latest response is below. If the agent explicitly acknowledged
the issue and stated a concrete plan to address it (not just "noted" but
a specific action like "will commit after completing X"), reply CLEAN to
allow the agent to follow through. Re-flag only if the agent ignored or
deflected the steer.

Agent response:
{{ assistant_text }}
{% endif %}

Reply CLEAN if changes were committed with a proper message.
Reply FLAG:<description> if a known pattern was matched (no commit, generic message, prohibited language).
Reply NEW:<pattern>|<description> if an issue not covered by patterns was detected.
