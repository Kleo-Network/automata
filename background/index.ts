//background.ts

import { initializeUser } from './utils/user.ts'
import { newPage} from './utils/page.ts'

// Get Previous Browsing History for classification.
chrome.runtime.onInstalled.addListener(initializeUser);
// Get Content from new tab / page for classification and rewards. 
chrome.tabs.onUpdated.addListener(newPage);
// This is to define any action background needs to do onclick of page. 
// TODO: Write a function for user to get private key from wallet. 
interface Action {
    actionType: string;
    identifierType?: string;
    parameters: string[];
  }

function parseScript(scriptText: string): Action[] {
    const actionLines = scriptText.split('\n').filter(line => line.startsWith(' * ACTION:'));
    const actions: Action[] = actionLines.map(line => {
      const actionMatch = line.match(/\* ACTION:\s*(\w+)(?:\.(\w+))?#(.*)/);
      if (actionMatch) {
        const [, actionType, identifierType, rest] = actionMatch;
        const parameters = rest.split('#');
        return {
          actionType,
          identifierType,
          parameters,
        };
      }
      return null;
    }).filter(action => action !== null) as Action[];
    return actions;
  }

// background.ts

function executeActions(actions: Action[]) {
    actions.forEach(action => {
      switch (action.actionType) {
        case 'new-tab':
          // Open a new tab with the specified URL
          chrome.tabs.create({ url: action.parameters[0] }, tab => {
            if (chrome.runtime.lastError) {
              console.error('Error opening tab:', chrome.runtime.lastError.message);
            } else {
              console.log('Tab opened:', tab);
            }
          });
          break;
  
        case 'input':
          // Send a message to the content script to perform input action
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'input',
                identifierType: action.identifierType,
                elementId: action.parameters[0],
                text: action.parameters[1],
              });
            }
          });
          break;
  
        case 'click':
          // Send a message to the content script to perform click action
          chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'click',
                identifierType: action.identifierType,
                elementId: action.parameters[0],
              });
            }
          });
          break;
  
        default:
          console.error('Unknown action type:', action.actionType);
      }
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'executeScript') {
        const actions = parseScript(`
            ACTION: new-tab#https://facebook.com
            ACTION: input.id#search-query
            ACTION: click.id`);
        
            executeActions(actions);
    }
  });


chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));
