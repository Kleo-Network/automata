// content/index.ts

import { extractInnerText, fetchElementsByAttribute } from "./templatize";
import {UserData} from '../src/common/hooks/UserContext';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'input') {
    performInput(request.identifierType, request.elementId, request.text);
  } else if (request.action === 'click') {
    performClick(request.identifierType, request.elementId, request.idName);
  } else if (request.action === 'infer') {
    performInfer(request.identifierType, request.elementId, request.attribute, request.attribValue);
  }
});

async function performInfer(identifierType: string, elementId: string, attribute: any, attribValue: any) {
  console.log("debug");
  let element: HTMLElement | null = null;
  if (identifierType === 'id') {
    element = document.getElementById(elementId);
  } else if (identifierType === 'class') {
    console.log("element id", elementId);
    element = document.getElementsByClassName(elementId)[0] as HTMLElement;
  } else if (identifierType === 'name') {
    element = document.querySelector(`[name="${elementId}"]`);
  }

  console.log({element});
  if (element) {
    const data = {
      innerHTML: element.innerHTML,
      innerText: element.innerText
    };

    const result = fetchElementsByAttribute(element.innerHTML, attribute, attribValue);
    console.log({result, element});
    const text = extractInnerText(result);

    chrome.runtime.sendMessage(
      {
        action: 'inferLLM',
        text: String(text),
        prompt: "You are there to pick item from this list to buy ps5, just STRICTLY return the index from the array and nothing else."
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
          console.error("Error from background inference:", response.error);
        } else {
          console.error("No valid response received from background script");
        }
      }
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
        console.error("Error sending message:", chrome.runtime.lastError);
      }
      console.log("what's the response? line 111 index.ts", response)
      if (response && response.success) {
        resolve({ success: true, user: response.user });
      } else {
        resolve({ success: false, error: response?.error || 'Unknown error occurred' });
      }
    });
  });
}

export function restoreAccount(privateKey: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
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