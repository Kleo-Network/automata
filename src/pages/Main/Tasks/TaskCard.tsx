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
  status: 'pending' | 'completed' | 'processing';
  item_url: string;
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
  status,
  item_url
}: TaskCardProps) => {
  const navigate = useNavigate();
  const handleViewTask = () => navigate(`/app/task/${id}`);

  const renderActionButton = () => {
    switch (status) {
      case 'pending':
        return (
          <button
            className="bg-primary-600 text-white px-4 py-2 rounded-md w-full hover:bg-primary-800 flex gap-3 justify-center items-center"
            onClick={handleViewTask}
          >
            Play Script
          </button>
        );
      case 'processing':
        return (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md w-full text-center">
            ⚙ Processing your data
          </div>
        );
      case 'completed':
        return (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md w-full text-center">
            <a href={`https://vanascan.io/tx/${item_url}`} target="_blank" rel="noopener noreferrer">
              Data Owned 🔥 & KDAT Tokens Deposited
            </a></div >
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full p-3.5 flex flex-col gap-3 mb-4">
      {/* Favicon + Title + Creator + Rating Row */}
      <div className="flex gap-4">
        <div className="min-h-12 min-w-12 bg-grayblue-100 rounded-md p-3 flex items-center justify-center">
          <img src={iconSrc} className="size-7 rounded-full" />
        </div>
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex py-1 gap-2 justify-between">
            <h2 className="font-semibold text-base">{title}</h2>
            <div className="h-fit flex items-center gap-1 px-2 py-1 rounded-full bg-grayblue-100 min-w-fit">
              <img
                src="../../assets/images/Tasks/yellowStarIcon.svg"
                alt=""
                className="size-3"
              />
              <p className="text-[10px]">{rating} Rating</p>
            </div>
          </div>
          <p className="text-[10px]">Created by {creator}</p>
        </div>
      </div>

      <div className="w-full text-xs">{description}</div>

      <div className="flex gap-2 flex-wrap mb-[1px]">
        {stats.map((stat) => (
          <StatPill
            key={stat.label}
            label={`${stat.label}: `}
            value={stat.value}
            iconSrc={stat.iconSrc}
          />
        ))}
      </div>

      <div className="flex justify-center font-medium w-full">
        {renderActionButton()}
      </div>
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
    <div className="bg-grayblue-100 rounded-full pt-[2px] pl-[4px] pr-[8px] pb-[4px] gap-1 flex">
      <div className='rounded-full p-[4px]'>
        <img src={iconSrc} alt="" className="size-[12px]" />
      </div>
      <div className='grid place-items-center'>
        <p className="text-center text-[10px]">
          <span className="font-bold">{label}</span> {value}
        </p>
      </div>
    </div>
  );
};