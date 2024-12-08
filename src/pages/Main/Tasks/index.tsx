import { useState } from "react";

const IMAGES = {
  searchIconPath: '../../../assets/images/Tasks/searchIcon.svg'
}

const TASKS_PAGE_DATA = {
  title: "Your Personal AI Assistant",
  desc: "Select your task and sit back as your personal AI assistant takes over.",
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
    <div className="h-[calc(100vh-70px)] w-full bg-grayblue-100 p-6 flex flex-col items-center gap-4">
      {/* Title + Description */}
      <div className="w-full flex flex-col gap-1 font-sans">
        <h1 className="font-bold text-2xl">{TASKS_PAGE_DATA.title}</h1>
        <p className="text-xs text-gray-700">{TASKS_PAGE_DATA.desc}</p>
      </div>
      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-lg bg-grayblue-200 px-4 py-3 w-full">
        <img src={IMAGES.searchIconPath} className="size-5" />
        <input
          type="text"
          placeholder="Search cards"
          value={searchString}
          onChange={(e) => handleSearchUpdate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-base outline-none placeholder:text-gray-500"
        />
      </div>
    </div>
  )
}