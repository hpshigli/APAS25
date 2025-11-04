import React, { useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import {Routes,Route,Navigate} from 'react-router-dom'
// import Add from './pages/Add/Add'
// import List from './pages/List/List'
// import Orders from './pages/Orders/Orders'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPopup from './components/LoginPopup/LoginPopup'
import Insights from './pages/Insights/Insights';
import Report from './pages/Report/Report';
import Upload from './pages/Upload/Upload';
const App = () => {

  const url = "http://localhost:5173";
  const [showAdmin,setAdminLogin] = useState(false)
  return (
    <div>
      {showAdmin?<LoginPopup setAdminLogin={setAdminLogin}/>:<></>}
      <ToastContainer/>
      <Navbar setAdminLogin={setAdminLogin}/>
      <hr />
      <div className="app-content">
        <Sidebar/>
        <Routes>
          <Route path="/" element={<Navigate to="/insights" replace />} />
          <Route path="/insights" element={<Insights url={url} />}/>
          <Route path="/analytics" element={<Navigate to="/insights" replace />} />
          <Route path="/report" element={<Report url={url} />}/>
          <Route path="/upload" element={<Upload url={url} />}/>
        </Routes>
      </div>
    </div>
  )
}

export default App
