import { useState, useMemo, useContext } from "react";
import { TaskCard } from "./TaskCard";
import useFetch, { FetchStatus } from "../../../common/hooks/useFetch";
import { UserContext } from '../../../common/hooks/UserContext';

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

type ApiResponse = {
  scripts: {
    _id: string;
    status: 'completed' | 'pending' | 'processing';
    script: Script;
    data?: {
      status: string;
      data_hash: string;
      result?: any;
      reward_tx_hash?: string;
      proof_tx_hash?: string;
    };
  }[];
};

export const Tasks = () => {
  const { user } = useContext(UserContext);

  // Only make the API call if we have a user address
  const { data, status, error } = useFetch<ApiResponse>(
    user?.address ? `script/all/${user.address}` : undefined,
    {}, // options
    [user?.address] // dependencies
  );

  const taskCards = useMemo(() => {
    if (!data?.scripts) return [];

    return data.scripts
      .filter(item => item.script.verified)
      .map(item => ({
        id: item._id,
        title: item.script.name,
        description: item.script.description,
        iconSrc: item.script.logo || 'https://example.com/default-icon.png',
        script: item.script.script,
        rating: item.script.rating,
        creator: item.script.creator_address,
        status: item.status,
        item_url: item.status === 'processing'
          ? 'processing'
          : item.status === 'completed'
            ? item.data?.reward_tx_hash || ''
            : '',
        stats: [{
          label: 'Earn Upto',
          value: `+${item.script.earn_points} KDAT`,
          iconSrc: '../../assets/images/tasks/dollarIcon.svg'
        }]
      }));
  }, [data]);

  // Show loading state if user isn't loaded yet
  if (!user?.address) {
    return (
      <div className="h-[calc(100vh-52px)] w-full bg-grayblue-100 p-6 flex items-center justify-center">
        <div>Loading user information...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-52px)] w-full bg-grayblue-100 p-6 flex flex-col items-center gap-4">
      <div className="w-full flex flex-col gap-1 font-sans">
        <h1 className="font-bold text-2xl">Own Data, Earn Crypto Tokens</h1>
        <p className="text-xs text-gray-700">
          Select your task and sit back as your personal AI assistant takes over.
        </p>
      </div>

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
                {...taskCard}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};