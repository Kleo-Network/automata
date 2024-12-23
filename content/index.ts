// content/index.ts

import { getPageContent } from '../content/utils/getPageContent';
import { UserData } from '../src/common/hooks/UserContext';

interface ExtensionIdEventDetail {
  extensionId: string;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('PRINCE type : ', request.action);

  if (request.action == 'infer') {
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
  } else if (request.action === 'select') {
    performSelect(request.filterQuerySelector, request.filterValue);
  } else if (request.action === 'evaluateConditionDOM') {
    console.log('PRINCE: Inside evaluation : ', request.conditionA, request.inequality, request.conditionB);
    const result = evaluateCondition(request.conditionA, request.inequality, request.conditionB);
    // Send the result back to the background script
    sendResponse({ result });
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

export function evaluateCondition(conditionA: string, inequality: string, conditionB: string): boolean {
  const a = resolveConditionValue(conditionA);
  const b = conditionB;

  console.log('PRINCE a and b = ', a, ' and ', b);

  if (!a || !b) {
    console.log('PRINCE one or both condition values are undefined');
    return false;
  }

  let result = false;

  switch (inequality) {
    case '==':
      result = a == b;
      break;
    case '!=':
      result = a != b;
      break;
    case '<':
      result = a < b;
      break;
    case '>':
      result = a > b;
      break;
    case '<=':
      result = a <= b;
      break;
    case '>=':
      result = a >= b;
      break;
    default:
      result = false;
      break;
  }
  console.log('PRINCE Results of evaluation : ', result);
  return result;
}

export function resolveConditionValue(condition: string): any {
  if (condition.startsWith('"') && condition.endsWith('"')) {
    return condition.slice(1, -1); // Strip quotes for literal strings
  }

  // Assume it's a query selector for DOM value
  const element = document.querySelector(condition);
  if (!element) return null;

  if (element.classList) {
    console.log('PRINCE classlist for condition : ', condition, ' is : ', Array.from(element.classList).join(' '));
    return Array.from(element.classList).join(' ');
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  return element.textContent || '';
}
