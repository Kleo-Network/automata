// content/index.ts

import { getPageContent } from '../content/utils/getPageContent';
import { UserData } from '../src/common/hooks/UserContext';
import { extractInnerText, fetchElementsByAttribute } from './templatize';

interface ExtensionIdEventDetail {
  extensionId: string;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if(request.action == 'infer'){
    performInfer(request.queryselector, request.prompt);
  }
  if (request.action === 'input') {
    performInput(request.queryselector, request.text);
  } else if (request.action === 'click') {
    performClick(request.queryselector);
  } else if (request.action === 'getPageContent') {
    // Use the getPageContent utility function
    getPageContent((content: string, title: string) => {
      sendResponse({ content, title });
    });
  }
});


// click#(infer#...queryselector#prompt)
// input#(query selector)#(infer#...queryselector#prompt)
// form#(query selector)#(infer#...queryselector#prompt)
// while#conditionA#inequality#conditionB{actionToPerformRepeatedly}
// play and pause functionality
// resume when login screen 


/*
TODO:
1. Create function performInfer which returns LLM response should work 
with kleo fastapi backend. ---> Vaibhav
2. change to queryselector from #id or #class params  ---> Vaibhav
3. create a function for form and ensure that it works with help of LLM.  ---> Vaibhav
4. select form option and submit that event. ---> Prince
5. While loop must work specifically for pagination and next pages. ---> Prince
6. Login screen should work as expected ---> Prince. 
*/
async function performInfer(querySelector: string, prompt: string) {
  console.log('debug');
  let element: HTMLElement | null = null;

  element = document.querySelector(querySelector);


  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'inferLLM',
        prompt: prompt,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('debug: Received response from background script');
          resolve(response);
        }
      }
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
    console.error('Element not found for clicking');
  }
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


