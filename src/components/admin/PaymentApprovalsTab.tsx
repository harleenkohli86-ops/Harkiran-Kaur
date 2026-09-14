import React, { useState } from 'react';
import { CentralStudent } from '../../services/centralStudentDatabase';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  Copy,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Bookmark,
  DollarSign,
  Tag,
  AlertTriangle,
} from 'lucide-react';

interface PaymentApprovalsTabProps {
  students: CentralStudent[];
  approvingId: string | null;
  onApprovePayment: (student: CentralStudent) => void;
  onRejectPayment: (student: CentralStudent) => void;
  onOpenMentorshipChart: (student: CentralStudent) => void;
  onRefresh: () => void;
}

export const PaymentApprovalsTab: React.FC<PaymentApprovalsTabProps> = ({
  students,
  approvingId,
  onApprovePayment,
  onRejectPayment,
  onOpenMentorshipChart,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Students who have submitted a course payment or purchase
  const paymentRecords = students.filter(
    (s) => s.purchasedCourse || s.paymentStatus !== 'unpaid'
  );

  const pendingCount = paymentRecords.filter((s) => s.paymentStatus === 'pending_approval').length;
  const approvedCount = paymentRecords.filter((s) => s.paymentStatus === 'approved').length;
  const rejectedCount = paymentRecords.filter((s) => s.paymentStatus === 'rejected').length;

  const filtered = paymentRecords.filter((s) => {
    if (statusFilter === 'pending' && s.paymentStatus !== 'pending_approval') return false;
    if (statusFilter === 'approved' && s.paymentStatus !== 'approved') return false;
    if (statusFilter === 'rejected' && s.paymentStatus !== 'rejected') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.fullName.toLowerCase().includes(q);
      const matchEmail = s.email.toLowerCase().includes(q);
      const matchPhone = s.phone.includes(q);
      const matchUtr = s.purchasedCourse?.utrNumber?.toLowerCase().includes(q);
      const matchOrder = s.purchasedCourse?.orderId?.toLowerCase().includes(q);
      const matchCourse = s.purchasedCourse?.courseName?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchUtr || matchOrder || matchCourse;
    }
    return true;
  });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Instructions */}
      <div className="bg-gradient-to-r from-[#1A1813] to-[#12110D] text-white border-2 border-[#C8A45D]/40 p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C8A45D]/20 border border-[#C8A45D]/50 flex items-center justify-center text-[#FFE3A0] shrink-0">
            <CreditCard className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-montserrat font-bold text-[#FFE3A0] tracking-wider flex items-center gap-1.5">
              <span>Central Payment Gateway</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px]">
                12-Digit UTR Verification
              </span>
            </div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-white mt-0.5">
              Course Purchase & Payment Approvals
            </h2>
            <p className="text-xs text-gray-400">
              When approved students purchase a course and submit their payment UTR details, review them below. Approving payment unlocks their full syllabus index, red marking tracker, and 12-month strategy calls table.
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
            <span>All Payments ({paymentRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, 12-digit UTR, email, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A45D]"
          />
        </div>

        <button
          onClick={onRefresh}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-[#C8A45D]/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1C1917] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Enrolled Course</th>
                <th className="py-3.5 px-4">Amount & Discount</th>
                <th className="py-3.5 px-4">12-Digit UTR Number</th>
                <th className="py-3.5 px-4">Order Details</th>
                <th className="py-3.5 px-4 text-center">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-xs">
                    {statusFilter === 'pending'
                      ? '✨ No payments pending review! All submitted payments have been verified.'
                      : 'No payment submissions found matching your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const course = s.purchasedCourse;
                  const isPending = s.paymentStatus === 'pending_approval';
                  const isApproved = s.paymentStatus === 'approved';
                  const isRejected = s.paymentStatus === 'rejected';
                  const utr = course?.utrNumber || course?.transactionRef || 'N/A';
                  const amount = course?.finalAmount || course?.amount || 2999;
                  const paymentDate = course?.paymentDate || (course as any)?.paidAt || s.updatedAt;

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
                          <div className="w-9 h-9 rounded-xl bg-[#FAF5E9] border border-[#C8A45D]/50 text-[#8A651E] font-bold flex items-center justify-center font-cinzel">
                            {s.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">{s.fullName}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{s.email}</div>
                            <div className="text-[10px] text-gray-400">{s.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs">
                          {course?.courseName || s.targetExam}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {s.level} • {s.group}
                        </div>
                      </td>

                      {/* Amount & Discount */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#8A651E] text-xs font-montserrat">
                          ₹{amount.toLocaleString('en-IN')}
                        </div>
                        {(course?.discountCodeUsed || (course as any)?.discountCode) && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[9px] font-bold font-mono mt-0.5">
                            <Tag className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{course?.discountCodeUsed || (course as any)?.discountCode}</span>
                          </div>
                        )}
                      </td>

                      {/* UTR Number */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded-lg border border-gray-300">
                            {utr}
                          </span>
                          {utr !== 'N/A' && (
                            <button
                              onClick={() => handleCopyUtr(utr)}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors cursor-pointer"
                              title="Copy UTR number to verify in bank statement"
                            >
                              {copiedUtr === utr ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-500" />
                              )}
                            </button>
                          )}
                        </div>
                        {copiedUtr === utr && (
                          <span className="text-[9px] text-emerald-600 font-bold block pt-0.5">
                            Copied!
                          </span>
                        )}
                      </td>

                      {/* Order Details */}
                      <td className="py-3.5 px-4 text-gray-600 text-[11px]">
                        <div className="font-mono text-gray-800 text-[10px] font-bold">
                          {course?.orderId || `ORD-${s.studentId.slice(-6)}`}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {paymentDate
                            ? new Date(paymentDate).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Pending'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Verification Pending</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Payment Verified</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
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
                                onClick={() => onApprovePayment(s)}
                                disabled={approvingId === s.studentId}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-montserrat font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Verify UTR, unlock Mentorship Roadmap & Calls Table for this student, and dispatch payment confirmation email"
                              >
                                {approvingId === s.studentId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Verify & Unlock</span>
                              </button>

                              <button
                                onClick={() => onRejectPayment(s)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                                title="Reject payment with reason"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && onOpenMentorshipChart && (
                            <button
                              onClick={() => onOpenMentorshipChart(s)}
                              className="px-3 py-1.5 bg-gradient-to-r from-[#1C1917] to-[#2E2419] hover:bg-black text-[#FFE3A0] border border-[#C8A45D]/60 font-montserrat font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Open live mentorship chart for this student"
                            >
                              <Bookmark className="w-3.5 h-3.5 text-[#C8A45D]" />
                              <span>Mentorship Chart</span>
                            </button>
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
