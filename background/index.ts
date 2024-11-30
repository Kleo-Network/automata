import { initializeUser } from './utils/user.ts'
import { newPage} from './utils/page.ts'

// Get Previous Browsing History for classification.
chrome.runtime.onInstalled.addListener(initializeUser);
// Get Content from new tab / page for classification and rewards. 
chrome.tabs.onUpdated.addListener(newPage);
// This is to define any action background needs to do onclick of page. 
// TODO: Write a function for user to get private key from wallet. 
chrome.sidePanel
          .setPanelBehavior({ openPanelOnActionClick: true })
          .catch((error) => console.error(error));
