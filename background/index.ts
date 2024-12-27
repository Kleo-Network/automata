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

  const action = parseSingleLine(inside);
  console.log("subaction from line 74 : ", action);
  return action;
}

/**
 * Same idea as parseScript, but for a single line only.
 * Returns a single ScriptAction.
 */
function parseSingleLine(line: string): ScriptAction {
  // 1) Split by '#' **only** if we're not in quotes or parentheses
  const parts = splitOutsideParenthesesAndQuotes(line);

  // 2) First token is the action type
  const [type, ...rawParams] = parts;

  // 3) Clean up leading/trailing quotes from each param
  //    then parseParameter(...) to handle nested ( ... ) actions
  const sanitizedParams = rawParams.map((p) => {
    let param = p;
    if (param.startsWith('"') && param.endsWith('"')) {
      param = param.slice(1, -1);
    }
    return parseParameter(param);
  });

  return {
    type: type as Action,
    // If you’d like to handle real nesting, type could be (string|ScriptAction)[] 
    // but we’ll assume string[] is acceptable once parseParameter returns the correct shape.
    params: sanitizedParams as string[],
  };
}


/**
 * Splits a line into tokens by '#' **unless** we are inside quotes 
 * or inside parentheses. This way, something like:
 *
 *   input#"#twotabsearchtextbox"#(infer#".twotabsearchtextbox"#"Prompt")
 *
 * ends up as an array of three top-level tokens:
 *   [
 *     "input",
 *     "\"#twotabsearchtextbox\"",
 *     "(infer#\".twotabsearchtextbox\"#\"Prompt\")"
 *   ]
 */
function splitOutsideParenthesesAndQuotes(line: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenLevel = 0;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      // Toggle inQuotes state
      inQuotes = !inQuotes;
      current += c;
    } 
    else if (!inQuotes) {
      // If not inside quotes, watch for parentheses
      if (c === '(') {
        parenLevel++;
        current += c;
      } else if (c === ')') {
        if (parenLevel > 0) {
          parenLevel--;
        }
        current += c;
      } 
      // If we see a '#' and we're not inside any parentheses, it's a top-level delimiter
      else if (c === '#' && parenLevel === 0) {
        results.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    } 
    else {
      // If we're in quotes, just accumulate characters
      current += c;
    }
  }

  // Push the last chunk
  if (current.trim() !== '') {
    results.push(current.trim());
  }

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
    return parseSingleLine(line);
  });
  return actions;
}



function waitForPageLoad(workTabId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.tabs.get(workTabId, (tab) => {
      if (!tab) {
        // If no tab is found, reject
        return reject(new Error(`No tab found with ID: ${workTabId}`));
      }

      // If the tab is already fully loaded, resolve immediately
      if (tab.status === 'complete') {
        return resolve();
      }

      // Otherwise, wait for onUpdated to tell us the status is 'complete'
      function listener(tabId: number, info: { status?: string }) {
        if (tabId === workTabId && info.status === 'complete') {
          // Stop listening once loaded
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }

      chrome.tabs.onUpdated.addListener(listener);
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
        console.log('param from line 225 : ', param);
        if (isScriptAction(param)) {
          // param is a nested action
          const subAction = param as ScriptAction;
          console.log("subAction from line 229 : ", subAction);
          // Execute the sub-action to get a result string
          const subResult = await executeSubAction(subAction, tabInstance);
          console.log("subResult from line 232 : ", subResult);
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
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log("infer action exists?", { action });
          if (tabInstance && tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'infer',
              queryselector: action.params[0],
              prompt: action.params[1],
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
async function executeSubAction(
  action: ScriptAction,
  currentTab: chrome.tabs.Tab | null
): Promise<string> {
  console.log('Executing subAction:', action);
  console.log('Current tab:', currentTab);

  // If there's no valid tab, throw an error immediately
  if (!currentTab || !currentTab.id) {
    throw new Error('No valid current tab found');
  }

  // 1) Wait for the page to finish loading
  await waitForPageLoad(currentTab.id);
  console.log('Page has finished loading from line 529');

  // 2) Now that the page has loaded, send the message if needed
  if (action.type === 'infer') {
    console.log('infer is triggered from line 533');
    // We'll wrap chrome.tabs.sendMessage in a small Promise utility
    const response = await new Promise<{ result?: string }>((resolve, reject) => {
      chrome.tabs.sendMessage(
        currentTab.id!,
        {
          action: 'infer',
          queryselector: action.params[0],
          prompt: action.params[1],
        },
        (res) => {
          console.log("result from content/index.ts", res);
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError.message);
          }
          resolve(res || {});
        }
      );
    });

    // 3) Return the result from the content script, if any
    if (response.result) {
      console.log('Result from the subAction:', response.result);
      return response.result;
    } else {
      return '';
    }
  } else {
    // If this sub-action is not "infer", just return an empty string
    return '';
  }
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
        console.log("what is request", request);
        const { prompt } = request;
        console.log("prompt from line 640", prompt);
        const result = await askAi(prompt);
        console.log("result from line 642", result);
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
