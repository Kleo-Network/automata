//background/index.ts


import LLM from './utils/llm';
import { getPageContent } from '../content/utils/getPageContent';
import {initializeUser, restoreAccount} from './utils/user';
// This is to define any action background needs to do onclick of page. 
// TODO: Write a function for user to get private key from wallet. 
type Action = 'new-tab' | 'input' | 'click' | 'infer' | 'wait';



type ScriptProject = {
    projectScript: string;
    projectName: string;
    projectDescription: string;
    image: string;
}

const llm = new LLM();

async function initializeLLM() {
  await llm.initialize();
}


async function fetchScript(cidr: string) {
  try {
    
    const result = await chrome.storage.local.get(['jwt', 'gateway']);
    
    return "content";
  } catch (error) {
    throw new Error(error);
  }
}

interface ScriptAction {
    type: Action;
    params: string[];
}

function parseScript(script: string): ScriptAction[] {
    return script.split('\n').filter(line => line.trim() !== '').map(line => {
        const [type, ...params] = line.split('#');
        return { type: type as Action, params };
    });
}

function waitForPageLoad(workTabId: number) {
    return new Promise<void>((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === workTabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        });
    });
}

// background.ts

async function executeActions(actions: ScriptAction[]) {
    let tabInstance = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

    for (const action of actions) {
      switch (action.type) {
        case 'new-tab':
          // Open a new tab with the specified URL
          console.log({action});
          tabInstance = await chrome.tabs.create({ url: action.params[0] });
          break;
  
        case 'input':
          // Send a message to the content script to perform input action
          console.log({action})
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'input',
              identifierType: action.params[0],
              elementId: action.params[1],
              text: action.params[2],
            });
          }
          break;
  
        case 'click':
          // Send a message to the content script to perform click action
          console.log({action});
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
          // Send a message to the content script to perform click action
          console.log({action});
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
            if (tabInstance.id) {
              await waitForPageLoad(tabInstance.id);
            }
          break;
          
        default:
          console.error('Unknown action type:', action.type);
      }
    };
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("lister running from background.ts")
    
    if (request.action === 'createUser') {
      // Create a promise wrapper to handle the async operation
      (async () => {
        try {
          const user = await initializeUser(request.name);
          console.log("response from background.ts", user);
          sendResponse({ success: true, user: user });
        } catch (error: any) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      // Return true to indicate we want to send a response asynchronously
      return true;
    }
  
    if (request.action === 'restoreAccount') {
      (async () => {
        try {
          const user = await restoreAccount(request.privateKey);
          sendResponse({ success: true, user: user });
        } catch (error: any) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
  
    if (request.action === 'executeScript') {
      (async () => {
        try {
          const content = request.input;
          if (content) {
            console.log("content", {script: content});
            const actions = parseScript(content);
            await executeActions(actions);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No content provided' });
          }
        } catch (error: any) {
          sendResponse({ success: false, error: error.message });
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
        } catch (error: any) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }
    return true;
});

chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));

initializeLLM().then(() => console.log("LLM initialized")).catch(console.error);

// Test Script
// new-tab#https://amazon.in
// wait
// input#id#twotabsearchtextbox#ps5
// click#id#nav-search-submit-button
// wait
// infer#class#s-search-results#data-component-type#s-search-result
// wait