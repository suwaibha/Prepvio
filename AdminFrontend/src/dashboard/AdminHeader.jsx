import React, { useState, useEffect } from "react";
import {
    Bell,
    Search,
    ChevronDown,
    User,
    LogOut,
    Settings,
    Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminHeader = () => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Mock Notifications (Keep mocked for now as requested, or fetch later)
    const [notifications, setNotifications] = useState([
        { id: 1, title: "New Employee Joined", message: "Sarah Wilson joined Design Team", time: "2 min ago", read: false },
        { id: 2, title: "System Update", message: "Dashboard v2.0 deployed successfully", time: "1 hour ago", read: false },
        { id: 3, title: "Ticket Alert", message: "Critical ticket #402 needs attention", time: "3 hours ago", read: false },
        { id: 4, title: "Revenue Milestone", message: "Monthly goal of ₹50k reached!", time: "5 hours ago", read: true },
        { id: 5, title: "New Review", message: "Client posted a 5-star review", time: "1 day ago", read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        // ✅ Read admin data from localStorage (set during login)
        const adminUserData = localStorage.getItem('adminUser');
        const adminToken = localStorage.getItem('adminToken');

        if (adminUserData && adminToken) {
            try {
                const parsedUser = JSON.parse(adminUserData);
                setUser(parsedUser);
                console.log("✅ Admin user loaded from localStorage:", parsedUser);
            } catch (error) {
                console.error("Failed to parse admin user data:", error);
                // Redirect to login if data is corrupted
                window.location.href = "http://localhost:5174/admin-login";
            }
        } else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            const localPreviewUser = {
                name: "Local Admin",
                email: "local-admin@prepvio.test",
                role: "admin",
                userId: "LOCAL"
            };
            localStorage.setItem("adminToken", "local-preview-token");
            localStorage.setItem("adminUser", JSON.stringify(localPreviewUser));
            setUser(localPreviewUser);
        } else {
            // No admin data found, redirect to login
            console.warn("⚠️ No admin data found, redirecting to login");
            window.location.href = "http://localhost:5174/admin-login";
        }
    }, []);

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleLogout = async () => {
        try {
            // Clear localStorage
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            localStorage.removeItem("adminRole");

            // Redirect to login
            window.location.href = "http://localhost:5174/admin-login";
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "http://localhost:5174/admin-login";
        }
    };

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all duration-300">

            {/* Left: Search Bar (Visual Only for Phase 1) */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative hidden md:block w-full max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search employees, tickets, or services..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md shadow-sm">Ctrl K</kbd>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                        >
                                            <Check className="w-3 h-3" /> Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[320px] overflow-y-auto">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!n.read ? 'bg-indigo-50/10' : ''}`}
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                            <div>
                                                <p className={`text-sm ${!n.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">{n.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <div className="p-8 text-center text-slate-500 text-sm font-medium">No new notifications</div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-slate-50 bg-slate-50/50 text-center">
                                    <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">View All History</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-1 pr-3 py-1 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all group"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-white overflow-hidden">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span>{user?.name?.charAt(0) || "A"}</span>
                            )}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{user?.name || "Admin User"}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.userId || user?.role || "Admin"}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user?.name?.charAt(0) || "A"}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{user?.name || "Admin User"}</p>
                                            <p className="text-xs text-slate-500 text-ellipsis overflow-hidden w-32 whitespace-nowrap">{user?.email || "admin@example.com"}</p>
                                            {user?.userId && <p className="text-[10px] font-bold text-indigo-500 mt-0.5">ID: {user.userId}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button onClick={() => navigate('/settings/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all">
                                        <User className="w-4 h-4" /> My Profile
                                    </button>
                                    <button onClick={() => navigate('/settings/system')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all">
                                        <Settings className="w-4 h-4" /> Settings
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
