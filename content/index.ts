// content.ts

import LLM from "./LLM";
import { extractInnerText, fetchElementsByAttribute } from "./templatize";

async function inferLlm(text: string, prompt: string = "You are there to pick item from this list to buy, just STRICTLY return the index from the array and nothing else.") {

  const llm = new LLM();
  await llm.initialize();

  try {
    const output = await llm.sendRequest(String(text), prompt);
    console.log("LLM Output:", output);
    return output;
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error");
  }
}

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
    console.log({result, element});
    const text = extractInnerText(result);
    const index = await inferLlm(String(text), "You are there to pick item from this list to buy ps5, just STRICTLY return the index from the array and nothing else.");
    const targetElements = element.querySelectorAll(`[${attribute}="${attribValue}"]`);
    console.log({targetElements});
    if (targetElements.length > (index ?? 0)) {
      const targetElement = targetElements[index ?? 0];
      const productUrl = targetElement.querySelector('a')?.href;
      if (productUrl) {
        window.location.href = productUrl;
      } else {
        console.error('Product URL not found');
      }
    } else {
      console.error('Element with class a-list-link not found in result[0]');
    }
    // result.at(index ?? 0).click();
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
