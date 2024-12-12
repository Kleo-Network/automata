import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Main } from './pages/Main';
import { UserProvider, UserContext } from './common/hooks/UserContext';

function App() {
  const { user } = useContext(UserContext);

  user = "ad"
  return (
    <UserProvider>

      <Routes>
        <Route
          path="/app/*"
          element={
            user ? <Main /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/app" /> : <Login />}
        />
        <Route path="*" element={<Navigate to={user ? "/app/tasks" : "/login"} />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
