import { ReactElement, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserData } from './common/interface';
import HomeComponent from './pages/home/HomeComponent';

function App(): ReactElement {
  const emptyStringArray: string[] = [];

  const [user, setUser] = useState<UserData>({
    badges: emptyStringArray,
    content_tags: emptyStringArray,
    first_time_user: false,
    identity_tags: emptyStringArray,
    kleo_points: 88,
    data_quality: 87,
    last_minted: Math.floor(Date.now() / 1000),
    address: '',
    verified: false,
    total_data_quantity: 2,
  });

  const clickMe = () => {
    chrome.runtime.sendMessage({ action: 'executeScript' });
  };

  return (
    <div className="rounded-xl bg-gray-50">
      <div className="flex flex-col font-inter self-stretch h-full rounded-xl">
        <button onClick={clickMe}>Click</button>
        <HomeComponent user={user} />
      </div>
    </div>
  );
}

export default App;
