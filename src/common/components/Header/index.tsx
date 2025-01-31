import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { vanaWalletApi } from "../../../../background/utils/api";
import { UserContext } from "./../../../common/hooks/UserContext";

interface TokenBalance {
  token: {
    decimals: string;
  };
  value: string;
}

interface HeaderData {
  kleoPoints: number;
  tabs: Array<{
    id: string;
    route: string;
    label: string;
    iconPath: string;
    activeIconPath: string;
  }>;
}

const IMAGES = {
  kleoLogoPath: "../../assets/images/header/KleoLogo.svg",
  kleoCoinPath: "../../assets/images/header/KleoCoin.svg",
  tasksIconPath: "../../assets/images/header/tasksIcon.svg",
  activeTasksIconPath: "../../assets/images/header/activeTasksIcon.svg",
  walletIconPath: "../../assets/images/header/walletIcon.svg",
  activeWalletIconPath: "../../assets/images/header/activeWalletIcon.svg",
  settingIconPath: "../../assets/images/header/settingIcon.svg",
  activeSettingIconPath: "../../assets/images/header/activeSettingIcon.svg",
  backIconPath: "../../assets/images/header/backIcon.svg",
};

const HEADER_DATA: HeaderData = {
  kleoPoints: 0,
  tabs: [
    {
      id: "wallet",
      route: "/app/wallet",
      label: "Wallet",
      iconPath: IMAGES.walletIconPath,
      activeIconPath: IMAGES.activeWalletIconPath,
    },
    {
      id: "settings",
      route: "/app/settings",
      label: "Settings",
      iconPath: IMAGES.settingIconPath,
      activeIconPath: IMAGES.activeSettingIconPath,
    },
  ],
};

export const Header = () => {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [header, setHeader] = useState<HeaderData>(HEADER_DATA);
  const activeTab = pathname;
  const homeRoute = "/app/tasks";
  const { user, setUser } = useContext(UserContext);

  // Copy address pill tooltip state
  const [isCopied, setIsCopied] = useState(false);

  const handleTabClick = (route: string) => {
    navigate(route);
  };

  const fetchUserData = async () => {
    try {
      const result = await chrome.storage.local.get("user");
      console.log("result", result);
      if (result.user) {
        setUser(result.user);

        // Fetch KDAT balance if we have a user address
        if (result.user.address) {
          const balances = (await vanaWalletApi(
            "GET",
            `/addresses/${result.user.address}/token-balances`
          )) as TokenBalance[];
          console.log("balances", balances);
          const rawBalance = balances[0]?.value ?? "0";
          const decimals = parseInt(balances[0]?.token?.decimals || "18", 10);
          const humanReadableBalance =
            Number(rawBalance) / Math.pow(10, decimals);
          console.log("humanReadableBalance", humanReadableBalance);
          // Update header with the KDAT balance
          setHeader((prev) => ({
            ...prev,
            kleoPoints: humanReadableBalance,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleCopyAddress = async () => {
    if (!user?.address) return;
    try {
      await navigator.clipboard.writeText(user.address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const truncatedAddress = user?.address
    ? `${user.address.slice(0, 4)}...${user.address.slice(-2)}`
    : "";

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="flex w-full px-4 py-2 justify-between items-center bg-grayblue-50 h-[52px]">
      {activeTab === homeRoute ? (
        <>
          {/* KDAT Balance */}
          <div className="flex">
            <span className="w-full text-[13px] font-semibold font-inter">
              Hey, {user?.name || "friend!"}
            </span>
          </div>


          {/* Address Pill */}
          {user?.address && (
            <div className="relative">
              <div
                onClick={handleCopyAddress}
                className="ml-[4px] flex gap-1 px-1 py-[1px] bg-gray-300 border border-gray-300 text-grayblue-800 text-[10px] cursor-pointer hover:border-gray-400"
              >
                {truncatedAddress}
              </div>
              {isCopied && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs mt-1 whitespace-nowrap">
                  Copied!
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex justify-end gap-2 h-full w-max flex-nowrap flex-1 items-center">
            <div className="flex gap-2 p-1 bg-white items-center">
              <div className="size-7 bg-gray-50 rounded-[4px] flex items-center justify-center">
                <img src={IMAGES.kleoCoinPath} className="size-4" />
              </div>
              <div className="text-gray-400 font-medium text-[10px]">
                <span className="text-gray-700 font-semibold text-[12px]">
                  {typeof header.kleoPoints === "number"
                    ? header.kleoPoints.toLocaleString("en-US")
                    : "0"}
                </span>{" "}
                KDAT
              </div>
            </div>
            {header.tabs.map((tab) => (
              <TabCard
                key={tab.id}
                isActive={activeTab === tab.route}
                label={tab.label}
                iconPath={tab.iconPath}
                activeIconPath={tab.activeIconPath}
                onClick={() => handleTabClick(tab.route)}
              />
            ))}
          </div>
        </>
      ) : (
        <div
          onClick={() => navigate(homeRoute)}
          className="cursor-pointer hover:opacity-80"
        >
          <img src={IMAGES.backIconPath} alt="" className="size-6" />
        </div>
      )}
    </header>
  );
};

interface TabCardProps {
  isActive: boolean;
  label: string;
  iconPath: string;
  activeIconPath: string;
  onClick: () => void;
}

const TabCard: React.FC<TabCardProps> = ({
  isActive,
  label,
  iconPath,
  activeIconPath,
  onClick,
}) => {
  const activeStyles = "bg-grayblue-200 text-primary-600";
  const inactiveStyles = "text-grayblue-600";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer size-8 bg-grayblue-100
        ${isActive ? activeStyles : inactiveStyles
        } hover:bg-grayblue-200 transition-colors`}
    >
      <img src={isActive ? activeIconPath : iconPath} alt={label} className="size-6" />
    </div>
  );
};
