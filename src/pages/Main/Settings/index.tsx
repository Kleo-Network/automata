import { useState } from "react"

const privateKeyToStarString = (key: string) => {
  if (key.length <= 2) return key; // If the key is too short, return as is
  return key.slice(0, 2) + '*'.repeat(key.length - 2);
};

const IMAGES = {
  copy: '../../../assets/images/settings/copy.svg',
  tick: '../../../assets/images/settings/tick.svg'
}

const LLM_OPTIONS = [
  { value: 'gpt4', label: 'GPT 4 Mini' },
  { value: 'claude', label: 'Claude Haiku' },
  { value: 'llama', label: 'LLAMA 3 70b' }
];

const SETTINGS_PAGE_DATA = {
  generalSettingsTitle: 'General Settings',
  generalSettings: [
    {
      id: '1',
      title: 'Next Withdrawal',
      description: 'The next VANA Liquidity event is scheduled in 21 days.',
      type: 'default'
    },
    {
      id: '2',
      title: 'Private Key',
      description: '123456',
      type: 'key'
    },
    {
      id: '3',
      title: 'Select LLM',
      description: 'Select what LLM to use',
      type: 'select',
      options: LLM_OPTIONS
    },
    {
      id: '4',
      title: 'RPC URL',
      description: 'https://rpc.vanamainnet.com',
      type: 'copy'
    },
    {
      id: '5',
      title: 'Chain',
      description: 'VANA MAINNET (Chain ID: 1234)',
      type: 'default'
    }
  ],
  supportTitle: 'Contact and Support',
  supportSettings: [
    {
      id: '1',
      title: 'Follow Kleo on X',
      description: '@KleoAI',
      type: 'link',
      url: 'https://x.com/KleoAI'
    },
    {
      id: '2',
      title: 'Withdrawal Guide',
      description: 'Learn how to withdraw your VANA tokens',
      type: 'link',
      url: 'https://docs.kleo.ai/withdrawal-guide'
    }
  ]
};

export const Settings = () => {
  return (
    <div className="h-[calc(100vh-52px)] w-full bg-grayblue-100 p-6 flex flex-col items-center gap-4 overflow-auto">
      {/* General Settings Title */}
      <div className="w-full text-xl font-bold">{SETTINGS_PAGE_DATA.generalSettingsTitle}</div>
      {/* General Settings */}
      <div className="w-full max-w-2xl">
        <div className="rounded-lg bg-white p-[14px] flex flex-col gap-3">
          {SETTINGS_PAGE_DATA.generalSettings.map((setting, index) => (
            <>
              <SettingItem key={setting.id} setting={setting as Setting} />
              {index < SETTINGS_PAGE_DATA.generalSettings.length - 1 && (
                <div className="h-px bg-gray-200" />
              )}
            </>
          ))}
        </div>
      </div>

      {/* Advanced Settings Title + Description */}
      <div className="w-full flex flex-col gap-1 font-sans">
        <h1 className="font-bold text-xl">{SETTINGS_PAGE_DATA.supportTitle}</h1>
        <p className="text-xs">{SETTINGS_PAGE_DATA.supportTitle}</p>
      </div>
      {/* Advanced Settings */}
      <div className="w-full max-w-2xl">
        <div className="rounded-lg bg-white p-[14px] flex flex-col gap-3">
          {SETTINGS_PAGE_DATA.supportSettings.map((setting, index) => (
            <>
              <SettingItem key={setting.id} setting={setting as Setting} />
              {index < SETTINGS_PAGE_DATA.supportSettings.length - 1 && (
                <div className="h-px bg-gray-200" />
              )}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

export type SettingType = 'default' | 'toggle' | 'disabled' | 'copy' | 'key'

export interface Setting {
  id: string
  title: string
  description: string
  type: SettingType
  enabled?: boolean
}

const SettingItem = ({ setting }: { setting: Setting }) => {
  const [enabled, setEnabled] = useState(setting.enabled);
  const [copied, setCopied] = useState(false); // State to handle copy status

  const handleCopy = () => {
    // Copy the description to the
    navigator.clipboard.writeText(setting.description);
    // Show the tick icon for 2 seconds
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`hover:bg-gray-50`}>
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="space-y-1 w-full">
          <h3 className="font-medium">{setting.title}</h3>
          <div className={`${setting.type === 'disabled' ? 'flex p-2 bg-grayblue-100 w-full rounded-md' : ''}`}>
            <p className="text-xs">{setting.type === 'key'
              ? privateKeyToStarString(setting.description) // Render key with stars
              : setting.description}</p>
          </div>
        </div>
        {setting.type === 'toggle' && (
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${enabled ? 'bg-[#8257E6]' : 'bg-gray-200'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        )}
        {(setting.type === 'copy' || setting.type === 'key') && (
          <button onClick={handleCopy}>
            <img
              src={copied ? IMAGES.tick : IMAGES.copy} // Show tick or copy icon
              alt=""
              className="size-6"
            />
          </button>
        )}
      </div>
    </div>
  )
}
