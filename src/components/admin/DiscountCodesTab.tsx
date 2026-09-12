import React, { useState } from 'react';
import { DiscountCodeRecord } from '../../services/centralStudentDatabase';
import {
  Tag,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Search,
  Percent,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface DiscountCodesTabProps {
  discountCodes: DiscountCodeRecord[];
}

export const DiscountCodesTab: React.FC<DiscountCodesTabProps> = ({ discountCodes }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [search, setSearch] = useState('');

  const unusedCount = discountCodes.filter((c) => !c.isUsed).length;
  const usedCount = discountCodes.filter((c) => c.isUsed).length;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredCodes = discountCodes.filter((c) => {
    if (filter === 'unused' && c.isUsed) return false;
    if (filter === 'used' && !c.isUsed) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const studentName = c.usedByStudentName || (c as any).usedByName || '';
      const email = c.usedByEmail || '';
      const orderId = c.usedWithOrderId || (c as any).orderId || '';
      return (
        c.code.toLowerCase().includes(q) ||
        studentName.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        orderId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#171512] to-[#0F0F0F] text-white border-2 border-[#C8A45D]/40 p-5 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C8A45D]/20 border border-[#C8A45D]/50 flex items-center justify-center text-[#FFE3A0] shrink-0">
            <Tag className="w-6 h-6 text-[#C8A45D]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-montserrat font-bold text-[#FFE3A0] tracking-wider flex items-center gap-1.5">
              <span>Security & Audit Control</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px]">
                One-Time Redemptions
              </span>
            </div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-white mt-0.5">
              Ranker Discount Codes &amp; HK5 (Audit Trail)
            </h2>
            <p className="text-xs text-gray-400">
              Exclusive 15% Ranker codes and 5% HK5 code. Strictly one coupon per order (no stacking). Once redeemed, the code is locked permanently to the student order ID.
            </p>
          </div>
        </div>

        {/* Stats and Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#C8A45D] text-black shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            All ({discountCodes.length})
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'unused'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Active & Available ({unusedCount})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-3 py-1.5 rounded-xl text-xs font-montserrat font-bold transition-all cursor-pointer ${
              filter === 'used'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Redeemed ({usedCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-[#C8A45D]/30 p-4 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search promo code or student details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#C8A45D]"
          />
        </div>
      </div>

      {/* Discount Codes Grid / Table */}
      <div className="bg-white border border-[#C8A45D]/30 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1C1917] text-white font-montserrat font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Discount Code</th>
                <th className="py-3.5 px-4">Discount Value</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Redeemed By Student</th>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredCodes.map((c) => {
                const isCopied = copiedCode === c.code;

                return (
                  <tr
                    key={c.code}
                    className={`transition-colors hover:bg-gray-50/80 ${
                      c.isUsed ? 'bg-gray-50/50 text-gray-500' : 'text-gray-900'
                    }`}
                  >
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#FAF5E9] text-[#8A651E] px-2.5 py-1 rounded-lg border border-[#C8A45D]/40">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopy(c.code)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"
                          title="Copy promo code"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {isCopied && (
                        <span className="text-[10px] text-emerald-600 font-bold block pt-0.5">
                          Copied to clipboard!
                        </span>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 font-montserrat font-bold text-xs text-[#8A651E]">
                      {c.discountPercent || (c as any).discountPercentage}% OFF Flat
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {c.isUsed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-300">
                          <span>Redeemed (Locked)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active & Available</span>
                        </span>
                      )}
                    </td>

                    {/* Redeemed By */}
                    <td className="py-3.5 px-4">
                      {c.isUsed ? (
                        <div>
                          <div className="font-bold text-gray-900 text-xs">
                            {c.usedByStudentName || (c as any).usedByName || 'Verified Student'}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {c.usedByEmail || '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">
                          Unredeemed (Ready for use)
                        </span>
                      )}
                    </td>

                    {/* Order Details */}
                    <td className="py-3.5 px-4 text-gray-600 text-[11px]">
                      {c.isUsed ? (
                        <div>
                          <div className="font-mono text-gray-800 text-[10px] font-bold">
                            {c.usedWithOrderId || (c as any).orderId || '—'}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {c.usedAt
                              ? new Date(c.usedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleCopy(c.code)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        {isCopied ? 'Copied' : 'Copy Code'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
