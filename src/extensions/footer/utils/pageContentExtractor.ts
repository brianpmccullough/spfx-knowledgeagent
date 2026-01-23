export interface IExtractedContent {
  index: number;
  content: string;
  element: HTMLElement;
}

export interface IExtractionProgress {
  current: number;
  total: number;
  status: 'extracting' | 'complete';
}

export type ProgressCallback = (progress: IExtractionProgress) => void;

/**
 * Extracts text content from all Rich Text Editor web parts on the page
 * with visual highlighting feedback as each element is processed.
 */
export async function extractRichTextContent(
  onProgress?: ProgressCallback,
  highlightDuration: number = 800
): Promise<IExtractedContent[]> {
  const elements = document.querySelectorAll<HTMLElement>('[data-sp-feature-tag="Rich Text Editor"]');
  const contents: IExtractedContent[] = [];
  const originalStyles = new Map<HTMLElement, { border: string; backgroundColor: string; transition: string }>();

  const total = elements.length;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // Store original styles
    originalStyles.set(element, {
      border: element.style.border,
      backgroundColor: element.style.backgroundColor,
      transition: element.style.transition
    });

    // Report progress
    onProgress?.({ current: i + 1, total, status: 'extracting' });

    try {
      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Apply highlight styles
      element.style.transition = 'background-color 0.3s, border 0.3s';
      element.style.border = '2px dashed #0078d4';
      element.style.backgroundColor = 'rgba(0, 120, 212, 0.1)';

      // Wait for scroll and let user see the highlight
      await delay(highlightDuration);

      // Extract text content
      const textContent = element.textContent?.trim() || '';
      if (textContent) {
        contents.push({
          index: i,
          content: textContent,
          element
        });
      }

      // Mark as processed (green)
      element.style.border = '2px solid #107c10';
      element.style.backgroundColor = 'rgba(16, 124, 16, 0.1)';

      await delay(300);

    } catch (error) {
      console.error(`Error processing element ${i + 1}/${total}:`, error);
    }
  }

  // Restore original styles after a brief pause
  await delay(500);
  originalStyles.forEach((style, element) => {
    element.style.transition = 'background-color 0.3s, border 0.3s';
    element.style.border = style.border;
    element.style.backgroundColor = style.backgroundColor;
    // Remove transition after animation completes
    setTimeout(() => {
      element.style.transition = style.transition;
    }, 300);
  });

  onProgress?.({ current: total, total, status: 'complete' });

  return contents;
}

/**
 * Parses a translation command to extract the target language.
 * Returns null if the input is not a translation command.
 *
 * Supported formats:
 * - "translate this page to Spanish"
 * - "translate page to French"
 * - "translate to German"
 */
export function parseTranslationCommand(input: string): string | undefined {
  const patterns = [
    /translate\s+(?:this\s+)?page\s+to\s+(\w+)/i,
    /translate\s+to\s+(\w+)/i,
    /translate\s+(?:this\s+)?page\s+(?:into|in)\s+(\w+)/i
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Combines extracted content into a single string for API submission
 */
export function formatContentForTranslation(contents: IExtractedContent[]): string {
  return contents
    .map((item, idx) => `[Section ${idx + 1}]\n${item.content}`)
    .join('\n\n---\n\n');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
