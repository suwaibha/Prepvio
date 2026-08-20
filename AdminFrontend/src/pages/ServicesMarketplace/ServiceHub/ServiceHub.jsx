import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Briefcase, 
  Type, 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon,
  X,
  ExternalLink,
  Layers,
  Sparkles
} from "lucide-react";
import DeleteConfirmationModal from "../../../Components/DeleteConfirmationModal";

/**
 * INTERNAL COMPONENT: ServiceThumbnail
 * Handles the automatic cycling "animation" for services with multiple images
 */
const ServiceThumbnail = ({ images, icon }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3000); // Cycle every 3 seconds
      return () => clearInterval(interval);
    }
  }, [images]);

  if (images && images.length > 0) {
    return (
      <div className="relative w-14 h-14 overflow-hidden rounded-2xl shadow-md border-2 border-white/80 group-hover:shadow-indigo-200/50 transition-all duration-500">
        <img 
          src={images[currentIndex]} 
          alt="" 
          className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-in-out"
          onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
        />
        {images.length > 1 && (
          <div className="absolute bottom-1 right-1 flex gap-0.5">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-2' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
        {images.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg animate-pulse">
            {images.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl border-2 border-white group-hover:bg-indigo-50 transition-colors shadow-sm">
      {icon || <ImageIcon className="w-6 h-6 text-slate-300" />}
    </div>
  );
};

/**
 * INTERNAL COMPONENT: Modal
 * Glassy modal overlay for service forms
 */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md z-50 p-4 animate-in fade-in duration-300">
    <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-8 md:p-10 w-full max-w-xl border border-white/50 transform animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
          <X className="w-7 h-7" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/**
 * MAIN COMPONENT: ServiceManagement
 */
const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [currentEditItem, setCurrentEditItem] = useState(null);
  
  const [itemData, setItemData] = useState({ 
    title: '', 
    description: '', 
    slug: '',
    image: '',
    images: [],
    icon: ''
  });
  const [newImageUrl, setNewImageUrl] = useState('');

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = `${CONTENT_API_URL}/services`;

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      setServices(response.data || []);
    } catch {
      setError('Failed to fetch services. Ensure your backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setCurrentEditItem(item);
    if (item) {
      setItemData({ 
        title: item.title || '', 
        description: item.description || '', 
        slug: item.slug || '',
        image: item.image || '',
        images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []),
        icon: item.icon || ''
      });
    } else {
      setItemData({ 
        title: '', 
        description: '', 
        slug: '',
        image: '',
        images: [],
        icon: ''
      });
    }
    setNewImageUrl('');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentEditItem(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData(prevData => {
      const newData = { ...prevData, [name]: value };
      if (name === 'title') {
        newData.slug = value.toLowerCase().trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '');
      }
      return newData;
    });
  };

  const addImageToArray = () => {
    const url = newImageUrl.trim();
    if (url) {
      if (!url.startsWith('http')) {
        alert("Please enter a valid URL starting with http:// or https://");
        return;
      }
      setItemData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (index) => {
    setItemData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!itemData.title.trim()) return;

    setActionLoading(true);
    setError(null);
    try {
      const payload = { ...itemData, image: itemData.images[0] || '' };
      if (modalType === 'add') {
        await axios.post(API_URL, payload);
      } else {
        await axios.put(`${API_URL}/${currentEditItem._id}`, payload);
      }
      handleCloseModal();
      await fetchServices();
    } catch {
      setError(`Failed to ${modalType} service. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (service) => {
      setServiceToDelete(service);
      setIsDeleteModalOpen(true);
  };

  const confirmDeleteService = async () => {
      if (!serviceToDelete) return;
      setIsDeleting(true);
      setError(null);
      try {
          await axios.delete(`${API_URL}/${serviceToDelete._id}`);
          await fetchServices();
      } catch {
          setError('Delete failed. The resource might already be gone.');
      } finally {
          setIsDeleting(false);
          setIsDeleteModalOpen(false);
          setServiceToDelete(null);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <Briefcase className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Service Hub</h1>
                    <p className="text-slate-500 font-bold mt-1">Manage agency offerings and visual galleries</p>
                </div>
            </div>
            <button 
                onClick={() => handleOpenModal('add')} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center gap-3"
            >
                <Plus className="w-5 h-5" />
                New Service
            </button>
        </div>

        {error && (
          <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-[1.5rem] flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4">
            <span className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> {error}</span>
            <button onClick={() => setError(null)} className="p-2 hover:bg-rose-100 rounded-lg transition-colors">✕</button>
          </div>
        )}

        {/* Main List Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {loading && services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <p className="text-slate-400 font-black text-xl tracking-tighter animate-pulse uppercase">Syncing Database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Preview</th>
                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Service Information</th>
                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Handle</th>
                    <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {services.length > 0 ? (
                    services.map(service => (
                      <tr key={service._id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-8 whitespace-nowrap">
                          <ServiceThumbnail 
                            images={Array.isArray(service.images) ? service.images : (service.image ? [service.image] : [])} 
                            icon={service.icon} 
                          />
                        </td>
                        <td className="px-8 py-8 max-w-sm">
                          <span className="block text-xl font-black text-slate-800 tracking-tight">{service.title}</span>
                          <span className="text-sm text-slate-400 font-bold line-clamp-1 mt-1 leading-relaxed">{service.description}</span>
                        </td>
                        <td className="px-8 py-8">
                          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg font-mono">/{service.slug}</span>
                        </td>
                        <td className="px-8 py-8 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button 
                              onClick={() => handleOpenModal('edit', service)} 
                              className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(service)} 
                              className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-32">
                        <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
                          <Layers className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Active Services</h3>
                        <p className="text-slate-400 mt-2 font-bold max-w-xs mx-auto">Start building your agency presence by adding a service above.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal 
          title={modalType === 'add' ? 'Register New Service' : 'Refine Service Profile'} 
          onClose={handleCloseModal}
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Service Title</label>
                  <div className="relative">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      type="text" 
                      name="title" 
                      value={itemData.title} 
                      onChange={handleChange} 
                      placeholder="e.g. Brand Design"
                      className="w-full border-2 border-slate-50 rounded-[1.25rem] p-4 pl-12 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Symbol (Emoji)</label>
                  <input 
                    type="text" 
                    name="icon" 
                    value={itemData.icon} 
                    onChange={handleChange} 
                    placeholder="✨"
                    className="w-full border-2 border-slate-50 rounded-[1.25rem] p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-black text-center text-xl" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-300 w-5 h-5" />
                  <textarea 
                    name="description" 
                    value={itemData.description} 
                    onChange={handleChange} 
                    rows="3" 
                    placeholder="Outline your process and value..."
                    className="w-full border-2 border-slate-50 rounded-[1.25rem] p-4 pl-12 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold resize-none leading-relaxed" 
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Permanent Handle</label>
                <div className="flex items-center gap-2 bg-indigo-50 p-4 rounded-[1.25rem] border border-indigo-100/50 font-mono text-xs text-indigo-600 font-black">
                   <Sparkles size={14} className="animate-pulse" />
                   <span>/services/</span>
                   <span className="text-indigo-800">{itemData.slug || "slug-preview"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Visual Gallery (URLs)</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 border-2 border-slate-50 rounded-[1.25rem] p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 text-sm font-bold"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageToArray();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addImageToArray}
                    className="px-6 bg-slate-900 text-white rounded-[1.25rem] font-black hover:bg-black transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
                
                {itemData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 bg-slate-50 p-5 rounded-[2.5rem] border border-slate-100 shadow-inner mt-4">
                    {itemData.images.map((img, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img src={img} alt="" className="h-full w-full object-cover rounded-[1.25rem] shadow-sm border border-white" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-2 hover:bg-rose-600 shadow-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] hover:bg-slate-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
              >
                Discard
              </button>
              <button 
                type="submit" 
                disabled={actionLoading}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 font-black text-xs uppercase tracking-widest active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {modalType === 'add' ? 'Confirm Launch' : 'Push Updates'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteService}
          title="Delete Service"
          message={`Are you sure you want to delete service "${serviceToDelete?.title || 'this service'}"? This action cannot be undone.`}
          isLoading={isDeleting}
      />
    </div>
  );
};

export default ServiceManagement;





// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { FaPlus, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
// import Modal from './Modal';

// const ServiceManagement = () => {
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalType, setModalType] = useState('add');
//   const [currentEditItem, setCurrentEditItem] = useState(null);
//     setError(null);
//     try {
//       const response = await axios.get(API_URL);
//       setServices(response.data);
//     } catch (err) {
//       setError('Failed to fetch services');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchServices();
//   }, []);

//   const handleOpenModal = (type, item = null) => {
//     setModalType(type);
//     setCurrentEditItem(item);
//     if (item) {
//       setItemData({ 
//         title: item.title, 
//         description: item.description, 
//         slug: item.slug,
//         image: item.image || '',
//         images: item.images || [],
//         icon: item.icon || ''
//       });
//     } else {
//       setItemData({ 
//         title: '', 
//         description: '', 
//         slug: '',
//         image: '',
//         images: [],
//         icon: ''
//       });
//     }
//     setNewImageUrl('');
//     setModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setModalOpen(false);
//     setCurrentEditItem(null);
//     setItemData({ 
//       title: '', 
//       description: '', 
//       slug: '',
//       image: '',
//       images: [],
//       icon: ''
//     });
//     setNewImageUrl('');
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setItemData(prevData => {
//       const newData = { ...prevData, [name]: value };
//       if (name === 'title') {
//         newData.slug = value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
//       }
//       return newData;
//     });
//   };

//   const addImageToArray = () => {
//     if (newImageUrl.trim()) {
//       setItemData(prev => ({
//         ...prev,
//         images: [...prev.images, newImageUrl.trim()]
//       }));
//       setNewImageUrl('');
//     }
//   };

//   const removeImage = (index) => {
//     setItemData(prev => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index)
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     try {
//       if (modalType === 'add') {
//         await axios.post(API_URL, itemData);
//       } else {
//         await axios.put(`${API_URL}/${currentEditItem._id}`, itemData);
//       }
//       handleCloseModal();
//       fetchServices();
//     } catch (err) {
//       setError(`Failed to ${modalType} service`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this service?")) return;
//     setLoading(true);
//     setError(null);
//     try {
//       await axios.delete(`${API_URL}/${id}`);
//       fetchServices();
//     } catch (err) {
//       setError('Failed to delete service');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p className="text-center text-gray-500">Loading services...</p>;
//   if (error) return <p className="text-center text-red-500">Error: {error}</p>;

//   return (
//     <div>
//       <div className="flex justify-end mb-4">
//         <button 
//           onClick={() => handleOpenModal('add')} 
//           className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
//         >
//           <FaPlus />
//           <span>Add New Service</span>
//         </button>
//       </div>
      
//       <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {services.length > 0 ? (
//               services.map(service => (
//                 <tr key={service._id}>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {service.images && service.images.length > 0 ? (
//                       <div className="flex items-center space-x-1">
//                         <img src={service.images[0]} alt={service.title} className="h-12 w-12 object-cover rounded" />
//                         {service.images.length > 1 && (
//                           <span className="text-xs text-gray-500">+{service.images.length - 1}</span>
//                         )}
//                       </div>
//                     ) : service.image ? (
//                       <img src={service.image} alt={service.title} className="h-12 w-12 object-cover rounded" />
//                     ) : service.icon ? (
//                       <span className="text-2xl">{service.icon}</span>
//                     ) : (
//                       <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Image</div>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.title}</td>
//                   <td className="px-6 py-4 text-sm text-gray-500">{service.description}</td>
//                   <td className="px-6 py-4 text-sm text-gray-500">{service.slug}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                     <button onClick={() => handleOpenModal('edit', service)} className="text-blue-600 hover:text-blue-900">
//                       <FaEdit />
//                     </button>
//                     <button onClick={() => handleDelete(service._id)} className="text-red-600 hover:text-red-900">
//                       <FaTrash />
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="5" className="text-center py-4 text-gray-500">No services found.</td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {modalOpen && (
//         <Modal title={`${modalType === 'add' ? 'Add' : 'Edit'} Service`} onClose={handleCloseModal}>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Service Title</label>
//               <input 
//                 type="text" 
//                 name="title" 
//                 value={itemData.title} 
//                 onChange={handleChange} 
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
//                 required 
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea 
//                 name="description" 
//                 value={itemData.description} 
//                 onChange={handleChange} 
//                 rows="3" 
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
//                 required
//               ></textarea>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Single Image URL (Optional)</label>
//               <input 
//                 type="text" 
//                 name="image" 
//                 value={itemData.image} 
//                 onChange={handleChange} 
//                 placeholder="https://example.com/image.jpg"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
//               />
//               {itemData.image && (
//                 <div className="mt-2">
//                   <img src={itemData.image} alt="Preview" className="h-24 w-24 object-cover rounded" />
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Multiple Image URLs (For Auto-Rotation)</label>
//               <div className="flex gap-2">
//                 <input 
//                   type="text" 
//                   value={newImageUrl}
//                   onChange={(e) => setNewImageUrl(e.target.value)}
//                   placeholder="https://example.com/image.jpg"
//                   className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       addImageToArray();
//                     }
//                   }}
//                 />
//                 <button
//                   type="button"
//                   onClick={addImageToArray}
//                   className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
//                 >
//                   Add
//                 </button>
//               </div>
              
//               {itemData.images.length > 0 && (
//                 <div className="mt-3 space-y-2">
//                   <p className="text-sm text-gray-600">{itemData.images.length} image(s) added:</p>
//                   <div className="grid grid-cols-3 gap-2">
//                     {itemData.images.map((img, index) => (
//                       <div key={index} className="relative group">
//                         <img src={img} alt={`Preview ${index + 1}`} className="h-20 w-full object-cover rounded" />
//                         <button
//                           type="button"
//                           onClick={() => removeImage(index)}
//                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
//                         >
//                           <FaTimes size={10} />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">Icon (Optional - e.g., 💼)</label>
//               <input 
//                 type="text" 
//                 name="icon" 
//                 value={itemData.icon} 
//                 onChange={handleChange} 
//                 placeholder="Enter emoji or icon"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
//               />
//             </div>

//             <div className="flex justify-end space-x-2 mt-4">
//               <button 
//                 type="button" 
//                 onClick={handleCloseModal} 
//                 className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button 
//                 type="submit" 
//                 disabled={loading}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {modalType === 'add' ? 'Add' : 'Update'}
//               </button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// };

// export default ServiceManagement;





// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
// import Modal from './Modal';

// const ServiceManagement = () => {
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalType, setModalType] = useState('add');
//   const [currentEditItem, setCurrentEditItem] = useState(null);
//   const [itemData, setItemData] = useState({ title: '', description: '', slug: '' });

//   const API_URL = 'http://localhost:8000/api/services';

//   const fetchServices = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await axios.get(API_URL);
//       setServices(response.data);
//     } catch (err) {
//       setError('Failed to fetch services');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchServices();
//   }, []);

//   const handleOpenModal = (type, item = null) => {
//     setModalType(type);
//     setCurrentEditItem(item);
//     if (item) {
//       setItemData({ title: item.title, description: item.description, slug: item.slug });
//     } else {
//       setItemData({ title: '', description: '', slug: '' });
//     }
//     setModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setModalOpen(false);
//     setCurrentEditItem(null);
//     setItemData({ title: '', description: '', slug: '' });
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setItemData(prevData => {
//       const newData = { ...prevData, [name]: value };
//       if (name === 'title') {
//         newData.slug = value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
//       }
//       return newData;
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     try {
//       if (modalType === 'add') {
//         await axios.post(API_URL, itemData);
//       } else {
//         await axios.put(`${API_URL}/${currentEditItem._id}`, itemData);
//       }
//       handleCloseModal();
//       fetchServices();
//     } catch (err) {
//       setError(`Failed to ${modalType} service`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this service?")) return;
//     setLoading(true);
//     setError(null);
//     try {
//       await axios.delete(`${API_URL}/${id}`);
//       fetchServices();
//     } catch (err) {
//       setError('Failed to delete service');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p className="text-center text-gray-500">Loading services...</p>;
//   if (error) return <p className="text-center text-red-500">Error: {error}</p>;

//   return (
//     <div>
//       <div className="flex justify-end mb-4">
//         <button onClick={() => handleOpenModal('add')} className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
//           <FaPlus />
//           <span>Add New Service</span>
//         </button>
//       </div>
//       <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {services.length > 0 ? (
//               services.map(service => (
//                 <tr key={service._id}>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.title}</td>
//                   <td className="px-6 py-4 text-sm text-gray-500">{service.description}</td>
//                   <td className="px-6 py-4 text-sm text-gray-500">{service.slug}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                     <button onClick={() => handleOpenModal('edit', service)} className="text-blue-600 hover:text-blue-900"><FaEdit /></button>
//                     <button onClick={() => handleDelete(service._id)} className="text-red-600 hover:text-red-900"><FaTrash /></button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="4" className="text-center py-4 text-gray-500">No services found.</td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//       {modalOpen && (
//         <Modal title={`${modalType === 'add' ? 'Add' : 'Edit'} Service`} onClose={handleCloseModal}>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Service Title</label>
//               <input type="text" name="title" value={itemData.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea name="description" value={itemData.description} onChange={handleChange} rows="3" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required></textarea>
//             </div>
//             <div className="flex justify-end space-x-2 mt-4">
//               <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
//               <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">{modalType === 'add' ? 'Add' : 'Update'}</button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// };

// export default ServiceManagement;
