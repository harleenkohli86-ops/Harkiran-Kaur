import React, { useState } from 'react';
import {
  SlotBookingRecord,
  updateSlotBookingStatus,
  deleteSlotBooking,
} from '../../services/centralStudentDatabase';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  MessageSquare,
  Sparkles,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface SlotBookingsTabProps {
  bookings: SlotBookingRecord[];
  onRefresh: () => void;
}

export const SlotBookingsTab: React.FC<SlotBookingsTabProps> = ({
  bookings,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [remarksInput, setRemarksInput] = useState('');

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const handleStatusChange = (
    bookingId: string,
    newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    updateSlotBookingStatus(bookingId, newStatus);
    onRefresh();
  };

  const handleSaveRemarks = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    updateSlotBookingStatus(bookingId, booking.status, remarksInput);
    setEditingRemarksId(null);
    setRemarksInput('');
    onRefresh();
  };

  const handleDelete = (bookingId: string) => {
    if (confirm('Are you sure you want to delete this slot booking?')) {
      deleteSlotBooking(bookingId);
      onRefresh();
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.studentName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.program.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openWhatsApp = (b: SlotBookingRecord) => {
    const cleanPhone = b.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${b.studentName}! This is Harkiran Kaur from HK Code of Rankers.\n\n` +
      `Your 1-on-1 Mentorship Call has been scheduled:\n` +
      `📅 Date: ${b.bookingDate}\n` +
      `⏰ Time: ${b.bookingTime}\n` +
      `📚 Program: ${b.program} (${b.group})\n` +
      `📞 Type: ${b.callType}\n` +
      `🆔 Booking ID: ${b.id}\n\n` +
      `Please ensure your webcam and study syllabus tracker are ready. Looking forward to our call!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171512] to-[#0F0F0F] text-white border-2 border-[#C8A45D]/40 p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C8A45D]/20 border border-[#C8A45D]/50 flex items-center justify-center text-[#FFE3A0] shrink-0">
            <Calendar className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-montserrat font-bold text-[#FFE3A0] tracking-wider flex items-center gap-1.5">
              <span>Admin Control Center</span>
              <span className="px-1.5 py-0.2 bg-[#C8A45D]/20 text-[#FFE3A0] border border-[#C8A45D]/40 rounded text-[9px]">
                Weekly 1-on-1 Calls
              </span>
            </div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-white mt-0.5">
              Slot Bookings (Weekly 1-on-1 Mentorship Calls)
            </h2>
            <p className="text-xs text-gray-400">
              Manage all weekly guidance calls booked by enrolled students. Send automated WhatsApp reminders and update booking status.
            </p>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'confirmed'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, registered email, phone or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A45D]"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-[#C8A45D]/30 rounded-2xl shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-medium text-sm">No slot bookings found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1C1917] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking ID & Date</th>
                  <th className="py-3.5 px-4">Student Info</th>
                  <th className="py-3.5 px-4">Program & Slot Time</th>
                  <th className="py-3.5 px-4">Call Details</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredBookings.map((b) => {
                  const isEditingRemarks = editingRemarksId === b.id;

                  return (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Booking ID & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs bg-[#FAF5E9] text-[#8A651E] px-2 py-0.5 rounded border border-[#C8A45D]/30">
                          {b.id}
                        </span>
                        <div className="text-[11px] text-gray-500 font-medium mt-1">
                          Booked: {new Date(b.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#C8A45D]" />
                          <span>{b.studentName}</span>
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="font-mono">{b.email}</span>
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{b.phone}</span>
                        </div>
                      </td>

                      {/* Program & Slot Time */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-bold text-gray-800 text-xs">
                          {b.program}
                        </div>
                        <div className="text-[11px] text-[#8A651E] font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C8A45D]" />
                          <span>{b.bookingDate} • {b.bookingTime}</span>
                        </div>
                        {b.group && (
                          <span className="inline-block text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {b.group}
                          </span>
                        )}
                      </td>

                      {/* Call Details / Notes */}
                      <td className="py-3.5 px-4 space-y-1 max-w-xs">
                        <div className="text-xs font-semibold text-gray-700">
                          {b.callType || 'Mentorship 1-on-1 Call'}
                        </div>
                        {b.notes && (
                          <p className="text-[11px] text-gray-500 italic bg-gray-50 p-1.5 rounded border border-gray-100">
                            "{b.notes}"
                          </p>
                        )}
                        {b.adminRemarks && !isEditingRemarks && (
                          <div className="text-[10.5px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            <strong>Remarks:</strong> {b.adminRemarks}
                          </div>
                        )}
                        {isEditingRemarks && (
                          <div className="flex items-center gap-1 mt-1">
                            <input
                              type="text"
                              value={remarksInput}
                              onChange={(e) => setRemarksInput(e.target.value)}
                              placeholder="Add admin remarks..."
                              className="px-2 py-1 bg-white border border-gray-300 rounded text-xs flex-1"
                            />
                            <button
                              onClick={() => handleSaveRemarks(b.id)}
                              className="px-2 py-1 bg-[#C8A45D] text-black font-bold text-xs rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingRemarksId(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={b.status}
                          onChange={(e) =>
                            handleStatusChange(
                              b.id,
                              e.target.value as 'pending' | 'confirmed' | 'completed' | 'cancelled'
                            )
                          }
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : b.status === 'completed'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : b.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openWhatsApp(b)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="Send WhatsApp Confirmation"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRemarksId(b.id);
                              setRemarksInput(b.adminRemarks || '');
                            }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors cursor-pointer"
                            title="Edit Remarks"
                          >
                            Remarks
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
