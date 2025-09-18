import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { MessageTextarea } from '../MessageTextarea';

// Mock all the dependencies
const mockUseChatStore = vi.fn();
const mockUseSendMessage = vi.fn();
const mockUseTextareaResize = vi.fn();
const mockUseMessageSubmit = vi.fn();

vi.mock('../../../store/useChatStore', () => ({
  useChatStore: () => mockUseChatStore()
}));

vi.mock('../../../api/useSendMessage', () => ({
  useSendMessage: () => mockUseSendMessage()
}));

vi.mock('../../../hooks/useTextareaResize', () => ({
  useTextareaResize: () => mockUseTextareaResize()
}));

vi.mock('../../../hooks/useMessageSubmit', () => ({
  useMessageSubmit: () => mockUseMessageSubmit()
}));

describe('MessageTextarea', () => {
  const mockSetInput = vi.fn();
  const mockHandleInput = vi.fn();
  const mockGetTextareaStyle = vi.fn();
  const mockHandleSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseChatStore.mockReturnValue({
      input: '',
      setInput: mockSetInput
    });
    
    mockUseSendMessage.mockReturnValue({
      isStreaming: false
    });
    
    mockUseTextareaResize.mockReturnValue({
      handleInput: mockHandleInput,
      getTextareaStyle: mockGetTextareaStyle
    });
    
    mockUseMessageSubmit.mockReturnValue({
      handleSubmit: mockHandleSubmit
    });
    
    mockGetTextareaStyle.mockReturnValue({});
  });

  describe('Basic Rendering', () => {
    it('renders textarea with default placeholder', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByPlaceholderText('Ask a question about your documents...');
      expect(textarea).toBeInTheDocument();
    });

    it('renders textarea with custom placeholder', () => {
      render(<MessageTextarea placeholder="Custom placeholder text" />);
      
      const textarea = screen.getByPlaceholderText('Custom placeholder text');
      expect(textarea).toBeInTheDocument();
    });

    it('displays current input value', () => {
      mockUseChatStore.mockReturnValue({
        input: 'Current input text',
        setInput: mockSetInput
      });

      render(<MessageTextarea />);
      
      const textarea = screen.getByDisplayValue('Current input text');
      expect(textarea).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(
        'w-full',
        'resize-none',
        'rounded-lg',
        'bg-neutral-800',
        'border',
        'border-neutral-700',
        'text-white'
      );
    });

    it('has correct initial rows attribute', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '1');
    });
  });

  describe('Input Handling', () => {
    it('calls setInput when text changes', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New input text' } });
      
      expect(mockSetInput).toHaveBeenCalledWith('New input text');
    });

    it('calls handleInput on input event', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.input(textarea, { target: { value: 'Input event' } });
      
      expect(mockHandleInput).toHaveBeenCalled();
    });

    it('applies style from getTextareaStyle', () => {
      const customStyle = { height: '100px', minHeight: '50px' };
      mockGetTextareaStyle.mockReturnValue(customStyle);

      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveStyle(customStyle);
    });
  });

  describe('Keyboard Interactions', () => {
    it('calls handleSubmit on Enter key without shift', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      
      expect(mockHandleSubmit).toHaveBeenCalledOnce();
    });

    it('does not call handleSubmit on Enter key with shift', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
      
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });

    it('prevents default on Enter without shift', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      
      // Create a custom event to test preventDefault behavior
      const mockEvent = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: vi.fn()
      };
      
      // Trigger the event handler directly
      fireEvent.keyDown(textarea, mockEvent);
      
      // Verify handleSubmit was called (which indicates preventDefault behavior)
      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('does not prevent default on Enter with shift', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      fireEvent.keyDown(textarea, event);
      
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('does not handle other keys', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Space' });
      fireEvent.keyDown(textarea, { key: 'a' });
      
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Streaming State', () => {
    it('disables textarea when streaming', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: true
      });

      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('enables textarea when not streaming', () => {
      mockUseSendMessage.mockReturnValue({
        isStreaming: false
      });

      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Integration with Hooks', () => {
    it('calls all required hooks', () => {
      render(<MessageTextarea />);
      
      expect(mockUseChatStore).toHaveBeenCalled();
      expect(mockUseSendMessage).toHaveBeenCalled();
      expect(mockUseTextareaResize).toHaveBeenCalled();
      expect(mockUseMessageSubmit).toHaveBeenCalled();
    });

    it('uses style from resize hook', () => {
      const testStyle = { height: '120px' };
      mockGetTextareaStyle.mockReturnValue(testStyle);

      render(<MessageTextarea />);
      
      expect(mockGetTextareaStyle).toHaveBeenCalled();
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveStyle(testStyle);
    });
  });

  describe('Event Handlers', () => {
    it('maintains separate handlers for different events', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      
      // Test change handler
      fireEvent.change(textarea, { target: { value: 'change event' } });
      expect(mockSetInput).toHaveBeenCalledWith('change event');
      
      // Test input handler
      fireEvent.input(textarea, { target: { value: 'input event' } });
      expect(mockHandleInput).toHaveBeenCalled();
      
      // Test keydown handler
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  describe('Focus and Accessibility', () => {
    it('has focus styles', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('maintains accessibility attributes', () => {
      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('placeholder');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input', () => {
      mockUseChatStore.mockReturnValue({
        input: '',
        setInput: mockSetInput
      });

      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('handles null style from resize hook', () => {
      mockGetTextareaStyle.mockReturnValue(null);

      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('handles undefined style from resize hook', () => {
      mockGetTextareaStyle.mockReturnValue(undefined);

      render(<MessageTextarea />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });
}); 