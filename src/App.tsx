import { ReactElement, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserData } from './common/interface';
import HomeComponent from './pages/home/HomeComponent';

function App(): ReactElement {
  const emptyStringArray: string[] = [];

  return (
    <div className="rounded-xl bg-gray-50">
      <div className="flex flex-col font-inter self-stretch h-full rounded-xl">
        <HomeComponent />
      </div>
    </div>
  );
}

export default App;
