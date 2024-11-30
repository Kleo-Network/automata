import { useEffect, useState } from 'react';

const FeatureCard = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

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
  };

  return (
    <div className="w-80 p-4 bg-white rounded-lg shadow-lg">
      {/* Header with Rating */}
      <div className="flex justify-end mb-3">
        <div className="flex items-center">
          {/* Star icon using pure CSS */}
          <div className="w-4 h-4 text-yellow-400 relative">
            ★
          </div>
          <span className="ml-1 text-sm text-gray-600">4.8</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-start space-x-4 mb-3">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <img
            src="/api/placeholder/48/48"
            alt="Feature icon"
            className="w-10 h-10 object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 leading-tight">Enhanced Analytics</h3>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-3">Advanced data visualization and reporting tools for better insights. Get detailed metrics and analyze your performance with our comprehensive suite of tools.</p>
        </div>
      </div>

      {/* Stats Section with matching pill designs */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-full border border-blue-100 flex items-center group hover:from-indigo-100 hover:to-blue-100 transition-colors">
          {/* Users icon */}
          <div className="w-4 h-4 mr-1.5 text-blue-600 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
          </div>
          <span className="text-sm font-medium text-blue-800">1.2k users</span>
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100 flex items-center group hover:from-blue-100 hover:to-indigo-100 transition-colors">
          {/* Coins icon */}
          <div className="w-4 h-4 mr-1.5 text-blue-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border-2 border-current flex items-center justify-center">
              $
            </div>
          </div>
          <span className="text-sm font-medium text-blue-800">2.5K tokens</span>
        </div>
      </div>

      {/* Play/Purchase Button */}
      {isConfirming ? (
        <div className="flex space-x-2">
          <button
            onClick={() => setIsConfirming(false)}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            {/* Check icon */}
            <div className="w-4 h-4 border-2 border-current rounded-full flex items-center justify-center">
              ✓
            </div>
            <span>Confirm</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handlePlayClick}
          className={`w-full py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 ${isPlaying
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
        >
          {isPlaying ? (
            <>
              {/* Pause icon */}
              <div className="w-4 h-4 flex items-center space-x-0.5">
                <div className="w-1.5 h-4 bg-current rounded-sm"></div>
                <div className="w-1.5 h-4 bg-current rounded-sm"></div>
              </div>
              <span>Stop</span>
            </>
          ) : (
            <>
              {/* Play icon */}
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