import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';

function App() {
  // const isAuthenticated = localStorage.getItem('authToken');
  // TODO: @vaibhav Please update with correct login logic.
  const isAuthenticated = false;

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app" /> : <Login />}
        />
        {/* <Route
          path="/app/*"
          element={
            isAuthenticated ? (
              <div>
                <BottomNavbar />
                <Routes>
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="wallet" element={<Wallet />} />
                  <Route path="settings" element={<Settings />} />
                </Routes>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        /> */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/app/tasks" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
