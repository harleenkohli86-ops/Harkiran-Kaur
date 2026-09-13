import React, { useState } from 'react';
import { CentralStudent } from '../../services/centralStudentDatabase';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Loader2,
  Check,
  X,
  UserCheck,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface RegistrationApprovalsTabProps {
  students: CentralStudent[];
  approvingId: string | null;
  onApproveRegistration: (student: CentralStudent) => void;
  onRejectRegistration: (student: CentralStudent) => void;
  onRefresh: () => void;
}

export const RegistrationApprovalsTab: React.FC<RegistrationApprovalsTabProps> = ({
  students,
  approvingId,
  onApproveRegistration,
  onRejectRegistration,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const pendingCount = students.filter((s) => s.registrationStatus === 'pending_approval').length;
  const approvedCount = students.filter((s) => s.registrationStatus === 'approved').length;
  const rejectedCount = students.filter((s) => s.registrationStatus === 'rejected').length;

  const filtered = students.filter((s) => {
    if (statusFilter === 'pending' && s.registrationStatus !== 'pending_approval') return false;
    if (statusFilter === 'approved' && s.registrationStatus !== 'approved') return false;
    if (statusFilter === 'rejected' && s.registrationStatus !== 'rejected') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchPhone = s.phone.includes(q);
      const matchId = s.studentId.toLowerCase().includes(q);
      const matchProgram = s.targetExam.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchId || matchProgram;
    }
    return true;
  });

  const handleSendWhatsApp = (student: CentralStudent) => {
    const cleanPhone = student.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
    const msg = student.registrationStatus === 'approved'
      ? `Hello ${student.fullName}! Your HK Code of Rankers registration has been approved by Harkiran Kaur! 🎉\n\nYou can now log in to your Student Portal using your email: ${student.email}. Once logged in, you can complete your course enrollment and access your personalized mentorship roadmap.`
      : `Hello ${student.fullName}! This is Harkiran Kaur's team from HK Code of Rankers regarding your ${student.targetExam} registration.`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-[#171512] to-[#0F0F0F] text-white border-2 border-[#C8A45D]/40 p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C8A45D]/20 border border-[#C8A45D]/50 flex items-center justify-center text-[#FFE3A0] shrink-0">
            <UserCheck className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-montserrat font-bold text-[#FFE3A0] tracking-wider flex items-center gap-1.5">
              <span>Central Student Database</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px]">
                Live Connected
              </span>
            </div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-white mt-0.5">
              Student Registration Approvals
            </h2>
            <p className="text-xs text-gray-400">
              When students register on the Student Portal, their application arrives here. Once approved, the student can log in and purchase courses.
            </p>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            <span>All ({students.length})</span>
          </button>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A45D]"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white border border-[#C8A45D]/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1C1917] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Program & Level</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-center">Registration Status</th>
                <th className="py-3.5 px-4 text-right">Admin Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 text-xs">
                    {statusFilter === 'pending'
                      ? '🎉 No registrations pending approval at this time! All accounts verified.'
                      : 'No student registrations match your filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isPending = s.registrationStatus === 'pending_approval';
                  const isApproved = s.registrationStatus === 'approved';
                  const isRejected = s.registrationStatus === 'rejected';

                  return (
                    <tr
                      key={s.studentId}
                      className={`transition-colors ${
                        isPending ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl border font-bold flex items-center justify-center font-cinzel ${
                              isApproved
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-rose-100 border-rose-300 text-rose-800'
                            }`}
                          >
                            {s.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                              <span>{s.fullName}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              ID: {s.studentId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-gray-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-gray-900">
                            <Mail className="w-3 h-3 text-[#C8A45D]" />
                            <span>{s.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{s.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Program & Level */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 bg-[#1C1917] text-[#FFE3A0] text-[10px] font-bold rounded-lg font-cinzel">
                          {s.targetExam}
                        </span>
                        <div className="text-[10px] text-gray-500 pt-0.5 font-medium">
                          {s.level} • {s.group}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-gray-600 text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Approved (Can Log In)</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <X className="w-3 h-3 text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => onApproveRegistration(s)}
                                disabled={approvingId === s.studentId}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-montserrat font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Approve student registration, enable portal login, and dispatch official approval email"
                              >
                                {approvingId === s.studentId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => onRejectRegistration(s)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                                title="Reject this registration"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSendWhatsApp(s)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                title="Send WhatsApp notification"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onApproveRegistration(s)}
                                disabled={approvingId === s.studentId}
                                className="text-[10px] text-[#8A651E] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                title="Resend official registration approval email"
                              >
                                {approvingId === s.studentId ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Mail className="w-2.5 h-2.5" />
                                )}
                                <span>Resend Email</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
