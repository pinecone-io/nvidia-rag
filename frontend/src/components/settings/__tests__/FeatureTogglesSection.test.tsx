import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { FeatureTogglesSection } from '../FeatureTogglesSection';

const mockUseSettingsStore = vi.fn();

vi.mock('../../../store/useSettingsStore', () => ({
  useSettingsStore: () => mockUseSettingsStore()
}));

describe('FeatureTogglesSection', () => {
  const mockOnShowWarning = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettingsStore.mockReturnValue({
      enableReranker: false,
      includeCitations: false,
      useGuardrails: false,
      enableQueryRewriting: false,
      enableVlmInference: false,
      enableFilterGenerator: false
    });
  });

  describe('Rendering', () => {
    it('renders all feature toggle labels', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      expect(screen.getByText('Enable Reranker')).toBeInTheDocument();
      expect(screen.getByText('Include Citations')).toBeInTheDocument();
      expect(screen.getByText('Use Guardrails')).toBeInTheDocument();
      expect(screen.getByText('Query Rewriting')).toBeInTheDocument();
      expect(screen.getByText('VLM Inference')).toBeInTheDocument();
      expect(screen.getByText('Filter Generator')).toBeInTheDocument();
    });

    it('renders all feature descriptions', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      expect(screen.getByText('Use reranking to improve document relevance')).toBeInTheDocument();
      expect(screen.getByText('Add source citations to responses')).toBeInTheDocument();
      expect(screen.getByText('Apply safety guardrails to responses')).toBeInTheDocument();
      expect(screen.getByText('Rewrite user queries for better retrieval')).toBeInTheDocument();
      expect(screen.getByText('Enable vision-language model inference')).toBeInTheDocument();
      expect(screen.getByText('Auto-generate filters from queries')).toBeInTheDocument();
    });

    it('renders toggle buttons for all features', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const toggleButtons = screen.getAllByRole('button');
      expect(toggleButtons).toHaveLength(6);
    });
  });

  describe('Toggle States', () => {
    it('shows disabled state for false values', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const toggleButtons = screen.getAllByRole('button');
      toggleButtons.forEach(button => {
        expect(button).toHaveClass('bg-neutral-600');
        expect(button).not.toHaveClass('bg-[var(--nv-green)]');
      });
    });

    it('shows enabled state for true values', () => {
      mockUseSettingsStore.mockReturnValue({
        enableReranker: true,
        includeCitations: true,
        useGuardrails: false,
        enableQueryRewriting: false,
        enableVlmInference: false,
        enableFilterGenerator: false
      });

      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const toggleButtons = screen.getAllByRole('button');
      
      // First two should be enabled
      expect(toggleButtons[0]).toHaveClass('bg-[var(--nv-green)]');
      expect(toggleButtons[1]).toHaveClass('bg-[var(--nv-green)]');
      
      // Rest should be disabled
      expect(toggleButtons[2]).toHaveClass('bg-neutral-600');
      expect(toggleButtons[3]).toHaveClass('bg-neutral-600');
      expect(toggleButtons[4]).toHaveClass('bg-neutral-600');
      expect(toggleButtons[5]).toHaveClass('bg-neutral-600');
    });

    it('positions toggle indicator correctly based on state', () => {
      mockUseSettingsStore.mockReturnValue({
        enableReranker: true,
        includeCitations: false,
        useGuardrails: false,
        enableQueryRewriting: false,
        enableVlmInference: false,
        enableFilterGenerator: false
      });

      const { container } = render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const indicators = container.querySelectorAll('.inline-block.h-4.w-4');
      
      // First indicator should be in "on" position
      expect(indicators[0]).toHaveClass('translate-x-6');
      
      // Others should be in "off" position
      expect(indicators[1]).toHaveClass('translate-x-1');
      expect(indicators[2]).toHaveClass('translate-x-1');
    });
  });

  describe('Toggle Interactions', () => {
    it('calls onShowWarning when Enable Reranker is clicked', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const rerankerToggle = screen.getAllByRole('button')[0];
      fireEvent.click(rerankerToggle);
      
      expect(mockOnShowWarning).toHaveBeenCalledWith('enableReranker', true);
    });

    it('calls onShowWarning when Include Citations is clicked', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const citationsToggle = screen.getAllByRole('button')[1];
      fireEvent.click(citationsToggle);
      
      expect(mockOnShowWarning).toHaveBeenCalledWith('includeCitations', true);
    });

    it('calls onShowWarning to disable when feature is currently enabled', () => {
      mockUseSettingsStore.mockReturnValue({
        enableReranker: true,
        includeCitations: false,
        useGuardrails: false,
        enableQueryRewriting: false,
        enableVlmInference: false,
        enableFilterGenerator: false
      });

      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const rerankerToggle = screen.getAllByRole('button')[0];
      fireEvent.click(rerankerToggle);
      
      expect(mockOnShowWarning).toHaveBeenCalledWith('enableReranker', false);
    });

    it('calls onShowWarning for all different feature keys', () => {
      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const toggleButtons = screen.getAllByRole('button');
      const expectedKeys = [
        'enableReranker',
        'includeCitations', 
        'useGuardrails',
        'enableQueryRewriting',
        'enableVlmInference',
        'enableFilterGenerator'
      ];
      
      toggleButtons.forEach((button, index) => {
        fireEvent.click(button);
        expect(mockOnShowWarning).toHaveBeenCalledWith(expectedKeys[index], true);
      });
      
      expect(mockOnShowWarning).toHaveBeenCalledTimes(6);
    });
  });

  describe('Mixed States', () => {
    it('handles mixed enabled/disabled states correctly', () => {
      mockUseSettingsStore.mockReturnValue({
        enableReranker: true,
        includeCitations: false,
        useGuardrails: true,
        enableQueryRewriting: false,
        enableVlmInference: true,
        enableFilterGenerator: false
      });

      render(<FeatureTogglesSection onShowWarning={mockOnShowWarning} />);
      
      const toggleButtons = screen.getAllByRole('button');
      
      // Check specific patterns
      expect(toggleButtons[0]).toHaveClass('bg-[var(--nv-green)]'); // enabled
      expect(toggleButtons[1]).toHaveClass('bg-neutral-600'); // disabled
      expect(toggleButtons[2]).toHaveClass('bg-[var(--nv-green)]'); // enabled
      expect(toggleButtons[3]).toHaveClass('bg-neutral-600'); // disabled
      expect(toggleButtons[4]).toHaveClass('bg-[var(--nv-green)]'); // enabled
      expect(toggleButtons[5]).toHaveClass('bg-neutral-600'); // disabled
    });
  });


}); 