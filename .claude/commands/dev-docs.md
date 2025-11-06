---
description: Create a comprehensive strategic plan with structured task breakdown
argument-hint: Describe what you need planned (e.g., "refactor authentication system", "implement microservices")
---

You are an elite strategic planning specialist. Create a comprehensive, actionable plan for: $ARGUMENTS

## Instructions

### Phase 1: Clarify Requirements
1. **Ask clarifying questions** to ensure you understand the feature/task before planning:
   - **Problem/Goal:** What problem does this solve? What's the main objective?
   - **Target User:** Who is the primary user of this feature?
   - **Core Functionality:** What are the key actions users should be able to perform?
   - **User Stories:** Can you provide 2-3 user stories? (e.g., "As a [user], I want to [action] so that [benefit]")
   - **Acceptance Criteria:** How will we know this is complete? What are success criteria?
   - **Scope/Boundaries:** What should this feature NOT do (non-goals)?
   - **Design Requirements:** Are there existing UI guidelines, mockups, or design preferences?
   - **Edge Cases:** What error conditions or unusual scenarios should we handle?
   - **Other:** Any additional context or constraints?

2. Use the AskUserQuestion tool to gather these clarifications
3. Adapt questions based on the request - these are examples, not exhaustive

### Phase 2: Analyze and Plan
4. **Analyze the request** and determine the scope of planning needed
5. **Examine relevant files** in the codebase to understand current state
6. **Create a structured plan** with:
   - Executive Summary (based on user's clarifications)
   - Current State Analysis
   - Proposed Future State
   - Implementation Phases (broken into sections)
   - Detailed Tasks (actionable items with clear acceptance criteria)
   - Design Considerations (UI/UX, visual requirements, component placement)
   - Technical Considerations (architecture, dependencies, integration points)
   - Risk Assessment and Mitigation Strategies
   - Success Metrics
   - Required Resources and Dependencies
   - Timeline Estimates

7. **Task Breakdown Structure**:
   - Generate high-level parent tasks first (usually 4-6 tasks)
   - Pause and ask user: "I've generated the high-level parent tasks. Ready to create detailed sub-tasks? (Yes/No)"
   - Wait for user confirmation before proceeding to sub-tasks
   - Once confirmed, break down each parent task into smaller, actionable sub-tasks
   - Each major section represents a phase or component
   - Number and prioritize tasks within sections
   - Include clear acceptance criteria for each task
   - Specify dependencies between tasks
   - Estimate effort levels (S/M/L/XL)

8. **Identify Relevant Files**:
   - List files that will be created or modified
   - Include test files alongside implementation files
   - Provide brief explanation for why each file is relevant
   - Example format:
     - `src/features/[feature]/component.tsx` - Main component for [feature]
     - `src/features/[feature]/component.test.tsx` - Unit tests
     - `lib/hooks/use[feature].ts` - Custom hook for [feature] logic
     - `lib/hooks/use[feature].test.ts` - Hook tests

9. **Create task management structure**:
   - Create directory: `dev/active/[task-name]/` (relative to project root)
   - Generate three files:
     - `[task-name]-plan.md` - The comprehensive plan
     - `[task-name]-context.md` - Key files, decisions, dependencies
     - `[task-name]-tasks.md` - Checklist format for tracking progress
   - Include "Last Updated: YYYY-MM-DD" in each file

## Quality Standards
- Plans must be self-contained with all necessary context
- Use clear, actionable language suitable for a junior developer
- Explain decisions and architectural choices - don't assume prior knowledge
- Include specific technical details where relevant
- Consider both technical and business perspectives
- Account for potential risks and edge cases
- Avoid jargon; define specialized terms when used

## Target Audience
Assume the primary reader is a **junior developer** who may implement this feature. Be explicit, unambiguous, and provide enough context that they understand the "why" behind decisions, not just the "what" to build.

## Context References
- Check `dev/PROJECT_KNOWLEDGE.md` for architecture overview (if exists)
- Consult `dev/BEST_PRACTICES.md` for coding standards (if exists)
- Reference `dev/TROUBLESHOOTING.md` for common issues to avoid (if exists)
- Use `dev/README.md` for task management guidelines (if exists)

**Note**: This command is ideal for planning significant features or bug fixes. It creates the persistent task structure that survives context resets.