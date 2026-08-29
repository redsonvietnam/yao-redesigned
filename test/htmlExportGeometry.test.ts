import { describe, it, expect } from 'vitest';
import { generateExportHTML, escapeHtml } from '../src/components/ExportModal';

describe('generateExportHTML - cell geometry', () => {
  const sampleCells = [
    { char: '盤' },
    { char: '王' },
    { char: '天' },
  ];

  it('cellSize = 46 produces 46px width/height', () => {
    const html = generateExportHTML('Test Doc', sampleCells, 46);
    expect(html).toContain('width:46px');
    expect(html).toContain('height:46px');
  });

  it('cellSize = 60 produces 60px width/height', () => {
    const html = generateExportHTML('Test Doc', sampleCells, 60);
    expect(html).toContain('width:60px');
    expect(html).toContain('height:60px');
  });

  it('cellSize = 60 produces glyph size 37px (Math.round(60 * 0.61))', () => {
    const html = generateExportHTML('Test Doc', sampleCells, 60);
    expect(html).toContain('font-size:37px');
  });

  it('cellSize = 46 produces glyph size 28px (Math.round(46 * 0.61))', () => {
    const html = generateExportHTML('Test Doc', sampleCells, 46);
    expect(html).toContain('font-size:28px');
  });

  it('different cellSize values produce different exported geometry', () => {
    const html46 = generateExportHTML('Test Doc', sampleCells, 46);
    const html60 = generateExportHTML('Test Doc', sampleCells, 60);
    expect(html46).not.toBe(html60);
    expect(html46).toContain('width:46px');
    expect(html60).toContain('width:60px');
  });

  it('HTML escaping remains correct: <b>x</b> → escaped', () => {
    const cellsWithHtml = [{ char: '<b>x</b>' }];
    const html = generateExportHTML('Test Doc', cellsWithHtml, 46);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
  });

  it('ampersand escaping remains correct', () => {
    const cellsWithAmp = [{ char: 'A&B' }];
    const html = generateExportHTML('Test Doc', cellsWithAmp, 46);
    expect(html).toContain('A&amp;B');
    expect(html).not.toContain('A&B');
  });

  it('quote escaping remains correct', () => {
    const cellsWithQuote = [{ char: 'A"B' }];
    const html = generateExportHTML('Test Doc', cellsWithQuote, 46);
    expect(html).toContain('A&quot;B');
  });

  it('apostrophe escaping remains correct', () => {
    const cellsWithApos = [{ char: "A'B" }];
    const html = generateExportHTML('Test Doc', cellsWithApos, 46);
    expect(html).toContain('A&#39;B');
  });



  it('basic exported HTML structure remains valid', () => {
    const html = generateExportHTML('Test Doc', sampleCells, 46);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('<head>');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('<title>Test Doc</title>');
    expect(html).toContain('<style>');
    expect(html).toContain('<body>');
    expect(html).toContain('<h1>Test Doc</h1>');
    expect(html).toContain('<div class="grid">');
    expect(html).toContain('</html>');
  });
});

describe('escapeHtml - regression', () => {
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
});