import { ReactElement, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { UserData } from './common/interface';
import Navbar from './navbar/Navbar';
import useFetch from './common/hooks/useFetch';
import HomeComponent from './pages/home/HomeComponent';
import Processing from './pages/ProfileCards/Processing'

function App(): ReactElement {
  const emptyStringArray: string[] = [];

  const [isUserLoading, setIsUserLoading] = useState(false);

  /*
{
  "about": "",
  "badges": [],
  "content_tags": [],
  "first_time_user": true,
  "identity_tags": [],
  "kleo_points": 52,
  "last_attested": 0,
  "last_cards_marked": 0,
  "milestones": {
    "data_owned": 23000,
    "followed_on_twitter": true,
    "referred_count": 0,
    "tweet_activity_graph": false
  },
  "name": "",
  "pfp": "",
  "pii_removed_count": 3,
  "profile_metadata": {},
  "referee": null,
  "referrals": [],
  "settings": {},
  "slug": "0x9bdcAeb9443316BbA3998a600Cc30888846A1C45",
  "stage": 1,
  "total_data_quantity": 23000,
  "verified": false
}
  */
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
    total_data_quantity: 2, // this would be in MegaBytes, this is 34MB
  });
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-gray-50">
      <div className="flex flex-col font-inter self-stretch h-full rounded-xl">

        <HomeComponent user={user} />


      </div>
    </div>
  );
}

export default App;
