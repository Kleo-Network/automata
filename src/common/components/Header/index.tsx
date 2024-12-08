import { Navigate, useNavigate } from "react-router-dom"

const IMAGES = {
  kleoLogoPath: "../../assets/images/header/KleoLogo.svg",
  kleoCoinPath: "../../assets/images/header/KleoCoin.svg",
}
const TOP_HEADER_DATA = {
  kleoPoints: 1784
}
export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="flex w-full h-14 p-4 justify-between items-center bg-grayblue-50">
      <img src={IMAGES.kleoLogoPath} />
      {/* KleoPoints Card */}
      {/* <div className="flex gap-2 p-1 bg-white items-center">
        <div className="w-8 h-8 bg-gray-50 rounded-[4px] flex items-center justify-center">
          <img src={IMAGES.kleoCoinPath} />
        </div>
        <div className="text-gray-400 font-medium text-[10px]">
          <span className="text-gray-700 font-medium text-sm">{TOP_HEADER_DATA.kleoPoints}</span> KLEO
        </div>
      </div> */}
      <div className="flex justify-end gap-2 h-full w-max flex-nowrap flex-1">
        <h2 className="font-bold text-lg cursor-pointer" onClick={() => navigate('/app/tasks')}>Tasks</h2>
        <h2 className="font-bold text-lg cursor-pointer" onClick={() => navigate('/app/wallet')}>Wallet</h2>
        <h2 className="font-bold text-lg cursor-pointer" onClick={() => navigate('/app/settings')}>Settings</h2>
      </div>
    </header>
  )
}
