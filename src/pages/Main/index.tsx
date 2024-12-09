import { Route, Routes } from "react-router-dom"
import { Header } from "../../common/components/Header"
import { Tasks } from "./Tasks"
import { Wallet } from "./Wallet"

export const Main = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="tasks" element={<Tasks />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="settings" element={<><h1 className="text-6xl">Settings</h1></>} />
      </Routes>
    </>
  )
}
