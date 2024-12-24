import { clearScriptContent, PageContent, storePageContent } from '../content/utils/contentManager';
import {askAi} from './utils/llm';
import { initializeUser, restoreAccount } from './utils/user';

// Types and Interfaces
// TODO: Write a function for user to get private key from wallet.
type Action = 'new-tab' | 'input' | 'click' | 'infer' | 'wait';

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

function parseScript(script: string): ScriptAction[] {
  // If your script can have multiple lines, split them
  const lines = script
    .split('\n')
    .map(l => l.trim())
    .filter((l) => l !== '');

  return lines.map(parseSingleLine);
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
async function executeActions(actions: ScriptAction[]): Promise<void> {
  let tabInstance = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

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
          tabInstance = await chrome.tabs.create({ url: action.params[0] as string });
          sendUpdate(`Opened new tab: ${action.params[0]}`);
          break;

        case 'input':
          if (tabInstance.id) {
            // action.params[0] is the selector
            // action.params[1] is the text (which may have come from nested infer)
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'input',
              queryselector: action.params[0],
              text: action.params[1]
            });
            sendUpdate(`Input entered: ${action.params[1]}`);
          }
          break;

        case 'click':
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'click',
              queryselector: action.params[0]
            });
          }
          break;

        case 'infer':
          if (tabInstance.id) {
            // For a top-level 'infer', do something or store its result
            // But typically, you'd handle 'infer' as a sub-action or just proceed
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'infer',
              queryselector: action.params[0],
              text: action.params[1]
            });
          }
          break;

        case 'wait':
          if (tabInstance.id) {
            sendUpdate('Waiting for page to load...');
            await waitForPageLoad(tabInstance.id);
            // Collect page content after load...
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
async function executeSubAction(action: ScriptAction, currentTab: chrome.tabs.Tab): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      console.log('Executing subAction:', action);

      if (!currentTab.id) {
        return reject('No current tab found');
      }

      if (action.type === 'infer') {
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
          await executeActions(actions);
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


