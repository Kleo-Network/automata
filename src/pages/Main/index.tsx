import { Route, Routes } from "react-router-dom"
import { Header } from "../../common/components/Header"
import { Tasks } from "./Tasks"
import { Wallet } from "./Wallet"

export const Main = ({ encryptedPrivateKey, address }) => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="tasks" element={<Tasks encryptedPrivateKey={encryptedPrivateKey} address={encryptedPrivateKey} />} />
        <Route path="wallet" element={<Wallet encryptedPrivateKey={encryptedPrivateKey} address={encryptedPrivateKey} />} />
        <Route path="settings" element={<><h1 className="text-6xl">Settings</h1></>} />
      </Routes>
    </>
  )
}
