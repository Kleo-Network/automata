// content.ts

import { extractInnerText, fetchElementsByAttribute } from "./templatize";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'input') {
    performInput(request.identifierType, request.elementId, request.text);
  } else if (request.action === 'click') {
    performClick(request.identifierType, request.elementId);
  } else if (request.action === 'infer') {
    performInfer(request.identifierType, request.elementId, request.attribute, request.attribValue);
  }
});

function performInfer(identifierType: string, elementId: string, attribute: any, attribValue: any) {
  console.log("debug");
  let element: HTMLElement | null = null;
  if (identifierType === 'id') {
    element = document.getElementById(elementId);
  } else if (identifierType === 'class') {
    element = document.querySelector(`.${elementId}`);
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
    const text = extractInnerText(result);
    console.log("result", text, data);
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
