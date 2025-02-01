// background/index.ts

import { clearScriptContent, PageContent, storePageContent } from '../content/utils/contentManager';
import { askAi } from './utils/llm';
import { initializeUser, restoreAccount } from './utils/user';
import {Action, ScriptAction, UpdateMessage, STEP_STATUS} from './utils/interface';
import {apiRequest} from './utils/api';

let port: chrome.runtime.Port | null = null;
let currentTaskId: string | null = null;


enum ScriptState {
  PAUSED = "PAUSED",
  RUNNING = "RUNNING",
  FINISHED = "FINISHED"
  
}

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
  param = param.trim();
  if (!param.startsWith('(') || !param.endsWith(')')) {
    return param; // It's just a normal string parameter
  }
  const inside = param.slice(1, -1).trim();
  const action = parseSingleLine(inside, lineIndex);
  return action;
}

function parseScript(script: string): ScriptAction[] {
  const lines = script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  const actions: ScriptAction[] = [];
  let inWhileBlock = false;
  let whileActions: ScriptAction[] = [];
  let currentWhileParams: any[] = [];
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('while#')) {
      inWhileBlock = true;
      // Handle the while statement parsing
      const whileLine = line.substring(6); // Remove 'while#'
      const inferStartIndex = whileLine.indexOf('(');
      const inferEndIndex = whileLine.lastIndexOf(')');
      
      if (inferStartIndex !== -1 && inferEndIndex !== -1) {
        // Extract querySelector and infer action
        const querySelector = whileLine.substring(0, inferStartIndex).split('#')[0];
        const inferPart = whileLine.substring(inferStartIndex + 1, inferEndIndex);
        
        // Parse the infer action
        const inferAction = parseSingleLine(inferPart, lineIndex);
        currentWhileParams = [querySelector, inferAction];
      } else {
        // Handle normal while parameters
        currentWhileParams = whileLine.split('#').map(param => parseParameter(param, lineIndex));
      }
      continue;
    }

    if (line === 'end while') {
      inWhileBlock = false;
      actions.push({
        type: 'while',
        params: [...currentWhileParams, whileActions],
        stepIndex: lineIndex++,
        status: STEP_STATUS.PENDING,
        message: `Pending while loop`
      });
      whileActions = [];
      continue;
    }

    if (inWhileBlock) {
      const action = parseSingleLine(line, lineIndex++);
      whileActions.push(action);
    } else {
      const action = parseSingleLine(line, lineIndex++);
      actions.push(action);
    }
  }

  return actions;
}

function parseSingleLine(line: string, lineIndex: number): ScriptAction {
  const parts = splitOutsideParenthesesAndQuotes(line);
  const [type, ...rawParams] = parts;
  
  const sanitizedParams = rawParams.map(param => {
    let cleaned = param.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  });

  return {
    type: type.trim(),
    params: sanitizedParams,
    stepIndex: lineIndex,
    status: STEP_STATUS.PENDING,
    message: `Pending command ${type}`
  };
}

function splitOutsideParenthesesAndQuotes(line: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenCount = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && line[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(' && !inQuotes) {
      parenCount++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      parenCount--;
      current += char;
    } else if (char === '#' && !inQuotes && parenCount === 0) {
      results.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    results.push(current.trim());
  }

  return results.filter(r => r !== '');
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

async function getKeyValue(key: string): Promise<any> {
  const result = await chrome.storage.local.get(key);
  console.log("result from line 153 : ", result);
  return result[key];
}

// Main Execution Functions
async function executeActions(actions: ScriptAction[], tabInstance: chrome.tabs.Tab | null, startStep: number = 0): Promise<ScriptState> {
  
  for (let i = startStep; i < actions.length; i++) {
    console.log("Actions in Background : ", actions);
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
            if(sessionState && sessionState.toString().toLowerCase() === "true"){
              sendUpdate('Login Completed', i, STEP_STATUS.SUCCESS, actions, false, tabInstance);
            }
            else{
              sendUpdate('Credentials required', i, STEP_STATUS.CREDS_REQUIRED, actions, true, tabInstance);
              console.log('Background: Credentials required');
              return ScriptState.PAUSED;
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
              action: 'fetch_data',
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
                stepIndex: i + 1,
                custom: action.params[2] ?? ""
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
        //while#queryselector#number_of_times: 
        //click#queryselector 
        //fetch#queryselector#text
        //input#queryselector#text
        //end while
        // Replace the while case in the switch statement within executeActions function
        // Update the while case in executeActions function
        case 'while':
          if (tabInstance && tabInstance.id) {
            const querySelector = action.params[0];
            let iterations;
            
            // Handle nested infer action in iterations parameter
            console.log("while aparams ", action.params);
            if (isScriptAction(action.params[1])) {
              console.log("Processing nested infer action for iterations:", action.params[1]);
              const inferResult = await executeSubAction(action.params[1], tabInstance);
              iterations = parseInt(inferResult);
              console.log("Inferred number of iterations:", iterations);
            } else {
              iterations = parseInt(action.params[1]);
            }
            
            if (isNaN(iterations)) {
              console.error("Invalid number of iterations");
              sendUpdate(`Error: Invalid number of iterations`, i, STEP_STATUS.ERROR, actions);
              break;
            }

            const nestedActions = action.params[2] as ScriptAction[];
            
            
            for (let iter = 0; iter < iterations; iter++) {
              console.log(`Executing iteration ${iter + 1} of ${iterations}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              // Execute each nested action
              for (const nestedAction of nestedActions) {
                const actionCopy = {
                  ...nestedAction,
                  stepIndex: i + 1 + iter * nestedActions.length
                };
                
                try {
                  switch (actionCopy.type) {
                    case 'click':
                      await new Promise<void>((resolve) => {
                        chrome.tabs.sendMessage(
                          tabInstance?.id!,
                          {
                            action: 'click',
                            queryselector: actionCopy.params[0]
                          },
                          () => {
                            if (chrome.runtime.lastError) {
                              console.error(chrome.runtime.lastError);
                            }
                            resolve();
                          }
                        );
                      });
                      break;
                      
                    case 'fetch':
                      await new Promise<void>((resolve) => {
                        chrome.tabs.sendMessage(
                          tabInstance?.id!,
                          {
                            action: 'fetch_data',
                            queryselector: actionCopy.params[0],
                            method: actionCopy.params[1]
                          },
                          () => {
                            if (chrome.runtime.lastError) {
                              console.error(chrome.runtime.lastError);
                            }
                            resolve();
                          }
                        );
                      });
                      break;
                      
                    case 'input':
                      await new Promise<void>((resolve) => {
                        chrome.tabs.sendMessage(
                          tabInstance?.id!,
                          {
                            action: 'input',
                            queryselector: actionCopy.params[0],
                            text: actionCopy.params[1]
                          },
                          () => {
                            if (chrome.runtime.lastError) {
                              console.error(chrome.runtime.lastError);
                            }
                            resolve();
                          }
                        );
                      });
                      break;
                      
                    case 'wait':
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      break;
                  }
                  
                  sendUpdate(`Executed nested action: ${actionCopy.type}`, 
                            actionCopy.stepIndex, 
                            STEP_STATUS.SUCCESS, 
                            actions);
                            
                } catch (error) {
                  console.error(`Error in nested action ${actionCopy.type}:`, error);
                  sendUpdate(`Error in nested action: ${actionCopy.type}`, 
                            actionCopy.stepIndex, 
                            STEP_STATUS.ERROR, 
                            actions);
                  throw error;
                }
              }
              
              // Add delay between iterations
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            sendUpdate(`Completed while loop`, i, STEP_STATUS.SUCCESS, actions);
          }
          break;
            
        case 'wait':
          console.log('Background: Waiting for page load');
          if (tabInstance && tabInstance.id) {
            sendUpdate('Waiting for page to load...', i, STEP_STATUS.RUNNING, actions);
            await waitForPageLoad(tabInstance.id);
            await new Promise(resolve => setTimeout(resolve, 2000));
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
  return ScriptState.FINISHED;
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
  
  // Handle infer action specifically
  if (action.type === 'infer') {
    console.log('Executing infer sub-action:', action);
    const response = await new Promise<{ result?: string }>((resolve, reject) => {
      chrome.tabs.sendMessage(
        currentTab.id!,
        {
          action: 'infer',
          queryselector: action.params[0],
          prompt: action.params[1],
        },
        (res) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError.message);
          }
          resolve(res || {});
        }
      );
    });

    if (response.result) {
      return response.result;
    }
  }
  return '';
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
        const content = request.input;
        const index = request.index;
        const tabInstance = request.tabInstance;
        const script_id = request.script_id;
        if (content) {
          const actions = parseScript(content);
          
          const state = await executeActions(actions, tabInstance, index);
          if(state === ScriptState.FINISHED){
            const scrape = await getKeyValue("scraped_data");
            const userData = await getKeyValue("user");
            console.log("userdata from key value storage", userData);
            const scoreData = {
              script_id: script_id,
              owner: userData.address, 
              content: scrape, 
              timestamp: Math.floor(Date.now() / 1000).toString(), // current timestamp
              owner_sig: "38794c92e88f709d081f4fd97e46bf9d5ca3921862a8108cfa1204cd09b09d21",
              
          };
          try {
            const response = await apiRequest<any>(
                'POST',
                'score/submit',
                scoreData
            );
        
            response["address"] = userData.address;
            response["script_id"] = script_id;
        
            try {
                const script_play = await apiRequest<any>('POST', 'script_play/script-execute', 
                    response);
        
                console.log('Background: Script execution completed', response);
                console.log("Call Script Play API", script_play);
                sendResponse({ success: true });
            } catch (scriptError) {
                console.error('Error executing script:', scriptError);
                await chrome.storage.local.remove('scraped_data');
                sendResponse({ success: false, error: scriptError.message });
                throw scriptError;
            }
        } catch (scoreError) {
            console.error('Error submitting score:', scoreError);
            await chrome.storage.local.remove('scraped_data');
            sendResponse({ success: false, error: scoreError.message });
            throw scoreError;
        }
            
        }
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
