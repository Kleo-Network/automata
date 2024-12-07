import React from 'react';
import { REDIRECT_TO_DASHBOARD_URL } from '../../constants';
import { replaceSlugInURL } from '../../utils';

interface NavbarProps {
  slug: string;
}

const Navbar = ({ slug }: NavbarProps) => {
  // Desc: This will redirect user to it's dashboard page in website.
  const goToDashboard = React.useCallback(() => {
    window.open(replaceSlugInURL(REDIRECT_TO_DASHBOARD_URL, slug), '_blank');
  }, [slug]);

  return (
    <nav className="relative flex w-full flex-wrap items-center justify-between bg-gray-navbar h-[52px]">
      <div className="flex flex-row w-full flex-wrap items-center justify-between px-[16px] py-[14px]">
        <div className="flex items-center justify-center text-neutral-900 hover:text-neutral-900">
          <img src="../assets/images/kleoLogo.svg" className="flex items-center size-6" />
          <h3 className="font-bold text-base ml-2">KLEO</h3>
        </div>

        {/* <!-- Navigation container --> */}
        <button className="flex flex-row items-center ml-auto hover:cursor-pointer" onClick={goToDashboard}>
          <div className="relative flex items-center justify-center flex-grow">
            <img src={'../assets/images/cardsIconWithNotification.svg'} alt={'My Dashboard'} className="size-6" />
          </div>
          <div className="text-gray-700 text-xs ml-2 font-medium">My Dashboard</div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
