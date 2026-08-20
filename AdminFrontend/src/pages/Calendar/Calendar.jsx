import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Calendar as CalendarIcon, Clock, AlignLeft } from 'lucide-react';
import DeleteConfirmationModal from '../../Components/DeleteConfirmationModal';

const Calender = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([
    {
      id: '1',
      title: 'All Day Event',
      start: new Date().toISOString().split('T')[0] + 'T00:00',
      end: new Date().toISOString().split('T')[0] + 'T23:59',
      color: '#6366f1',
      description: ''
    },
    {
      id: '2',
      title: 'Long Event',
      start: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T00:00',
      end: new Date(Date.now() + 259200000).toISOString().split('T')[0] + 'T23:59',
      color: '#10b981',
      description: ''
    },
    {
      id: '3',
      title: 'Meeting',
      start: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T10:30',
      end: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T11:30',
      color: '#3b82f6',
      description: ''
    },
    {
      id: '4',
      title: 'Lunch',
      start: new Date().toISOString().split('T')[0] + 'T12:00',
      end: new Date().toISOString().split('T')[0] + 'T13:00',
      color: '#f59e0b',
      description: ''
    },
    {
      id: '5',
      title: 'Birthday Party',
      start: new Date(Date.now() + 345600000).toISOString().split('T')[0] + 'T07:00',
      end: new Date(Date.now() + 345600000).toISOString().split('T')[0] + 'T10:00',
      color: '#ef4444',
      description: ''
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: ''
  });

  const draggableEvents = [
    { title: 'Team Meeting', duration: 60, color: '#6366f1', className: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { title: 'Project Review', duration: 120, color: '#f59e0b', className: 'bg-orange-50 text-orange-600 border-orange-100' },
    { title: 'Client Call', duration: 30, color: '#ef4444', className: 'bg-rose-50 text-rose-600 border-rose-100' },
    { title: 'Workshop', duration: 90, color: '#10b981', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { title: 'Training Session', duration: 60, color: '#3b82f6', className: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Design Sprint', duration: 120, color: '#8b5cf6', className: 'bg-purple-50 text-purple-600 border-purple-100' }
  ];

  const colorOptions = [
    { color: '#6366f1', bg: 'bg-indigo-500' },
    { color: '#f59e0b', bg: 'bg-orange-500' },
    { color: '#ef4444', bg: 'bg-rose-500' },
    { color: '#10b981', bg: 'bg-emerald-500' },
    { color: '#3b82f6', bg: 'bg-blue-500' },
    { color: '#8b5cf6', bg: 'bg-purple-500' }
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.start).toISOString().split('T')[0];
      const eventEnd = new Date(event.end).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const getTodayEventsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === today;
    }).length;
  };

  const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date) => {
    if (!date) return;
    setCurrentEvent(null);
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0);

    setFormData({
      title: '',
      description: '',
      start: formatDateTimeLocal(startDate),
      end: formatDateTimeLocal(endDate)
    });
    setSelectedColor('#6366f1');
    setIsModalOpen(true);
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start: formatDateTimeLocal(event.start),
      end: formatDateTimeLocal(event.end)
    });
    setSelectedColor(event.color);
    setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!formData.title || !formData.start) {
      alert('Please fill in the required fields');
      return;
    }

    if (currentEvent) {
      setEvents(events.map(evt =>
        evt.id === currentEvent.id
          ? { ...evt, ...formData, color: selectedColor }
          : evt
      ));
    } else {
      const newEvent = {
        id: Date.now().toString(),
        ...formData,
        color: selectedColor
      };
      setEvents([...events, newEvent]);
    }

    closeModal();
  };

  const handleDeleteEvent = () => {
    if (currentEvent) {
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteEvent = () => {
    if (currentEvent) {
      setEvents(events.filter(evt => evt.id !== currentEvent.id));
      setIsDeleteModalOpen(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEvent(null);
    setFormData({ title: '', description: '', start: '', end: '' });
  };

  const handleDragStart = (event) => {
    setDraggedEvent(event);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (date) => {
    if (!draggedEvent || !date) return;

    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + draggedEvent.duration);

    const newEvent = {
      id: Date.now().toString(),
      title: draggedEvent.title,
      start: startDate.toISOString().slice(0, 16),
      end: endDate.toISOString().slice(0, 16),
      color: draggedEvent.color,
      description: ''
    };

    setEvents([...events, newEvent]);
    setDraggedEvent(null);
  };

  const isTodayDate = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">Event Calendar</h2>
        <p className="text-slate-500 font-bold text-sm">Organize and manage your schedule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

        {/* Sidebar */}
        <div className="space-y-6 order-2 lg:order-1">

          {/* Calendar Stats */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                <span className="text-2xl font-black text-indigo-600">{events.length}</span>
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Total</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                <span className="text-2xl font-black text-emerald-600">{getTodayEventsCount()}</span>
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Today</span>
              </div>
            </div>
          </div>

          {/* Draggable Suggestions */}
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-4">Quick Add</h3>
            <div className="space-y-3">
              {draggableEvents.map((event, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(event)}
                  className={`flex items-center gap-3 p-3 ${event.className} border rounded-2xl cursor-move transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 group`}
                >
                  <div className={`w-1.5 h-6 rounded-full`} style={{ backgroundColor: event.color }}></div>
                  <span className="text-sm font-bold truncate">{event.title}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
              Drag items to the calendar
            </p>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden order-1 lg:order-2">

          {/* Calendar Controls */}
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {monthNames[currentDate.getMonth()]} <span className="text-slate-400">{currentDate.getFullYear()}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-px h-5 bg-slate-200 self-center mx-1"></div>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleToday}
                className="px-6 py-2.5 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                Today
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="p-1">
            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-slate-50">
              {dayNames.map(day => (
                <div key={day} className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-50">
              {days.map((date, index) => {
                const dayEvents = getEventsForDay(date);
                const isToday = isTodayDate(date);

                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(date)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(date)}
                    className={`min-h-[140px] p-3 bg-white hover:bg-slate-50/80 transition-all cursor-pointer group relative ${!date ? 'opacity-30 pointer-events-none' : ''
                      }`}
                  >
                    {date && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black transition-all ${isToday
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                              : 'text-slate-400 group-hover:text-slate-800'
                            }`}>
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="space-y-1.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => handleEventClick(event, e)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-sm transition-all hover:scale-[1.02] hover:brightness-110 flex items-center gap-1.5"
                              style={{ backgroundColor: event.color }}
                            >
                              <div className="w-1 h-1 rounded-full bg-white/50"></div>
                              <span className="truncate">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              + {dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shadow-lg shadow-indigo-100 ${currentEvent ? 'bg-amber-50 text-amber-600 shadow-amber-100' : 'bg-indigo-600 text-white'}`}>
                  {currentEvent ? <AlignLeft className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{currentEvent ? 'Edit Event' : 'Create Event'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentEvent ? 'Update existing details' : 'Add new event to schedule'}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft className="w-3 h-3" /> Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What's the plan?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* Timing Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> End
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Theme Color</label>
                <div className="flex gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.color}
                      onClick={() => setSelectedColor(option.color)}
                      className={`w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${option.bg} ${selectedColor === option.color ? 'ring-4 ring-indigo-100 scale-110' : ''
                        }`}
                    >
                      {selectedColor === option.color && <X className="w-5 h-5 text-white rotate-45" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {currentEvent && (
                  <button
                    onClick={handleDeleteEvent}
                    className="flex-1 px-6 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
                  </button>
                )}
                <button
                  onClick={handleSaveEvent}
                  className="flex-[2] px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {currentEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event"
        message={`Are you sure you want to delete the event "${currentEvent?.title || 'this event'}"? This action cannot be undone.`}
        isLoading={false}
      />
    </div>
  );
};

export default Calender;