import React, { useState } from 'react';
import {
  CentralStudent,
  addStudentManually,
  approveStudentPayment,
  rejectStudentPayment,
  deleteStudentFromCentralDb,
  ProgramName,
  ProgramLevel,
  ProgramGroup,
} from '../../services/centralStudentDatabase';
import {
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Copy,
  Check,
  Phone,
  Mail,
  User,
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Bookmark,
  Users,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface RegisteredStudentsListTabProps {
  students: CentralStudent[];
  onRefresh: () => void;
  onOpenMentorshipChart?: (student: CentralStudent) => void;
}

export const RegisteredStudentsListTab: React.FC<RegisteredStudentsListTabProps> = ({
  students,
  onRefresh,
  onOpenMentorshipChart,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'unpaid' | 'rejected'>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Action states
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingStudent, setRejectingStudent] = useState<CentralStudent | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletingStudent, setDeletingStudent] = useState<CentralStudent | null>(null);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualFormError, setManualFormError] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    program: 'CS Executive' as ProgramName,
    level: 'Level 2' as ProgramLevel,
    group: 'Group 1' as ProgramGroup,
    initialPaymentStatus: 'unpaid' as 'unpaid' | 'approved',
    courseName: 'CS Executive (Group 1) Mentorship',
    amount: '2999',
    utrNumber: '',
  });

  const pendingCount = students.filter((s) => s.paymentStatus === 'pending_approval').length;
  const approvedCount = students.filter((s) => s.paymentStatus === 'approved').length;
  const unpaidCount = students.filter((s) => s.paymentStatus === 'unpaid').length;
  const rejectedCount = students.filter((s) => s.paymentStatus === 'rejected').length;

  // Filtered students
  const filteredStudents = students.filter((s) => {
    // Status Filter
    if (statusFilter === 'pending' && s.paymentStatus !== 'pending_approval') return false;
    if (statusFilter === 'approved' && s.paymentStatus !== 'approved') return false;
    if (statusFilter === 'unpaid' && s.paymentStatus !== 'unpaid') return false;
    if (statusFilter === 'rejected' && s.paymentStatus !== 'rejected') return false;

    // Program Filter
    if (programFilter !== 'all' && !s.program?.toLowerCase().includes(programFilter.toLowerCase())) {
      return false;
    }

    // Search Query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const utr = (s.purchasedCourse?.utrNumber || s.purchasedCourse?.transactionRef || '').toLowerCase();
      const matchName = s.fullName?.toLowerCase().includes(q);
      const matchEmail = s.email?.toLowerCase().includes(q);
      const matchPhone = s.phone?.includes(q);
      const matchUtr = utr.includes(q);
      const matchCourse = s.purchasedCourse?.courseName?.toLowerCase().includes(q);
      const matchId = s.studentId?.toLowerCase().includes(q);
      const matchProgram = s.targetExam?.toLowerCase().includes(q);

      return matchName || matchEmail || matchPhone || matchUtr || matchCourse || matchId || matchProgram;
    }

    return true;
  });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  const handleApprove = async (student: CentralStudent) => {
    setApprovingId(student.studentId);
    try {
      const res = approveStudentPayment(student.studentId);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingStudent) return;
    rejectStudentPayment(
      rejectingStudent.studentId,
      rejectionReason || 'UPI UTR transaction could not be verified in bank records.'
    );
    setRejectingStudent(null);
    setRejectionReason('');
    onRefresh();
  };

  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    deleteStudentFromCentralDb(deletingStudent.studentId);
    setDeletingStudent(null);
    onRefresh();
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualFormError('');
    setManualSuccessMsg('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setManualFormError('Student Name, Email, and Phone number are required.');
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = addStudentManually({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        program: formData.program,
        level: formData.level,
        group: formData.group,
        initialPaymentStatus: formData.initialPaymentStatus,
        courseName: formData.courseName.trim(),
        amount: Number(formData.amount) || 0,
        utrNumber: formData.utrNumber.trim() || undefined,
      });

      if (res.success) {
        setManualSuccessMsg(res.message);
        setTimeout(() => {
          setIsAddModalOpen(false);
          setManualSuccessMsg('');
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            program: 'CS Executive',
            level: 'Level 2',
            group: 'Group 1',
            initialPaymentStatus: 'unpaid',
            courseName: 'CS Executive (Group 1) Mentorship',
            amount: '2999',
            utrNumber: '',
          });
          onRefresh();
        }, 800);
      } else {
        setManualFormError(res.message);
      }
    } catch (err: any) {
      setManualFormError(err.message || 'Failed to add student.');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-[#171512] to-[#0F0F0F] text-white border-2 border-[#C8A45D]/40 p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C8A45D]/20 border border-[#C8A45D]/50 flex items-center justify-center text-[#FFE3A0] shrink-0">
            <Users className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-montserrat font-bold text-[#FFE3A0] tracking-wider flex items-center gap-2">
              <span>Real Registered Students</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
                Cloud Sync Active
              </span>
            </div>
            <h2 className="font-cinzel text-lg sm:text-xl font-bold text-white mt-0.5">
              Registered Students & Purchase Tracker
            </h2>
            <p className="text-xs text-gray-400">
              Complete centralized database of real registered students, 12-digit UPI UTR submissions, and instant payment approval actions.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#C8A45D] to-[#B38E46] text-black font-montserrat font-bold text-xs rounded-xl shadow-md hover:brightness-110 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Student Manually</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-all cursor-pointer border border-white/10"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Students ({students.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Approval ({pendingCount})</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
              )}
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved ({approvedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
                statusFilter === 'unpaid'
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unpaid ({unpaidCount})
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Program Select */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="text-xs font-montserrat font-semibold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C8A45D]"
            >
              <option value="all">All Programs</option>
              <option value="CS Executive">CS Executive</option>
              <option value="CS Professional">CS Professional</option>
              <option value="CS EET">CS EET</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, email, phone number, 12-digit UTR, course name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D] placeholder:text-gray-400 font-montserrat"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-montserrat uppercase font-bold text-gray-500 tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Program & Group</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Course / Index</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">12-Digit UTR</th>
                <th className="py-3.5 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                        <Users className="w-7 h-7" />
                      </div>
                      <h3 className="font-cinzel text-base font-bold text-gray-800">
                        No registered students yet.
                      </h3>
                      <p className="text-xs text-gray-500 font-montserrat leading-relaxed">
                        Students will appear here once they register through the website or when added manually by Admin.
                      </p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A45D] text-black font-montserrat font-bold text-xs rounded-xl shadow hover:brightness-105 transition-all cursor-pointer mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Student Manually</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const course = s.purchasedCourse;
                  const utr = course?.utrNumber || course?.transactionRef || '';
                  const isPending = s.paymentStatus === 'pending_approval';
                  const isApproved = s.paymentStatus === 'approved';
                  const isRejected = s.paymentStatus === 'rejected';
                  const isUnpaid = s.paymentStatus === 'unpaid';

                  const regDate = s.registeredAt
                    ? new Date(s.registeredAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A';

                  const amountVal = course?.finalAmount || course?.amount || 0;

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
                          <div className="w-9 h-9 rounded-xl bg-[#FAF5E9] border border-[#C8A45D]/50 text-[#8A651E] font-bold flex items-center justify-center font-cinzel shrink-0">
                            {s.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                              <span>{s.fullName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({s.studentId})</span>
                            </div>
                            <div className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 text-gray-400" />
                              <span>{s.email}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-gray-400" />
                              <span>{s.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Program & Group */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs">
                          {s.program}
                        </div>
                        <div className="text-[10px] text-gray-500 font-montserrat">
                          {s.level} • <span className="font-semibold text-gray-700">{s.group}</span>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 font-montserrat whitespace-nowrap">
                        {regDate}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-900 border border-amber-400 rounded-lg text-[10px] font-extrabold uppercase font-montserrat shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                            PENDING APPROVAL
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-extrabold uppercase font-montserrat">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            APPROVED
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 rounded-lg text-[10px] font-extrabold uppercase font-montserrat">
                            <XCircle className="w-3 h-3 text-red-600" />
                            REJECTED
                          </span>
                        )}
                        {isUnpaid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-[10px] font-bold uppercase font-montserrat">
                            UNPAID
                          </span>
                        )}
                      </td>

                      {/* Course / Index Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs max-w-[200px] truncate" title={course?.courseName || 'None'}>
                          {course?.courseName || (isUnpaid ? 'Awaiting purchase' : s.targetExam)}
                        </div>
                        {course?.discountCodeUsed && (
                          <div className="text-[10px] text-emerald-700 font-mono font-semibold">
                            Promo: {course.discountCodeUsed}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-montserrat font-bold whitespace-nowrap">
                        {amountVal > 0 ? (
                          <span className="text-[#8A651E]">₹{amountVal.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>

                      {/* 12-Digit UTR */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        {utr ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded-lg border border-gray-300">
                              {utr}
                            </span>
                            <button
                              onClick={() => handleCopyUtr(utr)}
                              className="p-1 hover:bg-gray-200 text-gray-500 rounded transition-colors cursor-pointer"
                              title="Copy 12-digit UTR"
                            >
                              {copiedUtr === utr ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-sans text-xs">No UTR</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(s)}
                                disabled={approvingId === s.studentId}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-montserrat font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                              >
                                {approvingId === s.studentId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => setRejectingStudent(s)}
                                className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-montserrat font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <div className="flex items-center gap-1">
                              {onOpenMentorshipChart && (
                                <button
                                  onClick={() => onOpenMentorshipChart(s)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-montserrat font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Open Student Mentorship Tracker"
                                >
                                  <Bookmark className="w-3 h-3 text-amber-600" />
                                  <span>Tracker</span>
                                </button>
                              )}
                              <button
                                onClick={() => setRejectingStudent(s)}
                                className="px-2 py-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded text-[11px] font-montserrat transition-all cursor-pointer"
                                title="Revoke Approval"
                              >
                                Revoke
                              </button>
                            </div>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(s)}
                              disabled={approvingId === s.studentId}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-montserrat font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <span>Re-Approve</span>
                            </button>
                          )}

                          {isUnpaid && (
                            <button
                              onClick={() => handleApprove(s)}
                              disabled={approvingId === s.studentId}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-[11px] font-montserrat font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <span>Mark Approved</span>
                            </button>
                          )}

                          {/* Delete Student Option */}
                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-1"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ========================================================================= */}
      {/* MODAL: + Add Student Manually                                            */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-gray-900">
                    Add Student Manually
                  </h3>
                  <p className="text-[11px] text-gray-500 font-montserrat">
                    Creates a real student in the central database with immediate access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {manualFormError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-montserrat flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{manualFormError}</span>
              </div>
            )}

            {manualSuccessMsg && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-montserrat flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{manualSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleManualAddSubmit} className="mt-4 space-y-4 text-xs font-montserrat">
              {/* Full Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Registered Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </div>

              {/* Program & Level / Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Program</label>
                  <select
                    value={formData.program}
                    onChange={(e) => {
                      const prog = e.target.value as ProgramName;
                      setFormData({
                        ...formData,
                        program: prog,
                        level: prog === 'CS EET' ? 'Level 1' : prog === 'CS Professional' ? 'Level 3' : 'Level 2',
                        group: prog === 'CS EET' ? 'EET' : 'Group 1',
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                  >
                    <option value="CS Executive">CS Executive</option>
                    <option value="CS Professional">CS Professional</option>
                    <option value="CS EET">CS EET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Level</label>
                  <input
                    type="text"
                    disabled
                    value={formData.level}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Group</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as ProgramGroup })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                  >
                    {formData.program === 'CS EET' ? (
                      <option value="EET">Complete EET</option>
                    ) : (
                      <>
                        <option value="Group 1">Group 1</option>
                        <option value="Group 2">Group 2</option>
                        <option value="Both Groups">Both Groups</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Initial Payment Status */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <label className="block text-gray-800 font-bold">
                  Initial Payment Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                    <input
                      type="radio"
                      name="initialPaymentStatus"
                      value="unpaid"
                      checked={formData.initialPaymentStatus === 'unpaid'}
                      onChange={() => setFormData({ ...formData, initialPaymentStatus: 'unpaid' })}
                      className="accent-[#C8A45D]"
                    />
                    <span>Unpaid (Student will pay online)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800">
                    <input
                      type="radio"
                      name="initialPaymentStatus"
                      value="approved"
                      checked={formData.initialPaymentStatus === 'approved'}
                      onChange={() => setFormData({ ...formData, initialPaymentStatus: 'approved' })}
                      className="accent-emerald-600"
                    />
                    <span>Approved (Unlock Course Now)</span>
                  </label>
                </div>
              </div>

              {/* Optional Course / UTR fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Course / Index Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS Executive Group 1 Mentorship"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="2999"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">
                      12-Digit UTR (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 928408123456"
                      value={formData.utrNumber}
                      onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#C8A45D]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C8A45D] to-[#B38E46] hover:brightness-110 text-black font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingManual ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Add Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Reject Payment Reason                                              */}
      {/* ========================================================================= */}
      {rejectingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-base font-bold text-gray-900">
              Reject Payment for {rejectingStudent.fullName}?
            </h3>
            <p className="text-xs text-gray-500 font-montserrat mt-1">
              The student's payment status will be updated to "REJECTED". Their student portal will advise them to contact Harkiran Kaur or re-submit their UTR.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-700 mb-1 font-montserrat">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR number not found in ICICI / HDFC merchant statement. Please check and re-submit."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-red-500 font-montserrat"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setRejectingStudent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-montserrat font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-montserrat font-bold text-xs cursor-pointer shadow-sm"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Delete Student Confirm                                             */}
      {/* ========================================================================= */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-cinzel text-base font-bold text-gray-900">
              Remove Student Record?
            </h3>
            <p className="text-xs text-gray-500 font-montserrat mt-1">
              Are you sure you want to remove <span className="font-bold text-gray-900">{deletingStudent.fullName}</span> ({deletingStudent.email})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-montserrat font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-montserrat font-bold text-xs cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
