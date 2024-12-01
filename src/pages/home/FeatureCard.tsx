import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  rating: number;
  stats: { label: string; value: string; type?: string }[];
  iconSrc: string;
  isSponsored?: boolean;
}

const FeatureCard = ({ title, description, rating, stats, iconSrc, isSponsored }: FeatureCardProps) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [scriptInput, setScriptInput] = React.useState(`new-tab#https://amazon.in
input#id#twotabsearchtextbox#ps5
click#id#nav-search-submit-button
`);

  const handlePlayClick = () => {
    if (!isPlaying) {
      setIsConfirming(true);
      setTimeout(() => setIsConfirming(false), 3000);
    } else {
      setIsPlaying(false);
    }
  };

  const handleConfirm = () => {
    setIsPlaying(true);
    setIsConfirming(false);
    chrome.runtime.sendMessage({ action: 'executeScript', input: scriptInput });
  };

  return (
    <div className={`w-full max-w-lg mx-auto p-4 rounded-xl shadow-lg ${isSponsored ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-white'}`}>
      {/* Sponsored Badge */}
      {isSponsored && (
        <div className="mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="mr-1">★</span> Sponsored
          </span>
        </div>
      )}

      {/* Header with Rating */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center">
          <div className="w-4 h-4 text-yellow-400 relative">★</div>
          <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md">
          <img src={iconSrc} alt="Feature icon" className="w-10 h-10 object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">{title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{description}</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center justify-between mb-4 px-1">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`px-3 py-1.5 rounded-full border flex items-center group transition-colors ${stat.type === 'sponsored'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 hover:from-green-100 hover:to-emerald-100'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 hover:from-blue-100 hover:to-indigo-100'
              }`}
          >
            <div className={`w-4 h-4 mr-1.5 flex items-center justify-center ${stat.type === 'sponsored' ? 'text-green-600' : 'text-blue-600'
              }`}>
              <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
            </div>
            <span className={`text-sm font-medium ${stat.type === 'sponsored' ? 'text-green-800' : 'text-blue-800'
              }`}>
              {stat.label}: {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label htmlFor="scriptInput" className="block text-sm font-medium text-gray-700">
          Script Input
        </label>
        <textarea
          id="scriptInput"
          value={scriptInput}
          onChange={(e) => setScriptInput(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Play/Purchase Button */}
      {isConfirming ? (
        <div className="flex space-x-2">
          <button
            onClick={() => setIsConfirming(false)}
            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <div className="w-4 h-4 border-2 border-current rounded-full flex items-center justify-center">
              ✓
            </div>
            <span>Confirm</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handlePlayClick}
          className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 ${isPlaying
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
        >
          {isPlaying ? (
            <>
              <div className="w-4 h-4 flex items-center space-x-0.5">
                <div className="w-1.5 h-4 bg-current rounded-sm"></div>
                <div className="w-1.5 h-4 bg-current rounded-sm"></div>
              </div>
              <span>Stop</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-current border-b-[8px] border-b-transparent ml-0.5"></div>
              </div>
              <span>Play</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default FeatureCard;