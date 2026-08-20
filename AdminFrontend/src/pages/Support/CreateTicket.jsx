import React, { useState, useRef } from 'react'; // Import useRef
import {
  Home,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  Code,
  Image,
  MessageSquare,
  ChevronDown,
  Check,
  UploadCloud, // Added icon
  X, // Added icon
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Glass Card Component (Standard Premium Card) ---
const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 ${className}`}>
    {children}
  </div>
);

// --- Breadcrumbs Component ---
const Breadcrumbs = () => (
  <nav className="flex items-center text-sm mb-8" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1 md:space-x-2">
      <li className="inline-flex items-center">
        <a href="#" className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-bold transition-colors">
          <Home className="w-4 h-4 mr-2" />
          Home
        </a>
      </li>
      <li>
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <a href="#" className="ml-1 text-slate-500 hover:text-indigo-600 font-bold transition-colors md:ml-2">Helpdesk</a>
        </div>
      </li>
      <li aria-current="page">
        <div className="flex items-center">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="ml-1 text-slate-400 font-bold md:ml-2">Create Ticket</span>
        </div>
      </li>
    </ol>
  </nav>
);

// --- Rich Text Editor Toolbar (simplified) ---
const RichTextToolbar = () => (
  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-t-xl border-b border-slate-200">
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 font-bold text-sm flex items-center gap-1 transition-colors">
      Normal <ChevronDown className="w-3 h-3" />
    </button>
    <div className="w-px h-6 bg-slate-200 mx-1"></div>
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"><Bold className="w-4 h-4" /></button>
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"><Italic className="w-4 h-4" /></button>
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"><Underline className="w-4 h-4" /></button>
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"><List className="w-4 h-4" /></button>
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"><Code className="w-4 h-4" /></button>
    <button className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"><Image className="w-4 h-4" /></button>
  </div>
);

// --- New CustomSelect Component ---
const CustomSelect = ({ label, options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close on blur with a small delay to allow click events to register
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div className="relative">
      <label htmlFor={label} className="block text-slate-700 text-sm font-black uppercase tracking-wide mb-3">{label}</label>
      <button
        type="button"
        id={label}
        className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 flex justify-between items-center text-left"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={handleBlur}
      >
        <span>{selected ? selected.label : 'Select Option'}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-auto py-2">
          <ul className="">
            {options.map((option) => (
              <li
                key={option.value}
                className="px-4 py-3 text-slate-700 font-bold hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                onMouseDown={() => { // Use onMouseDown to prevent blur from firing before click
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                {option.label}
                {selected && selected.value === option.value && <Check className="w-5 h-5 text-indigo-600" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


// --- Main App Component ---
export default function CreateTicket() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('hello.'); // Pre-fill as per image
  const [files, setFiles] = useState([]); // State for files
  const [isDragging, setIsDragging] = useState(false); // State for drag-over
  const fileInputRef = useRef(null); // Ref for hidden file input

  // State for custom selects
  const customerOptions = [
    { value: 'customer1', label: 'Customer 1' },
    { value: 'customer2', label: 'Customer 2' },
    { value: 'customer3', label: 'Customer 3' },
  ];
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const categoryOptions = [
    { value: 'category1', label: 'Category A' },
    { value: 'category2', label: 'Category B' },
    { value: 'category3', label: 'Category C' },
  ];
  const [selectedCategory, setSelectedCategory] = useState(null);

  // --- File Handling Logic ---
  const handleFileAdd = (incomingFiles) => {
    const newFiles = Array.from(incomingFiles);
    // Prevent duplicates
    const uniqueNewFiles = newFiles.filter(
      (newFile) => !files.some((existingFile) => existingFile.name === newFile.name)
    );
    setFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
  };

  const handleFileRemove = (fileName) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileAdd(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    handleFileAdd(e.target.files);
  };

  const handleDropZoneClick = () => {
    fileInputRef.current.click();
  };
  // --- End File Handling ---

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted!', {
      customer: selectedCustomer ? selectedCustomer.value : null,
      category: selectedCategory ? selectedCategory.value : null,
      subject,
      description,
      files: files.map(f => f.name) // Log file names
    });
    // Add logic to send data to your MERN backend
    // You would typically use FormData to upload files
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="flex-1 max-w-5xl mx-auto">
        <Breadcrumbs />

        <div className="flex items-center gap-4 mb-8">
          <Link to="/help-desk/ticket/list" className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-indigo-600 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Ticket</h1>
            <p className="text-slate-500 font-bold mt-1">Submit a new support ticket</p>
          </div>
        </div>

        <GlassCard className="p-10">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Customer Select */}
              <CustomSelect
                label="Customer"
                options={customerOptions}
                selected={selectedCustomer}
                onSelect={setSelectedCustomer}
              />

              {/* Category Select */}
              <CustomSelect
                label="Category"
                options={categoryOptions}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

            {/* Subject Input */}
            <div className="mb-8">
              <label htmlFor="subject" className="block text-slate-700 text-sm font-black uppercase tracking-wide mb-3">Subject</label>
              <input
                type="text"
                id="subject"
                placeholder="Enter Subject"
                className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-slate-700 placeholder:text-slate-400"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Description Editor */}
            <div className="mb-8">
              <label htmlFor="description" className="block text-slate-700 text-sm font-black uppercase tracking-wide mb-3">Description</label>
              <div className="bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                <RichTextToolbar />
                <textarea
                  id="description"
                  rows="8"
                  className="w-full p-4 bg-transparent focus:outline-none resize-none text-slate-700 placeholder-slate-400 font-medium"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* File Drop Area */}
            <div
              className={`border-3 border-dashed rounded-2xl p-12 text-center mb-6 cursor-pointer transition-all duration-300 group ${isDragging ? 'bg-indigo-50 border-indigo-500 scale-[1.02]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-indigo-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
                multiple
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="font-black text-slate-800 text-lg mb-1">Drop files here or click to upload</p>
                <p className="text-sm font-bold text-slate-400">You can add multiple files</p>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mb-8 space-y-3">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">Selected Files:</h4>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <span className="text-sm font-bold text-slate-700 truncate flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleFileRemove(file.name)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all duration-300 font-bold"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300 font-bold flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Submit Ticket
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}