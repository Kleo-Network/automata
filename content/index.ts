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
  
  else if(request.action === 'fetch_data'){
    (async () => {
      try {
        const result = await performFetch(request.queryselector, request.method);
        console.log("result", result);
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false });
      }
    })();
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


async function performFetch(querySelector: string, method: string) {
  
  const elem = document.querySelector(querySelector);
  
  const storage = await chrome.storage.local.get("scraped_data");
  console.log("Storage data from content : line 41", storage);
  let result = storage.scraped_data || ""; 
  if (method === "html") {
      result = result.concat(elem?.outerHTML);
  } else if (method === "text") {
      result = result.concat((elem as HTMLElement)?.innerText);
  } else {
      result = result.concat("No text found");
  }
  await chrome.storage.local.set({ "scraped_data": result });
  return result;
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





