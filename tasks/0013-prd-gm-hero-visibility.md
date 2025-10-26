# PRD: GM Hero Visibility on Quest Approval and Management

## Overview

Guild Masters (GMs) currently lack visibility into which hero is associated with a quest when reviewing quests for approval on the main dashboard or managing quests on the quest management dashboard. This feature will display the associated hero's name inline within quest rows on both dashboards, enabling GMs to make better-informed decisions when approving or managing quests.

## Goals

1. Improve GM visibility by displaying the hero associated with each quest
2. Enable GMs to make more informed approval decisions by seeing the hero context
3. Maintain consistency across both the main dashboard and quest management dashboard
4. Keep the UI clean and uncluttered by showing minimal hero information (name only)

## User Stories

- **As a GM**, I want to see which hero is associated with a quest when reviewing it for approval, so I can understand the context and make informed decisions
- **As a GM**, I want to see the hero name on the quest management dashboard when managing quests, so I can track which hero created or is associated with each quest
- **As a GM**, I want the hero information to be easily visible without cluttering the quest row, so I can quickly scan and process multiple quests

## Functional Requirements

1. **Hero Name Display on Main Dashboard:** When a quest has an associated hero, display the hero's name inline in the quest row on the main dashboard quest approval section
2. **Hero Name Display on Quest Management Dashboard:** When a quest has an associated hero, display the hero's name inline in the quest row on the quest management dashboard
3. **Conditional Display:** Only display the hero field when a quest has an associated hero; hide the field entirely if no hero is associated
4. **Data Integrity:** Ensure the hero name is accurately retrieved from the quest's hero association in the database
5. **Performance:** Load hero data efficiently without introducing N+1 query problems

## Non-Goals (Out of Scope)

- Displaying full hero details (level, class, stats, etc.)
- Showing hero avatars or icons
- Creating clickable hero links or navigation to hero details
- Modifying hero selection or assignment logic
- Adding filters or sorting by hero on either dashboard

## Design Considerations

- The hero name should be displayed as plain text inline with the quest information
- No additional UI components (cards, badges, modals) needed
- Follow existing text styling and spacing conventions used on both dashboards
- The implementation should reuse existing component patterns where possible

## Technical Considerations

- The quest data model likely already has a relationship to the hero; ensure the relationship is properly loaded in queries
- May need to optimize database queries (e.g., using joins or eager loading) to prevent N+1 issues
- Consider whether hero data needs to be denormalized or cached for performance

## Success Metrics

- GMs can see the associated hero name on both the main dashboard and quest management dashboard
- No performance degradation when loading quest lists
- All existing quest approval and management functionality continues to work as expected
- Code quality maintained with comprehensive test coverage

## Open Questions

1. Is the hero relationship always populated for quests, or are there quests without heroes that we need to handle gracefully?
2. What is the exact placement of the hero name in the quest row? (e.g., after quest title, in a separate column, etc.)
3. Are there any character length constraints or truncation needed for very long hero names?
