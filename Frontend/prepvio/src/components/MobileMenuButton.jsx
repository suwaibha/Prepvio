import React from 'react';
import { Menu } from 'lucide-react';

/**
 * Mobile Hamburger Menu Button
 * Only visible on mobile devices (< 768px)
 * Triggers the sidebar to open
 */
const MobileMenuButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Open menu"
        >
            <Menu className="w-6 h-6 text-gray-700" />
        </button>
    );
};

export default MobileMenuButton;
