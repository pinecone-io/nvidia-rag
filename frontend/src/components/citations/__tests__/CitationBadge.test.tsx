import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import { CitationBadge } from '../CitationBadge';

describe('CitationBadge', () => {
  describe('Number Display', () => {
    it('displays the provided number', () => {
      render(<CitationBadge number={5} />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays different numbers correctly', () => {
      render(<CitationBadge number={123} />);
      
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('displays single digit numbers', () => {
      render(<CitationBadge number={1} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays zero', () => {
      render(<CitationBadge number={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays negative numbers', () => {
      render(<CitationBadge number={-5} />);
      
      expect(screen.getByText('-5')).toBeInTheDocument();
    });
  });
}); 