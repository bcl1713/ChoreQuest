import { render, screen } from '@/tests/utils/test-helpers'

// Simple test component to verify setup
function TestComponent() {
  return (
    <div>
      <h1>ChoreQuest</h1>
      <p>Fantasy RPG Chore Management</p>
    </div>
  )
}

describe('Test Setup Verification', () => {
  it('renders test component correctly', () => {
    render(<TestComponent />)
    
    expect(screen.getByRole('heading', { name: /chorequest/i })).toBeInTheDocument()
    expect(screen.getByText('Fantasy RPG Chore Management')).toBeInTheDocument()
  })

  it('has proper test environment setup', () => {
    expect(global.localStorage).toBeDefined()
    expect(global.ResizeObserver).toBeDefined()
    expect(global.WebSocket).toBeDefined()
  })
})