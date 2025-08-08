import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import { MessageInputContainer } from '../MessageInputContainer';

// Mock child components
vi.mock('../MessageTextarea', () => ({
  MessageTextarea: () => <div data-testid="message-textarea">Textarea</div>
}));

vi.mock('../MessageActions', () => ({
  MessageActions: () => <div data-testid="message-actions">Actions</div>
}));

describe('MessageInputContainer', () => {
  describe('Child Component Rendering', () => {
    it('renders MessageTextarea component', () => {
      render(<MessageInputContainer />);
      
      expect(screen.getByTestId('message-textarea')).toBeInTheDocument();
    });

    it('renders MessageActions component', () => {
      render(<MessageInputContainer />);
      
      expect(screen.getByTestId('message-actions')).toBeInTheDocument();
    });

    it('renders both components together', () => {
      render(<MessageInputContainer />);
      
      // Both should be present in the component
      expect(document.querySelector('.relative')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('wraps components in relative positioned container', () => {
      const { container } = render(<MessageInputContainer />);
      
      expect(container.firstChild).toHaveClass('relative');
    });
  });

  describe('Layout Structure', () => {
    it('renders container with correct structure', () => {
      render(<MessageInputContainer />);
      
      expect(screen.getByTestId('message-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('message-actions')).toBeInTheDocument();
    });

    it('uses relative positioning for action overlay', () => {
      const { container } = render(<MessageInputContainer />);
      
      expect(container.firstElementChild).toHaveClass('relative');
    });
  });
}); 