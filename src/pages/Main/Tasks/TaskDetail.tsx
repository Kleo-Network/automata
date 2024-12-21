import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useFetch, { FetchStatus } from "../../../common/hooks/useFetch";
import { parseScript } from "../../../../content/utils/parseScript";
import { TaskCard } from "./TaskCard";

const IMAGES = {
  successIconPath: '../../../assets/images/Tasks/greenTick.svg',
  errorIconPath: '../../../assets/images/Tasks/redCross.svg',
  runningIconPath: '../../../assets/images/Tasks/chevronRight.svg',
  infoIconPath: '../../../assets/images/Tasks/infoIcon.svg',
  pendingIconPath: '../../../assets/images/Tasks/pendingIcon.svg'
};

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

export const TaskDetails = () => {
  const { taskId } = useParams();

  // All useState hooks
  const [scriptStatus, setScriptStatus] = useState(STEP_STATUS.PENDING);
  const [steps, setSteps] = useState<Step[]>([]);
  const [inputValue, setInputValue] = useState('Credentials : ');
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const [scriptExecutionFailed, setScriptExecutionFailed] = useState<string>('');

  // Fetch the specific script details from the API
  const { data, status, error } = useFetch<ScriptResponse>(`script/${taskId}`);

  // useMemo hooks
  const inputRequired = useMemo(() => parseInt(taskId || '2') % 2 === 0, [taskId]);

  // useEffect hooks
  useEffect(() => {
    if (data?.script?.script) {
      const StepsList = parseScript(data.script.script);
      setSteps(StepsList);
      console.log('PARSED STEPS \n', StepsList);
    }
  }, [data?.script?.script]);

  // Listen to Execution Status changes
  useEffect(() => {
    // connect to background script
    const newPort = chrome.runtime.connect({ name: "tracking-port" });
    setPort(newPort);
    console.log('FE: Connected To BG Script on PORT : ', newPort);

    // send Initial Message to BG
    newPort.postMessage({
      action: 'START_TRACKING',
      taskId: taskId
    })

    // Handle incoming messages
    newPort.onMessage.addListener((update: Update) => {
      console.log('FE: Received message from BG:', update);

      if (update.stepIndex !== undefined && update.status) {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          if (newSteps[update.stepIndex!]) {
            newSteps[update.stepIndex!] = {
              ...newSteps[update.stepIndex!],
              status: update.status!
            };
          }
          return newSteps;
        });
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('Frontend: Disconnecting port');
      newPort.disconnect();
    };
  }, [taskId])

  const handlePlayScript = () => {
    if (data?.script.script) {
      console.log('Frontend: Executing script:', data?.script.script);
      setScriptStatus(STEP_STATUS.RUNNING);
      chrome.runtime.sendMessage(
        {
          action: 'executeScript',
          input: data.script.script
        },
        (response) => {
          console.log('Frontend: Received execute script response:', response);
          if (response?.success) {
            setScriptStatus(STEP_STATUS.FINISHED);
          } else {
            setScriptStatus(STEP_STATUS.ERROR);
            // Add error to updates
            setScriptExecutionFailed(response?.error || 'Script Execution Failed!')
          }
        }
      );
    }
  };

  // Render functions
  const renderLoading = () => (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <div>Loading task details...</div>
    </div>
  );

  const renderError = () => (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <div className="text-red-500">Error: {error}</div>
    </div>
  );

  const renderNoData = () => (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <div>No data found for this task.</div>
    </div>
  );

  // Main render logic
  if (status === FetchStatus.LOADING) return renderLoading();
  if (status === FetchStatus.ERROR) return renderError();
  if (!data?.script) return renderNoData();

  const taskData = data.script;

  return (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <TaskCard
        creator={taskData.creator_address}
        description={taskData.description}
        iconSrc={taskData.logo || 'https://example.com/default-icon.png'}
        rating={taskData.rating}
        script={taskData.script}
        stats={[
          { label: 'Used', value: `${taskData.used} times`, iconSrc: "../../assets/images/tasks/profileIcon.svg" },
          { label: 'Sponsored', value: taskData.sponsored, iconSrc: taskData.logo || 'https://example.com/default-icon.png' },
          { label: 'Earn', value: `+${taskData.earn_points}`, iconSrc: '../../assets/images/tasks/dollarIcon.svg' },
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
        {scriptStatus === STEP_STATUS.ERROR &&
          <HistoryItem
            content={scriptExecutionFailed}
            status={STEP_STATUS.ERROR}
            key={steps.length}
          />}
      </div>
    </div>
  );
};

// HistoryItem component remains the same
const HistoryItem = ({ status, content }: { status: STEP_STATUS, content: string }) => {
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
      <p>
        {content}
      </p>
    </div>
  );
};
