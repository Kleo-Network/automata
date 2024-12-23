import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useFetch, { FetchStatus } from "../../../common/hooks/useFetch";
import { parseScript } from "../../../../content/utils/parseScript";
import { TaskCard } from "./TaskCard";

// Constants
const IMAGES = {
  successIconPath: '../../../assets/images/Tasks/greenTick.svg',
  errorIconPath: '../../../assets/images/Tasks/redCross.svg',
  runningIconPath: '../../../assets/images/Tasks/chevronRight.svg',
  infoIconPath: '../../../assets/images/Tasks/infoIcon.svg',
  pendingIconPath: '../../../assets/images/Tasks/pendingIcon.svg'
};

// Enums & Types
export enum STEP_STATUS {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  FINISHED = 'FINISHED',
  CREDS_REQUIRED = 'CREDS_REQUIRED'
}

export interface Step {
  id: string;
  message: string;
  status: STEP_STATUS;
  action: string;
  params: string[];
}

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
}

// Main Component
export const TaskDetails = () => {
  const { taskId } = useParams<{ taskId: string }>();

  // State Management
  const [scriptStatus, setScriptStatus] = useState(STEP_STATUS.PENDING);
  const [steps, setSteps] = useState<Step[]>([]);
  const [inputValue, setInputValue] = useState('Credentials : ');
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const [scriptExecutionFailed, setScriptExecutionFailed] = useState('');

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
      const stepsList = parseScript(data.script.script);
      setSteps(stepsList);
      console.log('Parsed steps:', stepsList);
    }
  }, [data?.script?.script]);

  // Port Connection Management
  useEffect(() => {
    const newPort = chrome.runtime.connect({ name: "tracking-port" });
    setPort(newPort);
    console.log('Connected to background script:', newPort);

    // Initialize tracking
    newPort.postMessage({
      action: 'START_TRACKING',
      taskId
    });

    // Update steps based on background messages
    newPort.onMessage.addListener((update: Update) => {
      console.log('Received update:', update);

      if (update.stepIndex !== undefined && update.status) {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          if (newSteps[update.stepIndex]) {
            newSteps[update.stepIndex] = {
              ...newSteps[update.stepIndex],
              status: update.status
            };
          }
          return newSteps;
        });
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

    console.log('Executing script:', data.script.script);
    setScriptStatus(STEP_STATUS.RUNNING);

    chrome.runtime.sendMessage(
      {
        action: 'executeScript',
        input: data.script.script
      },
      (response) => {
        console.log('Script execution response:', response);
        if (response?.success) {
          setScriptStatus(STEP_STATUS.FINISHED);
        } else {
          setScriptStatus(STEP_STATUS.ERROR);
          setScriptExecutionFailed(response?.error || 'Script Execution Failed!');
        }
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

  // TODO: PRINCE remove this mock script one done with login flow.
  data!.script.script = `
new-tab$D$https://www.amazon.in/gp/css/order-history?ref_=nav_orders_first
wait
select$D$#time-filter$D$INFER$D$You will get this element, document.querySelector('#time-filter'). Now from this you need to identify the querySelector for 2024 option. And return a single string of choosing 2024 year. By assigning that string returned by you to this select element, and then if I dispatch the change event, it should be able to choose that 2024 in this select. For example you can return value for that option which is asked from the select you have been shared. Just return the value as string. For example 'year-2023' if it is available as option. Now here is the whole select element :
`

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
            label: 'Sponsored',
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
            ${scriptStatus === STEP_STATUS.RUNNING ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-800'}`}
          onClick={handlePlayScript}
          disabled={scriptStatus === STEP_STATUS.RUNNING}
        >
          {scriptStatus === STEP_STATUS.RUNNING ? 'Script Running...' : 'Play Script'}
        </button>
      </div>

      <h1 className="font-semibold text-lg mt-2">Log History</h1>
      <div className="rounded-lg flex-1 px-4 py-6 bg-grayblue-800 text-xs text-white w-full overflow-auto">
        {steps.map((historyItem, index) => (
          <HistoryItem
            content={historyItem.message}
            status={historyItem.status}
            key={index}
          />
        ))}
        {scriptStatus === STEP_STATUS.ERROR && (
          <HistoryItem
            content={scriptExecutionFailed}
            status={STEP_STATUS.ERROR}
            key={steps.length}
          />
        )}
      </div>
    </div>
  );
};

// History Item Sub-component
interface HistoryItemProps {
  status: STEP_STATUS;
  content: string;
}

const HistoryItem = ({ status, content }: HistoryItemProps) => {
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

  return (
    <div className={`w-full flex gap-2 mb-3 ${status === STEP_STATUS.RUNNING ? 'bg-gray-600' : ''}`}>
      <img src={getImagePath()} alt={status} className="size-4" />
      <p>{content}</p>
    </div>
  );
};
