//background.ts

// This is to define any action background needs to do onclick of page. 
// TODO: Write a function for user to get private key from wallet. 
type Action = 'new-tab' | 'input' | 'click' | 'infer';

interface ScriptAction {
    type: Action;
    params: string[];
}

function parseScript(script: string): ScriptAction[] {
    return script.split('\n').filter(line => line.trim() !== '').map(line => {
        const [type, ...params] = line.split('#');
        return { type: type as Action, params };
    });
}

// background.ts

async function executeActions(actions: ScriptAction[]) {
    for (const action of actions) {
      switch (action.type) {
        case 'new-tab':
          // Open a new tab with the specified URL
          console.log({action});
          const tab = await chrome.tabs.create({ url: action.params[0] });
          await new Promise<void>((resolve) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
              }
            });
          });
          break;
  
        case 'input':
          // Send a message to the content script to perform input action
          console.log({action})
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'input',
                identifierType: action.params[0],
                elementId: action.params[1],
                text: action.params[2],
              });
            }
          });
          break;
  
        case 'click':
          // Send a message to the content script to perform click action
          console.log({action});
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'click',
              identifierType: action.params[0],
              elementId: action.params[1],
            });
          }
          await new Promise<void>((resolve) => {
              chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                  if (tabs[0]?.id === tabId && info.status === 'complete') {
                      chrome.tabs.onUpdated.removeListener(listener);
                      resolve();
                  }
              });
          });
          console.log("page loaded completely");
          break;
  
        case 'infer':
        // Send a message to the content script to perform click action
        console.log({action});
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'infer',
                identifierType: action.params[0],
                elementId: action.params[1],
                attribute: action.params[2],
                attribValue: action.params[3],
            });
            }
        });
        break;
    
        default:
          console.error('Unknown action type:', action.type);
      }
    };
  }

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log({request, sender, sendResponse});
    if (request.action === 'executeScript') {
        const script = request.input ?? (request.input !== "" ? request.input : `new-tab#https://amazon.in
input#id#twotabsearchtextbox#ps5
click#id#nav-search-submit-button
infer#class#s-search-results#data-component-type#s-search-result`);
        const actions = parseScript(script);
        
            executeActions(actions);
    }
  });


chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));
