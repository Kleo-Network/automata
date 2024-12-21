import { Step, STEP_STATUS } from '../../src/pages/Main/Tasks/TaskDetail';

// Configuration for script actions and their human-readable messages
const SCRIPT_ACTION_CONFIG = {
  'new-tab': {
    getMessage: (params: string[]) => `Opening new tab: ${params[0]}`,
  },
  wait: {
    getMessage: () => 'Waiting for page to load...',
  },
  input: {
    getMessage: (params: string[]) => `Entering text: ${params[2]}`,
  },
  click: {
    getMessage: (params: string[]) => `Clicking element: ${params[2] || params[1]}`,
  },
  infer: {
    getMessage: (params: string[]) => `Inferring from ${params[0]}: ${params[1]}`,
  },
};

export const parseScript = (script: string): Step[] => {
  return script
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line, index) => {
      const [action, ...params] = line.split('#');
      const config = SCRIPT_ACTION_CONFIG[action as keyof typeof SCRIPT_ACTION_CONFIG];

      return {
        id: `step-${index}`,
        message: config ? config.getMessage(params) : `Executing ${action}`,
        status: STEP_STATUS.PENDING,
        action,
        params,
      };
    });
};
