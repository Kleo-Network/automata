import { Route, Routes } from "react-router-dom"
import { Header } from "../../common/components/Header"
import { Tasks } from "./Tasks"
import { Wallet } from "./Wallet"
import { Settings } from "./Settings"
import { TaskDetails } from "./Tasks/TaskDetail"

//all the API calls should take place here 

export const Main = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="tasks" element={<Tasks />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="settings" element={<Settings />} />
        <Route path="task/:taskId" element={<TaskDetails />} />
      </Routes>

    </>
  )
}
