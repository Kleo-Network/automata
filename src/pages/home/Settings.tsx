import React, { useState } from 'react';

const Settings: React.FC = () => {
    const [url, setUrl] = useState<string | undefined>(undefined);
    const [apiKey, setApiKey] = useState<string | undefined>(undefined);

    React.useEffect(() => {
        chrome.storage.local.get(['url', 'apiKey'], (result) => {
            const storedUrl = result.url || '';
            const storedApiKey = result.apiKey || '';
            setUrl(storedUrl);
            setApiKey(storedApiKey);
        });
        // const storedUrl = localStorage.getItem('url') || '';
        // const storedApiKey = localStorage.getItem('apiKey') || '';
        // setUrl(storedUrl);
        // setApiKey(storedApiKey);
    }, []);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Store the url and api key in local storage
        chrome.storage.local.set({ url, apiKey }, () => {
            console.log('Settings saved');
        });
        // localStorage.setItem('url', url ?? '');
        // localStorage.setItem('apiKey', apiKey ?? '');
    };

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white rounded-xl shadow-lg">
            <span className="text-2xl font-semibold text-gray-900 mb-6">Settings</span>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL:</label>
                    <input
                        type="text"
                        id="url"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="https://api.openai.com"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={url === undefined}
                    />
                </div>
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">API Key:</label>
                    <input
                        type="text"
                        id="apiKey"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder='sk-XXXXXXXX'
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={apiKey === undefined}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg flex items-center justify-center space-x-2 transition-all duration-300"
                >
                    Save
                </button>
            </form>
        </div>
    );
};

export default Settings;