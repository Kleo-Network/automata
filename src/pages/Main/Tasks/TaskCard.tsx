import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface TaskCardProps {
  description: string;
  title: string;
  iconSrc: string;
  script: string;
  stats: { label: string; value: string; iconSrc: string }[];
  rating: number;
  creator: string;
  id: string;
  showPlayButton?: boolean;
}

export const TaskCard = ({
  description,
  title,
  iconSrc,
  script,
  stats,
  rating,
  creator,
  id,
  showPlayButton = true
}: TaskCardProps) => {
  const scriptInput = "new-tab#https://amazon.in\nwait\ninput#id#twotabsearchtextbox#ps5\nclick#id#nav-search-submit-button\nwait\ninfer#class#s-search-results#data-component-type#s-search-result\nwait\nclick#id#buy-now-button"
  // Handlers for state transitions
  const navigate = useNavigate();
  const handleViewTask = () => navigate(`/app/task/${id}`);

  return (
    <div className="bg-white rounded-lg shadow-md w-full p-4 mb-4 flex flex-col gap-3">
      {/* Favicon + Title + Creator + Rating Row */}
      <div className="flex gap-4">
        <div className="min-h-12 min-w-12 bg-grayblue-100 rounded-md p-3 flex items-center justify-center">
          <img src={iconSrc} className="size-7 rounded-full" />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex py-1 gap-2 justify-between">
            {/* Title */}
            <h2 className="font-semibold text-base">{title}</h2>
            {/* Rating */}
            <div className="h-fit flex items-center gap-1 px-2 py-1 rounded-full bg-grayblue-100 min-w-fit">
              <img
                src="../../assets/images/tasks/starIcon.svg"
                alt=""
                className="size-3"
              />
              <p className="text-[10px]">{rating} Rating</p>
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
      {showPlayButton &&
        <div className="flex justify-center font-medium w-full">
          <button
            className="bg-primary-600 text-white px-4 py-2 rounded-md w-full hover:bg-primary-800 flex gap-3 justify-center items-center"
            onClick={handleViewTask}
          >
            View Script
          </button>
        </div>
      }
    </div>
  );
};

export interface StatPillProps {
  label: string;
  value: string;
  iconSrc?: string;
}

export const StatPill = ({ label, value, iconSrc }: StatPillProps) => {
  return (
    <div className="bg-grayblue-100 rounded-full p-2 gap-1 flex">
      <img src={iconSrc} alt="" className="size-4 rounded-full" />
      <p className="text-[10px]">
        <span className="font-bold">{label}</span> {value}
      </p>
    </div>
  );
};
