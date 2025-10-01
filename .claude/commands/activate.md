# /activate

Activates the ChoreQuest project and determines next work priority.

## Steps

1. Activate the serena MCP project
2. Read TASKS.md to understand current status
3. Read PLANNING.md to understand project context
4. Analyze what should be worked on next based on:
   - Current branch context
   - Incomplete tasks
   - Project priorities
5. Present recommendations to user for confirmation

## Implementation

```javascript
async function activate() {
  // Activate serena project
  await mcp.activateProject('serena');

  // Read planning documents
  const tasks = await readFile('TASKS.md');
  const planning = await readFile('PLANNING.md');

  // Analyze and present next steps
  analyzeAndRecommend(tasks, planning);
}
```
