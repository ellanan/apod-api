import { transformExplanation } from './index';

const sampleHtml = `
<b>  </b>
How typical is our Solar System?
Studying <a href="https://science.nasa.gov/example">3I/ATLAS</a>, a comet just passing through, is providing clues.
Confirmed previous interstellar visitors include an
<a href="https://en.wikipedia.org/wiki/Oumuamua">asteroid</a>,
a <a href="ap220305.html">comet</a>, and a meteor.
`;

describe('transformExplanation', () => {
  describe('format: html', () => {
    it('returns the HTML unchanged', () => {
      const result = transformExplanation(sampleHtml, 'html');
      expect(result).toBe(sampleHtml);
    });

    it('preserves anchor tags with href attributes', () => {
      const result = transformExplanation(sampleHtml, 'html');
      expect(result).toContain('<a href="https://science.nasa.gov/example">3I/ATLAS</a>');
      expect(result).toContain('<a href="https://en.wikipedia.org/wiki/Oumuamua">asteroid</a>');
    });
  });

  describe('format: markdown', () => {
    it('converts anchor tags to markdown links', () => {
      const result = transformExplanation(sampleHtml, 'markdown');
      expect(result).toContain('[3I/ATLAS](https://science.nasa.gov/example)');
      expect(result).toContain('[asteroid](https://en.wikipedia.org/wiki/Oumuamua)');
      expect(result).toContain('[comet](ap220305.html)');
    });

    it('strips other HTML tags', () => {
      const result = transformExplanation(sampleHtml, 'markdown');
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('</b>');
    });

    it('normalizes whitespace', () => {
      const result = transformExplanation(sampleHtml, 'markdown');
      expect(result).not.toContain('\n');
      expect(result).not.toMatch(/\s{2,}/);
    });
  });

  describe('format: text', () => {
    it('strips all HTML tags including anchors', () => {
      const result = transformExplanation(sampleHtml, 'text');
      expect(result).not.toContain('<a');
      expect(result).not.toContain('</a>');
      expect(result).not.toContain('<b>');
      expect(result).not.toContain('href=');
    });

    it('preserves link text without URLs', () => {
      const result = transformExplanation(sampleHtml, 'text');
      expect(result).toContain('3I/ATLAS');
      expect(result).toContain('asteroid');
      expect(result).toContain('comet');
    });

    it('normalizes whitespace', () => {
      const result = transformExplanation(sampleHtml, 'text');
      expect(result).not.toContain('\n');
      expect(result).not.toMatch(/\s{2,}/);
    });
  });

  describe('edge cases', () => {
    it('returns empty string for undefined input', () => {
      expect(transformExplanation(undefined, 'text')).toBe('');
      expect(transformExplanation(undefined, 'html')).toBe('');
      expect(transformExplanation(undefined, 'markdown')).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(transformExplanation('', 'text')).toBe('');
      expect(transformExplanation('', 'html')).toBe('');
      expect(transformExplanation('', 'markdown')).toBe('');
    });

    it('handles anchor tags with additional attributes', () => {
      const htmlWithAttrs = '<a href="https://example.com" target="_blank" rel="noopener">link</a>';
      expect(transformExplanation(htmlWithAttrs, 'markdown')).toBe('[link](https://example.com)');
    });

    it('handles plain text without HTML', () => {
      const plainText = 'Just some plain text without any HTML.';
      expect(transformExplanation(plainText, 'text')).toBe(plainText);
      expect(transformExplanation(plainText, 'html')).toBe(plainText);
      expect(transformExplanation(plainText, 'markdown')).toBe(plainText);
    });
  });
});
