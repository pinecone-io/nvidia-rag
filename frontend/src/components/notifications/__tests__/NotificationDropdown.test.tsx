import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { NotificationDropdown } from '../NotificationDropdown';

// Mock child components and hooks
vi.mock('../../../store/useIngestionTasksStore', () => ({
  useIngestionTasksStore: () => ({
    markAsRead: vi.fn(),
    removeTask: vi.fn(),
  })
}));

vi.mock('../../tasks/TaskDisplay', () => ({
  TaskDisplay: ({ task, onMarkRead, onRemove }: any) => (
    <div data-testid="task-display">
      <span>{task.collection_name}</span>
      <button data-testid="mark-read" onClick={onMarkRead}>Mark Read</button>
      <button data-testid="remove" onClick={onRemove}>Remove</button>
    </div>
  )
}));

describe('NotificationDropdown', () => {
  const mockPendingTask = {
    id: 'pending-1',
    collection_name: 'test-collection',
    created_at: '2023-01-01T00:00:00Z',
    state: 'PENDING' as const
  };

  const mockCompletedTask = {
    id: 'completed-1',
    collection_name: 'done-collection',
    created_at: '2023-01-01T00:00:00Z',
    state: 'FINISHED' as const,
    completedAt: Date.now()
  };

  it('shows empty state when no tasks', () => {
    render(<NotificationDropdown pendingTasks={[]} completedTasks={[]} />);
    expect(screen.getByText('No tasks')).toBeInTheDocument();
  });

  it('renders pending tasks', () => {
    render(<NotificationDropdown pendingTasks={[mockPendingTask]} completedTasks={[]} />);
    expect(screen.getByText('test-collection')).toBeInTheDocument();
  });

  it('renders completed tasks', () => {
    render(<NotificationDropdown pendingTasks={[]} completedTasks={[mockCompletedTask]} />);
    expect(screen.getByText('done-collection')).toBeInTheDocument();
  });

  it('renders both pending and completed tasks', () => {
    render(<NotificationDropdown pendingTasks={[mockPendingTask]} completedTasks={[mockCompletedTask]} />);
    expect(screen.getByText('test-collection')).toBeInTheDocument();
    expect(screen.getByText('done-collection')).toBeInTheDocument();
  });

  it('handles mark read and remove actions', () => {
    render(<NotificationDropdown pendingTasks={[mockPendingTask]} completedTasks={[]} />);
    
    expect(screen.getByTestId('mark-read')).toBeInTheDocument();
    expect(screen.getByTestId('remove')).toBeInTheDocument();
    
    // Test that buttons are clickable (actual behavior tested in useNotificationStorage)
    fireEvent.click(screen.getByTestId('mark-read'));
    fireEvent.click(screen.getByTestId('remove'));
  });
}); 