import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Main } from './pages/Main';

function App() {
  // const isAuthenticated = localStorage.getItem('authToken');
  // TODO: @vaibhav Please update with correct login logic.
  const isAuthenticated = true;

  return (
    <>
      <Routes>
        <Route
          path="/app/*"
          element={
            isAuthenticated ? <Main /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app" /> : <Login />}
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/app/tasks" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
