import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="flex h-screen bg-cover bg-center relative "
      style={{
        backgroundImage: `url('/Hero.png')`,
      }}
    >
      {/* Glassy overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>

      <div className="relative flex w-full">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main content with glass effect */}
        <div className="flex-1 overflow-y-auto  text-gray-900 z-10">
          <Outlet context={{ mobileOpen, setMobileOpen }} />
        </div>
      </div>
    </div>
  );
};

export default Layout;
