import { useParams } from "react-router-dom";
import { TaskCard } from "./TaskCard";
import { useState } from "react";

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
}

const TASK_DETAIL_PAGE_DATA = {
  taskCardDetails: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    title: "Amazon Order List",
    iconSrc: 'https://icon.horse/icon/amazon.in',
    script: "",
    stats: [
      { label: 'Used', value: '10.2k times', iconSrc: "../../assets/images/tasks/profileIcon.svg" },
      { label: 'Sponsored', value: 'Amazon', iconSrc: 'https://icon.horse/icon/amazon.in' },
      { label: 'Earn', value: '+5.5k', iconSrc: '../../assets/images/tasks/dollarIcon.svg' },
    ],
    rating: 3.4,
    creator: 'cyborg_129',
    inputRequired: true,
    inputDescription: 'Fill in the input details below',
    inputInitialValue: 'Credentials : ',
    inputPlaceholder: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ullamco'
  },
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
}

export const TaskDetails = () => {
  const { taskId } = useParams();
  const [scriptStatus, setScriptStatus] = useState(SCRIPT_STATUS.NOT_STARTED);
  const [inputValue, setInputValue] = useState(TASK_DETAIL_PAGE_DATA.taskCardDetails.inputInitialValue);
  const handlePlayScript = () => {
    setScriptStatus(SCRIPT_STATUS.RUNNING);
    setTimeout(() => {
      setScriptStatus(SCRIPT_STATUS.FINISHED);
    }, 2000);
  }
  // TODO: @vaibhav this is to add dynamically the inputRequired. Please Remove this when integrate.
  TASK_DETAIL_PAGE_DATA.taskCardDetails.inputRequired = parseInt(taskId || '2') % 2 === 0;

  return (
    <div className="p-6 flex flex-col w-full h-[calc(100vh-52px)] gap-4 bg-grayblue-100">
      <TaskCard
        creator={TASK_DETAIL_PAGE_DATA.taskCardDetails.creator}
        description={TASK_DETAIL_PAGE_DATA.taskCardDetails.description}
        iconSrc={TASK_DETAIL_PAGE_DATA.taskCardDetails.iconSrc}
        rating={TASK_DETAIL_PAGE_DATA.taskCardDetails.rating}
        script={TASK_DETAIL_PAGE_DATA.taskCardDetails.script}
        stats={TASK_DETAIL_PAGE_DATA.taskCardDetails.stats}
        title={TASK_DETAIL_PAGE_DATA.taskCardDetails.title}
        id={taskId!}
        showPlayButton={false}
      />
      {/* Input conditionally */}
      {TASK_DETAIL_PAGE_DATA.taskCardDetails.inputRequired && (
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-lg">Input</h1>
          <p className="text-xs text-gray-700">{TASK_DETAIL_PAGE_DATA.taskCardDetails.inputDescription}</p>
          <textarea
            id="input"
            value={inputValue} // Bind to the state variable
            onChange={(e) => setInputValue(e.target.value)} // Update state on change
            placeholder={TASK_DETAIL_PAGE_DATA.taskCardDetails.inputPlaceholder}
            className="mt-1 min-h-32 w-full rounded-lg bg-grayblue-200 p-4 text-xs placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}
      {/* Play Script Button */}
      <div className="flex justify-center font-medium w-full">
        <button
          className={`px-4 py-2 rounded-md w-full flex gap-3 justify-center items-center text-white
            ${scriptStatus === SCRIPT_STATUS.RUNNING ?
              'bg-gray-400'
              : 'bg-primary-600 hover:bg-primary-800'}`}
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
        {
          TASK_DETAIL_PAGE_DATA.logHistory.map((historyItem, index) =>
            <HistoryItem content={historyItem.content} type={historyItem.type} key={index} />
          )
        }
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
        return IMAGES.infoIconPath; // Assuming CREDS_REQUIRED uses infoIcon
      default:
        return IMAGES.infoIconPath; // Default icon
    }
  };

  return (
    <div className="w-full flex gap-2 mb-3">
      <img src={getImagePath()} alt={type} className="size-4" />
      <p>
        {type === HISTORY_ITEMS.RUNNING ? <span className="font-bold">Running: </span> : ''}
        {content}
      </p>
    </div>
  )
}
