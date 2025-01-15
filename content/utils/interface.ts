export type Action = 'open-tab' | 'input' | 'click' | 'infer' | 'wait' | 'select' | 'open' | 'login' | 'fetch';

export interface ScriptAction {
  type: Action;
  params: string[];
  stepIndex: number;
}

export interface UpdateMessage {
  timestamp: number;
  message: string;
  stepIndex: number;
  status: STEP_STATUS;
  actions: ScriptAction[];
  isPaused: boolean;
  tabInstance: chrome.tabs.Tab | null;
}

// Enums
export enum STEP_STATUS {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  FINISHED = 'FINISHED',
  CREDS_REQUIRED = 'CREDS_REQUIRED',
}

export interface ExecutionState {
    isPaused: boolean;
    currentActionIndex: number;
    actions: ScriptAction[];
    tabInstanceId?: number;

}
