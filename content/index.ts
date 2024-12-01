// content.ts

import { getPageContent } from './utils/getPageContent';
import {createUserAndStoreCredentials} from './utils/helpers'
// Define types for custom events
interface ExtensionIdEventDetail {
  extensionId: string;
}

// Define types for message events
interface KleoMessage {
  type: '' | '' | '';
  [key: string]: any; // For any additional properties in the message
}

// Define type for chrome runtime message
interface ChromeMessage {
  action: string;
  [key: string]: any;
}

function dispatchCustomEvent<T>(eventName: string, detail: T): void {
  document.dispatchEvent(new CustomEvent<T>(eventName, { detail }));
}

function injectScript(file: string): void {
  const script: HTMLScriptElement = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file);

  // Dispatch the event after the script is loaded
  script.onload = (): void => {
    dispatchCustomEvent<ExtensionIdEventDetail>('ExtensionIdEvent', {
      extensionId: chrome.runtime.id,
    });
  };

  document.head.appendChild(script);
}


// content.ts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'input') {
    performInput(request.identifierType, request.elementId, request.text);
  } else if (request.action === 'click') {
    performClick(request.identifierType, request.elementId);
  }
});

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

function performClick(identifierType: string, elementId: string) {
  let element: HTMLElement | null = null;
  if (identifierType === 'id') {
    element = document.getElementById(elementId);
  } else if (identifierType === 'class') {
    element = document.querySelector(`.${elementId}`);
  } else if (identifierType === 'name') {
    element = document.querySelector(`[name="${elementId}"]`);
  }

  if (element) {
    element.click();
    console.log('Clicked element:', element);
  } else {
    console.error('Element not found for clicking');
  }
}


window.addEventListener('message', function (event: MessageEvent) {
  // Type guard to check if the event data matches our expected format
  const isKleoMessage = (data: any): data is KleoMessage => {
    return data && typeof data.type === 'string';
  };

  if (!isKleoMessage(event.data)) {
    return;
  }
  console.log(event.data)
  switch (event.data.type) {
   
  }
});

chrome.runtime.onMessage.addListener(function (
  request: ChromeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
): void {
  if (request.action === 'some action') {
    someAction((content: string, title: string) => {
      sendResponse({ content, title });
    });
  }
});

// Inject the script
injectScript(chrome.runtime.getURL('injectedScript.js'));
