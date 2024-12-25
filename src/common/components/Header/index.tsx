import { useLocation, useNavigate } from "react-router-dom"

const IMAGES = {
  kleoLogoPath: "../../assets/images/header/KleoLogo.svg",
  kleoCoinPath: "../../assets/images/header/KleoCoin.svg",
  tasksIconPath: "../../assets/images/header/tasksIcon.svg",
  activeTasksIconPath: "../../assets/images/header/activeTasksIcon.svg",
  walletIconPath: "../../assets/images/header/walletIcon.svg",
  activeWalletIconPath: "../../assets/images/header/activeWalletIcon.svg",
  settingIconPath: "../../assets/images/header/settingIcon.svg",
  activeSettingIconPath: "../../assets/images/header/activeSettingIcon.svg",
  backIconPath: '../../assets/images/header/backIcon.svg'
}
const HEADER_DATA = {
  kleoPoints: 0,
  tabs: [
    {
      id: 'wallet',
      route: '/app/wallet',
      label: 'Wallet',
      iconPath: IMAGES.walletIconPath,
      activeIconPath: IMAGES.activeWalletIconPath
    },
    {
      id: 'settings',
      route: '/app/settings',
      label: 'Settings',
      iconPath: IMAGES.settingIconPath,
      activeIconPath: IMAGES.activeSettingIconPath
    }
  ]
}
export const Header = () => {
  const location = useLocation()
  const { pathname } = location
  const navigate = useNavigate();
  const activeTab = pathname;
  const homeRoute = '/app/tasks';

  const handleTabClick = (route: string) => {
    console.log('Tab clicked : ', route);
    navigate(route);
  }

  return (
    <header className="flex w-full px-4 py-2 justify-between items-center bg-grayblue-50 h-[52px] gap-4">
      {/* <img src={IMAGES.kleoLogoPath} /> */}
      {activeTab === homeRoute ?
        <>
          <div className="flex gap-2 p-1 bg-white items-center">
            <div className="size-7 bg-gray-50 rounded-[4px] flex items-center justify-center">
              <img src={IMAGES.kleoCoinPath} className="size-4" />
            </div>
            <div className="text-gray-400 font-medium text-[10px]">
              <span className="text-gray-700 font-semibold text-sm">{HEADER_DATA.kleoPoints}</span> ACT
            </div>
          </div>
          {/* Wallet and Settings Tabs */}
          <div className="flex justify-end gap-2 h-full w-max flex-nowrap flex-1 items-center">
            {
              HEADER_DATA.tabs.map(tab => {
                return (
                  <TabCard
                    key={tab.id}
                    isActive={activeTab === tab.route}
                    label={tab.label}
                    iconPath={tab.iconPath}
                    activeIconPath={tab.activeIconPath}
                    onClick={() => handleTabClick(tab.route)}
                  />
                )
              })
            }
          </div>
        </>
        :
        <div onClick={() => navigate(homeRoute)} className="cursor-pointer hover:opacity-80">
          <img src={IMAGES.backIconPath} alt="" className="size-6" />
        </div>
      }
    </header>
  )
}

interface TabCardProps {
  isActive: boolean;
  label: string;
  iconPath: string;
  activeIconPath: string;
  onClick: () => void;
}
const TabCard: React.FC<TabCardProps> = ({ isActive, label, iconPath, activeIconPath, onClick }) => {
  const activeStyles = "bg-grayblue-200 text-primary-600";
  const inactiveStyles = "text-grayblue-600";
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer size-8 bg-grayblue-100
        ${isActive ? activeStyles : inactiveStyles} hover:bg-grayblue-200`}
    >
      <img src={isActive ? activeIconPath : iconPath} alt={label} className="size-6" />
    </div>
  );
};
