import { stringDoesNotContainAnyFromArray } from './helpers';
import {initializeUser, postToAPI} from  './user.ts'

interface tabInfo {
    status?: string;
}
interface TabRemoveInfo {
    windowId: number;
    isWindowClosing: boolean;
  }
interface Tab {
    url?: string;
}
interface user {
    address:string;
    token: string;
    points?: number;
}
interface StorageData {
    user?: user
}

interface PageResponse {
    content?: string;
    title?: string;
}

interface DataToSend {
    content?: string;
    title?: string;
    url?: string;
    user?: user;
    lastVisitTime?: number;
}

export async function newPage(tabId: number, changeInfo: tabInfo, tab: Tab): Promise<void> {
    if (changeInfo.status === 'complete' && tab.url && stringDoesNotContainAnyFromArray(tab.url)) {
        chrome.storage.local.get('user', async function(storageData: StorageData) {
            if (storageData.user) {   
                chrome.tabs.sendMessage((tab as any).id, { action: "getPageContent" }, function(response: PageResponse) {
                    setTimeout(() => {
                    if (response) {
                        
                        const dataToSend: DataToSend = {
                            content: response?.content,
                            title: response?.title,
                            url: tab.url!,
                            lastVisitTime: new Date().getTime()
                        };
                        postToAPI(
                            {
                                history: [dataToSend],
                                address: (storageData.user as any).id,
                                signup: false,
                            },
                            (storageData.user as any).token
                        );
                       
                        } else {
                            console.error("Failed to retrieve page content or title.");
                        }
                    }, 2000);
                });
            }
           
        });
    }
}