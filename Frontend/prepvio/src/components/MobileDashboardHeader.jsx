import React from 'react';
import { useNavigate } from 'react-router-dom';
import MobileMenuButton from './MobileMenuButton';
import UserAvatar from './UserAvatar';
import { useAuthStore } from '../store/authstore';

const ASSETS = {
    avatarPlaceholder: "https://api.dicebear.com/7.x/initials/svg?seed=",
};

/**
 * Mobile Dashboard Header
 * Only visible on mobile devices (< 768px)
 * Includes hamburger menu, logo, and user avatar
 */
const MobileDashboardHeader = ({ setMobileOpen }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const displayName = user?.name?.split(' ')[0] || 'User';
    const userAvatar = user?.profilePic || `${ASSETS.avatarPlaceholder}${encodeURIComponent(user?.name || 'User')}`;

    const handleAvatarClick = () => {
        navigate('/dashboard/settings');
    };

    return (
        <nav className="md:hidden sticky top-0 z-50 bg-[#FDFBF9]/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <MobileMenuButton onClick={() => setMobileOpen(true)} />
                    <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/10">
                        P
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">
                        Prepvio.AI
                    </span>
                </div>

                <UserAvatar
                    image={userAvatar}
                    name={displayName}
                    onClick={handleAvatarClick}
                />
            </div>
        </nav>
    );
};

export default MobileDashboardHeader;
