// content/index.ts

import { getPageContent } from '../content/utils/getPageContent';
import { UserData } from '../src/common/hooks/UserContext';
import { extractInnerText, fetchElementsByAttribute } from './templatize';

interface ExtensionIdEventDetail {
  extensionId: string;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'input') {
    performInput(request.identifierType, request.elementId, request.text);
  } else if (request.action === 'click') {
    performClick(request.identifierType, request.elementId, request.idName);
  } else if (request.action === 'infer') {
    performInfer(request.identifierType, request.elementId, request.attribute, request.attribValue);
  } else if (request.action === 'getPageContent') {
    // Use the getPageContent utility function
    getPageContent((content: string, title: string) => {
      sendResponse({ content, title });
    });
  }
});

async function performInfer(identifierType: string, elementId: string, attribute: any, attribValue: any) {
  console.log('debug');
  let element: HTMLElement | null = null;
  if (identifierType === 'id') {
    element = document.getElementById(elementId);
  } else if (identifierType === 'class') {
    console.log('element id', elementId);
    element = document.getElementsByClassName(elementId)[0] as HTMLElement;
  } else if (identifierType === 'name') {
    element = document.querySelector(`[name="${elementId}"]`);
  }

  console.log({ element });
  if (element) {
    const data = {
      innerHTML: element.innerHTML,
      innerText: element.innerText,
    };

    const result = fetchElementsByAttribute(element.innerHTML, attribute, attribValue);
    console.log({ result, element });
    const text = extractInnerText(result);

    chrome.runtime.sendMessage(
      {
        action: 'inferLLM',
        text: String(text),
        prompt:
          'You are there to pick item from this list to buy ps5, just STRICTLY return the index from the array and nothing else.',
      },
      (response) => {
        if (response && response.index !== undefined && response.index !== null) {
          const index = response.index;
          const targetElements = element.querySelectorAll(`[${attribute}="${attribValue}"]`);
          if (targetElements.length > index) {
            const targetElement = targetElements[index];
            const productUrl = targetElement.querySelector('a')?.href;
            if (productUrl) {
              window.location.href = productUrl;
            } else {
              console.error('Product URL not found');
            }
          } else {
            console.error('Element not found at returned index');
          }
        } else if (response && response.error) {
          console.error('Error from background inference:', response.error);
        } else {
          console.error('No valid response received from background script');
        }
      },
    );
  } else {
    console.error('Element not found for scraping');
  }
}

function performInput(identifierType: string, elementId: string, text: string) {
  let element: HTMLElement | null = null;
  if (identifierType === 'id') {
    element = document.getElementById(elementId);
  } else if (identifierType === 'class') {
    element = document.querySelector(`.${elementId}`);
  } else if (identifierType === 'name') {
    element = document.querySelector(`[name="${elementId}"]`);
  }

  if (element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    (element as HTMLInputElement).value = text;
    console.log(`Set value "${text}" for element:`, element);
  } else {
    console.error('Element not found or not an input element');
  }
}

function performClick(identifierType: string, elementId: string, idName: string) {
  let element: HTMLElement | null = null;
  if (identifierType === 'id') {
    element = document.getElementById(elementId);
  } else if (identifierType === 'class') {
    element = document.querySelector(`.${elementId}`);
  } else if (identifierType === 'name') {
    element = document.querySelector(`[${elementId}="${idName}"]`);
  }

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("message",message);
  if (message.type === 'SHOW_LOGIN_MODAL') {
      alert("hello world, page loaded!")
      showLoginModal();
  }
});

// Create a simple modal to prompt the user for credentials
function showLoginModal() {
  // 1. Create the modal container
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.bottom = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.backgroundColor = '#f9f9f9';
  modal.style.borderTop = '1px solid #ccc';
  modal.style.padding = '20px';
  modal.style.zIndex = '999999'; // ensure it stays on top

  // 2. Create the form
  const form = document.createElement('form');
  form.innerHTML = `
    <label for="username">Username: </label>
    <input type="text" id="username" name="username" required />
    
    <label for="password"> Password: </label>
    <input type="password" id="password" name="password" required />
    
    <button type="submit">Login</button>
  `;

  // 3. Handle form submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // In a real scenario, you'd probably do some XHR/fetch to log the user in
    // or rely on the page's own login logic. For demonstration:

    // Option A: Let the real page handle the login (by removing event.preventDefault())
    // Option B: Do something custom here before letting the user proceed

    // For now, just simulate a redirect or let the real login proceed
    console.log('Attempting login...');
    // If the page is going to redirect to a different URL after successful login,
    // we can rely on window.location changes or form submission.
    simulateRedirectOrWaitForRedirect();
  });

  // 4. Append form to modal, and modal to body
  modal.appendChild(form);
  document.body.appendChild(modal);
}

function simulateRedirectOrWaitForRedirect() {
 
  setTimeout(() => {
   
    chrome.runtime.sendMessage({ type: 'LOGIN_REDIRECT' });
    
    window.location.href = 'https://example.com/after-login';
  }, 2000);
}