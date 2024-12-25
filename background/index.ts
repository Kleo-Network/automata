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

/**
 * Checks if a parameter looks like a nested action.
 * Example of a "nested action" in parentheses:
 *   (infer#".abc"#"get button text from this element")
 *
 * If it does, we parse that substring as a separate ScriptAction.
 */
function parseParameter(param: string): ScriptAction | string {
  // If the param doesn't start with '(' and end with ')', return as is
  if (!param.startsWith('(') || !param.endsWith(')')) {
    return param; // It's just a normal string parameter
  }

  // Remove outer parentheses
  const inside = param.slice(1, -1).trim(); // "infer#".abc"#"prompt text"

  // Now parse the inside with the same logic as we do for normal lines,
  // but we only expect a single action, so we can parse just once.
  const subActions = splitOutsideQuotes(inside, '\n').length > 1
    ? parseScript(inside) // If you allowed multiline inside
    : [parseSingleLine(inside)]; // or parse a single line

  // For simplicity, assume only one action in the parentheses
  if (subActions.length === 1) {
    return subActions[0];
  } else {
    // If you want to handle multiple actions inside parentheses, you'd return them all or handle differently
    throw new Error('Nested parentheses must contain only one action in this example.');
  }
}

/**
 * Same idea as parseScript, but for a single line only.
 * Returns a single ScriptAction.
 */
function parseSingleLine(line: string): ScriptAction {
  // 1) Split on '#' outside quotes
  const parts = splitOutsideQuotes(line, '#');

  // 2) Remove leading/trailing quotes
  const sanitizedParts = parts.map((part) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return part.slice(1, -1);
    }
    return part;
  });

  // 3) The first segment is action type, the rest are params
  const [type, ...rawParams] = sanitizedParts;

  // 4) Parse each param again to check for nested actions
  const params = rawParams.map(parseParameter);

  return {
    type: type as Action,
    params: params as string[] // or ScriptAction[] if you want to allow sub-actions
  };
}
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

function parseScript(script: string): ScriptAction[] {
  // 1) Split script into lines, trim each, and filter out empties
  const lines = script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  // 2) For each line, handle "while" specially or parse single-line
  const actions: ScriptAction[] = lines.map((line) => {
    // Special handling for "while" loop
    if (line.startsWith('while')) {
      // 2a) Split the line on '#' (outside of quotes)
      const parts = splitOutsideQuotes(line, '#');

      // 2b) Remove leading/trailing double quotes
      const sanitizedParts = parts.map((part) => {
        if (part.startsWith('"') && part.endsWith('"')) {
          return part.slice(1, -1);
        }
        return part;
      });

      // 2c) Further sanitize each part by replacing `\"` with `"`.
      const sanitizedPartsForWhile = sanitizedParts.map((part) =>
        part.replace(/\\"/g, '"')
      );

      // 2d) Extract condition parts from the sanitized array.
      //     We’re ignoring the first element (`while`) since we already know this is a while action.
      const [_, conditionA, inequality, conditionB] = sanitizedPartsForWhile;

      // 2e) Extract the content inside `{ ... }`
      //     The line should have something like: while # conditionA # inequality # conditionB # { ... }
      const actionContent = line.substring(
        line.indexOf('{') + 1,
        line.lastIndexOf('}')
      ).trim();

      return {
        type: 'while',
        params: [conditionA, inequality, conditionB, actionContent],
      };
    }

    // 3) If it’s not a `while`, parse it as a regular single-line action
    return parseSingleLine(line);
  });

  // 4) Return the array of ScriptAction objects
  return actions;
}


/**
 * Splits a string by a delimiter only if that delimiter
 * is not within double quotes.
 * Example:
 *   splitOutsideQuotes('abc#def', '#') -> ['abc', 'def']
 *   splitOutsideQuotes('abc"#"def', '#') -> ['abc"#"def']
 */


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


// Main Execution Functions
async function executeActions(actions: ScriptAction[], tabInstance: chrome.tabs.Tab | null): Promise<void> {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    try {
      sendUpdate(`Executing action: ${action.type}`, i, STEP_STATUS.RUNNING);

      // 1) If any param is a sub-action, resolve it first.
      for (let j = 0; j < action.params.length; j++) {
        const param = action.params[j];
        if (isScriptAction(param)) {
          // param is a nested action
          const subAction = param as ScriptAction;
          // Execute the sub-action to get a result string
          const subResult = await executeSubAction(subAction, tabInstance);
          // Replace the param in the parent action with the result
          action.params[j] = subResult;
        }
      }

      // 2) Now that nested actions (if any) are resolved, you can proceed
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
      throw error;  // or handle it in some other way
    }
  }

  sendUpdate('Script execution completed');
}

/**
 * Checks if the given parameter is a ScriptAction object vs. a string.
 */
function isScriptAction(param: any): param is ScriptAction {
  return typeof param === 'object' && param.type !== undefined && param.params !== undefined;
}

/**
 * Execute a sub-action. Returns the result as a string (or whatever you need).
 */
async function executeSubAction(action: ScriptAction, currentTab: chrome.tabs.Tab | null): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      console.log('Executing subAction:', action);

      if (currentTab && !currentTab.id) {
        return reject('No current tab found');
      }

      if (currentTab && currentTab.id && action.type === 'infer') {
        // Example: we send a message to content script to do 'infer'
        chrome.tabs.sendMessage(
          currentTab.id,
          {
            action: 'infer',
            queryselector: action.params[0],
            text: action.params[1]
          },
          (response) => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError.message);
            }
            // Suppose the content script responds with { result: "some text" }
            if (response?.result) {
              console.log("result from the subaction", response.result)
              resolve(response.result);
            } else {
              resolve(''); // Or handle differently
            }
          }
        );
      } else {
        // If you want to allow other sub-actions, handle them similarly
        resolve('');
      }
    } catch (err) {
      reject(err);
    }
  });
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
