export type ExplanationFormat = 'text' | 'html' | 'markdown';

export function transformExplanation(html: string | undefined, format: ExplanationFormat): string {
  if (!html) return '';

  if (format === 'html') {
    return html;
  }
  if (format === 'markdown') {
    // Convert <a href="url">text</a> to [text](url)
    // Supports both single and double quotes, and nested tags inside anchors
    return html
      .replace(/<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, url, text) => {
        // Strip any nested HTML tags from the link text
        const cleanText = text.replace(/<[^>]+>/g, '');
        return `[${cleanText}](${url})`;
      })
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Default: text (strip all HTML)
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function transformData<T extends { explanation?: string }>(
  data: T | T[],
  format: ExplanationFormat
): T | T[] {
  if (Array.isArray(data)) {
    return data.map((entry) => ({
      ...entry,
      explanation: transformExplanation(entry.explanation, format),
    }));
  }
  return {
    ...data,
    explanation: transformExplanation(data.explanation, format),
  };
}
