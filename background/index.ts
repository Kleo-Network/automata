import { clearScriptContent, PageContent, storePageContent } from '../content/utils/contentManager';
import LLM from './utils/llm';
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
const llm = new LLM();

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
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const [type, ...params] = line.split('#');
      return { type: type as Action, params };
    });
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

      switch (action.type) {
        case 'new-tab':
          console.log('Background: Opening new tab:', action.params[0]);
          tabInstance = await chrome.tabs.create({ url: action.params[0] });
          sendUpdate(`Opened new tab: ${action.params[0]}`);
          break;

        case 'input':
          console.log('Background: Sending input action:', action);
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'input',
              identifierType: action.params[0],
              elementId: action.params[1],
              text: action.params[2],
            });
            sendUpdate(`Input entered: ${action.params[2]}`);
          }
          break;

        case 'click':
          console.log({ action });
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'click',
              identifierType: action.params[0],
              elementId: action.params[1],
              idName: action.params[2],
            });
          }
          break;

        case 'infer':
          console.log({ action });
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'infer',
              identifierType: action.params[0],
              elementId: action.params[1],
              attribute: action.params[2],
              attribValue: action.params[3],
            });
          }
          break;

        case 'wait':
          console.log('Background: Waiting for page load');
          if (tabInstance.id) {
            sendUpdate('Waiting for page to load...');
            await waitForPageLoad(tabInstance.id);

            // Collect page content after load
            if (currentTaskId) {
              chrome.tabs.sendMessage(tabInstance.id, { action: 'getPageContent' }, async (response) => {
                if (response?.content && response?.title) {
                  const pageContent: PageContent = {
                    url: tabInstance.url || '',
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
        const { text, prompt } = request;
        const result = await llm.sendRequest(text, prompt);
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

async function initializeLLM() {
  await llm.initialize();
}

initializeLLM()
  .then(() => console.log('LLM initialized'))
  .catch(console.error);

  // background/index.ts

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 1. Only proceed if the tab is fully loaded (changeInfo.status === 'complete')
  //    and we have a URL to inspect.
  if (changeInfo.status === 'complete' && tab.url) {
    // 2. A simple check to see if it's a login page (adjust logic as needed)
    
      // 3. Notify the content script to show the login modal
      chrome.tabs.sendMessage(tabId, { type: 'SHOW_LOGIN_MODAL' });
    
  }
});

// 4. Listen for messages from the injected script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGIN_REDIRECT') {
    console.log('[background] User has left the login page or logged in.');
    // Trigger whatever logic you need here
    // e.g., sendResponse({ success: true });
  }
});
