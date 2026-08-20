import { ChevronLeft } from "lucide-react";

export default function UserAvatar({ image, name, onClick }) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all"
        >
            <img
                src={image}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-gray-100"
            />
            <span className="text-sm font-bold text-gray-700 hidden sm:block">
                {name}
            </span>
            <ChevronLeft className="-rotate-90 w-4 h-4 text-gray-400" />
        </div>
    );
}
