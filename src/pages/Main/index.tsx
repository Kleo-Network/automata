import { Route, Routes } from "react-router-dom"
import { Header } from "../../common/components/Header"

export const Main = () => {
  return (
    <>
      <Header />
      <h1 className="text-5xl">Main App</h1>
      <Routes>
        <Route path="tasks" element={<><h1 className="text-6xl">Tasks</h1></>} />
        <Route path="wallet" element={<><h1 className="text-6xl">Wallet</h1></>} />
        <Route path="settings" element={<><h1 className="text-6xl">Settings</h1></>} />
      </Routes>
    </>
  )
}
