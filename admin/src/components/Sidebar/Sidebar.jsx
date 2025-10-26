import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to={'/insights'} className="sidebar-option">
            <img src={assets.add_icon} alt="" />
            <p>Insights</p>
        </NavLink>
        <NavLink to={'/report'} className="sidebar-option">
            <img src={assets.list_icon} alt="" />
            <p>Reports</p>
        </NavLink>
        <NavLink to={'/upload'} className="sidebar-option">
            <img src={assets.order_icon} alt="" />
            <p>Uploads</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
