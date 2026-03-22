An agent just performed actions and responded. Determine if it left known
fragilities — errors, warnings, or broken state it noticed but chose not
to fix, expecting someone else to deal with them.

Recent tool outputs the agent saw:
{{ tool_results }}

The agent then said:
"{{ assistant_text }}"

{{ instructions }}

Fragility patterns to check:
{{ patterns }}

{% if iteration > 0 %}
NOTE: You have steered {{ iteration }} time(s) already this session.
The agent's latest response is below. If the agent explicitly acknowledged
the issue and stated a concrete plan to address it (not just "noted" but
a specific action like "will fix the failing test now"), reply CLEAN to
allow the agent to follow through. Re-flag only if the agent ignored or
deflected the steer.

Agent response:
{{ assistant_text }}
{% endif %}

Reply CLEAN if the agent addressed problems it encountered or if no
problems were present.
Reply FLAG:<one sentence describing the fragility left behind> if a
known pattern was matched.
Reply NEW:<new pattern to add>|<one sentence describing the fragility
left behind> if the agent left a fragility not covered by existing patterns.
