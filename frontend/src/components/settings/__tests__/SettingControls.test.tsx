import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { SettingToggle, SettingSlider, SettingInput, SettingTextInput } from '../SettingControls';

// Mock the FeatureWarningModal
vi.mock('../../modals/FeatureWarningModal', () => ({
  FeatureWarningModal: ({ isOpen, onClose, onConfirm }: any) => (
    isOpen ? (
      <div data-testid="feature-warning-modal">
        <button data-testid="modal-cancel" onClick={onClose}>Cancel</button>
        <button data-testid="modal-confirm" onClick={onConfirm}>Confirm</button>
      </div>
    ) : null
  )
}));

describe('SettingControls', () => {
  describe('SettingToggle', () => {
    it('opens modal when toggle clicked', () => {
      render(<SettingToggle label="Test" description="Desc" value={false} onChange={vi.fn()} />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(screen.getByTestId('feature-warning-modal')).toBeInTheDocument();
    });

    it('calls onChange when modal confirmed', () => {
      const onChange = vi.fn();
      render(<SettingToggle label="Test" description="Desc" value={false} onChange={onChange} />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      fireEvent.click(screen.getByTestId('modal-confirm'));
      
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('closes modal when cancelled', () => {
      render(<SettingToggle label="Test" description="Desc" value={false} onChange={vi.fn()} />);
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      fireEvent.click(screen.getByTestId('modal-cancel'));
      
      expect(screen.queryByTestId('feature-warning-modal')).not.toBeInTheDocument();
    });
  });

  describe('SettingSlider', () => {
    it('calls onChange when number input changes', () => {
      const onChange = vi.fn();
      render(<SettingSlider label="Test" value={50} onChange={onChange} min={0} max={100} step={1} />);
      
      fireEvent.change(screen.getByTestId('slider-input'), { target: { value: '75' } });
      expect(onChange).toHaveBeenCalledWith(75);
    });

    it('calls onChange when range input changes', () => {
      const onChange = vi.fn();
      render(<SettingSlider label="Test" value={50} onChange={onChange} min={0} max={100} step={1} />);
      
      fireEvent.change(screen.getByTestId('slider-range'), { target: { value: '75' } });
      expect(onChange).toHaveBeenCalledWith(75);
    });
  });

  describe('SettingInput', () => {
    it('calls onChange when input value changes', () => {
      const onChange = vi.fn();
      render(<SettingInput label="Test" value="test" onChange={onChange} />);
      
      fireEvent.change(screen.getByTestId('input-field'), { target: { value: 'new value' } });
      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('shows validation message when invalid', () => {
      render(<SettingInput label="Test" value="test" onChange={vi.fn()} isValid={false} validationMessage="Error" />);
      expect(screen.getByTestId('input-validation-message')).toHaveTextContent('Error');
    });

    it('hides validation message when valid', () => {
      render(<SettingInput label="Test" value="test" onChange={vi.fn()} isValid={true} validationMessage="Error" />);
      expect(screen.queryByTestId('input-validation-message')).not.toBeInTheDocument();
    });
  });

  describe('SettingTextInput', () => {
    it('calls onChange when textarea value changes', () => {
      const onChange = vi.fn();
      render(<SettingTextInput label="Test" value="test" onChange={onChange} />);
      
      fireEvent.change(screen.getByTestId('text-input-field'), { target: { value: 'new text' } });
      expect(onChange).toHaveBeenCalledWith('new text');
    });
  });
}); 