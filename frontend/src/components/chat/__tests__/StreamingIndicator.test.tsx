import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import { StreamingIndicator } from '../StreamingIndicator';

describe('StreamingIndicator', () => {
  describe('Text Display', () => {
    it('displays only dots when no text provided', () => {
      render(<StreamingIndicator />);
      
      // Should only show the dots animation, no text
      const dotsContainer = document.querySelector('.flex.space-x-1');
      expect(dotsContainer).toBeInTheDocument();
      expect(dotsContainer?.children).toHaveLength(3);
    });

    it('displays custom text when provided', () => {
      render(<StreamingIndicator text="Custom" />);
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('displays different custom texts', () => {
      const { rerender } = render(<StreamingIndicator text="Loading" />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      
      rerender(<StreamingIndicator text="Processing" />);
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('displays empty text when provided', () => {
      const { container } = render(<StreamingIndicator text="" />);
      
      // Should still show dots container
      const dotsContainer = container.querySelector('.flex.space-x-1');
      expect(dotsContainer).toBeInTheDocument();
    });

    it('handles special characters in text', () => {
      render(<StreamingIndicator text="Loading... 100%" />);
      expect(screen.getByText('Loading... 100%')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct flex container structure', () => {
      const { container } = render(<StreamingIndicator text="Test" />);
      
      const flexContainer = container.querySelector('.flex.items-center.gap-2');
      expect(flexContainer).toBeInTheDocument();
    });

    it('contains dots animation', () => {
      const { container } = render(<StreamingIndicator />);
      
      const dotsContainer = container.querySelector('.flex.space-x-1');
      expect(dotsContainer).toBeInTheDocument();
      expect(dotsContainer?.children).toHaveLength(3);
    });
  });
}); 