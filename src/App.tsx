import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Main } from './pages/Main';
import { UserProvider, UserContext } from './common/hooks/UserContext';
function AppRoutes() {
  const { user } = useContext(UserContext);
  console.log("first time user render", user);
  return (
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
  );
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;