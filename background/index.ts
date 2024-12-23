import { clearScriptContent, PageContent, storePageContent } from '../content/utils/contentManager';
import { askAi } from './utils/llm';
import { initializeUser, restoreAccount } from './utils/user';

// Types and Interfaces
// TODO: Write a function for user to get private key from wallet.
type Action = 'new-tab' | 'input' | 'click' | 'infer' | 'wait' | 'select' | 'while';

interface ScriptProject {
  projectScript: string;
  projectName: string;
  projectDescription: string;
  image: string;
}

interface ScriptAction {
  type: Action;
  params: string[];
}

interface UpdateMessage {
  timestamp: number;
  message: string;
  stepIndex?: number;
  status?: STEP_STATUS;
}

// Enums
enum STEP_STATUS {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  FINISHED = 'FINISHED',
  CREDS_REQUIRED = 'CREDS_REQUIRED',
}

// Global Variables
let port: chrome.runtime.Port | null = null;
let currentTaskId: string | null = null;

// Helper Functions
function sendUpdate(message: string, stepIndex?: number, status?: STEP_STATUS): void {
  if (port) {
    const update: UpdateMessage = {
      timestamp: Date.now(),
      message,
      stepIndex,
      status,
    };
    port.postMessage(update);
  }
}

function parseScript(script: string): ScriptAction[] {
  return script
    .split('\n')
    .filter((line) => line.trim() !== '') // Filter out empty lines
    .map((line) => {
      // 1) Split the line on '#' (outside of quotes)
      const parts = splitOutsideQuotes(line, '#');

      // 2) For each segment, remove leading & trailing double quotes
      const sanitizedParts = parts.map((part) => {
        // Remove leading/trailing quotes only if the part starts and ends with a quote
        if (part.startsWith('"') && part.endsWith('"')) {
          return part.slice(1, -1);
        }
        return part;
      });

      // Special handling for "while" loop
      if (line.startsWith('while')) {
        // Sanitize all parts by replacing \" with "
        const sanitizedPartsForWhile = sanitizedParts.map((part) => part.replace(/\\"/g, '"'));

        // Extract condition parts (ensure we clean them)
        const [_, conditionA, inequality, conditionB] = sanitizedPartsForWhile;

        // Extract the content inside { } for actions
        const actionContent = line.substring(line.indexOf('{') + 1, line.lastIndexOf('}')).trim();

        // Recursively parse nested actions with incremented depth
        return {
          type: 'while',
          params: [conditionA, inequality, conditionB, actionContent],
        };
      }

      // 3) For other actions, sanitize the parameters
      const [type, ...params] = sanitizedParts.map((param) => param.replace(/\\"/g, '"'));

      return {
        type: type as Action,
        params, // The rest of the segments are your parameters
      };
    });
}

/**
 * Splits a string by a delimiter only if that delimiter
 * is not within double quotes.
 * Example:
 *   splitOutsideQuotes('abc#def', '#') -> ['abc', 'def']
 *   splitOutsideQuotes('abc"#"def', '#') -> ['abc"#"def']
 */
function splitOutsideQuotes(line: string, delimiter: string): string[] {
  const results: string[] = [];
  let currentSegment = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Flip the inQuotes state whenever we encounter a double quote
      inQuotes = !inQuotes;
      currentSegment += char;
    } else if (char === delimiter && !inQuotes) {
      // If we're NOT inside quotes and we see the delimiter, split here
      results.push(currentSegment);
      currentSegment = '';
    } else {
      // Otherwise, just accumulate the character
      currentSegment += char;
    }
  }

  // Push the last segment
  results.push(currentSegment);

  return results;
}

function waitForPageLoad(workTabId: number): Promise<void> {
  return new Promise<void>((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === workTabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

async function fetchScript(cidr: string): Promise<string> {
  try {
    const result = await chrome.storage.local.get(['jwt', 'gateway']);
    return 'content';
  } catch (error) {
    throw new Error(error as string);
  }
}

// Main Execution Functions
async function executeActions(actions: ScriptAction[], tabInstance: chrome.tabs.Tab | null): Promise<void> {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    try {
      sendUpdate(`Executing action: ${action.type}`, i, STEP_STATUS.RUNNING);

      switch (action.type) {
        case 'new-tab':
          console.log('Background: Opening new tab:', action.params[0]);
          tabInstance = await chrome.tabs.create({ url: action.params[0] });
          console.log('PRINCE new tab ID : ', tabInstance.id);
          sendUpdate(`Opened new tab: ${action.params[0]}`);
          break;

        case 'input':
          console.log('Background: Sending input action:', action);
          if (tabInstance && tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'input',
              queryselector: action.params[0],
              text: action.params[1],
            });
            sendUpdate(`Input entered: ${action.params[1]}`);
          }
          break;

        case 'select':
          if (tabInstance && tabInstance.id) {
            console.log('PRINCE : sending select event ', action);
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'select',
              filterQuerySelector: action.params[0],
              filterValue: action.params[1],
            });
          }
          break;

        case 'while':
          const [conditionA, inequality, conditionB, actionContent] = action.params;
          console.log('Executing while loop:', { conditionA, inequality, conditionB, actionContent });

          let conditionEvaluation = false;
          let maxIterations = 10; // Safeguard to avoid infinite loop

          if (tabInstance && tabInstance.id) {
            // Use await to wait for the response from the content script
            conditionEvaluation = await new Promise((resolve) => {
              chrome.tabs.sendMessage(
                tabInstance!.id!,
                {
                  action: 'evaluateConditionDOM',
                  conditionA,
                  inequality,
                  conditionB,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      'PRINCE: Error sending message to content script:',
                      chrome.runtime.lastError.message,
                    );
                    resolve(false); // Assume condition is false if the content script is unavailable
                    return;
                  }

                  if (response && response.result !== undefined) {
                    console.log('PRINCE reevaluating condition: ', response.result);
                    resolve(response.result); // Use the evaluation result
                  } else {
                    console.error('PRINCE: Invalid response from content script:', response);
                    resolve(false); // Assume condition is false if response is invalid
                  }
                },
              );
            });
          }

          while (conditionEvaluation && maxIterations > 0) {
            const repeatedActions = parseScript(actionContent);
            console.log('PRINCE : repeating these actions: ', repeatedActions);
            await executeActions(repeatedActions, tabInstance); // Pass the tabInstance into the recursive call

            // Wait for a short delay before re-evaluating the condition to give DOM time to update
            // await new Promise((resolve) => setTimeout(resolve, 2500)); // 500ms delay
            await waitForPageLoad(tabInstance!.id!);
            if (currentTaskId) {
              chrome.tabs.sendMessage(tabInstance!.id!, { action: 'getPageContent' }, async (response) => {
                if (response?.content && response?.title) {
                  const pageContent: PageContent = {
                    url: tabInstance!.url || '',
                    title: response.title,
                    content: response.content,
                    timestamp: Date.now(),
                  };
                  await storePageContent(currentTaskId!, pageContent);
                  console.log('Current TaskID : ', currentTaskId);
                }
              });
            }

            // Reevaluate the condition after executing actions
            conditionEvaluation = await new Promise((resolve) => {
              chrome.tabs.sendMessage(
                tabInstance!.id!,
                {
                  action: 'evaluateConditionDOM',
                  conditionA,
                  inequality,
                  conditionB,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      'PRINCE: Error sending message to content script:',
                      chrome.runtime.lastError.message,
                    );
                    resolve(false); // Assume condition is false if the content script is unavailable
                    return;
                  }

                  if (response && response.result !== undefined) {
                    console.log('PRINCE reevaluating condition: ', response.result);
                    resolve(response.result); // Use the evaluation result
                  } else {
                    console.error('PRINCE: Invalid response from content script:', response);
                    resolve(false); // Assume condition is false if response is invalid
                  }
                },
              );
            });

            maxIterations -= 1; // Decrease iterations to avoid infinite loop
            console.log('PRINCE : Execution done.', maxIterations, conditionEvaluation);
          }
          console.log('PRINCE: Out of while loop.', maxIterations);

          if (maxIterations <= 0) {
            console.warn('PRINCE: Exceeded maximum number of iterations for while loop.');
          } else {
            sendUpdate(`Completed while loop`, i, STEP_STATUS.SUCCESS);
          }
          break;

        case 'click':
          console.log({ action });
          if (tabInstance && tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'click',
              queryselector: action.params[0],
            });
          }
          break;

        case 'infer':
          console.log({ action });
          if (tabInstance && tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'infer',
              queryselector: action.params[0],
              text: action.params[1],
            });
          }
          break;

        case 'wait':
          console.log('Background: Waiting for page load');
          if (tabInstance && tabInstance.id) {
            sendUpdate('Waiting for page to load...');
            await waitForPageLoad(tabInstance.id);

            // Collect page content after load
            if (currentTaskId) {
              chrome.tabs.sendMessage(tabInstance.id, { action: 'getPageContent' }, async (response) => {
                if (response?.content && response?.title) {
                  const pageContent: PageContent = {
                    url: tabInstance!.url || '',
                    title: response.title,
                    content: response.content,
                    timestamp: Date.now(),
                  };
                  await storePageContent(currentTaskId!, pageContent);
                  console.log('Current TaskID : ', currentTaskId);
                }
              });
            }

            sendUpdate('Page loaded successfully');
          }
          break;
      }

      sendUpdate(`Completed: ${action.type}`, i, STEP_STATUS.SUCCESS);
    } catch (error) {
      console.error('Background: Action execution error:', error);
      sendUpdate(`Error executing ${action.type}: ${(error as Error).message}`, i, STEP_STATUS.ERROR);
      if (currentTaskId) {
        // TODO: PRINCE Uncomment this.
        // await clearScriptContent(currentTaskId!);
      }
      throw error;
    }
  }

  // After all actions are completed, send content to API
  if (currentTaskId) {
    try {
      // TODO: PRINCE Uncomment this.
      // await sendScriptContentToAPI(currentTaskId);
    } catch (error) {
      // Don't throw here to avoid failing the whole script execution
      console.error('Failed to send script content to API:', error);
    }
  }

  sendUpdate('Script execution completed');
}

// Event Listeners
chrome.runtime.onConnect.addListener((connectingPort) => {
  if (connectingPort.name === 'tracking-port') {
    console.log('Background: New port connection established');
    port = connectingPort;

    port.onDisconnect.addListener(() => {
      console.log('Background: Port disconnected');
      port = null;
      if (currentTaskId) {
        clearScriptContent(currentTaskId).catch(console.error);
        currentTaskId = null;
      }
    });

    port.onMessage.addListener((msg) => {
      console.log('Background: Received message from frontend:', msg);
      if (msg.action === 'START_TRACKING') {
        console.log('Background: Starting tracking for task:', msg.taskId);
        currentTaskId = msg.taskId;
        sendUpdate('Started tracking task ' + msg.taskId);
      }
    });
  }
});

// Message Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('listener running from background.ts');

  if (request.action === 'createUser') {
    (async () => {
      try {
        const user = await initializeUser(request.name);
        console.log('response from background.ts', user);
        sendResponse({ success: true, user: user });
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    return true;
  }

  if (request.action === 'restoreAccount') {
    (async () => {
      try {
        const user = await restoreAccount(request.privateKey);
        sendResponse({ success: true, user: user });
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    return true;
  }

  if (request.action === 'executeScript') {
    (async () => {
      try {
        const content = request.input;
        if (content) {
          console.log('Background: Parsing script:', content);
          const actions = parseScript(content);
          console.log('BG actions after parsing : ', actions);
          await executeActions(actions, null);
          console.log('Background: Script execution completed');
          sendResponse({ success: true });
        } else {
          console.error('Background: No content provided');
          sendResponse({ success: false, error: 'No content provided' });
        }
      } catch (error) {
        console.error('Background: Script execution error:', error);
        // await clearScriptContent(currentTaskId || '');
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    return true;
  }

  if (request.action === 'inferLLM') {
    (async () => {
      try {
        const { prompt } = request;
        const result = await askAi(prompt);
        sendResponse({ success: true, index: result });
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
    })();
    return true;
  }

  return true;
});

// Initialize
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));
