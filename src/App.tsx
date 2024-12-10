import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Main } from './pages/Main';
import { UserProvider } from './common/hooks/UserContext';

function App() {
  // const isAuthenticated = localStorage.getItem('authToken');
  // TODO: @vaibhav Please update with correct login logic.
  //
  const [encryptedPrivateKey, setEncryptedPrivateKey] = useState("");
  const [address, setAddress] = useState("");

  return (
    <UserProvider>

      <Routes>
        <Route
          path="/app/*"
          element={
            address ? <Main /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={address ? <Navigate to="/app" /> : <Login />}
        />
        <Route path="*" element={<Navigate to={address ? "/app/tasks" : "/login"} />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
