export type Action = 'open-tab' | 'input' | 'click' | 'infer' | 'wait' | 'select' | 'open' | 'login' | 'fetch' | 'while';

export interface ScriptAction {
  type: any;
  params: any[];
  stepIndex: number;
  status: STEP_STATUS;
  message: string;
}

export interface UpdateMessage {
  timestamp: number;
  stepIndex: number;
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
