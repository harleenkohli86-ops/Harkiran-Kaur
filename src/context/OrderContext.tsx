import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem } from '../types';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { saveEnrollment, updateAppointmentStatus } from '../lib/supabase';
import { sendStudentConfirmationEmail, sendStudentApprovalEmail } from '../services/emailService';
import { generateInvoicePDF } from '../services/invoiceService';
import { setStudentApprovalStatus } from '../services/mentorshipTrackerService';
import { getAllStudents, approveStudentPayment } from '../services/centralStudentDatabase';

interface OrderContextType {
  orders: OrderItem[];
  createOrder: (
    paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'EMI',
    billingDetails: OrderItem['billingDetails'],
    options?: {
      utrNumber?: string;
    }
  ) => Promise<{ success: boolean; order?: OrderItem; message: string }>;
  approveOrderAndSendEmail: (
    orderIdOrNumber: string
  ) => Promise<{ success: boolean; message: string }>;
  latestOrder: OrderItem | null;
  isThankYouModalOpen: boolean;
  setIsThankYouModalOpen: (open: boolean) => void;
  downloadInvoicePDF: (order: OrderItem) => void;
}

const ORDER_STORAGE_KEY = 'hk_rankers_orders_v1';
const LEGACY_ORDER_STORAGE_KEY = 'hk_rankers_orders';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, grantPurchase } = useAuth();
  const { cartItems, subtotal, discountAmount, totalAmount, clearCart } = useCart();

  const [orders, setOrders] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY) || localStorage.getItem(LEGACY_ORDER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [latestOrder, setLatestOrder] = useState<OrderItem | null>(null);
  const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  // Listen for cross-tab order updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ORDER_STORAGE_KEY && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createOrder = async (
    paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'EMI',
    billingDetails: OrderItem['billingDetails'],
    options?: {
      utrNumber?: string;
    }
  ): Promise<{ success: boolean; order?: OrderItem; message: string }> => {
    if (cartItems.length === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }

    const orderNum = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const isDirectUpiWithUtr = paymentMethod === 'UPI' && Boolean(options?.utrNumber);

    const finalBillingDetails: OrderItem['billingDetails'] = {
      ...billingDetails,
      fullName: (user?.fullName && user.fullName.trim()) || billingDetails.fullName?.trim() || 'CS Aspirant',
      email: (user?.email && user.email.trim().toLowerCase()) || (billingDetails.email || '').trim().toLowerCase(),
      phone: (user?.phone && user.phone.trim()) || (billingDetails.phone || '').trim(),
    };

    const newOrder: OrderItem = {
      id: `ord_${Date.now()}`,
      orderNumber: orderNum,
      userId: user?.id || (finalBillingDetails.email ? `usr_${finalBillingDetails.email.replace(/[^a-zA-Z0-9]/g, '_')}` : 'usr_guest'),
      items: cartItems.map((ci) => ({
        productId: ci.product.id,
        name: ci.product.name,
        price: ci.product.price,
        quantity: ci.quantity,
      })),
      subtotal,
      discount: discountAmount,
      tax: 0,
      totalAmount,
      paymentMethod,
      utrNumber: options?.utrNumber,
      status: isDirectUpiWithUtr ? 'PENDING_APPROVAL' : 'COMPLETED',
      createdAt: new Date().toISOString(),
      billingDetails: finalBillingDetails,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setLatestOrder(newOrder);

    // Save order details to Supabase backend table
    try {
      saveEnrollment({
        name: finalBillingDetails.fullName || 'Enrolled Student',
        email: finalBillingDetails.email || '',
        phone: finalBillingDetails.phone || '',
        program: newOrder.items.map((i) => i.name).join(' + '),
        productId: newOrder.items.map((i) => i.productId).join(', '),
        utrNumber: options?.utrNumber,
        amount: totalAmount,
        status: isDirectUpiWithUtr ? 'pending_verification' : 'confirmed',
        notes: isDirectUpiWithUtr
          ? `Direct UPI payment with UTR: ${options?.utrNumber} (Amount: ₹${totalAmount}) to Harkiran kaur jatinder singh kohli [harkirankaurr@ibl]. Awaiting admin approval.`
          : `Paid Order: ${orderNum} (Total: ₹${totalAmount}) via ${paymentMethod} | Ref: ${options?.utrNumber || 'Verified'}`,
      }).catch((err) => console.warn('Supabase order save background error:', err));
    } catch (e) {
      console.warn('Supabase save error:', e);
    }

    // Attach purchased product IDs to student account ONLY if already verified/instant (not pending UPI verification)
    if (user && !isDirectUpiWithUtr) {
      const purchasedIds = cartItems.map((ci) => ci.product.id);
      grantPurchase(purchasedIds);
    }

    // Automatically send official confirmation email ONLY if payment is already verified
    // If pending UPI UTR verification, the confirmation email is dispatched strictly upon Admin Approval
    if (!isDirectUpiWithUtr) {
      try {
        sendStudentConfirmationEmail({
          studentName: finalBillingDetails.fullName || 'CS Aspirant',
          studentEmail: finalBillingDetails.email || '',
          studentPhone: finalBillingDetails.phone || '',
          programName: newOrder.items.map((i) => i.name).join(' + '),
          amount: totalAmount,
          utrNumber: options?.utrNumber || 'Verified UPI Transfer',
          orderNumber: orderNum,
        }).catch((err) => console.warn('Automatic order email send notice:', err));
      } catch (mailErr) {
        console.warn('Mail dispatch error on order create:', mailErr);
      }
    }

    // Clear cart after successful submission
    clearCart();

    // Show confirmation modal
    setIsThankYouModalOpen(true);

    return {
      success: true,
      order: newOrder,
      message: isDirectUpiWithUtr
        ? 'UTR number submitted successfully! Your enrollment is pending verification and you will receive a confirmation email.'
        : 'Payment Successful! Course access unlocked.',
    };
  };

  /**
   * Admin-initiated action: Approves a student's pending UPI order,
   * sends the official branded confirmation email, and updates records.
   */
  const approveOrderAndSendEmail = async (
    orderIdOrNumber: string
  ): Promise<{ success: boolean; message: string }> => {
    let targetOrder = orders.find(
      (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
    );

    if (!targetOrder) {
      return { success: false, message: `Order ${orderIdOrNumber} not found.` };
    }

    const now = new Date().toISOString();

    // 1. Dispatch confirmation email with Academy logo and Harkiran Kaur's signature
    const emailResult = await sendStudentConfirmationEmail({
      studentName: targetOrder.billingDetails.fullName || 'CS Aspirant',
      studentEmail: targetOrder.billingDetails.email || '',
      studentPhone: targetOrder.billingDetails.phone || '',
      programName: targetOrder.items.map((i) => i.name).join(' + '),
      amount: targetOrder.totalAmount,
      utrNumber: targetOrder.utrNumber || 'Verified UPI Transfer',
      orderNumber: targetOrder.orderNumber,
      confirmedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    // 2. Update order state in memory and localStorage
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === targetOrder!.id || ord.orderNumber === targetOrder!.orderNumber) {
          return {
            ...ord,
            status: 'COMPLETED',
            approvedAt: now,
            emailSentAt: now,
          };
        }
        return ord;
      })
    );

    // 3. Grant access to purchased course modules
    const purchasedIds = targetOrder.items.map((ci) => ci.productId);
    grantPurchase(purchasedIds);

    // 4. Activate Student Login Access in Central Database, Registered Users, and Mentorship Profiles
    const studentEmail = (targetOrder.billingDetails.email || '').trim().toLowerCase();
    const studentPhone = (targetOrder.billingDetails.phone || '').trim();
    const studentName = targetOrder.billingDetails.fullName || 'Student';

    if (studentEmail) {
      // Sync with central student database
      try {
        const allStudents = getAllStudents();
        const studentMatch = allStudents.find(
          (s) =>
            s.email.toLowerCase() === studentEmail ||
            (studentPhone && s.phone.replace(/\D/g, '').slice(-10) === studentPhone.replace(/\D/g, '').slice(-10))
        );
        if (studentMatch) {
          approveStudentPayment(studentMatch.studentId);
        }
      } catch (err) {
        console.warn('Error approving student payment in central database:', err);
      }

      setStudentApprovalStatus(studentEmail, true);

      try {
        const rawUsers = localStorage.getItem('hk_rankers_registered_users');
        const registeredUsers: any[] = rawUsers ? JSON.parse(rawUsers) : [];
        const existingIdx = registeredUsers.findIndex(
          (u) => u.email && u.email.trim().toLowerCase() === studentEmail
        );
        if (existingIdx !== -1) {
          registeredUsers[existingIdx].isApproved = true;
          registeredUsers[existingIdx].approvalStatus = 'approved';
          registeredUsers[existingIdx].approvedAt = now;
          registeredUsers[existingIdx].purchasedProductIds = Array.from(
            new Set([...(registeredUsers[existingIdx].purchasedProductIds || []), ...purchasedIds])
          );
        } else {
          // Create registered account so student can log in or reset password immediately
          registeredUsers.push({
            id: `usr_${Date.now()}`,
            fullName: studentName,
            email: studentEmail,
            phone: studentPhone,
            targetExam: targetOrder.items[0]?.name || 'CS Executive',
            password: 'student_pass',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=C8A45D&color=000`,
            purchasedProductIds: purchasedIds,
            createdAt: now,
            isApproved: true,
            approvalStatus: 'approved',
            approvedAt: now,
            role: 'student',
          });
        }
        localStorage.setItem('hk_rankers_registered_users', JSON.stringify(registeredUsers));
      } catch (err) {
        console.warn('Error updating registered user on order approval:', err);
      }
    }

    // 5. Sync status with Supabase & local appointments
    try {
      await updateAppointmentStatus(
        { phone: targetOrder.billingDetails.phone },
        'confirmed',
        {
          email_sent_at: now,
          notes: `Approved by Master Admin. Confirmation email dispatched to ${targetOrder.billingDetails.email}.`,
          utr_number: targetOrder.utrNumber,
        }
      );
    } catch (err) {
      console.warn('Sync updateAppointmentStatus notice:', err);
    }

    return {
      success: true,
      message: `Enrollment #${targetOrder.orderNumber} approved! Confirmation email dispatched to ${targetOrder.billingDetails.email}.`,
    };
  };

  const downloadInvoicePDF = (order: OrderItem) => {
    try {
      generateInvoicePDF(order);
    } catch (err) {
      console.error('Error generating PDF invoice:', err);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        approveOrderAndSendEmail,
        latestOrder,
        isThankYouModalOpen,
        setIsThankYouModalOpen,
        downloadInvoicePDF,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};
