export interface PageContent {
  url: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface ScriptContentData {
  taskId: string;
  pages: PageContent[];
}

// Content Collection Functions
export async function storePageContent(taskId: string, pageContent: PageContent): Promise<void> {
  try {
    const key = `script_content_${taskId}`;
    const result = await chrome.storage.local.get(key);
    let scriptContent: ScriptContentData = result[key] || { taskId, pages: [] };

    // Add new page content
    scriptContent.pages.push(pageContent);

    await chrome.storage.local.set({ [key]: scriptContent });
    console.log('Stored page content for task:', taskId);
  } catch (error) {
    console.error('Error storing page content:', error);
    throw error;
  }
}

export async function clearScriptContent(taskId: string): Promise<void> {
  try {
    const key = `script_content_${taskId}`;
    await chrome.storage.local.remove(key);
    console.log('Cleared content for task:', taskId);
  } catch (error) {
    console.error('Error clearing script content:', error);
    throw error;
  }
}

export async function sendScriptContentToAPI(taskId: string): Promise<void> {
  try {
    const key = `script_content_${taskId}`;
    const result = await chrome.storage.local.get(key);
    const scriptContent: ScriptContentData = result[key];

    if (!scriptContent) {
      console.log('No content found for task:', taskId);
      return;
    }

    // Get API endpoint and JWT from storage
    const { jwt, gateway } = await chrome.storage.local.get(['jwt', 'gateway']);

    // Send content to API
    const response = await fetch(`${gateway}/api/script-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(scriptContent),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    // Clear content after successful API call
    await clearScriptContent(taskId);
    console.log('Successfully sent and cleared script content for task:', taskId);
  } catch (error) {
    console.error('Error sending script content to API:', error);
    throw error;
  }
}
