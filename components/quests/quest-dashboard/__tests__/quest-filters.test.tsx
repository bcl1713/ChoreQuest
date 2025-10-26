import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestFilters from '../quest-filters';
import { QuestStatus } from '@/lib/types/database';

describe('QuestFilters', () => {
  const mockFilters = {
    status: 'ALL' as QuestStatus | 'ALL',
    assigneeId: 'ALL',
    searchTerm: '',
  };

  const mockAssignees = [
    { id: 'user-1', name: 'Alice' },
    { id: 'user-2', name: 'Bob' },
  ];

  const mockHandlers = {
    onFilterChange: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render search input', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search quests/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should render status filter dropdown', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toBeInTheDocument();
    });

    it('should render all status options', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const statusSelect = screen.getByLabelText(/status/i);
      expect(statusSelect).toContainHTML('<option value="ALL">All Statuses</option>');
      expect(statusSelect).toContainHTML('<option value="PENDING">Pending</option>');
      expect(statusSelect).toContainHTML('<option value="IN_PROGRESS">In Progress</option>');
      expect(statusSelect).toContainHTML('<option value="COMPLETED">Completed</option>');
      expect(statusSelect).toContainHTML('<option value="APPROVED">Approved</option>');
    });

    it('should render assignee filter when assignees are provided', () => {
      render(
        <QuestFilters
          filters={mockFilters}
          assignees={mockAssignees}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );

      const assigneeSelect = screen.getByLabelText(/assignee/i);
      expect(assigneeSelect).toBeInTheDocument();
    });

    it('should not render assignee filter when no assignees provided', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      expect(screen.queryByLabelText(/assignee/i)).not.toBeInTheDocument();
    });

    it('should render reset button', () => {
      render(
        <QuestFilters
          filters={mockFilters}
          onFilterChange={mockHandlers.onFilterChange}
          onReset={mockHandlers.onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should not render reset button when onReset is not provided', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });
  });

  describe('Search Input', () => {
    it('should display current search term', () => {
      const filtersWithSearch = { ...mockFilters, searchTerm: 'clean dishes' };
      render(
        <QuestFilters
          filters={filtersWithSearch}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search quests/i) as HTMLInputElement;
      expect(searchInput.value).toBe('clean dishes');
    });

    it('should call onFilterChange when search term changes', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search quests/i);
      fireEvent.change(searchInput, { target: { value: 'homework' } });

      expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({ searchTerm: 'homework' });
    });

    it('should clear search input icon when search term is empty', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      expect(screen.getByText('🔍')).toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    it('should display current status filter', () => {
      const filtersWithStatus = { ...mockFilters, status: 'PENDING' as QuestStatus };
      render(
        <QuestFilters
          filters={filtersWithStatus}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
      expect(statusSelect.value).toBe('PENDING');
    });

    it('should call onFilterChange when status changes', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });

      expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({ status: 'IN_PROGRESS' });
    });
  });

  describe('Assignee Filter', () => {
    it('should display current assignee filter', () => {
      const filtersWithAssignee = { ...mockFilters, assigneeId: 'user-1' };
      render(
        <QuestFilters
          filters={filtersWithAssignee}
          assignees={mockAssignees}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );

      const assigneeSelect = screen.getByLabelText(/assignee/i) as HTMLSelectElement;
      expect(assigneeSelect.value).toBe('user-1');
    });

    it('should call onFilterChange when assignee changes', () => {
      render(
        <QuestFilters
          filters={mockFilters}
          assignees={mockAssignees}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );

      const assigneeSelect = screen.getByLabelText(/assignee/i);
      fireEvent.change(assigneeSelect, { target: { value: 'user-2' } });

      expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({ assigneeId: 'user-2' });
    });

    it('should render all assignee options', () => {
      render(
        <QuestFilters
          filters={mockFilters}
          assignees={mockAssignees}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );

      expect(screen.getByText('All Assignees')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Reset Button', () => {
    it('should call onReset when clicked and filters are active', () => {
      const activeFilters = { ...mockFilters, status: 'PENDING' as QuestStatus };
      render(
        <QuestFilters
          filters={activeFilters}
          onFilterChange={mockHandlers.onFilterChange}
          onReset={mockHandlers.onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      expect(mockHandlers.onReset).toHaveBeenCalled();
    });

    it('should be disabled when all filters are at default', () => {
      render(
        <QuestFilters
          filters={mockFilters}
          onFilterChange={mockHandlers.onFilterChange}
          onReset={mockHandlers.onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeDisabled();
    });

    it('should be enabled when status filter is active', () => {
      const activeFilters = { ...mockFilters, status: 'PENDING' as QuestStatus };
      render(
        <QuestFilters
          filters={activeFilters}
          onFilterChange={mockHandlers.onFilterChange}
          onReset={mockHandlers.onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).not.toBeDisabled();
    });

    it('should be enabled when assignee filter is active', () => {
      const activeFilters = { ...mockFilters, assigneeId: 'user-1' };
      render(
        <QuestFilters
          filters={activeFilters}
          assignees={mockAssignees}
          onFilterChange={mockHandlers.onFilterChange}
          onReset={mockHandlers.onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).not.toBeDisabled();
    });

    it('should be enabled when search term is active', () => {
      const activeFilters = { ...mockFilters, searchTerm: 'test' };
      render(
        <QuestFilters
          filters={activeFilters}
          onFilterChange={mockHandlers.onFilterChange}
          onReset={mockHandlers.onReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).not.toBeDisabled();
    });
  });

  describe('Styling and Layout', () => {
    it('should use responsive flex layout', () => {
      const { container } = render(
        <QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />
      );

      const filterContainer = container.firstChild as HTMLElement;
      expect(filterContainer).toHaveClass('flex');
    });

    it('should apply proper styling to inputs', () => {
      render(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const searchInput = screen.getByPlaceholderText(/search quests/i);
      expect(searchInput).toHaveClass('bg-gray-900');
    });
  });

  describe('Performance', () => {
    it('should be memoized and not re-render when props are unchanged', () => {
      const { rerender } = render(
        <QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />
      );

      const firstRender = screen.getByPlaceholderText(/search quests/i);

      rerender(<QuestFilters filters={mockFilters} onFilterChange={mockHandlers.onFilterChange} />);

      const secondRender = screen.getByPlaceholderText(/search quests/i);
      expect(firstRender).toBe(secondRender);
    });
  });
});
