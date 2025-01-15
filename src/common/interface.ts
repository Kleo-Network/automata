export interface UserData {
  badges?: string[];
  content_tags?: string[];
  first_time_user?: boolean;
  identity_tags?: string[];
  kleo_points?: number;
  data_quality?: number;
  slug?: string;
  verified?: boolean;
  last_minted?: number;
  total_data_quantity?: number;
  address?: string;
}

export interface VisitCountMap {
  category: string;
  count: number;
}

interface PublishedCardMetadata {
  activity: string[] | VisitCountMap[] | string;
  description: string;
  entities?: string[];
  dateFrom?: number;
  dateTo?: number;
  tags?: string[];
  titles?: string[];
}

interface PublishedCardUrls {
  id: string;
  title: string;
  url: string;
}

export interface PublishedCard {
  cardType: string;
  category: string;
  content: string;
  date: string;
  id: string;
  metadata: PublishedCardMetadata;
  minted: boolean;
  tags: string[];
  urls: PublishedCardUrls[];
}
export enum CardType {
  GitCard = 'GitCard',
  CalendlyCard = 'CalendlyCard',
  MapCard = 'PlaceCard',
  TwitterCard = 'XCard',
}
export interface Contribution {
  date: string;
  count: number;
}
export interface GitCard {
  userName: string;
  followers: number;
  following: number;
  contribution: Contribution[];
  url: string;
}
export interface CalendlyCard {
  slug: string;
}
export interface MapCard {
  location: string;
  cordinates: {
    lat: number;
    lng: number;
  };
}
//  Type 'GitCard' is missing the following properties from type 'User': pinned_tweet, bio, followers_count, is_verifiedts(2322)
export interface TextCard {
  text: string;
}
export interface TwitterCard {
  username: string;
  pinned_tweet: string;
  followers_count: number;
  following_count: number;
  bio: string;
  is_verified: boolean;
}

interface UrlMetadata {
  url: string;
  caption: string;
}

export interface InstagramCard {
  urls: UrlMetadata[];
  username: string;
}

export interface StaticCard {
  cardType: string;
  id: string;
  last_connected: string;
  metadata: GitCard | CalendlyCard | MapCard | TwitterCard | TextCard | InstagramCard;
}

export interface fullUserData {
  user: UserData;
  published_cards: PublishedCard[];
  static_cards: StaticCard[];
}

export interface UserDataProps {
  user: UserData;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
  slug: string;
}

export enum CardTypeToRender {
  YT = 'YT',
  IMAGE = 'IMAGE',
  DATA = 'DATA',
  PURPLE = 'PURPLE',
}

export interface PendingCard {
  cardType: string;
  category: string;
  content: string;
  date: number;
  id: string;
  metadata: PublishedCardMetadata;
  minted: boolean;
  tags: string[];
  urls: PublishedCardUrls[];
  cardTypeToRender?: CardTypeToRender;
  stockImage?: string;
}

export interface ChartItem {
  label: string;
  percentage: string;
}

export type Action = 'open-tab' | 'input' | 'click' | 'infer' | 'wait' | 'select' | 'open' | 'login' | 'fetch';

export interface ScriptAction {
  type: Action;
  params: string[];
  stepIndex: number;
  status: STEP_STATUS;
  message: string;
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


function parseParameter(param: string, lineIndex: number): ScriptAction | string {
  if (!param.startsWith('(') || !param.endsWith(')')) {
    return param; // It's just a normal string parameter
  }
  const inside = param.slice(1, -1).trim(); // "infer#".abc"#"prompt text"
  const action = parseSingleLine(inside, lineIndex);
  console.log("subaction from line 74 : ", action);
  return action;
}

function parseSingleLine(line: string, lineIndex: number): ScriptAction {
  const parts = splitOutsideParenthesesAndQuotes(line);
  const [type, ...rawParams] = parts;
  const sanitizedParams = rawParams.map((p) => {
    let param = p;
    if (param.startsWith('"') && param.endsWith('"')) {
      param = param.slice(1, -1);
    }
    return parseParameter(param, lineIndex);
  });

  return {
    type: type as Action,
    params: sanitizedParams as string[],
    stepIndex: lineIndex,
    status: STEP_STATUS.PENDING,
    message: `Pending Command ${type}`
  };
}


function splitOutsideParenthesesAndQuotes(line: string): string[] {
  const results: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenLevel = 0;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
    } 
    else if (!inQuotes) {
      if (c === '(') {
        parenLevel++;
        current += c;
      } else if (c === ')') {
        if (parenLevel > 0) {
          parenLevel--;
        }
        current += c;
      } 
      else if (c === '#' && parenLevel === 0) {
        results.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    } 
    else {
      
      current += c;
    }
  }

  if (current.trim() !== '') {
    results.push(current.trim());
  }

  return results;
}


export function parseScript(script: string): ScriptAction[] {
  const lines = script
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  return lines.map((line, index) => {
    const action = parseSingleLine(line, index);
    console.log(`Parsed action at step ${index}:`, action);
    return action;
  });
}
const isJsonObject = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch (e) {
    return false;
  }
};

const handleJsonParam = (params: string[]): string | null => {
  for (const param of params) {
    if (isJsonObject(param)) {
      console.log(param);
      return `Prompting LLM with query: ${JSON.stringify(JSON.parse(param))}`;
    }
  }
  return null;
}

export const SCRIPT_ACTION_CONFIG = {
  'open': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Opening URL: ${params[0]}`;
    },
  },
  'open-tab': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Opening new tab: ${params[0]}`;
    },
  },
  'wait': {
    getMessage: () => 'Waiting for page to load...',
  },
  'input': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Entering text on ${params[0]}: ${params[1]}`;
    },
  },
  'click': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Clicking element: ${params[1] || params[0]}`;
    },
  },
  'infer': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Inferring from ${params[0]}: ${params[1]}`;
    },
  },
  'login': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Logging in at: ${params[0]}`;
    },
  },
  'select': {
    getMessage: (params: string[]) => {
      const jsonMessage = handleJsonParam(params);
      return jsonMessage || `Selecting ${params[1]} from ${params[0]}`;
    },
  }
};

