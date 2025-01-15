import { useState, useMemo } from "react";
import { TaskCard } from "./TaskCard";
import useFetch, { FetchStatus } from "../../../common/hooks/useFetch";
import { UserContext } from '../../../common/hooks/UserContext';
import { useContext } from 'react';
type Script = {
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
};
type ScriptsResponse = {
  scripts: Script[];
};

// const IMAGES = {
//   searchIconPath: '../../../assets/images/Tasks/searchIcon.svg'
// }

const TASKS_PAGE_DATA = {
  title: "Own Data, Earn Crypto Tokens",
  desc: "Select your task and sit back as your personal AI assistant takes over."
};

export const Tasks = () => {
  const [searchString, setSearchString] = useState('');
  const { user } = useContext(UserContext);
  const { data, status, error } = useFetch<ScriptsResponse>(`script/all/${user?.address}`);

  const taskCards = useMemo(() => {
    if (data?.scripts) {
      // Map the fetched scripts to the TaskCard props format
      return data.scripts
        .filter((script) => script.verified) // Ensure only verified scripts
        .map((script) => ({
          id: script._id,
          title: script.name,
          description: script.description,
          iconSrc: script.logo || 'https://example.com/default-icon.png',
          script: script.script,
          rating: script.rating,
          creator: script.creator_address,
          stats: [
            { label: 'Used', value: `${script.used} times`, iconSrc: "../../assets/images/tasks/profileIcon.svg" },
            { label: 'Earn Upto', value: `+${script.earn_points} KDAT`, iconSrc: '../../assets/images/tasks/dollarIcon.svg' },
          ]
        }));
    } else {
      return [];
    }
  }, [data]);

  const handleSearchUpdate = (newValue: string) => {
    setSearchString(newValue);
  };
  const handleSearchSubmit = () => {
    console.log('Performing search for:', searchString);
    // TODO: @vaibhav Add your search functionality here
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <div className="h-[calc(100vh-52px)] w-full bg-grayblue-100 p-6 flex flex-col items-center gap-4">
      {/* Title + Description */}
      <div className="w-full flex flex-col gap-1 font-sans">
        <h1 className="font-bold text-2xl">{TASKS_PAGE_DATA.title}</h1>
        <p className="text-xs text-gray-700">{TASKS_PAGE_DATA.desc}</p>
      </div>
      {/* Search Bar */}
      {/* <div className="flex items-center gap-3 rounded-lg bg-grayblue-200 px-4 py-2 w-full">
        <img src={IMAGES.searchIconPath} className="size-[18px]" />
        <input
          type="text"
          placeholder="Search cards"
          value={searchString}
          onChange={(e) => handleSearchUpdate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
        />
      </div> */}
      {/* Tasks List */}
      <div className="overflow-auto w-full flex-1">
        {status === FetchStatus.LOADING && (
          <div>Loading tasks...</div>
        )}
        {status === FetchStatus.ERROR && (
          <div className="text-red-500">Error: {error}</div>
        )}
        {status === FetchStatus.SUCCESS && taskCards.length === 0 && (
          <div>No verified tasks found.</div>
        )}
        {status === FetchStatus.SUCCESS && taskCards.length > 0 && (
          <>
            {taskCards.map((taskCard) => (
              <TaskCard
                key={taskCard.id}
                creator={taskCard.creator}
                description={taskCard.description}
                iconSrc={taskCard.iconSrc}
                rating={taskCard.rating}
                script={taskCard.script}
                stats={taskCard.stats}
                title={taskCard.title}
                id={taskCard.id}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}