import { useState } from "react";
import { TaskCard } from "./TaskCard";

const IMAGES = {
  searchIconPath: '../../../assets/images/Tasks/searchIcon.svg'
}

const TASKS_PAGE_DATA = {
  title: "Your Personal AI Assistant",
  desc: "Select your task and sit back as your personal AI assistant takes over.",
  taskCards: [
    {
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
      id: "1"
    },
    {
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
      id: "2"
    },
    {
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
      id: "3"
    },
    {
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
      id: "4"
    },
    {
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
      id: "5"
    },
  ]
};

export const Tasks = () => {
  const [searchString, setSearchString] = useState('');

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
      <div className="flex items-center gap-3 rounded-lg bg-grayblue-200 px-4 py-2 w-full">
        <img src={IMAGES.searchIconPath} className="size-[18px]" />
        <input
          type="text"
          placeholder="Search cards"
          value={searchString}
          onChange={(e) => handleSearchUpdate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
        />
      </div>
      {/* Tasks List */}
      <div className="overflow-auto w-full flex-1">
        {
          TASKS_PAGE_DATA.taskCards.map((taskCard, index) => {
            return <TaskCard
              creator={taskCard.creator}
              description={taskCard.description}
              iconSrc={taskCard.iconSrc}
              rating={taskCard.rating}
              script={taskCard.script}
              stats={taskCard.stats}
              title={taskCard.title}
              id={taskCard.id}
              key={taskCard.id}
            />
          })
        }
      </div>
    </div>
  )
}