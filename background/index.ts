import { clearScriptContent, PageContent, storePageContent } from '../content/utils/contentManager';
import { askAi } from './utils/llm';
import { initializeUser, restoreAccount } from './utils/user';
import {Action, ScriptAction, UpdateMessage, STEP_STATUS} from './utils/interface';
import { flareTestnet, metachain } from 'viem/chains';

let port: chrome.runtime.Port | null = null;
let currentTaskId: string | null = null;

function sendUpdate(message: string, stepIndex: number, status: STEP_STATUS, actions?: ScriptAction[], isPaused?: boolean, tabInstance?: chrome.tabs.Tab): void {
  if (port) {
    if(actions && actions[stepIndex]){
      actions[stepIndex].status = status;
      actions[stepIndex].message = message;
      for(let i=0; i < stepIndex; i++)
        actions[i].status = STEP_STATUS.SUCCESS;
    }
    
    const update: UpdateMessage = {
      timestamp: Date.now(),
      stepIndex: stepIndex,
      actions: actions || [],
      isPaused: isPaused || false,
      tabInstance: tabInstance || null
    };
    port.postMessage(update);
  }
}

function parseParameter(param: string, lineIndex: number): ScriptAction | string {
  if (!param.startsWith('(') || !param.endsWith(')')) {
    return param; // It's just a normal string parameter
  }
  const inside = param.slice(1, -1).trim(); // "infer#".abc"#"prompt text"
  const action = parseSingleLine(inside, lineIndex);
  console.log("subaction from line 74 : ", action);
  return action;
}

function parseSingleLine(line: string, lineIndex: number): ScriptAction {
  const parts = splitOutsideParenthesesAndQuotes(line);
  const [type, ...rawParams] = parts;
  const sanitizedParams = rawParams.map((p) => {
    let param = p;
    if (param.startsWith('"') && param.endsWith('"')) {
      param = param.slice(1, -1);
    }
    return parseParameter(param, lineIndex);
  });

  return {
    type: type as Action,
    params: sanitizedParams as string[],
    stepIndex: lineIndex,
    status: STEP_STATUS.PENDING,
    message: `Pending command ${type}`
  };
}


function splitOutsideParenthesesAndQuotes(line: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenLevel = 0;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
    } 
    else if (!inQuotes) {
      if (c === '(') {
        parenLevel++;
        current += c;
      } else if (c === ')') {
        if (parenLevel > 0) {
          parenLevel--;
        }
        current += c;
      } 
      else if (c === '#' && parenLevel === 0) {
        results.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    } 
    else {
      
      current += c;
    }
  }

  if (current.trim() !== '') {
    results.push(current.trim());
  }

  return results;
}


function parseScript(script: string): ScriptAction[] {
  const lines = script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  return lines.map((line, index) => {
    const action = parseSingleLine(line, index);
    console.log(`Parsed action at step ${index}:`, action);
    return action;
  });
}



function waitForPageLoad(workTabId: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.tabs.get(workTabId, (tab) => {
      if (!tab) {
        return reject(new Error(`No tab found with ID: ${workTabId}`));
      }

      if (tab.status === 'complete') {
        return resolve();
      }

      function listener(tabId: number, info: { status?: string }) {
        if (tabId === workTabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }

      chrome.tabs.onUpdated.addListener(listener);
    });
  });
}



// Main Execution Functions
async function executeActions(actions: ScriptAction[], tabInstance: chrome.tabs.Tab | null, startStep: number = 0): Promise<void> {
  
  for (let i = startStep; i < actions.length; i++) {
   
    const action = actions[i];
    try {
      sendUpdate(`Executing action: ${action.type}`, i, STEP_STATUS.RUNNING, actions);
      for (let j = 0; j < action.params.length; j++) {
        const param = action.params[j];
        console.log('param from line 225 : ', param);
        if (isScriptAction(param)) {
          const subAction = param as ScriptAction;
          console.log("subAction from line 229 : ", subAction);
          const subResult = await executeSubAction(subAction, tabInstance);
          console.log("subResult from line 232 : ", subResult);
          action.params[j] = subResult;
        }
      }

     
      switch (action.type) {
        case 'login':
          if(tabInstance && tabInstance.id){
            const sessionState = action.params[1];
            console.log("The credentials from login for sessionState is"  , sessionState);
            if(!sessionState || sessionState.toString() === 'false'){
               sendUpdate('Credentials required', i, STEP_STATUS.CREDS_REQUIRED, actions, true, tabInstance);
               console.log('Background: Credentials required');
               return;
            }
            else{
              sendUpdate('Login Completed', i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
            }
          }
          break;
        case 'open':
          if (tabInstance && tabInstance.id) {
            await chrome.tabs.update(tabInstance.id, { url: action.params[0] });
            sendUpdate(`Navigated to: ${action.params[0]}`, i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
          } 
          break;
        case 'open-tab':
          console.log('Background: Opening new tab:', action.params[0]);
          tabInstance = await chrome.tabs.create({ url: action.params[0] });
          console.log('PRINCE new tab ID : ', tabInstance.id);
          sendUpdate(`Opened new tab: ${action.params[0]}`, i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
          break;

        case 'input':
          console.log('Background: Sending input action:', action);
          if (tabInstance && tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'input',
              queryselector: action.params[0],
              text: action.params[1],
            });
            sendUpdate(`Input entered: ${action.params[1]}`, i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
          }
          break;
        
        case 'fetch':
          if(tabInstance && tabInstance.id){
            sendUpdate(`Fetching: ${action.params[0]}`, i, STEP_STATUS.RUNNING, actions, false, tabInstance);
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'fetch',
              queryselector: action.params[0],
              method: action.params[1]
            });
            sendUpdate(`Fetched: ${action.params[0]}`, i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
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
            sendUpdate(`Selected: ${action.params[1]}`, i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
          }
          break;

        case 'click':
          console.log({ action });
          if (tabInstance && tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'click',
              queryselector: action.params[0],
            });
            sendUpdate(`Clicked: ${action.params[0]}`, i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
          }
          break;

          case 'infer':
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log("infer action exists?", { action });
            if (tabInstance && tabInstance.id) {
              const response = await chrome.tabs.sendMessage(tabInstance.id, {
                action: 'infer',
                queryselector: action.params[0],
                prompt: action.params[1],
              });
              console.log('response from line 244', response);
              if (response && response.actions_infer) {
                const inferredActions = response.actions_infer;
                const updatedActions = [...actions, ...inferredActions]
                sendUpdate(`Inferred: mention the inferred actions by having some margin! `, i, STEP_STATUS.SUCCESS, updatedActions);
                await executeActions(inferredActions, tabInstance);
              } else {
                console.log('No inferred actions received from content script');
                sendUpdate(`Inferred: mention the inferred actions by having some margin! `, i, STEP_STATUS.SUCCESS, actions);
              }
            }
            break;

        case 'wait':
          console.log('Background: Waiting for page load');
          if (tabInstance && tabInstance.id) {
            sendUpdate('Waiting for page to load...', i, STEP_STATUS.RUNNING, actions);
            await waitForPageLoad(tabInstance.id);
            sendUpdate('Page loaded successfully', i, STEP_STATUS.SUCCESS, actions);
          }
          break;
      }
      
    } catch (error) {
      console.error('Background: Action execution error:', error);
      sendUpdate(`Error executing ${action.type}: ${(error as Error).message}`, 0, STEP_STATUS.ERROR, actions);
      throw error;  
    }
  }
  
  sendUpdate('Script execution completed',1000, STEP_STATUS.SUCCESS, actions);
  return;
}


function isScriptAction(param: any): param is ScriptAction {
  return typeof param === 'object' && param.type !== undefined && param.params !== undefined;
}


async function executeSubAction(
  action: ScriptAction,
  currentTab: chrome.tabs.Tab | null
): Promise<string> {

  if (!currentTab || !currentTab.id) {
    throw new Error('No valid current tab found');
  }

  await waitForPageLoad(currentTab.id);
  console.log('Page has finished loading from line 529');

  if (action.type === 'infer') {
    console.log('infer is triggered from line 533');
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

    if (response.result) {
      console.log('Result from the subAction:', response.result);
      return response.result;
    } else {
      return '';
    }
  } else {
    return '';
  }
}



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
  }
});

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
        console.log('Background: Parsing script:', request.input);
        const content = request.input;
        const index = request.index;
        const tabInstance = request.tabInstance;
        if (content) {
          console.log('Background: Parsing script:', content);
          const actions = parseScript(content);
          console.log('BG actions after parsing : ', actions);
          console.log('Background: Executing actions');
          await executeActions(actions, tabInstance, index);
          console.log('Background: Script execution completed');
          sendResponse({ success: true });
        } else {
          console.error('Background: No content provided');
          sendResponse({ success: false, error: 'No content provided' });
        }
      } catch (error) {
        console.error('Background: Script execution error:', error);
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
