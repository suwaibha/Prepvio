import React from "react";
import { X, Users } from "lucide-react";

function TeamModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const team = [
        {
            name: "Swaroop Bhati",
            role: "Founder & Lead Developer",
            image: "/newuilogo1.png", // Replace with actual image
        },
        // Add more team members here
    ];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transform-gpu">
                {/* HEADER */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-900" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Our Team
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 px-6 py-6 overflow-y-auto text-gray-700 space-y-6 overscroll-contain">
                    <p className="text-gray-500 text-sm">
                        Meet the dedicated individuals behind PrepVio working to empower your career journey.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {team.map((member, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                                    <p className="text-sm text-gray-500">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium">
                            We're always looking for talented individuals to join our mission. If you're passionate about AI and education, reach out to us!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeamModal;
