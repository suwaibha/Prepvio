import React, { useState, useEffect } from "react";
import axios from "axios";
import { CONTENT_API_URL } from "../../../config/api";
import { Plus, Trash2, Edit2, Loader2, FolderOpen, Search, X } from "lucide-react";
import DeleteConfirmationModal from "../../../Components/DeleteConfirmationModal";

const CategoryManagement = () => {
  // --- State Management ---
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const API_URL = `${CONTENT_API_URL}/categories`;

  // --- API Effects ---
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      // Assuming backend structure is { data: [...] } based on your first snippet
      setCategories(response.data.data || []);
    } catch {
      setError("Failed to fetch categories. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return;

    setActionLoading(true);
    setError(null);
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${editId}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }

      // Reset State
      setFormData({ name: "" });
      setIsEditing(false);
      setEditId(null);

      // Refresh List
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred while saving.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name });
    setIsEditing(true);
    setEditId(category._id); // Using MongoDB default _id
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setActionLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/${categoryToDelete._id}`);
      await fetchCategories();
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete category.");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: "" });
    setError(null);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 w-full space-y-8 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Category Management</h1>
              <p className="text-slate-500 font-bold mt-1 text-sm">Organize your content structure</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-8">
              <h2 className="text-xl font-black mb-6 text-slate-800 flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Edit2 className="w-5 h-5 text-indigo-500" />
                    Edit Category
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-indigo-500" />
                    New Category
                  </>
                )}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-2 border-slate-200 rounded-xl p-4 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-bold text-slate-700 placeholder:font-normal"
                    placeholder="e.g. Development"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={actionLoading || !formData.name.trim()}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isEditing ? (
                      "Update Category"
                    ) : (
                      "Add Category"
                    )}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full py-4 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-all border-2 border-slate-200 font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: List & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 px-2">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 font-black text-xl min-w-[3rem] text-center">
                  {categories.length}
                </div>
                <span className="text-slate-500 font-bold text-sm uppercase tracking-wide">Total<br />Categories</span>
              </div>

              <div className="relative w-full sm:max-w-xs group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px]">
              {loading && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-slate-500 font-bold animate-pulse">Loading...</p>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-slate-700 font-black text-lg">No categories found</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Start by creating your first category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCategories.map((category, index) => (
                    <div
                      key={category._id}
                      className={`group bg-white border-2 ${editId === category._id ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-100 hover:border-indigo-200'} rounded-2xl p-4 flex justify-between items-center transition-all shadow-sm hover:shadow-md`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-inner ${editId === category._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'} transition-colors`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-1">
                            {category.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wide uppercase mt-0.5">
                            ID: {category._id.slice(-6)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDeleteCategory}
        itemName={categoryToDelete?.name}
        title="Delete Category"
      />
    </div>
  );
};

export default CategoryManagement;





// // CategoryManagement.jsx
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";

// const CategoryManagement = () => {
//   const [categories, setCategories] = useState([]);
//   const [formData, setFormData] = useState({ name: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editId, setEditId] = useState(null);

//   const API_URL = "http://localhost:8000/api/categories";

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const fetchCategories = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await axios.get(API_URL);
//       setCategories(response.data.data);
//     } catch (err) {
//       setError("Failed to fetch categories.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);
//     try {
//       if (isEditing) {
//         await axios.put(`${API_URL}/${editId}`, formData);
//       } else {
//         await axios.post(API_URL, formData);
//       }
//       setFormData({ name: "" }); // Reset form to only the name field
//       setIsEditing(false);
//       setEditId(null);
//       fetchCategories();
//     } catch (err) {
//       setError(err.response?.data?.error || "An error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (category) => {
//     setFormData({ name: category.name }); // Set form data to only the name
//     setIsEditing(true);
//     setEditId(category._id);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to delete this category?")) {
//       setLoading(true);
//       setError(null);
//       try {
//         await axios.delete(`${API_URL}/${id}`);
//         fetchCategories();
//       } catch (err) {
//         setError(err.response?.data?.error || "Failed to delete category.");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">Category Management</h1>

//       <div className="bg-white p-6 rounded-lg shadow-md mb-6">
//         <h2 className="text-xl font-semibold mb-4">
//           {isEditing ? "Edit Category" : "Add New Category"}
//         </h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Name</label>
//             <input
//               type="text"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
//               required
//             />
//           </div>
//           <div className="flex justify-end space-x-2">
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//               disabled={loading}
//             >
//               {loading ? "Saving..." : isEditing ? "Update" : "Add Category"}
//             </button>
//             {isEditing && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   setIsEditing(false);
//                   setEditId(null);
//                   setFormData({ name: "" });
//                 }}
//                 className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
//                 disabled={loading}
//               >
//                 Cancel
//               </button>
//             )}
//           </div>
//         </form>
//         {error && <p className="mt-4 text-red-500">{error}</p>}
//       </div>

//       <div className="bg-white p-6 rounded-lg shadow-md">
//         <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>
//         {loading && <p>Loading categories...</p>}
//         {!loading && categories.length === 0 && (
//           <p className="text-gray-500">No categories found.</p>
//         )}
//         {!loading && categories.length > 0 && (
//           <ul className="space-y-4">
//             {categories.map((category) => (
//               <li
//                 key={category._id}
//                 className="border rounded-md p-4 flex justify-between items-center"
//               >
//                 <div>
//                   <h3 className="font-semibold">{category.name}</h3>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     onClick={() => handleEdit(category)}
//                     className="text-blue-600 hover:text-blue-800"
//                     title="Edit"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(category._id)}
//                     className="text-red-600 hover:text-red-800"
//                     title="Delete"
//                   >
//                     <FaTrash />
//                   </button>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CategoryManagement;
