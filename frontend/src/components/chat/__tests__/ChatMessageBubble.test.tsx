import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils';
import ChatMessageBubble from '../ChatMessageBubble';
import type { ChatMessage } from '../../../types/chat';

// Mock the streaming store
const mockUseStreamingStore = vi.fn();
vi.mock('../../../store/useStreamingStore', () => ({
  useStreamingStore: () => mockUseStreamingStore()
}));

// Mock child components
vi.mock('../MessageContent', () => ({
  MessageContent: ({ content }: { content: string }) => (
    <div data-testid="message-content">{content}</div>
  )
}));

vi.mock('../StreamingIndicator', () => ({
  StreamingIndicator: () => <div data-testid="streaming-indicator">Streaming...</div>
}));

vi.mock('../../citations/CitationButton', () => ({
  CitationButton: ({ citations }: { citations: any[] }) => (
    <div data-testid="citation-button">Citations: {citations.length}</div>
  )
}));

describe('ChatMessageBubble', () => {
  const mockUserMessage: ChatMessage = {
    id: 'user-1',
    role: 'user',
    content: 'Hello, this is a user message',
    timestamp: '2024-01-01T00:00:00Z'
  };

  const mockAssistantMessage: ChatMessage = {
    id: 'assistant-1',
    role: 'assistant',
    content: 'Hello, this is an assistant message',
    timestamp: '2024-01-01T00:01:00Z'
  };

  const mockAssistantMessageWithCitations: ChatMessage = {
    id: 'assistant-2',
    role: 'assistant',
    content: 'This message has citations',
    timestamp: '2024-01-01T00:02:00Z',
    citations: [
      { source: 'doc1.pdf', text: 'Citation text', document_type: 'text', score: 0.9 },
      { source: 'doc2.pdf', text: 'Another citation', document_type: 'text', score: 0.8 }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStreamingStore.mockReturnValue({
      isStreaming: false,
      streamingMessageId: null
    });
  });

  describe('Regular Messages', () => {
    it('renders user message with correct styling', () => {
      const { container } = render(<ChatMessageBubble msg={mockUserMessage} />);
      
      expect(screen.getByTestId('message-content')).toHaveTextContent('Hello, this is a user message');
      
      // Check for the styling classes on the message container
      const messageContainer = container.querySelector('.max-w-2xl');
      expect(messageContainer).toHaveClass('bg-[var(--nv-green)]', 'text-black');
    });

    it('renders assistant message with correct styling', () => {
      const { container } = render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      expect(screen.getByTestId('message-content')).toHaveTextContent('Hello, this is an assistant message');
      
      // Check for the styling classes on the message container
      const messageContainer = container.querySelector('.max-w-2xl');
      expect(messageContainer).toHaveClass('bg-neutral-900', 'text-white');
    });

    it('renders user message with right alignment', () => {
      const { container } = render(<ChatMessageBubble msg={mockUserMessage} />);
      
      const outerContainer = container.querySelector('.flex');
      expect(outerContainer).toHaveClass('justify-end');
    });

    it('renders assistant message with left alignment', () => {
      const { container } = render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      const outerContainer = container.querySelector('.flex');
      expect(outerContainer).toHaveClass('justify-start');
    });

    it('renders citations when present', () => {
      render(<ChatMessageBubble msg={mockAssistantMessageWithCitations} />);
      
      expect(screen.getByTestId('citation-button')).toHaveTextContent('Citations: 2');
    });

    it('does not render citations when not present', () => {
      render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      expect(screen.queryByTestId('citation-button')).not.toBeInTheDocument();
    });

    it('handles empty content', () => {
      const messageWithEmptyContent = { ...mockUserMessage, content: '' };
      
      render(<ChatMessageBubble msg={messageWithEmptyContent} />);
      
      expect(screen.getByTestId('message-content')).toHaveTextContent('');
    });

    it('handles null content', () => {
      const messageWithNullContent = { ...mockUserMessage, content: null as any };
      
      render(<ChatMessageBubble msg={messageWithNullContent} />);
      
      expect(screen.getByTestId('message-content')).toHaveTextContent('');
    });
  });

  describe('Streaming Messages', () => {
    it('renders streaming message when this message is being streamed', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'assistant-1'
      });

      // Create a message with no content to trigger streaming indicator
      const streamingMessage = { ...mockAssistantMessage, content: '' };
      render(<ChatMessageBubble msg={streamingMessage} />);
      
      // Check that MessageContent is rendered (even if empty)
      expect(screen.getByTestId('message-content')).toBeInTheDocument();
      
      // Check for the StreamingIndicator by looking for its specific structure
      const streamingContainer = document.querySelector('.flex.items-center.gap-2');
      expect(streamingContainer).toBeInTheDocument();
    });

    it('does not render streaming when different message is being streamed', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'different-id'
      });

      render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('does not render streaming for user messages even when streaming', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'user-1'
      });

      render(<ChatMessageBubble msg={mockUserMessage} />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('does not render streaming when not streaming', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: false,
        streamingMessageId: 'assistant-1'
      });

      render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('handles empty content in streaming message', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'assistant-1'
      });

      const streamingMessage = { ...mockAssistantMessage, content: '' };
      
      render(<ChatMessageBubble msg={streamingMessage} />);
      
      expect(screen.getByTestId('message-content')).toHaveTextContent('');
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
    });
  });

  describe('Streaming Detection Logic', () => {
    it('correctly identifies streaming state with all conditions met', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'assistant-1'
      });

      // Create a message with no content to trigger streaming indicator
      const streamingMessage = { ...mockAssistantMessage, content: '' };
      render(<ChatMessageBubble msg={streamingMessage} />);
      
      // Should render in streaming mode (check for streaming container)
      const streamingContainer = document.querySelector('.flex.items-center.gap-2');
      expect(streamingContainer).toBeInTheDocument();
    });

    it('does not identify as streaming when isStreaming is false', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: false,
        streamingMessageId: 'assistant-1'
      });

      render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('does not identify as streaming when role is user', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'user-1'
      });

      render(<ChatMessageBubble msg={mockUserMessage} />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });

    it('does not identify as streaming when message IDs do not match', () => {
      mockUseStreamingStore.mockReturnValue({
        isStreaming: true,
        streamingMessageId: 'different-id'
      });

      render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      expect(screen.queryByTestId('streaming-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('applies correct container classes', () => {
      const { container } = render(<ChatMessageBubble msg={mockUserMessage} />);
      
      const messageContainer = container.querySelector('.max-w-2xl');
      expect(messageContainer).toHaveClass('rounded-lg', 'p-4');
    });

    it('renders message content in correct text size', () => {
      render(<ChatMessageBubble msg={mockAssistantMessage} />);
      
      const textContainer = screen.getByTestId('message-content').closest('.text-sm');
      expect(textContainer).toBeInTheDocument();
    });
  });
}); 