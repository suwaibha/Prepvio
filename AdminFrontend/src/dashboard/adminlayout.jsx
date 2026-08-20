import React from "react";
import Sidebar from "./adminsidebar"; // Ensure case matches
import AdminHeader from "./AdminHeader";
import { Outlet } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Sidebar - Fixed */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header - Fixed Top */}
        <AdminHeader />

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;





// import React from "react";
// import Sidebar from "./Sidebar";
// import { Outlet } from "react-router-dom";

// const Layout = () => {
//   return (
//     <div className="flex h-screen relative">
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main content */}
//       <div className="flex-1 overflow-y-auto z-10 p-6">
//         <Outlet /> {/* Pages render here */}
//       </div>
//     </div>
//   );
// };

// export default Layout;