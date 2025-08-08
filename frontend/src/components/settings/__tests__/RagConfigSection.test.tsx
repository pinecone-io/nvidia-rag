import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { RagConfigSection } from '../RagConfigSection';

const mockUseSettingsStore = vi.fn();
const mockUseSettingsHandlers = vi.fn();

vi.mock('../../../store/useSettingsStore', () => ({
  useSettingsStore: () => mockUseSettingsStore()
}));

vi.mock('../../../hooks/useSettingsHandlers', () => ({
  useSettingsHandlers: () => mockUseSettingsHandlers()
}));

describe('RagConfigSection', () => {
  const mockSetSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue({
      temperature: 0.7,
      topP: 0.9,
      confidenceScoreThreshold: 0.5,
      vdbTopK: 10,
      rerankerTopK: 5,
      set: mockSetSettings
    });
    
    mockUseSettingsHandlers.mockReturnValue({
      vdbTopKInput: '10',
      rerankerTopKInput: '5',
      maxTokensInput: '1000',
      handleVdbTopKChange: vi.fn(),
      handleRerankerTopKChange: vi.fn(),
      handleMaxTokensChange: vi.fn()
    });
  });

  describe('Temperature Control', () => {
    it('renders temperature label', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });

    it('renders temperature help text', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText(/Controls randomness in responses/)).toBeInTheDocument();
    });

    it('displays current temperature value', () => {
      render(<RagConfigSection />);
      
      const numberInputs = screen.getAllByDisplayValue('0.7');
      expect(numberInputs.length).toBeGreaterThan(0);
    });

    it('calls setSettings when temperature changes via number input', () => {
      render(<RagConfigSection />);
      
      const numberInputs = screen.getAllByRole('spinbutton');
      const temperatureInput = numberInputs.find(input => 
        input.getAttribute('step') === '0.1' && 
        input.getAttribute('max') === '1'
      );
      
      fireEvent.change(temperatureInput!, { target: { value: '0.8' } });
      
      expect(mockSetSettings).toHaveBeenCalledWith({ temperature: 0.8 });
    });

    it('calls setSettings when temperature changes via range slider', () => {
      render(<RagConfigSection />);
      
      const sliders = screen.getAllByRole('slider');
      const temperatureSlider = sliders.find(slider => 
        slider.getAttribute('step') === '0.1' && 
        slider.getAttribute('max') === '1'
      );
      
      fireEvent.change(temperatureSlider!, { target: { value: '0.3' } });
      
      expect(mockSetSettings).toHaveBeenCalledWith({ temperature: 0.3 });
    });
  });

  describe('Top P Control', () => {
    it('renders top P label', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText('Top P')).toBeInTheDocument();
    });

    it('displays current top P value', () => {
      render(<RagConfigSection />);
      
      const numberInputs = screen.getAllByDisplayValue('0.9');
      expect(numberInputs.length).toBeGreaterThan(0);
    });

    it('calls setSettings when top P changes', () => {
      render(<RagConfigSection />);
      
      const numberInputs = screen.getAllByRole('spinbutton');
      const topPInput = numberInputs.find(input => 
        input.getAttribute('step') === '0.1' && 
        input.getAttribute('max') === '1' &&
        input.getAttribute('value') === '0.9'
      );
      
      fireEvent.change(topPInput!, { target: { value: '0.95' } });
      
      expect(mockSetSettings).toHaveBeenCalledWith({ topP: 0.95 });
    });
  });

  describe('Confidence Score Threshold', () => {
    it('renders confidence score threshold label', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText('Confidence Score Threshold')).toBeInTheDocument();
    });

    it('displays current confidence score threshold value', () => {
      render(<RagConfigSection />);
      
      const numberInputs = screen.getAllByDisplayValue('0.5');
      expect(numberInputs.length).toBeGreaterThan(0);
    });

    it('calls setSettings when confidence score threshold changes', () => {
      render(<RagConfigSection />);
      
      const numberInputs = screen.getAllByRole('spinbutton');
      const confidenceInput = numberInputs.find(input => 
        input.getAttribute('step') === '0.05' && 
        input.getAttribute('min') === '0' &&
        input.getAttribute('max') === '1'
      );
      
      fireEvent.change(confidenceInput!, { target: { value: '0.7' } });
      
      expect(mockSetSettings).toHaveBeenCalledWith({ confidenceScoreThreshold: 0.7 });
    });
  });

  describe('VDB Top K Control', () => {
    it('renders VDB top K label', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText('Vector DB Top K')).toBeInTheDocument();
    });

    it('displays current VDB top K value', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('calls handler when VDB top K changes', () => {
      const mockHandler = vi.fn();
      mockUseSettingsHandlers.mockReturnValue({
        vdbTopKInput: '10',
        rerankerTopKInput: '5',
        maxTokensInput: '1000',
        handleVdbTopKChange: mockHandler,
        handleRerankerTopKChange: vi.fn(),
        handleMaxTokensChange: vi.fn()
      });

      render(<RagConfigSection />);
      
      const vdbInput = screen.getByDisplayValue('10');
      fireEvent.change(vdbInput, { target: { value: '15' } });
      
      expect(mockHandler).toHaveBeenCalledWith('15');
    });
  });

  describe('Reranker Top K Control', () => {
    it('renders reranker top K label', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText('Reranker Top K')).toBeInTheDocument();
    });

    it('displays current reranker top K value', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('calls handler when reranker top K changes', () => {
      const mockHandler = vi.fn();
      mockUseSettingsHandlers.mockReturnValue({
        vdbTopKInput: '10',
        rerankerTopKInput: '5',
        maxTokensInput: '1000',
        handleVdbTopKChange: vi.fn(),
        handleRerankerTopKChange: mockHandler,
        handleMaxTokensChange: vi.fn()
      });

      render(<RagConfigSection />);
      
      const rerankerInput = screen.getByDisplayValue('5');
      fireEvent.change(rerankerInput, { target: { value: '8' } });
      
      expect(mockHandler).toHaveBeenCalledWith('8');
    });
  });

  describe('Max Tokens Control', () => {
    it('renders max tokens label', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText('Max Tokens')).toBeInTheDocument();
    });

    it('displays current max tokens value', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    it('calls handler when max tokens changes', () => {
      const mockHandler = vi.fn();
      mockUseSettingsHandlers.mockReturnValue({
        vdbTopKInput: '10',
        rerankerTopKInput: '5',
        maxTokensInput: '1000',
        handleVdbTopKChange: vi.fn(),
        handleRerankerTopKChange: vi.fn(),
        handleMaxTokensChange: mockHandler
      });

      render(<RagConfigSection />);
      
      const maxTokensInput = screen.getByDisplayValue('1000');
      fireEvent.change(maxTokensInput, { target: { value: '2000' } });
      
      expect(mockHandler).toHaveBeenCalledWith('2000');
    });
  });

  describe('Help Text', () => {
    it('renders help text for controls', () => {
      render(<RagConfigSection />);
      
      expect(screen.getByText(/Controls randomness in responses/)).toBeInTheDocument();
      expect(screen.getByText(/Limits token selection to cumulative probability/)).toBeInTheDocument();
    });
  });
}); 