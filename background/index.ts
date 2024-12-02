//background.ts

// This is to define any action background needs to do onclick of page. 
// TODO: Write a function for user to get private key from wallet. 
type Action = 'new-tab' | 'input' | 'click' | 'infer' | 'wait';

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

function waitForPageLoad(workTabId: number) {
    return new Promise<void>((resolve) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === workTabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        });
    });
}

// background.ts

async function executeActions(actions: ScriptAction[]) {
    let tabInstance = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

    for (const action of actions) {
      switch (action.type) {
        case 'new-tab':
          // Open a new tab with the specified URL
          console.log({action});
          tabInstance = await chrome.tabs.create({ url: action.params[0] });
          break;
  
        case 'input':
          // Send a message to the content script to perform input action
          console.log({action})
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'input',
              identifierType: action.params[0],
              elementId: action.params[1],
              text: action.params[2],
            });
          }
          break;
  
        case 'click':
          // Send a message to the content script to perform click action
          console.log({action});
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
              action: 'click',
              identifierType: action.params[0],
              elementId: action.params[1],
            });
          }
          break;
  
        case 'infer':
          // Send a message to the content script to perform click action
          console.log({action});
          if (tabInstance.id) {
            chrome.tabs.sendMessage(tabInstance.id, {
                action: 'infer',
                identifierType: action.params[0],
                elementId: action.params[1],
                attribute: action.params[2],
                attribValue: action.params[3],
            });
          }
          break;

        case 'wait':
            if (tabInstance.id) {
              await waitForPageLoad(tabInstance.id);
            }
          break;
          
        default:
          console.error('Unknown action type:', action.type);
      }
    };
  }

// new-tab#https://amazon.in
// wait
// input#id#twotabsearchtextbox#ps5
// click#id#nav-search-submit-button
// wait
// infer#class#s-search-results#data-component-type#s-search-result
// wait

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log({request, sender, sendResponse});
    if (request.action === 'executeScript') {
        const script = request.input ?? (request.input);
        const actions = parseScript(script);

        executeActions(actions);
    }
  });


chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));
