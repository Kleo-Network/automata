//background.ts

// This is to define any action background needs to do onclick of page. 
// TODO: Write a function for user to get private key from wallet. 
type Action = 'new-tab' | 'input' | 'click' | 'scrape';

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
                identifierType: action.type,
                elementId: action.params[0],
                text: action.params[1],
              });
            }
          });
          break;
  
        case 'click':
          // Send a message to the content script to perform click action
          console.log({action});
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'click',
                identifierType: action.type,
                elementId: action.params[0],
              });
            }
          });
          break;
  
        case 'scrape':
        // Send a message to the content script to perform click action
        console.log({action});
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'scrape',
                identifierType: action.type,
                elementId: action.params[0],
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
        const actions = parseScript(request.input ?? `
new-tab#https://amazon.in
input#twotabsearchtextbox#ps5
click#nav-search-submit-button
scrape#id
`);
        
            executeActions(actions);
    }
  });


chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));
