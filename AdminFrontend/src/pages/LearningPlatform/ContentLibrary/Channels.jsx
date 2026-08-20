import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { Plus, Trash2, Edit, Loader2, Globe, Search, LayoutGrid, List } from "lucide-react";
import DeleteConfirmationModal from "../../../Components/DeleteConfirmationModal";

const ChannelManagement = () => {
  // --- State Management ---
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    link: ""
  });
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);

  const API_URL = `${CONTENT_API_URL}/channels`;

  // --- API Effects ---
  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL);
      setChannels(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      setError("Failed to fetch channels. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setCurrentEditItem(item);
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        link: item.link || ""
      });
    } else {
      setFormData({ name: "", description: "", imageUrl: "", link: "" });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentEditItem(null);
    setFormData({ name: "", description: "", imageUrl: "", link: "" });
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.imageUrl.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setActionLoading(true);
    setError(null);

    const itemData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
      link: formData.link.trim(),
    };

    try {
      if (modalType === "add") {
        await axios.post(API_URL, itemData);
      } else {
        await axios.put(`${API_URL}/${currentEditItem._id}`, itemData);
      }
      handleCloseModal();
      await fetchChannels();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${modalType} channel`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (channel) => {
    setChannelToDelete(channel);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteChannel = async () => {
    if (!channelToDelete) return;
    setActionLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/${channelToDelete._id}`);
      await fetchChannels();
      setIsDeleteModalOpen(false);
      setChannelToDelete(null);
    } catch {
      setError("Failed to delete channel");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 w-full space-y-8 text-slate-900 font-sans">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Channel Management</h1>
          </div>

          <button
            onClick={() => handleOpenModal("add")}
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all duration-300 font-bold shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Add Channel</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto flex-1">
            <div className="relative group w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 placeholder-slate-500 font-medium focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-100/50 outline-none transition-all shadow-sm"
              />
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border-2 border-transparent">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === "grid" ? "bg-white shadow-md text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === "list" ? "bg-white shadow-md text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-center justify-between">
            <span className="font-bold">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-black">✕</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <p className="text-slate-600 font-bold text-lg animate-pulse tracking-tight">Loading Channels...</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 opacity-60">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-slate-800 font-black text-xl">No channels found</h3>
            <p className="text-slate-600 font-medium mt-2">Try adjusting your search or add a new channel.</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredChannels.map((channel) => (
                  <div key={channel._id} className="group flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                      <button
                        onClick={() => handleOpenModal("edit", channel)}
                        className="p-2 bg-white/90 text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(channel)}
                        className="p-2 bg-white/90 text-red-600 rounded-lg shadow-sm hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="h-40 bg-slate-100 relative overflow-hidden group">
                      <img
                        src={channel.imageUrl}
                        alt={channel.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Channel"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        {channel.link && (
                          <a href={channel.link} target="_blank" rel="noopener noreferrer" className="text-white text-xs font-bold flex items-center gap-1 hover:underline">
                            <Globe className="w-3 h-3" /> Visit Channel
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight">{channel.name}</h3>
                      <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">{channel.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Channel</th>
                      <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredChannels.map((channel) => (
                      <tr key={channel._id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={channel.imageUrl}
                              alt={channel.name}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100"
                              onError={(e) => { e.target.src = "https://via.placeholder.com/100"; }}
                            />
                            <div>
                              <div className="font-bold text-slate-800">{channel.name}</div>
                              {channel.link && (
                                <a href={channel.link} target="_blank" rel="noopener noreferrer" className="text-indigo-500 text-xs hover:underline flex items-center gap-1 mt-0.5">
                                  <Globe className="w-3 h-3" /> {new URL(channel.link).hostname}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-slate-500 text-sm line-clamp-2">{channel.description}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal("edit", channel)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(channel)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4 transition-opacity">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-lg border border-slate-100 transform transition-all scale-100">
            <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">
              {modalType === "add" ? "New Channel" : "Edit Channel"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Channel Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700"
                    placeholder="e.g. CodeAcademy"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium text-slate-700 resize-none"
                    placeholder="Channel summary..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logo URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium text-slate-700"
                    placeholder="https://..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Website Link</label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium text-slate-700"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold border border-slate-200"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {modalType === "add" ? "Create Channel" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setChannelToDelete(null);
        }}
        onConfirm={confirmDeleteChannel}
        itemName={channelToDelete?.name}
        title="Delete Channel"
      />
    </div>
  );
};

export default ChannelManagement;




// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
// import Modal from './Modal';

// const ChannelManagement = () => {
//   const [channels, setChannels] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalType, setModalType] = useState('add');
//   const [currentEditItem, setCurrentEditItem] = useState(null);

//   const API_URL = 'http://localhost:8000/api/channels';

//   const fetchChannels = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await axios.get(API_URL);
//       setChannels(res.data);
//     } catch (err) {
//       setError('Failed to fetch channels');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchChannels();
//   }, []);

//   const handleOpenModal = (type, item = null) => {
//     setModalType(type);
//     setCurrentEditItem(item);
//     setModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setModalOpen(false);
//     setCurrentEditItem(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const form = e.target;
//     const itemData = {
//       name: form.name.value.trim(),
//       description: form.description.value.trim(),
//       imageUrl: form.imageUrl.value.trim(),
//       link: form.link.value.trim(),
//     };

//     try {
//       if (modalType === 'add') {
//         await axios.post(API_URL, itemData);
//       } else {
//         await axios.put(`${API_URL}/${currentEditItem._id}`, itemData);
//       }
//       form.reset();
//       handleCloseModal();
//       fetchChannels();
//     } catch (err) {
//       console.error(err.response?.data || err.message);
//       setError(err.response?.data?.message || `Failed to ${modalType} channel`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Are you sure you want to delete this channel?')) return;
//     setLoading(true);
//     setError(null);
//     try {
//       await axios.delete(`${API_URL}/${id}`);
//       fetchChannels();
//     } catch (err) {
//       setError('Failed to delete channel');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <p className="text-center text-gray-500">Loading channels...</p>;
//   if (error) return <p className="text-center text-red-500">Error: {error}</p>;

//   return (
//     <div>
//       <div className="flex justify-end mb-4">
//         <button
//           onClick={() => handleOpenModal('add')}
//           className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
//         >
//           <FaPlus />
//           <span>Add New Channel</span>
//         </button>
//       </div>
//       <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {channels.length > 0 ? (
//               channels.map(channel => (
//                 <tr key={channel._id}>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <img
//                       src={channel.imageUrl}
//                       alt={channel.name}
//                       className="h-12 w-12 rounded-lg object-cover"
//                     />
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{channel.name}</td>
//                   <td className="px-6 py-4 text-sm text-gray-500">{channel.description}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
//                     <button
//                       onClick={() => handleOpenModal('edit', channel)}
//                       className="text-blue-600 hover:text-blue-900"
//                     >
//                       <FaEdit />
//                     </button>
//                     <button
//                       onClick={() => handleDelete(channel._id)}
//                       className="text-red-600 hover:text-red-900"
//                     >
//                       <FaTrash />
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="4" className="text-center py-4 text-gray-500">No channels found.</td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {modalOpen && (
//         <Modal title={`${modalType === 'add' ? 'Add' : 'Edit'} Channel`} onClose={handleCloseModal}>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Channel Name</label>
//               <input
//                 type="text"
//                 name="name"
//                 defaultValue={currentEditItem?.name || ''}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Description</label>
//               <textarea
//                 name="description"
//                 defaultValue={currentEditItem?.description || ''}
//                 rows="3"
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
//                 required
//               ></textarea>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Image URL</label>
//               <input
//                 type="url"
//                 name="imageUrl"
//                 defaultValue={currentEditItem?.imageUrl || ''}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">Original Website Link</label>
//               <input
//                 type="url"
//                 name="link"
//                 defaultValue={currentEditItem?.link || ''}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
//                 required
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
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

// export default ChannelManagement;
