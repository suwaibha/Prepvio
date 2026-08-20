import React, { useEffect, useState } from "react";
import { mainApi } from "../utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import MobileDashboardHeader from "../components/MobileDashboardHeader";
import {
  Settings, User, Mail, Phone, MapPin, Globe, Briefcase, Save,
  Camera, ExternalLink, ArrowLeft, Sparkles, Cpu, MessageSquare,
  Trophy, Users, Github, Twitter, Linkedin, ShieldCheck, Code2, Award, Zap, Target,
  Plus, X, Edit2, Trash2, Link as LinkIcon, LockKeyhole, RefreshCw
} from "lucide-react";

// --- ANIMATION VARIANTS (EXACTLY AS PROVIDED) ---
const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1, ease: "easeOut" },
  },
};

const itemUpVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
};

// --- SUB-COMPONENTS (EXACTLY AS PROVIDED) ---
const SkillBadge = ({ name, level }) => (
  <div className="flex flex-col gap-2 p-4 bg-white border border-gray-100 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-center">
      <span className="font-bold text-gray-900 text-xs md:text-sm truncate mr-1">{name}</span>
      <Sparkles className="w-3 h-3 text-[#D4F478] fill-[#D4F478] flex-shrink-0" />
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((step) => (
        <div
          key={step}
          className={`h-1 md:h-1.5 flex-1 rounded-full ${step <= level ? 'bg-[#1A1A1A]' : 'bg-gray-100'}`}
        />
      ))}
    </div>
  </div>
);

const ProjectCard = ({ project, onEdit, onDelete }) => (
  <motion.div
    variants={itemUpVariants}
    className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative"
  >
    <div className="h-40 md:h-48 bg-gray-100 relative overflow-hidden">
      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
      <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-2">
        {project.liveLink && (
          <a
            href={project.liveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 md:w-4 h-4 text-black" />
          </a>
        )}
        {project.githubLink && (
          <a
            href={project.githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <Github className="w-3.5 h-3.5 md:w-4 h-4 text-black" />
          </a>
        )}
      </div>
    </div>
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl md:text-2xl font-black text-gray-900 flex-1">{project.title}</h3>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => onEdit(project)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(project._id)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
      <p className="text-gray-500 font-medium text-xs md:text-sm mb-4 md:mb-6 leading-relaxed line-clamp-2">{project.description}</p>
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {project.tags?.map((tag) => (
          <span key={tag} className="px-2 py-0.5 md:px-3 md:py-1 bg-gray-50 border border-gray-100 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

const InterviewMetric = ({ label, score, icon: Icon }) => (
  <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2rem] shadow-sm flex flex-col items-center text-center gap-1 md:gap-2">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center text-gray-900 mb-1 md:mb-2 group-hover:bg-[#D4F478] transition-colors">
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
    </div>
    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-xl md:text-3xl font-black text-gray-900">{score}%</span>
  </div>
);

const InputGroup = ({ label, icon: Icon, type = "text", placeholder, name, value, onChange, disabled = false, fullWidth = false }) => (
  <div className={`space-y-2 ${fullWidth ? "md:col-span-2" : ""}`}>
    <label className="text-sm font-bold text-gray-900 ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  </div>
);

// ✅ PROJECT MODAL COMPONENT
const ProjectModal = ({ isOpen, onClose, onSave, editingProject }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    imageUrl: "",
    liveLink: "",
    githubLink: "",
  });

  useEffect(() => {
    if (editingProject) {
      setFormData({
        title: editingProject.title || "",
        description: editingProject.description || "",
        tags: Array.isArray(editingProject.tags) ? editingProject.tags.join(", ") : "",
        imageUrl: editingProject.imageUrl || "",
        liveLink: editingProject.liveLink || "",
        githubLink: editingProject.githubLink || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        tags: "",
        imageUrl: "",
        liveLink: "",
        githubLink: "",
      });
    }
  }, [editingProject, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArray = formData.tags
      .split(",")
      .map(t => t.trim())
      .filter(t => t);

    onSave({
      ...formData,
      tags: tagsArray,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 ml-1">Project Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Awesome Project"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 ml-1">Description *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what makes this project special..."
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 ml-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="React, Node.js, MongoDB"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 ml-1">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 ml-1">Live Demo Link</label>
              <input
                type="url"
                value={formData.liveLink}
                onChange={(e) => setFormData({ ...formData, liveLink: e.target.value })}
                placeholder="https://myproject.com"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 ml-1">GitHub Link</label>
              <input
                type="url"
                value={formData.githubLink}
                onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                placeholder="https://github.com/username/repo"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl px-4 py-3.5 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#1A1A1A] text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-200"
              >
                {editingProject ? "Update Project" : "Add Project"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// --- VIEW: ACCOUNT SETTINGS (EXACTLY AS PROVIDED) ---
function AccountView({ onNavigate }) {
  const { setMobileOpen } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const fileInputRef = React.useRef(null);
  const identityFileInputRef = React.useRef(null);
  const [identity, setIdentity] = useState(null);
  const [enrollingIdentity, setEnrollingIdentity] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);
  const [resetReason, setResetReason] = useState("");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    city: "", state: "", country: "", pincode: "", bio: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await mainApi.get("/users/me");
        const u = res.data.user;
        setUser(u);

        setFormData({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          email: u.email || "",
          city: u.location?.city || "",
          state: u.location?.state || "",
          country: u.location?.country || "",
          pincode: u.location?.pincode || "",
          bio: u.bio || "",
        });

        const identityRes = await mainApi.get("/users/identity/status");
        setIdentity(identityRes.data.identity);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await mainApi.put("/users/me", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        location: {
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
        },
      }, { withCredentials: true });

      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        alert("Account updated successfully ✅");
      } else {
        alert("Update successful but response incomplete");
      }
    } catch (err) {
      console.error("Update error:", err);
      const errorMsg = err.response?.data?.message || "Failed to update profile. Please try again.";
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const imageFileToJpegDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 640;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("Unable to read image"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(file);
    });
  };

  const handleIdentityPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setEnrollingIdentity(true);
    try {
      const image = await imageFileToJpegDataUrl(file);
      const res = await mainApi.post(
        "/users/identity/enroll",
        { image }
      );

      setIdentity(res.data.identity);
      setUser((prev) => ({ ...prev, profilePic: res.data.identity.referenceImage }));
      alert("Interview identity photo enrolled and locked.");
    } catch (err) {
      console.error("Identity enrollment error:", err);
      alert(err.response?.data?.message || "Failed to enroll identity photo");
    } finally {
      setEnrollingIdentity(false);
      if (identityFileInputRef.current) identityFileInputRef.current.value = "";
    }
  };

  const handleIdentityResetRequest = async () => {
    setRequestingReset(true);
    try {
      const res = await mainApi.post(
        "/users/identity/reset-request",
        { reason: resetReason }
      );
      setIdentity((prev) => ({ ...prev, resetStatus: res.data.resetStatus }));
      setResetReason("");
      alert("Identity photo reset request submitted.");
    } catch (err) {
      console.error("Identity reset request error:", err);
      alert(err.response?.data?.message || "Failed to submit reset request");
    } finally {
      setRequestingReset(false);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setUploading(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result;

        try {
          const res = await mainApi.post(
            "/users/upload-profile-pic",
            { profilePic: base64Image }
          );

          if (res.data.success) {
            setUser({ ...user, profilePic: res.data.profilePic });
            alert("Profile picture updated successfully ✅");
          }
        } catch (err) {
          console.error("Upload error:", err);
          alert(err.response?.data?.message || "Failed to upload profile picture");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File reading error:", err);
      setUploading(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
        <motion.div variants={itemUpVariants} className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Account Settings</h1>
            <p className="text-gray-500 font-medium mt-2">Manage your personal information and preferences.</p>
          </div>
        </motion.div>

        <motion.div variants={itemUpVariants} className="w-full bg-[#1A1A1A] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-gray-200 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full blur-[100px] opacity-30 pointer-events-none" />
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-white/20 to-white/5 border border-white/10 shadow-2xl">
              <img
                src={user?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.firstName + ' ' + formData.lastName)}`}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <button
              onClick={handleCameraClick}
              disabled={uploading || identity?.locked}
              title={identity?.locked ? "Interview identity photo is locked" : "Update profile photo"}
              className="absolute bottom-2 right-2 bg-[#D4F478] text-black p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left relative z-10 flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/10 text-[#D4F478]">
              <Briefcase className="w-3 h-3" /> Software Intern
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{formData.firstName} {formData.lastName}</h2>
            <p className="text-gray-400 max-w-md text-lg leading-relaxed mb-6">{formData.bio || "Passionate about coding and building modern web apps. Ready to tackle the next big challenge."}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="bg-white/10 backdrop-blur-md border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white hover:text-black transition-all duration-300 flex items-center gap-2 cursor-pointer"><Settings className="w-4 h-4" /> Preferences</button>
              <button onClick={onNavigate} className="bg-[#D4F478] text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(212,244,120,0.3)] flex items-center gap-2 cursor-pointer"><ExternalLink className="w-4 h-4" /> View Portfolio</button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemUpVariants} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${identity?.enrolled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {identity?.locked ? <LockKeyhole className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Interview Identity</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {identity?.enrolled
                    ? "Your interview photo is locked for proctored interview verification."
                    : "Enroll a clear face photo before starting an interview."}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${identity?.enrolled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {identity?.enrolled ? "Enrolled" : "Required"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${identity?.locked ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {identity?.locked ? "Locked" : "Unlocked"}
                  </span>
                  {identity?.resetStatus && identity.resetStatus !== "none" && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700">
                      Reset {identity.resetStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {identity?.referenceImage && (
                <img
                  src={identity.referenceImage}
                  alt="Interview identity"
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm"
                />
              )}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => identityFileInputRef.current?.click()}
                  disabled={enrollingIdentity || (identity?.locked && identity?.resetStatus !== "approved")}
                  className="bg-[#1A1A1A] text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrollingIdentity ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {identity?.enrolled ? "Replace Photo" : "Enroll Photo"}
                </button>
                <input
                  ref={identityFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleIdentityPhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {identity?.locked && identity?.resetStatus !== "pending" && (
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row gap-3">
              <input
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Reason for identity photo reset"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-gray-100 font-medium"
              />
              <button
                type="button"
                onClick={handleIdentityResetRequest}
                disabled={requestingReset}
                className="bg-gray-100 text-gray-900 px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${requestingReset ? "animate-spin" : ""}`} />
                Request Reset
              </button>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemUpVariants} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900"><User className="w-5 h-5" /></div>
            <div><h3 className="text-xl font-bold text-gray-900">Personal Details</h3><p className="text-sm text-gray-500 font-medium">Update your identity information</p></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="First Name" icon={User} name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter your first name" />
              <InputGroup label="Last Name" icon={User} name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter your last name" />
              <InputGroup label="Email Address" icon={Mail} type="email" name="email" value={formData.email} disabled={true} placeholder="swaroop@email.com" />
              <InputGroup label="Phone Number" icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              <InputGroup label="City" icon={MapPin} name="city" value={formData.city} onChange={handleChange} placeholder="Enter your city" />
              <InputGroup label="State" icon={Globe} name="state" value={formData.state} onChange={handleChange} placeholder="Enter your state" />
              <InputGroup label="Pin Code" icon={MapPin} name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter pincode" />
              <InputGroup label="Country" icon={Globe} name="country" value={formData.country} onChange={handleChange} placeholder="India" />
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-900 ml-1">Bio</label>
                <textarea name="bio" rows={4} value={formData.bio} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:ring-4 focus:ring-gray-100 rounded-xl p-4 outline-none transition-all placeholder:text-gray-400 font-medium text-gray-800 resize-none" placeholder="Tell us a little about yourself..." />
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-gray-200 cursor-pointer ${saving
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-black hover:scale-105'
                  }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}

// --- VIEW: PORTFOLIO (✅ WITH PROJECT MANAGEMENT + FIXED SKILL DEDUPLICATION) ---
function PortfolioView({ onBack }) {
  const { setMobileOpen } = useOutletContext();
  const [view, setView] = useState("creator");
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Project management state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchPortfolio = async () => {
    try {
      const res = await mainApi.get("/users/portfolio");
      setPortfolio(res.data);
    } catch (err) {
      console.error("Failed to fetch portfolio", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ✅ Handle Add/Edit Project
  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        // Update existing project
        await mainApi.put(
          `/users/projects/${editingProject._id}`,
          projectData
        );
        alert("Project updated successfully! ✅");
      } else {
        // Create new project
        await mainApi.post(
          "/users/projects",
          projectData
        );
        alert("Project added successfully! ✅");
      }

      setIsModalOpen(false);
      setEditingProject(null);
      fetchPortfolio(); // Refresh data
    } catch (err) {
      console.error("Save project error:", err);
      alert("Failed to save project. Please try again.");
    }
  };

  // ✅ Handle Delete Project
  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await mainApi.delete(
        `/users/projects/${projectId}`
      );
      alert("Project deleted successfully! ✅");
      fetchPortfolio(); // Refresh data
    } catch (err) {
      console.error("Delete project error:", err);
      alert("Failed to delete project. Please try again.");
    }
  };

  // ✅ Handle Edit Project
  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D4F478] border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const { user, skills = [], projects = [], interviews = [], aptitude = [] } = portfolio || {};

  const calculatePerformanceLevel = (course) => {
    if (!course.totalSeconds || course.totalSeconds === 0) {
      return 1;
    }

    const progressPercentage = (course.watchedSeconds / course.totalSeconds) * 100;

    if (progressPercentage >= 90) return 5;
    if (progressPercentage >= 70) return 4;
    if (progressPercentage >= 50) return 3;
    if (progressPercentage >= 25) return 2;
    return 1;
  };

  // ✅ FIX: Deduplicate skills and keep only the highest-rated version
  const skillsWithLevels = skills.map((s) => ({
    courseId: s.courseId,
    name: s.courseTitle,
    level: calculatePerformanceLevel(s),
  }));

  // Remove duplicates by keeping the skill with the highest level for each unique name
  const verifiedSkills = Object.values(
    skillsWithLevels.reduce((acc, skill) => {
      const existing = acc[skill.name];
      // If skill doesn't exist or current skill has higher level, use it
      if (!existing || skill.level > existing.level) {
        acc[skill.name] = skill;
      }
      return acc;
    }, {})
  );

  const avgLogic = aptitude.length > 0
    ? Math.round(aptitude.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / aptitude.length)
    : 0;

  return (
    <>
      {/* Mobile Header */}
      <MobileDashboardHeader setMobileOpen={setMobileOpen} />

      <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition} className="min-h-screen bg-[#FDFBF9] font-sans px-4 py-6 md:p-8 pb-20 overflow-x-hidden">
        <div className="max-w-6xl mx-auto mb-8 md:mb-12">
          <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:items-center">
            <div className="flex justify-start order-1 gap-3">
              <button onClick={onBack} className="inline-flex items-center gap-3 text-gray-600 hover:text-black font-black transition-all group bg-white px-5 py-2.5 rounded-full border border-gray-100 shadow-sm hover:shadow-md hover:scale-105 active:scale-95">
                <div className="p-1.5 bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white transition-all"><ArrowLeft className="w-4 h-4" /></div>
                <span className="text-sm">Back to Settings</span>
              </button>
            </div>
            <div className="flex justify-center order-2">
              <div className="bg-white border border-gray-200 p-1.5 rounded-full shadow-lg flex gap-1 relative overflow-hidden w-full max-w-[320px]">
                <button onClick={() => setView("creator")} className={`relative z-10 flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${view === "creator" ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                  <Zap className={`w-4 h-4 ${view === "creator" ? "fill-[#D4F478] text-black" : ""}`} /> <span>Creator</span>
                </button>
                <button onClick={() => setView("candidate")} className={`relative z-10 flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${view === "candidate" ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                  <Target className={`w-4 h-4 ${view === "candidate" ? "fill-blue-400 text-black" : ""}`} /> <span>Hired</span>
                </button>
                <motion.div initial={false} animate={{ x: view === "creator" ? "0%" : "100%" }} className="absolute top-1.5 left-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full shadow-sm z-0" style={{ backgroundColor: view === "creator" ? "#D4F478" : "#60A5FA" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              </div>
            </div>
            <div className="hidden md:block order-3" />
          </div>
        </div>

        <motion.div key={view} variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          <motion.div variants={itemUpVariants} className="w-full bg-[#1A1A1A] rounded-[2rem] md:rounded-[3rem] p-6 md:p-16 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            <div className={`absolute -top-12 -left-12 md:-top-24 md:-left-24 w-48 md:w-96 h-48 md:h-96 rounded-full blur-[60px] md:blur-[120px] transition-colors duration-700 ${view === "creator" ? "bg-indigo-600/20" : "bg-blue-600/20"}`} />
            <div className={`absolute -bottom-12 -right-12 md:-bottom-24 md:-right-24 w-48 md:w-96 h-48 md:h-96 rounded-full blur-[60px] md:blur-[120px] transition-colors duration-700 ${view === "creator" ? "bg-[#D4F478]/10" : "bg-emerald-500/10"}`} />
            <div className="relative mb-6 md:mb-8">
              <div className={`w-24 h-24 md:w-40 md:h-40 rounded-full p-1 md:p-1.5 bg-gradient-to-tr shadow-2xl transition-all duration-700 ${view === "creator" ? "from-[#D4F478] to-emerald-500" : "from-blue-400 to-indigo-600"}`}>
                <img src={user?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || "Profile")}`} className="w-full h-full object-cover rounded-full border-2 md:border-4 border-[#1A1A1A]" alt="Profile" />
              </div>
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-[#D4F478] mb-4 md:mb-6 border border-white/5">{view === "creator" ? "Available for Projects" : "Ready for Interviews"}</div>
              <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-3 md:mb-4 px-2">{user?.name || "Candidate"}</h1>
              <p className="text-gray-400 text-sm md:text-xl font-medium leading-relaxed mb-6 md:mb-8 px-4">{user?.bio || (view === "creator" ? "Full-stack Engineer specializing in high-performance systems." : "Results-driven developer with proven technical excellence.")}</p>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {[Github, Twitter, Linkedin, Globe].map((Icon, i) => (<a key={i} href="#" className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white hover:bg-white hover:text-black transition-all duration-300"><Icon className="w-4 h-4 md:w-5 md:h-5" /></a>))}
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {view === "creator" ? (
              <motion.div key="creator-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <div className="flex items-center gap-3 ml-1 md:ml-2"><div className="p-1.5 md:p-2 bg-black text-white rounded-lg md:rounded-xl"><Cpu className="w-4 h-4 md:w-5 md:h-5" /></div><h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight text-left">Verified Skills</h2></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                      {verifiedSkills.length > 0 ? verifiedSkills.map((s) => (
                        <SkillBadge
                          key={s.courseId}
                          name={s.name}
                          level={s.level}
                        />
                      )) : (
                        <p className="text-gray-400 font-bold p-4 col-span-full">Start learning courses to unlock skills.</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6 md:mb-8"><div className="p-1.5 md:p-2 bg-[#D4F478] text-black rounded-lg md:rounded-xl"><Award className="w-4 h-4 md:w-5 md:h-5" /></div><h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Project Stats</h2></div>
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex justify-between items-center"><span className="text-xs md:text-sm font-bold text-gray-500">Live Apps</span><span className="text-lg md:text-xl font-black text-gray-900">{projects.length}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs md:text-sm font-bold text-gray-500">Courses</span><span className="text-lg md:text-xl font-black text-gray-900">{verifiedSkills.length}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs md:text-sm font-bold text-gray-500">Milestones</span><span className="text-lg md:text-xl font-black text-gray-900">{interviews.length}</span></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 md:space-y-8">
                  <div className="flex items-center justify-between px-1 md:px-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 md:p-2 bg-black text-white rounded-lg md:rounded-xl"><Code2 className="w-4 h-4 md:w-5 md:h-5" /></div>
                      <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight text-left">Recent Builds</h2>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProject(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-[#D4F478] text-black px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden md:inline">Add Project</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {projects.length > 0 ? projects.map((p) => (
                      <ProjectCard
                        key={p._id}
                        project={p}
                        onEdit={handleEditProject}
                        onDelete={handleDeleteProject}
                      />
                    )) : (
                      <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-gray-100">
                        <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold mb-4">No projects yet</p>
                        <button
                          onClick={() => {
                            setEditingProject(null);
                            setIsModalOpen(true);
                          }}
                          className="bg-[#D4F478] text-black px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:scale-105 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Add Your First Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="candidate-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                  <InterviewMetric label="Logic Accuracy" score={avgLogic} icon={Cpu} />
                  <InterviewMetric label="Comm. Skills" score={92} icon={MessageSquare} />
                  <InterviewMetric label="Sys. Design" score={88} icon={Globe} />
                  <InterviewMetric label="Culture Fit" score={98} icon={Users} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
                  <div className="lg:col-span-3 bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-sm space-y-6 md:space-y-8">
                    <div className="flex items-center gap-3 mb-2 md:mb-4"><div className="p-1.5 md:p-2 bg-blue-600 text-white rounded-lg md:rounded-xl"><Target className="w-4 h-4 md:w-5 md:h-5" /></div><h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Interview Milestones</h2></div>
                    <div className="space-y-6 md:space-y-8 relative">
                      <div className="absolute left-3.5 md:left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
                      {interviews.length > 0 ? interviews.map((item, i) => (
                        <div key={i} className="relative pl-10 md:pl-12">
                          <div className="absolute left-2.5 md:left-3 top-2 w-2 md:w-2.5 h-2 md:h-2.5 bg-blue-500 rounded-full border-2 md:border-4 border-white shadow-[0_0_0_2px_#EFF6FF] md:shadow-[0_0_0_4px_#EFF6FF]" />
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div><h4 className="text-sm md:text-base font-black text-gray-900">{item.role}</h4><p className="text-xs md:text-sm font-bold text-gray-500">{item.feedback || "In progress"}</p></div>
                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1"><span className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 md:px-2 py-0.5 rounded">Score: {item.score}%</span></div>
                          </div>
                        </div>
                      )) : <p className="text-gray-400 font-bold ml-12">Complete interviews to see milestones.</p>}
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-[#1A1A1A] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-24 md:w-40 h-24 md:h-40 bg-blue-400/20 rounded-full blur-2xl md:blur-3xl group-hover:bg-blue-400/30 transition-all" /><h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-2"><ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Verified Strengths</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {["Problem Solving", "Scalable Architecture", "Async Management", "Mental Models", "Peer Mentorship"].map((tag) => (<div key={tag} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl md:rounded-2xl border border-white/5 hover:border-white/10 transition-all"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /><span className="text-xs md:text-sm font-bold text-gray-300">{tag}</span></div>))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ✅ Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        editingProject={editingProject}
      />
    </>
  );
}

// --- MAIN APPLICATION ---
export default function App() {
  const [currentPage, setCurrentPage] = useState("account");

  return (
    <div className="min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#D4F478] selection:text-black p-4 md:p-8">
      <AnimatePresence mode="wait">
        {currentPage === "account" ? (
          <AccountView key="account" onNavigate={() => setCurrentPage("portfolio")} />
        ) : (
          <PortfolioView key="portfolio" onBack={() => setCurrentPage("account")} />
        )}
      </AnimatePresence>
    </div>
  );
}