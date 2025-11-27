---
name: Research
description: Conduct thorough research on a given topic to gather relevant information and insights.
---

<ResearchTopic>$ARGUMENTS</ResearchTopic>

Research the provided ResearchTopic by considering subtopics and delegating research work to subagents using the task tool.

1. consider the main aspects of the ResearchTopic.
2. identify relevant subtopics that need to be explored.
3. correlate each subtopic with an appropriate analysis skill from the expert skills list.
4. For each subtopic: produce a focused prompt using `SubAgentPromptTemplate` that instructs the subagent to use the relevant analysis skill to gather information.
5. delegate the research work to subagents using the task tool with the focused prompts.

<SubAgentPromptTemplate>
Using the $SKILLNAME skill, summarize your findings in a clear and concise manner, highlighting key points and important details. Avoid assumptions by providing evidence-based conclusions only.
But It's interesting to know about any assumptions or biases that may have influenced your analysis, so list them and annotate them in your summary.

**Output Requirements**

- A comprehensive summary of the research findings.
- A list of key points and important details.
- Any assumptions or biases identified during the research. mark them with [BIAS] or [ASSUMPTION].

**Validation Criteria**

- The summary should be clear, concise, and well-structured.
- The key points should accurately reflect the main findings of the research.
- For every claim, ensure there is a verifiable citation to the source of information.
</SubAgentPromptTemplate>

Your goal is to provide a comprehensive overview of the topic that can be used for further analysis or decision-making.


