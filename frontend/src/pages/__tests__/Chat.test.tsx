import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/utils';
import Chat from '../Chat';

// Mock scrollIntoView function for jsdom environment
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock all child components to isolate page behavior
const mockUseChatStore = vi.fn();
vi.mock('../../store/useChatStore', () => ({
  useChatStore: () => mockUseChatStore()
}));

vi.mock('../../components/chat/MessageInput', () => ({
  default: () => <div data-testid="message-input">Message Input</div>
}));

vi.mock('../../components/chat/ChatMessageBubble', () => ({
  default: ({ msg }: { msg: any }) => (
    <div data-testid="chat-message-bubble">
      {msg.role}: {msg.content}
    </div>
  )
}));

vi.mock('../../components/collections/CollectionList', () => ({
  default: () => <div data-testid="collection-list">Collection List</div>
}));

vi.mock('../../components/drawer/SidebarDrawer', () => ({
  default: () => <div data-testid="sidebar-drawer">Sidebar Drawer</div>
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatStore.mockReturnValue({
      messages: [
        { id: '1', content: 'Hello', role: 'user' },
        { id: '2', content: 'Hi there!', role: 'assistant' }
      ]
    });
  });

  describe('Component Rendering', () => {
    it('renders CollectionList component', () => {
      render(<Chat />);
      
      expect(screen.getByTestId('collection-list')).toBeInTheDocument();
    });

    it('renders MessageInput component', () => {
      render(<Chat />);
      
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
    });

    it('renders SidebarDrawer component', () => {
      render(<Chat />);
      
      expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();
    });

    it('renders all main components together', () => {
      render(<Chat />);
      
      expect(screen.getByTestId('collection-list')).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-drawer')).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('renders chat message bubbles for each message', () => {
      render(<Chat />);
      
      const bubbles = screen.getAllByTestId('chat-message-bubble');
      expect(bubbles).toHaveLength(2);
    });

    it('displays correct message content', () => {
      render(<Chat />);
      
      expect(screen.getByText('user: Hello')).toBeInTheDocument();
      expect(screen.getByText('assistant: Hi there!')).toBeInTheDocument();
    });

    it('handles empty messages array', () => {
      mockUseChatStore.mockReturnValue({
        messages: []
      });

      render(<Chat />);
      
      const bubbles = screen.queryAllByTestId('chat-message-bubble');
      expect(bubbles).toHaveLength(0);
    });

    it('handles single message', () => {
      mockUseChatStore.mockReturnValue({
        messages: [{ id: '1', content: 'Only message', role: 'user' }]
      });

      render(<Chat />);
      
      const bubbles = screen.getAllByTestId('chat-message-bubble');
      expect(bubbles).toHaveLength(1);
      expect(screen.getByText('user: Only message')).toBeInTheDocument();
    });

    it('handles multiple messages', () => {
      mockUseChatStore.mockReturnValue({
        messages: [
          { id: '1', content: 'First', role: 'user' },
          { id: '2', content: 'Second', role: 'assistant' },
          { id: '3', content: 'Third', role: 'user' }
        ]
      });

      render(<Chat />);
      
      const bubbles = screen.getAllByTestId('chat-message-bubble');
      expect(bubbles).toHaveLength(3);
    });
  });

  describe('Layout Structure', () => {
    it('uses correct layout classes', () => {
      const { container } = render(<Chat />);
      
      const mainDiv = container.firstElementChild;
      expect(mainDiv).toHaveClass('flex', 'h-[calc(100vh-56px)]', 'bg-nvidia-dark');
    });

    it('maintains component order in layout', () => {
      render(<Chat />);
      
      const collectionList = screen.getByTestId('collection-list');
      const messageInput = screen.getByTestId('message-input');
      const sidebarDrawer = screen.getByTestId('sidebar-drawer');
      
      // CollectionList should come first, then message area, then sidebar
      expect(collectionList.compareDocumentPosition(messageInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(messageInput.compareDocumentPosition(sidebarDrawer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('renders scroll bottom reference element', () => {
      const { container } = render(<Chat />);
      
      // Check that there's a ref element for auto-scrolling (div without content)
      const chatArea = container.querySelector('.space-y-6');
      expect(chatArea).toBeInTheDocument();
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('includes scroll reference element', () => {
      const { container } = render(<Chat />);
      
      // The bottomRef element should be present for scrolling
      const messagesContainer = container.querySelector('.space-y-6');
      expect(messagesContainer).toBeInTheDocument();
      expect(messagesContainer?.children.length).toBeGreaterThanOrEqual(2); // messages + ref div
    });

    it('renders messages in correct container', () => {
      render(<Chat />);
      
      const bubbles = screen.getAllByTestId('chat-message-bubble');
      expect(bubbles).toHaveLength(2);
      
      // All bubbles should be rendered
      bubbles.forEach(bubble => {
        expect(bubble).toBeInTheDocument();
      });
    });
  });
}); 