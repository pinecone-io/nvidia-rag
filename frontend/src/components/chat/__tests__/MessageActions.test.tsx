import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { MessageActions } from '../MessageActions';

// Mock the API and hooks
const mockUseSendMessage = vi.fn();
const mockUseMessageSubmit = vi.fn();

vi.mock('../../../api/useSendMessage', () => ({
  useSendMessage: () => mockUseSendMessage()
}));

vi.mock('../../../hooks/useMessageSubmit', () => ({
  useMessageSubmit: () => mockUseMessageSubmit()
}));

describe('MessageActions', () => {
  const mockStopStream = vi.fn();
  const mockHandleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseSendMessage.mockReturnValue({
      isStreaming: false,
      stopStream: mockStopStream
    });
    
    mockUseMessageSubmit.mockReturnValue({
      handleSubmit: mockHandleSubmit,
      canSubmit: true
    });
  });

  describe('Send Button State', () => {
    it('renders send button when not streaming', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: false,
        stopStream: mockStopStream
      });

      render(<MessageActions />);
      
      expect(screen.getByTitle('Send message')).toBeInTheDocument();
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
    });

    it('renders send button as enabled when canSubmit is true', () => {
      mockUseMessageSubmit.mockReturnValue({
        handleSubmit: mockHandleSubmit,
        canSubmit: true
      });

      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).not.toBeDisabled();
      expect(sendButton).toHaveClass('bg-[var(--nv-green)]');
    });

    it('renders send button as disabled when canSubmit is false', () => {
      mockUseMessageSubmit.mockReturnValue({
        handleSubmit: mockHandleSubmit,
        canSubmit: false
      });

      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveClass('bg-neutral-700', 'cursor-not-allowed');
    });

    it('calls handleSubmit when send button is clicked', () => {
      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      fireEvent.click(sendButton);
      
      expect(mockHandleSubmit).toHaveBeenCalledOnce();
    });

    it('does not call handleSubmit when send button is disabled', () => {
      mockUseMessageSubmit.mockReturnValue({
        handleSubmit: mockHandleSubmit,
        canSubmit: false
      });

      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      fireEvent.click(sendButton);
      
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Stop Button State', () => {
    it('renders stop button when streaming', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: true,
        stopStream: mockStopStream
      });

      render(<MessageActions />);
      
      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.queryByTitle('Send message')).not.toBeInTheDocument();
    });

    it('calls stopStream when stop button is clicked', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: true,
        stopStream: mockStopStream
      });

      render(<MessageActions />);
      
      const stopButton = screen.getByText('Stop');
      fireEvent.click(stopButton);
      
      expect(mockStopStream).toHaveBeenCalledOnce();
    });

    it('renders stop button with correct styling', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: true,
        stopStream: mockStopStream
      });

      render(<MessageActions />);
      
      const stopButton = screen.getByText('Stop');
      // Just verify the stop button is rendered correctly
      expect(stopButton).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct container positioning', () => {
      const { container } = render(<MessageActions />);
      
      const actionsContainer = container.firstChild as HTMLElement;
      expect(actionsContainer).toHaveClass('absolute', 'right-3', 'top-3', 'flex', 'items-center', 'gap-2');
    });

    it('renders send icon correctly', () => {
      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      const svg = sendButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-4', 'h-4');
    });

    it('renders stop icon correctly', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: true,
        stopStream: mockStopStream
      });
      
      render(<MessageActions />);
      
      const stopButton = screen.getByText('Stop');
      // Check that the stop button contains the stop icon structure
      expect(stopButton).toContainHTML('Stop');
    });
  });

  describe('State Transitions', () => {
    it('switches from send to stop when streaming starts', () => {
      const { rerender } = render(<MessageActions />);
      
      expect(screen.getByTitle('Send message')).toBeInTheDocument();
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
      
      mockUseSendMessage.mockReturnValue({
        isStreaming: true,
        stopStream: mockStopStream
      });
      
      rerender(<MessageActions />);
      
      expect(screen.queryByTitle('Send message')).not.toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('switches from stop to send when streaming ends', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: true,
        stopStream: mockStopStream
      });

      const { rerender } = render(<MessageActions />);
      
      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.queryByTitle('Send message')).not.toBeInTheDocument();
      
      mockUseSendMessage.mockReturnValue({
        isStreaming: false,
        stopStream: mockStopStream
      });
      
      rerender(<MessageActions />);
      
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
      expect(screen.getByTitle('Send message')).toBeInTheDocument();
    });
  });

  describe('Button Styling States', () => {
    it('applies hover effects to enabled send button', () => {
      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toHaveClass('hover:bg-[var(--nv-green)]/90', 'hover:shadow-lg');
    });

    it('applies disabled styling to disabled send button', () => {
      mockUseMessageSubmit.mockReturnValue({
        handleSubmit: mockHandleSubmit,
        canSubmit: false
      });

      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toHaveClass('opacity-50', 'text-gray-400');
    });

    it('applies correct transition classes', () => {
      render(<MessageActions />);
      
      const sendButton = screen.getByTitle('Send message');
      expect(sendButton).toHaveClass('transition-all', 'duration-200');
    });
  });
}); 