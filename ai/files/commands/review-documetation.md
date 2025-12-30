---
description: Review supplied files for documentation quality and completeness.
subtask: true
agent: general
---

Assist with a comprehensive documentation review of the files or content indicated by the user request.

<UserRequest>
  $ARGUMENTS
</UserRequest>

## Initialisation

Before starting ensure the following skills are loaded with `skill_use`:

1. **experts_developer_experience_documentation_engineer** - Specializes in API documentation, information architecture, automation, and developer experience
2. **experts_business_product_technical_writer** - Specializes in clarity, accuracy, user guides, and technical content

## Your Task

Conduct a thorough documentation review from BOTH perspectives. Analyze the README.md file for:

### From Documentation Engineer Perspective:

1. Information architecture - logical structure, scannability, navigation
2. API documentation coverage - are all tools fully documented?
3. Code examples - clarity, practicality, testability
4. Completeness - gaps or missing sections
5. Search optimization - discoverability

### From Technical Writer Perspective:

1. Clarity & accessibility for target audiences (beginners and advanced users)
2. Technical accuracy and consistency
3. Readability - language conciseness, structure
4. User focus - does content address real use cases?
5. Consistency in terminology, style, tone

### Specific Focus Areas:

This will largely depend on the content provided, so first identify what the documentation is for, who the target audience is and what key features or changes are being introduced. Then evaluate the following aspects:

1. **Examples** - Does the documentation give a pragmatic example of how to use the plugin without overwhelming the user with information?
2. **Configuration** - Are configuration options clearly explained with defaults and examples?
3. **Use cases** - Are common use cases well documented and easy to find?
5. **Getting started** - Can newcomers understand how to get started quickly?

### Deliverables

Provide a comprehensive review document that includes:

1. **Executive Summary** - Overall assessment of documentation quality (score 1-10)
2. **Strengths** - What the documentation does well
3. **Opportunities** - Specific areas for improvement with concrete suggestions
4. **Critical Issues** - Any technical inaccuracies or clarity problems. Provide a todolist of fixes if applicable.
5. **Recommendations** - Prioritized list of improvements (must-have, should-have, nice-to-have)
6. **Specific Edits** - Exact text changes recommended with rationale


Format your response clearly with sections for Documentation Engineer insights and Technical Writer insights.

Be specific and actionable.

Do not ask questions, instead list observations and recommendations.

The output will be used by a main agent to implement and clarify with the user.

