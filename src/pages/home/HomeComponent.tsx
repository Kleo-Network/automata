import React from 'react';
import FeatureCard from './FeatureCard';
import FeatureCardProps from './FeatureCard';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Settings from './Settings';


type Stats = {
  label: string;
  value: string;
  type?: string;
}

type FeatureCardProps = {
  title: string;
  description: string;
  rating: number;
  stats: Stats[];
  iconSrc: string;
  isSponsored: boolean;
  script: string;
}

const HomeComponent = () => {
  const [featuresData, setFeaturesData] = React.useState<FeatureCardProps[]>([]);

  async function fetchScript(ipfs_hash: string) {
    try {
      const url = `https://orange-quiet-toad-977.mypinata.cloud/ipfs/${ipfs_hash}`;
      const response = await fetch(url);
      const proj = await response.json();
      const card: FeatureCardProps = {
        title: proj.projectName,
        description: proj.shortDescription,
        script: proj.projectScript,
        iconSrc: proj.image,
        stats: [
          { label: 'Used By', value: '10.2k' },
          { label: 'Earn', value: '+5.5k', type: 'sponsored' },
        ],
        isSponsored: false,
        rating: 3.4

      };
      setFeaturesData([...featuresData, card]);
    } catch (error) {
      throw new Error(String(error));
    }
  }


  const scriptProjects = ["bafkreie4gnrwnb46h2sryinuw4siu2gzzcsarujvq2uxtigou45uduw3jq"];

  React.useEffect(() => {
    scriptProjects.map(proj => {
      console.log("proj", proj);
      fetchScript(proj);
    });

  }, []);

  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  React.useEffect(() => {
    navigate('/');
  }, []);

  const handleHomeClick = () => {
    navigate('/');
  };




  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col justify-between">
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex-grow">
        <div className="max-w-7xl mx-auto space-y-6">

          <Routes>
            <Route path="/" element={featuresData.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
              />
            ))} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>

      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <button className="flex flex-col items-center text-blue-600 relative group py-2" onClick={handleHomeClick}>
              <div className="absolute -top-1 left-1/2 w-1 h-1 bg-blue-600 rounded-full transform -translate-x-1/2"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-sm font-medium mt-1">Home</span>
            </button>

            <button className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors py-2 group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm font-medium mt-1">Wallet</span>
            </button>

            <button className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors py-2 group" onClick={handleSettingsClick}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm font-medium mt-1">Settings</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="h-20" />
    </div>
  );
};

export default HomeComponent;