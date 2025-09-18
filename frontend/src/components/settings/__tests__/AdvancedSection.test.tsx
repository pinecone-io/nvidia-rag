import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { AdvancedSection } from '../AdvancedSection';

const mockUseSettingsHandlers = vi.fn();

vi.mock('../../../hooks/useSettingsHandlers', () => ({
  useSettingsHandlers: () => mockUseSettingsHandlers()
}));

describe('AdvancedSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsHandlers.mockReturnValue({
      stopTokensInput: '',
      handleStopTokensChange: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('renders stop tokens label', () => {
      render(<AdvancedSection />);
      
      expect(screen.getByText('Stop Tokens')).toBeInTheDocument();
    });

    it('renders help text', () => {
      render(<AdvancedSection />);
      
      expect(screen.getByText('Tokens that will stop text generation when encountered.')).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
      render(<AdvancedSection />);
      
      const input = screen.getByPlaceholderText('Enter tokens separated by commas');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('displays current stop tokens value', () => {
      mockUseSettingsHandlers.mockReturnValue({
        stopTokensInput: 'stop, end, finish',
        handleStopTokensChange: vi.fn()
      });

      render(<AdvancedSection />);
      
      const input = screen.getByDisplayValue('stop, end, finish');
      expect(input).toBeInTheDocument();
    });

    it('calls handleStopTokensChange when input changes', () => {
      const mockHandleChange = vi.fn();
      mockUseSettingsHandlers.mockReturnValue({
        stopTokensInput: '',
        handleStopTokensChange: mockHandleChange
      });

      render(<AdvancedSection />);
      
      const input = screen.getByPlaceholderText('Enter tokens separated by commas');
      fireEvent.change(input, { target: { value: 'new, tokens' } });
      
      expect(mockHandleChange).toHaveBeenCalledWith('new, tokens');
    });

    it('handles empty input value', () => {
      const mockHandleChange = vi.fn();
      mockUseSettingsHandlers.mockReturnValue({
        stopTokensInput: 'existing',
        handleStopTokensChange: mockHandleChange
      });

      render(<AdvancedSection />);
      
      const input = screen.getByDisplayValue('existing');
      fireEvent.change(input, { target: { value: '' } });
      
      expect(mockHandleChange).toHaveBeenCalledWith('');
    });
  });


}); 