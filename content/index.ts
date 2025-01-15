// content/index.ts

import { send } from 'process';
import { UserData } from '../src/common/hooks/UserContext';

interface ExtensionIdEventDetail {
  extensionId: string;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('PRINCE type : ', request.action);

  if (request.action === 'infer') {
    (async () => {
      try {
        const inference = await performInfer(request.queryselector, request.prompt);
        sendResponse({ result: inference }); 
      } catch (error: any) {
        console.error('Infer error:', error);
        sendResponse({ error: error?.message || 'Unknown error' });
      }
    })();
  }
  else if(request.action === 'fetch'){
    performFetch(request.querySelector, request.method);
  }
  else if (request.action === 'input') {
    performInput(request.queryselector, request.text);
  } else if (request.action === 'click') {
    performClick(request.queryselector);
  } else if (request.action === 'select') {
    performSelect(request.filterQuerySelector, request.filterValue);
  } 
  return true;
});
async function performFetch(querySelector: string, method: string){
    const elem = document.querySelector(querySelector);
    const result = await chrome.storage.local.get(method);
    result.push(elem);
    await chrome.storage.local.set({ method: result});
}
async function performInfer(querySelector: string, prompt: string) {
// add a param here if performInfer is to called from  direct inference such that or nested inference.
  return new Promise((resolve, reject) => {
    const elem = document.querySelector(querySelector);
    const html = elem ? elem.outerHTML : '';
    chrome.runtime.sendMessage(
      {
        action: 'inferLLM',
        prompt: html + prompt,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response) {
          return reject(new Error('No response from background!'));
        }
        if (response.success) {
          resolve(response.index);
        } else {
          reject(new Error(response.error || 'Unknown error from background'));
        }
      },
    );
  });
}


function performInput(queryselector: string, text: string) {
  let element: HTMLElement | null = null;

  element = document.querySelector(queryselector);

  if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    (element as HTMLInputElement).value = text;
    console.log(`Set value "${text}" for element:`, element);
  } else {
    console.error('Element not found or not an input element');
  }
}

function performClick(querySelector: string) {
  let element: HTMLElement | null = null;

  element = document.querySelector(querySelector);
  if (element) {
    element.click();
    console.log('Clicked element:', element);
  } else {
    console.error('Element not found for clicking:', querySelector);
  }
}

async function performSelect(filterQuerySelector: string, filterValue: string): Promise<void> {
  const element = document.querySelector(filterQuerySelector);
  if (!element) {
    console.error('There is no Filter for given querySelector:', filterQuerySelector);
    return;
  }
  if (!(element instanceof HTMLSelectElement)) {
    console.error('Element is not a select element:', filterQuerySelector);
    return;
  }
  element.value = filterValue;
  const event = new Event('change', { bubbles: true });
  element.dispatchEvent(event);
  return new Promise((resolve, reject) => {
  const loadHandler = () => {
      window.removeEventListener('load', loadHandler);
      resolve();
    };
    window.addEventListener('load', loadHandler);
  });
}

export function createNewUser(name: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'createUser', name: name }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
      }
      console.log("what's the response? line 111 index.ts", response);
      if (response && response.success) {
        resolve({ success: true, user: response.user });
      } else {
        resolve({ success: false, error: response?.error || 'Unknown error occurred' });
      }
    });
  });
}

export function restoreAccount(
  privateKey: string,
): Promise<{ success: boolean; user?: UserData; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'restoreAccount', privateKey: privateKey }, (response) => {
      if (response && response.success) {
        resolve({ success: true, user: response.user });
      } else {
        resolve({ success: false, error: response?.error || 'Unknown error occurred' });
      }
    });
  });
}




