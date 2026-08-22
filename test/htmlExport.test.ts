import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/components/ExportModal';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('A&B')).toBe('A&amp;B');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a>b')).toBe('a&gt;b');
  });

  it('escapes double quote', () => {
    expect(escapeHtml('a"b')).toBe('a&quot;b');
  });

  it('escapes single quote', () => {
    expect(escapeHtml("a'b")).toBe('a&#39;b');
  });

  it('escapes all special chars combined', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles Vietnamese text with diacritics', () => {
    expect(escapeHtml('Xin chào')).toBe('Xin chào');
  });

  it('handles mixed content with HTML entities', () => {
    expect(escapeHtml('Tom & Jerry say "hi"')).toBe(
      'Tom &amp; Jerry say &quot;hi&quot;'
    );
  });
});
