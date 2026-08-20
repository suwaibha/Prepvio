import React, { useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";

// Layout
import Layout from "./dashboard/adminlayout.jsx";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard.jsx";

// Employees
import AllEmployees from "./pages/Employees/AllEmployees.jsx";
import AddEmployee from "./pages/Employees/AddEmployee.jsx";
import Departments from "./pages/Employees/Departments.jsx";
import Attendance from "./pages/Employees/Attendance.jsx";

// Learning Platform
import StudentsList from "./pages/LearningPlatform/Students/StudentsList.jsx";
import CoursesList from "./pages/LearningPlatform/Courses/CoursesList.jsx";
import Channels from "./pages/LearningPlatform/ContentLibrary/Channels.jsx";
import Categories from "./pages/LearningPlatform/ContentLibrary/Categories.jsx";
import Playlists from "./pages/LearningPlatform/ContentLibrary/Playlist.jsx";
import VideoQuiz from "./pages/LearningPlatform/Assessments/VideoQuiz.jsx";
import Projects from "./pages/LearningPlatform/Assessments/Projects.jsx";
import Submissions from "./pages/LearningPlatform/Assessments/Submissions.jsx";

// Services Marketplace
import ServiceHub from "./pages/ServicesMarketplace/ServiceHub/ServiceHub.jsx";
import AIInterview from "./pages/ServicesMarketplace/AITools/AIInterview.jsx";
import ResumeAnalyzer from "./pages/ServicesMarketplace/AITools/ResumeAnalyzer.jsx";
import JobPortal from "./pages/ServicesMarketplace/JobPortal/JobPortal.jsx";

// Revenue & Billing
import RevenueOverview from "./pages/RevenueBilling/Overview.jsx";
import Subscriptions from "./pages/RevenueBilling/Subscriptions.jsx";
import Invoices from "./pages/RevenueBilling/Invoices.jsx";
import Analytics from "./pages/RevenueBilling/Analytics.jsx";

// Support
import SupportDashboard from "./pages/Support/SupportDashboard.jsx";
import Tickets from "./pages/Support/Tickets.jsx";
import Customers from "./pages/Support/Customers.jsx";
import CreateTicket from "./pages/Support/CreateTicket.jsx";
import TicketDetails from "./pages/Support/TicketDetails.jsx";

// Calendar
import Calendar from "./pages/Calendar/Calendar.jsx";

// Settings
import Profile from "./pages/Settings/Profile.jsx";
import Security from "./pages/Settings/Security.jsx";
import Notifications from "./pages/Settings/Notifications.jsx";
import Appearance from "./pages/Settings/Appearance.jsx";
import Privacy from "./pages/Settings/Privacy.jsx";
import SystemPreferences from "./pages/Settings/SystemPreferences.jsx";
import Integrations from "./pages/Settings/Integrations.jsx";
import BillingSettings from "./pages/Settings/BillingSettings.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("adminToken", token);
      // Remove token from URL
      searchParams.delete("token");
      setSearchParams(searchParams);
      // Optionally reload to ensure axios interceptor picks it up immediately if needed
      // window.location.reload(); 
    }
  }, [searchParams, setSearchParams]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Employees */}
        <Route path="employees/all" element={<AllEmployees />} />
        <Route path="employees/add" element={<AddEmployee />} />
        <Route path="employees/departments" element={<Departments />} />
        <Route path="employees/attendance" element={<Attendance />} />

        {/* Learning Platform */}
        <Route path="learning/students" element={<StudentsList />} />
        <Route path="learning/courses" element={<CoursesList />} />
        <Route path="learning/content/channels" element={<Channels />} />
        <Route path="learning/content/categories" element={<Categories />} />
        <Route path="learning/content/playlists" element={<Playlists />} />
        <Route path="learning/assessments/quizzes" element={<VideoQuiz />} />
        <Route path="learning/assessments/projects" element={<Projects />} />
        <Route path="learning/assessments/submissions" element={<Submissions />} />

        {/* Services Marketplace */}
        <Route path="services/catalog" element={<ServiceHub />} />
        <Route path="services/ai-tools/interview" element={<AIInterview />} />
        <Route path="services/ai-tools/resume" element={<ResumeAnalyzer />} />
        <Route path="services/jobs" element={<JobPortal />} />

        {/* Revenue & Billing */}
        <Route path="revenue/overview" element={<RevenueOverview />} />
        <Route path="revenue/subscriptions" element={<Subscriptions />} />
        <Route path="revenue/invoices" element={<Invoices />} />
        <Route path="revenue/analytics" element={<Analytics />} />

        {/* Support */}
        <Route path="support/dashboard" element={<SupportDashboard />} />
        <Route path="support/tickets" element={<Tickets />} />
        <Route path="support/customers" element={<Customers />} />
        <Route path="support/tickets/create" element={<CreateTicket />} />
        <Route path="support/tickets/details" element={<TicketDetails />} />

        {/* Calendar */}
        <Route path="calendar" element={<Calendar />} />

        {/* Settings */}
        <Route path="settings/profile" element={<Profile />} />
        <Route path="settings/security" element={<Security />} />
        <Route path="settings/notifications" element={<Notifications />} />
        <Route path="settings/appearance" element={<Appearance />} />
        <Route path="settings/privacy" element={<Privacy />} />
        <Route path="settings/system" element={<SystemPreferences />} />
        <Route path="settings/integrations" element={<Integrations />} />
        <Route path="settings/billing" element={<BillingSettings />} />
      </Route>
      <Route path="/admin-login" element={<AdminLogin />} />
    </Routes>
  );
}






// import React from 'react';
// import AdminPanel from './Components/AdminPanel.jsx';

// import './index.css';

// function App() {
//   return (
//     <div className="App bg-gray-100 min-h-screen">
//       <AdminPanel />
//     </div>
//   );
// }

// export default App;