import { useState } from 'react';

interface TaskCardProps {
  description: string;
  title: string;
  iconSrc: string;
  script: string;
  stats: { label: string; value: string; iconSrc: string }[];
  rating: number;
  creator: string;
}

export const TaskCard = ({
  description,
  title,
  iconSrc,
  script,
  stats,
  rating,
  creator,
}: TaskCardProps) => {
  // States for the card
  const [status, setStatus] = useState<'play' | 'confirm' | 'running'>('play');
  const [scriptRunning, setScriptRunning] = useState(false);

  // Handlers for state transitions
  const handlePlay = () => setStatus('confirm');
  const handleCancel = () => setStatus('play');
  const handleConfirm = () => {
    setStatus('running');
    setScriptRunning(true);

    // Simulate the script execution process
    setTimeout(() => {
      setScriptRunning(false);
      setStatus('play'); // Return to "play" after execution
    }, 3000); // 3-second mock execution
  };
  const handleStop = () => {
    setScriptRunning(false);
    setStatus('play'); // Stop execution and reset to "play"
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full p-4 mb-4 flex flex-col gap-3">
      {/* Favicon + Title + Creator + Rating Row */}
      <div className="flex gap-4">
        <div className="min-h-12 min-w-12 bg-grayblue-100 rounded-md p-2 flex items-center justify-center">
          <img src={iconSrc} className="size-10" />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex py-1 gap-2 justify-between">
            {/* Title */}
            <h2 className="font-semibold text-lg">{title}</h2>
            {/* Rating */}
            <div className="h-fit flex items-center gap-1 px-2 py-1 rounded-full bg-grayblue-100 min-w-fit">
              <img
                src="../../assets/images/tasks/starIcon.svg"
                alt=""
                className="size-4"
              />
              <p className="text-xs">{rating} Rating</p>
            </div>
          </div>
          <p className="text-xs">Created by {creator}</p>
        </div>
      </div>

      {/* Description Row */}
      <div className="w-full text-xs">{description}</div>

      {/* Stats Pills */}
      <div className="flex gap-2 flex-wrap mb-1">
        {stats.map((stat) => (
          <StatPill
            key={stat.label}
            label={`${stat.label}: `}
            value={stat.value}
            iconSrc={stat.iconSrc}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        {status === 'play' && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md w-full hover:bg-blue-600"
            onClick={handlePlay}
          >
            Play
          </button>
        )}
        {status === 'confirm' && (
          <div className="flex gap-4 w-full">
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex-1 hover:bg-gray-400"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-md flex-1 hover:bg-green-600"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </div>
        )}
        {status === 'running' && (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md w-full hover:bg-red-700"
            onClick={handleStop}
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
};

interface StatPillProps {
  label: string;
  value: string;
  iconSrc?: string;
}

const StatPill = ({ label, value, iconSrc }: StatPillProps) => {
  return (
    <div className="bg-grayblue-100 rounded-full p-2 gap-2 flex">
      <img src={iconSrc} alt="" className="size-4 rounded-full" />
      <p className="text-[10px]">
        <span className="font-bold">{label}</span> {value}
      </p>
    </div>
  );
};
