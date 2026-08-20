// import React, { useState } from "react";
// // 1. IMPORT 'useNavigate' from React Router
// import { useNavigate } from "react-router-dom";
// import { Home, Users, FileText, Target, Briefcase, Settings, ChevronDown } from "lucide-react";

// // This map connects your item 'name' to the 'path' in App.js
// const navLinks = {
//   "Dashboard": "/dashboard",
//   "User Management": "/user-management",
//   "Statistics": "/statistics",
//   "Channels": "/channels",
//   "Categories": "/categories",
//   "Playlist": "/playlists",
//   "Video Quiz": "/quizzes",
//   "HDashboard": "/hdashboard",
//   "Customer": "/customer",
//   "Calender": "/calender",
//   "AnalyticsDashboard": "/AnalyticsDashboard",
//   "Pricing": "/pricing",
//   "Membership List": "/listpage",


//   // Ticket sub-items
//   "Create": "/help-desk/ticket/create",
//   "Details": "/help-desk/ticket/details",
//   "List": "/help-desk/ticket/list",

//   // You can add these once you create the routes in App.js
//   // "Content Management": "/content",
//   // "Job Portal": "/job-portal",
//   // "AI Interview Practice": "/ai-interview",
//   // "Resume Analyzer": "/resume-analyzer",
//   "Calendar": "/calendar",
//   // "Settings": "/settings",
// };

// const NavItem = ({ icon: Icon, text, active, onClick, isSubItem = false, isNestedSubItem = false }) => (
//   <li
//     onClick={onClick}
//     className={`flex items-center space-x-3 rounded-xl cursor-pointer transition-all duration-200 ${
//       active
//         ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 font-semibold border border-blue-300/50"
//         : "text-slate-700 hover:bg-white/60 hover:shadow-md"
//     } ${isNestedSubItem ? "py-2 px-3 ml-4" : isSubItem ? "py-2 px-3 ml-2" : "p-3"}`}
//   >
//     {Icon && <Icon size={20} className="flex-shrink-0" />}
//     <span className="text-sm">{text}</span>
//   </li>
// );

// export default function Sidebar() {
//   const [activeItem, setActiveItem] = useState("Dashboard");
//   const [openMenus, setOpenMenus] = useState([]);

//   // 2. INITIALIZE the navigate function
//   const navigate = useNavigate();

//   // 3. UPDATE 'handleItemClick' to navigate
//   const handleItemClick = (name) => {
//     setActiveItem(name);

//     // Find the path from our 'navLinks' map
//     const path = navLinks[name];

//     // If we have a path, navigate to it!
//     if (path) {
//       navigate(path);
//     } else {
//       console.warn(`No path defined for: ${name}`);
//     }
//   };

//   const toggleMenu = (name) => {
//     setOpenMenus((prev) =>
//       prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
//     );
//   };

//   const navItems = [
//     { name: "Dashboard", icon: Home },
//     { name: "User Management", icon: Users },


//     {
//       name: "Learn & Perform",
//       icon: Target,
//       children: [
//         { name: "Channels" },
//         { name: "Categories" },
//         { name: "Playlist" },
//         { name: "Video Quiz" },
//       ],
//     },
//     { name: "Job Portal", icon: Briefcase },
//     { name: "AI Interview Practice", icon: Target },
//     { name: "Resume Analyzer", icon: FileText },

//      {
//       name: "Statistics",
//       icon: FileText,

//     },
//     {
//       name: "Membership",
//       icon: Target,
//       children: [
//         { name: "AnalyticsDashboard" },
//         { name: "Pricing" },
//         { name: "Membership List" },

//       ],
//     },

//     { name: "Calender", icon: FileText },
//     { 
//       name: "Help Desk", 
//       icon: Users,
//       children: [
//         { name: "HDashboard" },
//         { 
//           name: "Ticket",
//           children: [
//             { name: "Create" },
//             { name: "Details" },
//             { name: "List" },
//           ]
//         },
//         { name: "Customer" },
//       ],
//     },
//     {
//       name: "Settings",
//       icon: Settings,
//       children: [
//         { name: "Profile Settings" },
//         { name: "Account Security" },
//         { name: "Notifications" },
//         { name: "Appearance" },
//         { name: "Privacy" },
//       ],
//     },
//   ];

//             <ChevronDown
//               size={16}
//               className={`transition-transform duration-300 ${
//                 openMenus.includes(item.name) ? "rotate-180" : "rotate-0"
//               }`}
//             />
//           </div>

//           {openMenus.includes(item.name) && (
//             <ul className="pl-4 pt-2 space-y-1">
//               {item.children.map((sub) => renderNavItem(sub, true))}
//             </ul>
//           )}
//         </li>
//       );
//     }

//     return (
//       <NavItem
//         key={item.name}
//         icon={item.icon}
//         text={item.name}
//         active={activeItem === item.name}
//         onClick={() => handleItemClick(item.name)}
//         isSubItem={isSubItem}
//         isNestedSubItem={isSubItem}
//       />
//     );
//   };

//   return (
//     <aside className="w-72 h-screen bg-gradient-to-br from-orange-100/80 via-rose-100/80 to-slate-200/80 backdrop-blur-xl shadow-2xl sticky top-0 overflow-y-auto border-r border-white/50 flex-shrink-0">
//       <div className="p-6">
//         {/* Logo Section */}
//         <div className="flex justify-center items-center mb-10 bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/50">
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
//             MERN-Admin
//           </h1>
//         </div>

//         {/* Navigation */}
//         <nav>
//           <ul className="space-y-2">
//             {navItems.map((item) => renderNavItem(item))}
//           </ul>
//         </nav>

//         {/* Footer Section */}
//         <div className="mt-8 p-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
//               A
//             </div>
//             <div>
//               <p className="text-sm font-semibold text-slate-800">Admin User</p>
//               <p className="text-xs text-slate-600">admin@example.com</p>
//             </div>
//           </div>
//         </div>
//       </div>
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Briefcase,
  Settings,
  ChevronDown,
  LayoutGrid,
  Database,
  BarChart3,
  HelpCircle,
  Calendar,
  IndianRupee,
  Trophy,
} from "lucide-react";

// This map connects your item 'name' to the 'path' in App.js
const navLinks = {
  // Dashboard
  "Dashboard": "/dashboard",

  // Employees
  "All Employees": "/employees/all",
  "Add Employee": "/employees/add",
  "Departments": "/employees/departments",
  "Attendance": "/employees/attendance",

  // Learning Platform
  "Students": "/learning/students",
  "Courses": "/learning/courses",
  "Channels": "/learning/content/channels",
  "Categories": "/learning/content/categories",
  "Playlists": "/learning/content/playlists",
  "Video Quiz": "/learning/assessments/quizzes",
  "Projects": "/learning/assessments/projects",
  "Submissions": "/learning/assessments/submissions",

  // Services Marketplace
  "Service Hub": "/services/catalog",
  "AI Interview": "/services/ai-tools/interview",
  "Resume Analyzer": "/services/ai-tools/resume",
  "Job Portal": "/services/jobs",

  // Revenue & Billing
  "Overview": "/revenue/overview",
  "Subscriptions": "/revenue/subscriptions",
  "Invoices": "/revenue/invoices",
  "Analytics": "/revenue/analytics",

  // Support
  "Support Dash": "/support/dashboard",
  "Tickets": "/support/tickets",
  "Customers": "/support/customers",
  "Create Ticket": "/support/tickets/create",
  "Ticket Details": "/support/tickets/details",

  // Calendar
  "Calendar": "/calendar",

  // Settings
  "Profile": "/settings/profile",
  "Security": "/settings/security",
  "Notifications": "/settings/notifications",
  "Appearance": "/settings/appearance",
  "Privacy": "/settings/privacy",
  "System Prefs": "/settings/system",
  "Integrations": "/settings/integrations",
  "Billing Settings": "/settings/billing",
};

const NavItem = ({ icon: Icon, text, active, onClick, isSubItem = false, isNestedSubItem = false }) => (
  <li
    onClick={onClick}
    className={`flex items-center space-x-3 rounded-[1.25rem] cursor-pointer transition-all duration-300 ${active
      ? "bg-indigo-600 text-white font-black shadow-xl shadow-indigo-200"
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold"
      } ${isNestedSubItem ? "py-3 px-4 ml-4 text-xs" : isSubItem ? "py-3 px-4 ml-2 text-sm" : "py-4 px-6 w-full"}`}
  >
    {Icon && <Icon size={isSubItem ? 18 : 22} className={`flex-shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-indigo-600 transition-colors"}`} />}
    <span className={isSubItem ? "" : "tracking-tight"}>{text}</span>
  </li>
);

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [openMenus, setOpenMenus] = useState([]);

  const navigate = useNavigate();

  const handleItemClick = (name) => {
    setActiveItem(name);
    const path = navLinks[name];
    if (path) {
      navigate(path);
    } else {
      console.warn(`No path defined for: ${name}`);
    }
  };

  const toggleMenu = (name) => {
    setOpenMenus((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const navItems = [
    { name: "Dashboard", icon: Home },

    {
      name: "Employees",
      icon: Users,
      children: [
        { name: "All Employees" },
        { name: "Add Employee" },
        { name: "Departments" },
        { name: "Attendance" },
      ],
    },

    {
      name: "Learning Platform",
      icon: Trophy,
      children: [
        { name: "Students" },
        { name: "Courses" },
        {
          name: "Content Library",
          children: [
            { name: "Channels" },
            { name: "Categories" },
            { name: "Playlists" },
          ]
        },
        {
          name: "Assessments",
          children: [
            { name: "Video Quiz" },
            { name: "Projects" },
            { name: "Submissions" },
          ]
        }
      ],
    },

    {
      name: "Services Marketplace",
      icon: Briefcase,
      children: [
        { name: "Service Hub" },
        {
          name: "AI Tools",
          children: [
            { name: "AI Interview" },
            { name: "Resume Analyzer" },
          ]
        },
        { name: "Job Portal" },
      ],
    },

    {
      name: "Revenue & Billing",
      icon: IndianRupee,
      children: [
        { name: "Overview" },
        { name: "Subscriptions" },
        { name: "Invoices" },
        { name: "Analytics" },
      ],
    },

    {
      name: "Support",
      icon: HelpCircle,
      children: [
        { name: "Support Dash" },
        { name: "Tickets" },
        { name: "Customers" },
      ],
    },

    { name: "Calendar", icon: Calendar },

    {
      name: "Settings",
      icon: Settings,
      children: [
        { name: "Profile" },
        { name: "Security" },
        { name: "Notifications" },
        { name: "Appearance" },
        { name: "Privacy" },
        { name: "System Prefs" },
        { name: "Integrations" },
        { name: "Billing Settings" },
      ],
    },
  ];

  const renderNavItem = (item, isSubItem = false) => {
    if (item.children) {
      const isActive = openMenus.includes(item.name) ||
        item.children.some((c) => c.name === activeItem || (c.children && c.children.some(nested => nested.name === activeItem)));

      return (
        <li key={item.name}>
          <div
            onClick={() => toggleMenu(item.name)}
            className={`flex items-center justify-between space-x-3 rounded-[1.25rem] cursor-pointer transition-all duration-300 group ${isActive
              ? "bg-white text-indigo-700 font-black shadow-lg shadow-slate-100 border border-slate-100"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold"
              } ${isSubItem ? "py-3 px-4 ml-2 text-sm" : "py-4 px-6 w-full"}`}
          >
            <div className="flex items-center space-x-3">
              {item.icon && <item.icon size={isSubItem ? 18 : 22} className={
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-indigo-600 transition-colors"
              } />}
              <span className={isSubItem ? "" : "tracking-tight"}>{item.name}</span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 text-slate-400 ${openMenus.includes(item.name) ? "rotate-180 text-indigo-600" : ""
                }`}
            />
          </div>

          {openMenus.includes(item.name) && (
            <ul className="pl-2 pt-2 space-y-1 relative">
              <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100 rounded-full"></div>
              {item.children.map((sub) => renderNavItem(sub, true))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <NavItem
        key={item.name}
        icon={item.icon}
        text={item.name}
        active={activeItem === item.name}
        onClick={() => handleItemClick(item.name)}
        isSubItem={isSubItem}
        isNestedSubItem={isSubItem}
      />
    );
  };

  return (
    <aside className="w-80 h-screen bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] sticky top-0 overflow-y-auto border-r border-slate-100 flex-shrink-0 z-40 hidden md:block font-sans">
      <div className="p-6">
        {/* Logo Section */}
        <div className="mb-10 px-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-200 transform rotate-3 hover:rotate-6 transition-transform">
            A
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Admin<span className="text-indigo-600">Panel</span></h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Premium v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="space-y-1.5 pb-20">
            {navItems.map((item) => renderNavItem(item))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}