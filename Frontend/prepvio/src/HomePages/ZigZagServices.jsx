import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../config/api";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Activity } from "lucide-react";
import { useAuthStore } from "../store/authstore"; // ✅ ADD THIS
import AuthModal from "../components/AuthModal"; // ✅ ADD THIS
import MobileRestrictionModal from "../components/MobileRestrictionModal"; // ✅ ADD THIS

const ZigZagServices = () => {
  // ==========================================
  // 1. BACKEND & LOGIC (Strictly Preserved)
  // ==========================================
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ ADD THIS
  const [modalType, setModalType] = useState('login'); // ✅ ADD THIS
  const [showMobileModal, setShowMobileModal] = useState(false); // ✅ ADD MOBILE MODAL STATE
  const serviceRefs = useRef([]);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore(); // ✅ ADD THIS

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${CONTENT_API_URL}/services`);
        setServices(res.data);
        const initialIndexes = {};
        res.data.forEach((service, idx) => {
          initialIndexes[idx] = 0;
        });
        setActiveImageIndex(initialIndexes);
      } catch (err) {
        setError("Failed to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const intervals = services.map((service, index) => {
      if (service.images && service.images.length > 1) {
        return setInterval(() => {
          setActiveImageIndex((prev) => ({
            ...prev,
            [index]: ((prev[index] || 0) + 1) % service.images.length,
          }));
        }, 3000);
      }
      return null;
    });
    return () => intervals.forEach(i => i && clearInterval(i));
  }, [services]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.2 }
    );
    serviceRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => serviceRefs.current.forEach((ref) => ref && observer.unobserve(ref));
  }, [services]);

  // ✅ UPDATED: Check authentication before navigation
  const handleNavigate = (slug) => {
    // Check for mobile device
    if (window.innerWidth < 768) {
      setShowMobileModal(true);
      return;
    }

    if (!isAuthenticated) {
      setModalType('login');
      setShowAuthModal(true);
      return;
    }

    if (!user?.isVerified) {
      setModalType('verify');
      setShowAuthModal(true);
      return;
    }

    navigate(`/services/${slug}`);
  };

  // ==========================================
  // 2. UI RENDER (Compact Layout + Premium Typography)
  // ==========================================

  if (loading) return <div className="flex justify-center items-center h-96"><div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;
  if (error) return <div className="text-center mt-20 text-red-600 font-bold">{error}</div>;
  if (services.length === 0) return <div className="text-center mt-20 text-gray-400">No services found.</div>;

  return (
    <>
      {/* ✅ ADD AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        type={modalType}
      />
      <MobileRestrictionModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />

      <section id="services" className="py-20 relative bg-[#FDFBF9] overflow-hidden font-sans">

        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-50/40 rounded-full blur-[100px] -z-10 pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-20 px-4">
          <div className="inline-block bg-[#D4F478] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-black/5 shadow-sm transform -rotate-1">
            Our Capabilities
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter leading-[0.9] mb-4">
            Master Your <br />
            <span className="text-gray-400">Digital Presence</span>
          </h2>
        </div>

        {/* Services List - COMPACT CONTAINER (max-w-6xl) */}
        <div className="space-y-24 max-w-6xl mx-auto px-4 md:px-6">
          {services.map((service, index) => {
            const currentImageIndex = activeImageIndex[index] || 0;
            const isReverse = index % 2 !== 0;
            const isIntersecting = isVisible[`service-${index}`];

            return (
              <div
                key={service._id}
                id={`service-${index}`}
                ref={(el) => (serviceRefs.current[index] = el)}
                className={`flex flex-col md:flex-row items-center gap-10 md:gap-16 ${isReverse ? "md:flex-row-reverse" : ""
                  } transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu ${isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"
                  }`}
              >

                {/* --- IMAGE SIDE (Compact Height: h-72) --- */}
                <div
                  onClick={() => handleNavigate(service.slug)}
                  className="w-full md:w-1/2 relative group cursor-pointer perspective-1000"
                >
                  {/* Decorative floating blob */}
                  <div className={`absolute -top-6 ${isReverse ? '-left-6' : '-right-6'} w-24 h-24 bg-[#D4F478]/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

                  <div className="relative h-64 md:h-72 lg:h-80 w-full rounded-[2.5rem] overflow-hidden border border-white/50 shadow-2xl shadow-gray-200/50 bg-white transform transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-2">
                    {/* Images */}
                    {service.images && service.images.length > 0 ? (
                      service.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={service.title}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgIdx === currentImageIndex ? "opacity-100" : "opacity-0"
                            }`}
                        />
                      ))
                    ) : service.image ? (
                      <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-[#EAE6F5] text-gray-400">
                        <Activity size={40} />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* "App" Badge */}
                    <div className="absolute top-5 right-5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl shadow-sm border border-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                </div>

                {/* --- TEXT SIDE (Rich Typography) --- */}
                <div className="w-full md:w-1/2 text-center md:text-left">

                  {/* Styled Number Box (From New UI) */}
                  <div className="flex justify-center md:justify-start mb-6">
                    <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
                      {index < 9 ? `0${index + 1}` : index + 1}
                    </div>
                  </div>

                  {/* Heavy, Tight Heading */}
                  <h3 className="text-4xl lg:text-5xl font-black text-[#1A1A1A] mb-5 tracking-tighter leading-[0.95]">
                    {service.title}
                  </h3>

                  {/* Medium Weight Description */}
                  <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
                    {service.description}
                  </p>

                  {/* The "Split Pill" Button (From New UI) */}
                  <div className="flex justify-center md:justify-start">
                    <button
                      onClick={() => handleNavigate(service.slug)}
                      className="flex items-center gap-0 group cursor-pointer"
                    >
                      <span className="bg-[#1A1A1A] text-white px-8 py-4 rounded-l-full font-bold text-base shadow-xl shadow-gray-300/40 relative z-10 transition-transform group-hover:translate-x-1">
                        View Service
                      </span>
                      <span className="w-14 h-[3.5rem] flex items-center justify-center rounded-r-full bg-[#D4F478] border-l-2 border-[#1A1A1A] group-hover:bg-[#cbf060] transition-colors origin-left">
                        <ArrowRight className="w-5 h-5 text-black transform group-hover:-rotate-45 transition-transform duration-300" />
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default ZigZagServices;
