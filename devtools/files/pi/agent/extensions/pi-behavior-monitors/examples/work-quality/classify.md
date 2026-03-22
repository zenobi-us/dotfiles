An agent was asked:
"{{ user_text }}"

It performed these actions:
{{ tool_calls }}

Then it said:
"{{ assistant_text }}"

{{ instructions }}

Analyze the quality of the work. Check against these patterns:
{{ patterns }}

{% if iteration > 0 %}
NOTE: You have steered {{ iteration }} time(s) already this session.
The agent's latest response is below. If the agent explicitly acknowledged
the quality issue and stated a concrete plan to address it, reply CLEAN to
allow the agent to follow through. Re-flag only if the agent ignored or
deflected the steer.

Agent response:
{{ assistant_text }}
{% endif %}

Reply CLEAN if the work was sound.
Reply FLAG:<one sentence describing the quality issue> if a known
pattern was matched.
Reply NEW:<new pattern to add>|<one sentence describing the quality
issue> if there's a work quality problem not covered by existing patterns.
