import { parse } from 'node-html-parser';

/**
 * Function to fetch elements with a specific attribute
 * @param html - The HTML content as a string
 * @param attribute - The attribute name to search for
 * @param value - The attribute value to match (optional)
 * @returns Array of matched elements
 */
export function fetchElementsByAttribute(
  html: string,
  attribute: string,
  value?: string
): any[] {
  try {
    // Parse the HTML content
    const root = parse(html);

    // Function to recursively search for matching elements
    const searchElements = (node: any, results: any[]) => {
      if (!node) return;

      if (node.nodeType === 1) {
        // Check if the node has the specified attribute
        const attrValue = node.getAttribute(attribute);
        if (attrValue && (!value || attrValue === value)) {
          results.push(node);
        }
      }

      // Recursively search child nodes
      for (const child of node.childNodes || []) {
        searchElements(child, results);
      }
    };

    const results: any[] = [];
    searchElements(root, results);

    return results;
  } catch (error) {
    console.error('Error fetching elements by attribute:', error);
    return [];
  }
}

export function extractInnerText(elements: any[]): string[] {
    return elements.map((element) => element.innerText.trim());
  }