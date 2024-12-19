import { useParams } from "react-router-dom";
import { TaskCard } from "./TaskCard";
import { useState, useMemo, useEffect } from "react";
import useFetch, { FetchStatus } from "../../../common/hooks/useFetch";

enum HISTORY_ITEMS {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  RUNNING = 'RUNNING',
  CREDS_REQUIRED = 'CREDS_REQUIRED'
}

enum SCRIPT_STATUS {
  NOT_STARTED = 'NOT_STARTED',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  FINISHED = 'FINISHED'
}

const IMAGES = {
  successIconPath: '../../../assets/images/Tasks/greenTick.svg',
  errorIconPath: '../../../assets/images/Tasks/redCross.svg',
  runningIconPath: '../../../assets/images/Tasks/chevronRight.svg',
  infoIconPath: '../../../assets/images/Tasks/infoIcon.svg'
};

const TASK_DETAIL_PAGE_DATA = {
  logHistory: [
    {
      type: HISTORY_ITEMS.RUNNING,
      content: 'Lorem ipsum dolor ...'
    },
    {
      type: HISTORY_ITEMS.SUCCESS,
      content: 'Lorem ipsum dolor'
    },
    {
      type: HISTORY_ITEMS.ERROR,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      type: HISTORY_ITEMS.SUCCESS,
      content: 'Lorem ipsum dolor'
    },
    {
      type: HISTORY_ITEMS.ERROR,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing '
    },
    {
      type: HISTORY_ITEMS.SUCCESS,
      content: 'Lorem ipsum dolor sit amet, cons'
    },
    {
      type: HISTORY_ITEMS.CREDS_REQUIRED,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing '
    },
    {
      type: HISTORY_ITEMS.SUCCESS,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing '
    },
  ]
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

export const TaskDetails = () => {
  const { taskId } = useParams();
  const [scriptStatus, setScriptStatus] = useState(SCRIPT_STATUS.NOT_STARTED);
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);



  // Fetch the specific script details from the API
  const { data, status, error } = useFetch<ScriptResponse>(`script/${taskId}`);

  // Handle input requirement logic (for demonstration)
  const inputRequired = useMemo(() => parseInt(taskId || '2') % 2 === 0, [taskId]);
  const [inputValue, setInputValue] = useState('Credentials : ');
  interface Update {
    timestamp: number;
    message: string;
  }
  const [updates, setUpdates] = useState<Update[]>([]);

  useEffect(() => {
    // Connect to background script
    const newPort = chrome.runtime.connect({ name: "tracking-port" });
    setPort(newPort);
    console.log('Frontend: Connected to background script', newPort);

    // Send initial message to background
    newPort.postMessage({
      action: 'START_TRACKING',
      taskId: taskId
    });

    // Handle incoming messages
    newPort.onMessage.addListener((update: Update) => {
      console.log('Frontend: Received message from background:', update);
      setUpdates(prev => [...prev, update]);

      // Check if tracking completed
      if (update.message === 'Tracking completed') {
        console.log("Frontend: Tracking completed");
        setScriptStatus(SCRIPT_STATUS.FINISHED);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('Frontend: Disconnecting port');
      newPort.disconnect();
    };
  }, [taskId]);


  const handlePlayScript = () => {
    if (data?.script.script) {
      console.log('Frontend: Executing script:', data.script.script);
      chrome.runtime.sendMessage(
        {
          action: 'executeScript',
          input: data.script.script
        },
        (response) => {
          console.log('Frontend: Received execute script response:', response);
          if (response?.success) {
            setScriptStatus(SCRIPT_STATUS.RUNNING);
          } else {
            setScriptStatus(SCRIPT_STATUS.ERROR);
            // Add error to updates
            setUpdates(prev => [...prev, {
              timestamp: Date.now(),
              message: `Error: ${response?.error || 'Script execution failed'}`
            }]);
          }
        }
      );
    }
  }

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

  // Once data is successfully fetched, use it to populate the TaskCard
  const scriptData = data?.script;
  if (!scriptData) {
    return (
      <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
        <div>No data found for this task.</div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <TaskCard
        creator={scriptData.creator_address}
        description={scriptData.description}
        iconSrc={scriptData.logo || 'https://example.com/default-icon.png'}
        rating={scriptData.rating}
        script={scriptData.script}
        stats={[
          { label: 'Used', value: `${scriptData.used} times`, iconSrc: "../../assets/images/tasks/profileIcon.svg" },
          { label: 'Sponsored', value: scriptData.sponsored, iconSrc: scriptData.logo || 'https://example.com/default-icon.png' },
          { label: 'Earn', value: `+${scriptData.earn_points}`, iconSrc: '../../assets/images/tasks/dollarIcon.svg' },
        ]}
        title={scriptData.name}
        id={scriptData._id}
        showPlayButton={false}
      />
      {/* Input conditionally */}
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
      {/* Play Script Button */}
      <div className="flex justify-center font-medium w-full">
        <button
          className={`px-4 py-2 rounded-md w-full flex gap-3 justify-center items-center text-white
            ${scriptStatus === SCRIPT_STATUS.RUNNING ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-800'}`}
          onClick={handlePlayScript}
          disabled={scriptStatus === SCRIPT_STATUS.RUNNING}
        >
          {scriptStatus === SCRIPT_STATUS.RUNNING ? 'Script Running...' : 'Play Script'}
        </button>
      </div>
      {/* Log History */}
      <h1 className="font-semibold text-lg mt-2">Log History</h1>
      {/* history container */}
      <div className="rounded-lg flex-1 px-4 py-6 bg-grayblue-800 text-xs text-white w-full overflow-auto">
        {updates.map((historyItem, index) =>
          <HistoryItem content={historyItem.message} type={HISTORY_ITEMS.RUNNING} key={index} />
        )}
      </div>
    </div>
  );
};

interface HistoryItemProps {
  type: HISTORY_ITEMS,
  content: string
}

const HistoryItem = ({ type, content }: HistoryItemProps) => {
  const getImagePath = () => {
    switch (type) {
      case HISTORY_ITEMS.SUCCESS:
        return IMAGES.successIconPath;
      case HISTORY_ITEMS.ERROR:
        return IMAGES.errorIconPath;
      case HISTORY_ITEMS.RUNNING:
        return IMAGES.runningIconPath;
      case HISTORY_ITEMS.CREDS_REQUIRED:
        return IMAGES.infoIconPath;
      default:
        return IMAGES.infoIconPath;
    }
  };

  return (
    <div className="w-full flex gap-2 mb-3">
      <img src={getImagePath()} alt={type} className="size-4" />
      <p>
        {type === HISTORY_ITEMS.RUNNING && <span className="font-bold">Running: </span>}
        {content}
      </p>
    </div>
  )
};
