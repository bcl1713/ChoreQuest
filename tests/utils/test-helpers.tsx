import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'

// Mock providers that would wrap the app in production
interface MockProvidersProps {
  children: ReactNode
}

const MockProviders = ({ children }: MockProvidersProps) => {
  // Add providers here as they're implemented:
  // - AuthProvider
  // - ThemeProvider
  // - SocketProvider
  // - etc.
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MockProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'YOUNG_HERO',
  familyId: 'family-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockCharacter = (overrides = {}) => ({
  id: 'char-1',
  userId: 'user-1',
  name: 'Test Hero',
  class: 'KNIGHT',
  level: 1,
  xp: 0,
  gold: 0,
  gems: 0,
  honorPoints: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockQuest = (overrides = {}) => ({
  id: 'quest-1',
  title: 'Test Quest',
  description: 'A test quest description',
  xpReward: 100,
  goldReward: 50,
  difficulty: 'MEDIUM',
  category: 'DAILY',
  status: 'PENDING',
  familyId: 'family-1',
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockFamily = (overrides = {}) => ({
  id: 'family-1',
  name: 'Test Family',
  code: 'TEST123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})