import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useFetch, { FetchStatus } from "../../../common/hooks/useFetch";
import { TaskCard } from "./TaskCard";
import { STEP_STATUS, ScriptAction, parseScript, SCRIPT_ACTION_CONFIG } from "../../../common/interface";
// Constants
const IMAGES = {
  successIconPath: '../../../assets/images/Tasks/greenTick.svg',
  errorIconPath: '../../../assets/images/Tasks/redCross.svg',
  runningIconPath: '../../../assets/images/Tasks/chevronRight.svg',
  infoIconPath: '../../../assets/images/Tasks/infoIcon.svg',
  pendingIconPath: '../../../assets/images/Tasks/pendingIcon.svg'
};




interface ScriptData {
  _id: string;
  creator_address: string;
  transaction_hash: string;
  script: string;
  used: number;
  earn_points: number;
  rating: number;
  description: string;
  name: string;
  sponsored: string;
  logo: string;
  created_at: string;
  verified: boolean;
}

type ScriptResponse = {
  script: ScriptData;
}

interface Update {
  timestamp: number;
  message: string;
  stepIndex: number;
  status: STEP_STATUS;
  actions: ScriptAction[];
  isPaused: boolean;
  tabInstance: chrome.tabs.Tab | null;
}

// Main Component
export const TaskDetails = () => {
  const { taskId } = useParams<{ taskId: string }>();

  // State Management
  const [scriptStatus, setScriptStatus] = useState(STEP_STATUS.PENDING);
  const [steps, setSteps] = useState<ScriptAction[]>([]);
  const [inputValue, setInputValue] = useState<string>('Input : ');
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const [pauseIndex, setPauseIndex] = useState<number>(0);
  const [isPause, setIsPause] = useState<boolean>(true);
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  // Data Fetching
  const { data, status, error } = useFetch<ScriptResponse>(`script/${taskId}`);
  // TODO: @vaibhav Update the scriptResponse to have this field. Right now keeping it false.
  // const inputRequired = data?.script.inputRequired;
  const inputRequired = false;

  // NOTE: This is for mock data only.
  // const inputRequired = useMemo(() =>
  //   parseInt(taskId || '2') % 2 === 0,
  //   [taskId]
  // );

  // Get the steps at Start
  useEffect(() => {
    if (data?.script?.script) {
      const actions = parseScript(data?.script?.script)
      setSteps(actions);
      console.log(data?.script?.script)
    }
  }, [data?.script?.script]);

  // Port Connection Management
  useEffect(() => {
    const newPort = chrome.runtime.connect({ name: "tracking-port" });
    setPort(newPort);
    console.log('Connected to background script:', newPort);


    // Update steps based on background messages
    newPort.onMessage.addListener((update: Update) => {
      if (update) {
        if (update.tabInstance) {
          setTab(update.tabInstance);
        }

        if (update.isPaused == true) {
          setPauseIndex(update.stepIndex);
          setIsPause(true);
        }


        console.log('Previous Steps', steps);
        console.log('Received update on new steps:', update);
        setSteps(update.actions);

      }
    });

    return () => {
      console.log('Disconnecting port');
      newPort.disconnect();
    };
  }, [taskId]);

  // Event Handlers
  const handlePlayScript = () => {
    if (!data?.script.script) return;
    setIsPause(false);
    console.log('Executing script:', data.script.script);
    chrome.runtime.sendMessage(
      {
        action: 'executeScript',
        input: data.script.script,
        index: pauseIndex,
        tabInstance: tab
      },
      (response) => {
        console.log('Script execution response:', response);
      }
    );
  };

  // Loading States
  if (status === FetchStatus.LOADING) {
    return (
      <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
        <div>Loading task details...</div>
      </div>
    );
  }

  if (status === FetchStatus.ERROR) {
    return (
      <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data?.script) {
    return (
      <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
        <div>No data found for this task.</div>
      </div>
    );
  }

  const taskData = data.script;

  // Main Render
  return (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <TaskCard
        creator={taskData.creator_address}
        description={taskData.description}
        iconSrc={taskData.logo || 'https://example.com/default-icon.png'}
        rating={taskData.rating}
        script={taskData.script}
        stats={[
          {
            label: 'Used',
            value: `${taskData.used} times`,
            iconSrc: "../../assets/images/tasks/profileIcon.svg"
          },
          {
            label: 'Sponsor',
            value: taskData.sponsored,
            iconSrc: taskData.logo || 'https://example.com/default-icon.png'
          },
          {
            label: 'Earn',
            value: `+${taskData.earn_points}`,
            iconSrc: '../../assets/images/tasks/dollarIcon.svg'
          },
        ]}
        title={taskData.name}
        id={taskData._id}
        showPlayButton={false}
      />

      {inputRequired && (
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-lg">Input</h1>
          <p className="text-xs text-gray-700">Fill in the input details below</p>
          <textarea
            id="input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
            className="mt-1 min-h-32 w-full rounded-lg bg-grayblue-200 p-4 text-xs placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      <div className="flex justify-center font-medium w-full">
        <button
          className={`px-4 py-2 rounded-md w-full flex gap-3 justify-center items-center text-white
            ${isPause ? 'bg-primary-600 hover:bg-primary-800' : 'bg-gray-400'}`}
          onClick={handlePlayScript}
          disabled={!isPause}
        >
          {scriptStatus === STEP_STATUS.RUNNING ? 'Script Running...' : 'Play Script'}
        </button>

      </div>
      <div>
        {steps.some(step => step.status === STEP_STATUS.CREDS_REQUIRED) && (
          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
            Please Sign In to your account. Once you have signed in, click on Play Script button above.
          </div>)}

      </div>
      <h1 className="font-semibold text-lg mt-2">Log History</h1>
      <div className="rounded-lg flex-1 px-4 py-6 bg-grayblue-800 text-xs text-white w-full overflow-auto">
        {steps.map((historyItem, index) => (
          <HistoryItem
            item={historyItem}
            status={historyItem.status}
            key={index}
          />
        ))}
      </div>
    </div>
  );
};

// History Item Sub-component
interface HistoryItemProps {
  status: STEP_STATUS;
  item: ScriptAction;
}

const HistoryItem = ({ status, item }: HistoryItemProps) => {
  const getImagePath = () => {
    switch (status) {
      case STEP_STATUS.SUCCESS:
        return IMAGES.successIconPath;
      case STEP_STATUS.ERROR:
        return IMAGES.errorIconPath;
      case STEP_STATUS.RUNNING:
        return IMAGES.runningIconPath;
      case STEP_STATUS.CREDS_REQUIRED:
        return IMAGES.infoIconPath;
      case STEP_STATUS.PENDING:
        return IMAGES.pendingIconPath;
      default:
        return IMAGES.infoIconPath;
    }
  };
  const config = SCRIPT_ACTION_CONFIG[item.type as keyof typeof SCRIPT_ACTION_CONFIG];
  return (
    <div className={`w-full flex gap-2 mb-3 ${status === STEP_STATUS.RUNNING ? 'bg-gray-600' : ''}`}>
      <img src={getImagePath()} alt={status} className="size-4" />
      <p>{item.message}</p>
    </div>
  );
};
