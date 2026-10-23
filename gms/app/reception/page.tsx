'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  CreditCard, 
  ShoppingBag, 
  Search, 
  CheckCircle, 
  X, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  LogOut, 
  Plus, 
  Minus, 
  Check, 
  ChevronRight, 
  RefreshCw, 
  ArrowLeft,
  Snowflake,
  ShieldAlert,
  Flame,
  Menu,
  Phone,
  User,
  ShoppingBag as CartIcon,
  Smartphone,
  Building2,
  Download,
  Calendar,
  TrendingUp,
  Sparkles,
  Filter,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { api, getStoredUser, clearSession, UserSession } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EthiopianDatePicker } from '@/components/EthiopianDatePicker';
import {
  toEthiopian,
  ethiopianToIso,
  getTodayEthiopian,
  calculateEthiopianEndDate,
  formatEthDate,
  formatEthDateTime,
  formatEthPeriod,
} from '@/lib/ethiopianCalendar';
import {
  validateEthiopianPhone,
  validateEmail,
  validateName,
  formatEthiopianPhone
} from '@/lib/validators';

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'memberships-payments' | 'pos' | 'wizard'>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [todayEthDate, setTodayEthDate] = useState<string>('');

  // Data States
  const [members, setMembers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration 3-Step Wizard States (5.4)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardData, setWizardData] = useState({
    // Step 1: Personal
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'male',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    // Step 2: Membership
    plan_name: 'Monthly Standard',
    price: 59,
    start_date: '2026-10-20',
    eth_year: 2019,
    eth_month: 2,
    eth_day: 10,
    duration_months: 1,
    // Step 3: Payment
    method: 'cash',
    paid_now: true
  });
  const [createdMemberSummary, setCreatedMemberSummary] = useState<any | null>(null);

  // Memberships & Payments Unified Screen State (5.6)
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<any | null>(null);
  const [memPaySearch, setMemPaySearch] = useState('');
  const [memPayStatusFilter, setMemPayStatusFilter] = useState('all');
  const [memPayMethodFilter, setMemPayMethodFilter] = useState('all');
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewTargetMemberId, setRenewTargetMemberId] = useState('');
  const [renewPlanName, setRenewPlanName] = useState('Monthly Standard');
  const [renewAmount, setRenewAmount] = useState(59);
  const [renewMethod, setRenewMethod] = useState('cash');
  const [renewDurationMonths, setRenewDurationMonths] = useState(1);
  const [renewEthYear, setRenewEthYear] = useState(2019);
  const [renewEthMonth, setRenewEthMonth] = useState(2);
  const [renewEthDay, setRenewEthDay] = useState(10);

  // Point of Sale (POS) Cart State (5.7)
  const [posCart, setPosCart] = useState<{ product: any; quantity: number }[]>([]);
  const [posMemberId, setPosMemberId] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'bank_transfer'>('cash');
  const [posSuccessTotal, setPosSuccessTotal] = useState<number | null>(null);

  // Edit Member Modal
  const [editingMember, setEditingMember] = useState<any | null>(null);
  // Delete confirmation state
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToasts(prev => [...prev, { id: `toast_${Date.now()}`, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    try {
      const todayEth = getTodayEthiopian();
      const todayIso = ethiopianToIso(todayEth.year, todayEth.month, todayEth.date);
      setTodayEthDate(formatEthDate(todayIso));
      setWizardData(prev => ({
        ...prev,
        start_date: todayIso,
        eth_year: todayEth.year,
        eth_month: todayEth.month,
        eth_day: todayEth.date
      }));
      setRenewEthYear(todayEth.year);
      setRenewEthMonth(todayEth.month);
      setRenewEthDay(todayEth.date);
    } catch {
      setTodayEthDate(formatEthDate(new Date()));
    }
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadReceptionData();
  }, [router]);

  async function loadReceptionData() {
    setLoading(true);
    try {
      const [mems, prods, sls, pays, exp, membershipsData] = await Promise.all([
        api.getMembers(),
        api.getProducts(),
        api.getProductSales(),
        api.getPayments(),
        api.getExpiringMembershipsReport(7),
        api.getMemberships()
      ]);
      setMembers(mems || []);
      setProducts(prods || []);
      setSales(sls || []);
      setPayments(pays || []);
      setExpiringMembers(exp || []);
      setMemberships(membershipsData || []);
      if (mems && mems.length > 0 && !selectedMemberForPayment) {
        setSelectedMemberForPayment(mems[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Wizard Step 2 Calculated End Date (in Ethiopian calendar)
  const calculateWizardEndDate = () => {
    const expiry = calculateEthiopianEndDate(
      wizardData.eth_year || 2019,
      wizardData.eth_month || 2,
      wizardData.eth_day || 10,
      Number(wizardData.duration_months) || 1
    );
    return expiry.isoString;
  };

  // Complete 3-Step Registration Wizard
  async function handleFinishWizard() {
    try {
      const fnVal = validateName(wizardData.first_name, 'First Name', true);
      if (!fnVal.isValid) {
        showToast(fnVal.error || 'Invalid First Name', 'error');
        setWizardStep(1);
        return;
      }
      const lnVal = validateName(wizardData.last_name, 'Last Name', true);
      if (!lnVal.isValid) {
        showToast(lnVal.error || 'Invalid Last Name', 'error');
        setWizardStep(1);
        return;
      }
      const phoneVal = validateEthiopianPhone(wizardData.phone);
      if (!phoneVal.isValid) {
        showToast(phoneVal.error || 'Invalid Ethiopian phone number', 'error');
        setWizardStep(1);
        return;
      }
      if (wizardData.email && wizardData.email.trim()) {
        const emailVal = validateEmail(wizardData.email, false);
        if (!emailVal.isValid) {
          showToast(emailVal.error || 'Invalid email address', 'error');
          setWizardStep(1);
          return;
        }
      }

      const expiry = calculateEthiopianEndDate(
        wizardData.eth_year || 2019,
        wizardData.eth_month || 2,
        wizardData.eth_day || 10,
        Number(wizardData.duration_months) || 1
      );
      const endDate = expiry.isoString;
      const newMember = await api.createMember({
        first_name: wizardData.first_name.trim(),
        last_name: wizardData.last_name.trim(),
        phone: phoneVal.normalized,
        email: wizardData.email ? wizardData.email.trim().toLowerCase() : '',
        date_of_birth: wizardData.date_of_birth,
        gender: wizardData.gender,
        address: wizardData.address,
        emergency_contact_name: wizardData.emergency_contact_name,
        emergency_contact_phone: wizardData.emergency_contact_phone,
        status: 'active'
      });

      const memberId = newMember?.id || newMember?._id;

      if (wizardData.paid_now && memberId) {
        await api.createPayment({
          member_id: memberId,
          amount: wizardData.price,
          method: wizardData.method,
          plan_name: wizardData.plan_name,
          start_date: wizardData.start_date,
          end_date: endDate
        });
      }

      setCreatedMemberSummary({
        name: `${wizardData.first_name} ${wizardData.last_name}`,
        plan: wizardData.plan_name,
        endDate,
        endDateEth: expiry.formatted,
        startDateEth: formatEthDate(wizardData.start_date, 'withAmharic')
      });
      setWizardStep(4);
      loadReceptionData();
      showToast(`Member ${wizardData.first_name} ${wizardData.last_name} registered!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete registration', 'error');
    }
  }

  // POS Add to Cart
  function addToCart(product: any) {
    setPosCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQty) {
          showToast(`No more stock available for ${product.name}`, 'error');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  // POS Complete Sale
  async function handleCompleteSale() {
    if (posCart.length === 0) return;
    try {
      let total = 0;
      for (const item of posCart) {
        await api.createProductSale({
          product_id: item.product.id,
          member_id: posMemberId || null,
          quantity: item.quantity,
          payment_method: posPaymentMethod
        });
        total += item.product.price * item.quantity;
      }
      const methodLabels: Record<string, string> = {
        cash: 'Cash',
        card: 'Card',
        mobile_money: 'Mobile Money',
        bank_transfer: 'Bank Transfer'
      };
      setPosSuccessTotal(total);
      setPosCart([]);
      setPosMemberId('');
      showToast(`Sale completed! Total: ETB ${total.toFixed(2)} (${methodLabels[posPaymentMethod] || 'Cash'})`);
      setPosPaymentMethod('cash');
      loadReceptionData();
    } catch (err: any) {
      showToast(err.message || 'Sale failed', 'error');
    }
  }

  // Calculate cart total
  const cartTotal = posCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Freeze membership
  const handleFreeze = async (membershipId: string, memberName: string) => {
    try {
      await api.freezeMembership(membershipId);
      showToast(`Membership for ${memberName} frozen.`);
      loadReceptionData();
    } catch (err: any) {
      showToast(err.message || 'Failed to freeze membership', 'error');
    }
  };

  // Unfreeze membership
  const handleUnfreeze = async (membershipId: string, memberName: string) => {
    try {
      await api.unfreezeMembership(membershipId);
      showToast(`Membership for ${memberName} unfrozen.`);
      loadReceptionData();
    } catch (err: any) {
      showToast(err.message || 'Failed to unfreeze membership', 'error');
    }
  };

  // Open renew modal for specific member
  const openRenewModalForMember = (memberId: string) => {
    const todayEth = getTodayEthiopian();
    setRenewTargetMemberId(memberId);
    setRenewPlanName('Monthly Standard');
    setRenewAmount(59);
    setRenewMethod('cash');
    setRenewDurationMonths(1);
    setRenewEthYear(todayEth.year);
    setRenewEthMonth(todayEth.month);
    setRenewEthDay(todayEth.date);
    setIsRenewModalOpen(true);
  };

  // Handle renew/payment submission
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTargetMemberId) {
      showToast('Please select a member.', 'error');
      return;
    }
    try {
      const todayIso = ethiopianToIso(renewEthYear, renewEthMonth, renewEthDay);
      const expiry = calculateEthiopianEndDate(
        renewEthYear,
        renewEthMonth,
        renewEthDay,
        Number(renewDurationMonths)
      );
      const endDate = expiry.isoString;

      await api.createPayment({
        member_id: renewTargetMemberId,
        amount: renewAmount,
        method: renewMethod,
        plan_name: renewPlanName,
        start_date: todayIso,
        end_date: endDate
      });

      showToast(`Payment recorded & renewed! Valid until: ${expiry.formatted}`);
      setIsRenewModalOpen(false);
      loadReceptionData();
    } catch (err: any) {
      showToast(err.message || 'Failed to renew membership', 'error');
    }
  };

  // Unified single table data combining memberships and payments
  const unifiedRecords = React.useMemo(() => {
    const list: any[] = [];
    const seenMembershipIds = new Set<string>();

    payments.forEach(p => {
      const pMemId = p.memberId || p.member_id;
      const matchedMembership = memberships.find(m => 
        (p.membershipId && (m.id === p.membershipId || m._id === p.membershipId)) ||
        (pMemId && (m.memberId === pMemId || m.member_id === pMemId))
      );
      const matchedMember = members.find(m => (m.id || m._id) === pMemId);
      
      const membershipId = matchedMembership?.id || matchedMembership?._id || p.membershipId || null;
      if (membershipId) seenMembershipIds.add(membershipId);

      const startDate = matchedMembership?.startDate || (p.membershipPeriod ? p.membershipPeriod.split(' to ')[0] : null);
      const endDate = matchedMembership?.endDate || (p.membershipPeriod ? p.membershipPeriod.split(' to ')[1] : null);

      list.push({
        id: `pay_${p.id || p._id}`,
        memberId: pMemId,
        memberName: p.memberName || (matchedMember ? `${matchedMember.firstName} ${matchedMember.lastName}` : 'Unknown'),
        memberPhone: p.memberPhone || matchedMember?.phone || '—',
        planName: p.planName || matchedMembership?.planName || 'Direct / Custom',
        startDate,
        endDate,
        period: formatEthPeriod(startDate, endDate),
        amount: p.amount ?? matchedMembership?.price ?? 0,
        method: p.method || 'cash',
        paidAt: p.paidAt || p.paid_at || p.createdAt,
        status: matchedMembership?.status || matchedMember?.status || 'active',
        membershipId,
        receivedBy: p.receivedBy?.name || 'Staff'
      });
    });

    memberships.forEach(m => {
      const mId = m.id || m._id;
      if (!seenMembershipIds.has(mId)) {
        const memId = m.memberId || m.member_id;
        const matchedMember = members.find(mem => (mem.id || mem._id) === memId);
        list.push({
          id: `mem_${mId}`,
          memberId: memId,
          memberName: m.memberName || (matchedMember ? `${matchedMember.firstName} ${matchedMember.lastName}` : 'Unknown'),
          memberPhone: m.memberPhone || matchedMember?.phone || '—',
          planName: m.planName || 'Standard Plan',
          startDate: m.startDate,
          endDate: m.endDate,
          period: formatEthPeriod(m.startDate, m.endDate),
          amount: m.price || 0,
          method: 'direct',
          paidAt: m.createdAt || m.startDate,
          status: m.status || 'active',
          membershipId: mId,
          receivedBy: m.createdBy?.name || 'Admin'
        });
      }
    });

    return list;
  }, [payments, memberships, members]);

  // Real-time filtered records
  const filteredUnifiedRecords = React.useMemo(() => {
    return unifiedRecords.filter(item => {
      const term = memPaySearch.toLowerCase().trim();
      const matchesSearch = !term || 
        item.memberName?.toLowerCase().includes(term) ||
        item.memberPhone?.toLowerCase().includes(term) ||
        item.planName?.toLowerCase().includes(term) ||
        item.method?.toLowerCase().includes(term) ||
        item.receivedBy?.toLowerCase().includes(term);

      const matchesStatus = memPayStatusFilter === 'all' || item.status === memPayStatusFilter;
      const matchesMethod = memPayMethodFilter === 'all' || item.method === memPayMethodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [unifiedRecords, memPaySearch, memPayStatusFilter, memPayMethodFilter]);

  // Export CSV
  const exportMemPayToCSV = () => {
    const headers = ['Member Name', 'Phone', 'Plan', 'Period (Ethiopian)', 'Amount (ETB)', 'Payment Method', 'Date (Ethiopian)', 'Status', 'Received By'];
    const rows = filteredUnifiedRecords.map(r => [
      `"${r.memberName || ''}"`,
      `"${r.memberPhone || ''}"`,
      `"${r.planName || ''}"`,
      `"${r.period || ''}"`,
      `"${r.amount || 0}"`,
      `"${r.method || ''}"`,
      `"${r.paidAt ? formatEthDateTime(r.paidAt) : ''}"`,
      `"${r.status || ''}"`,
      `"${r.receivedBy || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `memberships_payments_ethiopian_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'memberships-payments', label: 'Memberships & Payments', icon: CreditCard },
    { key: 'pos', label: 'Product Sales (POS)', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="flex flex-1">
        {/* 5.1 Reception Sidebar (Speed & Touch-Friendly, restricted items) */}
        <aside
          className={`fixed lg:sticky top-0 h-screen z-40 bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#0B0F19] text-white flex flex-col w-64 border-r border-slate-800/80 shrink-0 shadow-2xl transition-transform duration-300 ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E8452C] to-orange-500 flex items-center justify-center text-white shadow-lg shadow-[#E8452C]/30 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-wider heading-font block leading-none">
                  FRONT<span className="text-[#E8452C]">DESK</span>
                </span>
                <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase block mt-1">
                  Reception Portal
                </span>
              </div>
            </div>
            <button onClick={() => setMobileDrawerOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
            Operations
          </div>

          {/* Nav Items (Min 44px touch targets) */}
          <nav className="flex-1 py-1 px-3 space-y-1.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as any);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full min-h-[46px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#E8452C] to-[#C7331C] text-white shadow-lg shadow-[#E8452C]/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Quick Button to Register Wizard */}
            <div className="pt-4 mt-2">
              <button
                onClick={() => {
                  setWizardStep(1);
                  setActiveTab('wizard');
                  setMobileDrawerOpen(false);
                }}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-orange-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#E8452C]/25 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register New Member
              </button>
            </div>
          </nav>

          {/* User profile & Logout */}
          <div className="m-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {currentUser?.fullName.charAt(0) || 'R'}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate">{currentUser?.fullName}</span>
                <span className="text-[10px] text-slate-400 block">Receptionist</span>
              </div>
            </div>
            <button
              onClick={() => {
                clearSession();
                router.push('/login');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  Titan Front Desk
                </span>
                <h1 className="text-lg font-black text-slate-900 heading-font uppercase tracking-wide mt-0.5">
                  {activeTab.replace('-', ' ')}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live Ethiopian Calendar Date Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{todayEthDate ? `የዛሬ ቀን: ${todayEthDate}` : 'የዛሬ ቀን'}</span>
              </div>

              <button
                onClick={() => {
                  setWizardStep(1);
                  setActiveTab('wizard');
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#C7331C] hover:opacity-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#E8452C]/20 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Member</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* ============================================================== */}
            {/* 5.2 RECEPTION DASHBOARD */}
            {/* ============================================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 3 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Total Members */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Total Members
                      </span>
                      <div className="text-3xl font-black text-slate-900 heading-font">{members.length}</div>
                      <span className="text-xs text-emerald-600 font-bold mt-1.5 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        {members.filter(m => m.status === 'active').length} active memberships
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-blue-500/10">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 2: Expiring in 7 Days */}
                  <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                        Expiring in 7 Days
                      </span>
                      <div className="text-3xl font-black text-amber-700 heading-font">{expiringMembers.length}</div>
                      <span className="text-xs text-amber-600 font-semibold mt-1.5 block">Needs renewal follow-up</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-amber-500/15">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 3: Sales Today */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Sales Today
                      </span>
                      <div className="text-3xl font-black text-slate-900 heading-font">
                        ETB {sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0).toFixed(2)}
                      </div>
                      <span className="text-xs text-slate-500 font-semibold mt-1.5 block">{sales.length} transactions</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-emerald-500/10">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Main Area: Recent Members Overview + Expiring Soon */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Recent Members */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 heading-font">Recent Members</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Quickly access member records and manage subscriptions</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('members')}
                          className="text-xs font-bold text-[#E8452C] hover:underline cursor-pointer"
                        >
                          View All ({members.length}) →
                        </button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {members.slice(0, 6).map((m, i) => (
                          <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 font-bold flex items-center justify-center text-white text-xs shadow-xs">
                                {m.firstName?.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">{m.fullName}</span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {m.phone} • Plan: {m.currentPlan || 'None'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={m.status} />
                              <button
                                onClick={() => {
                                  setSelectedMemberForPayment(m);
                                  setActiveTab('memberships-payments');
                                }}
                                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                              >
                                Renew / Pay
                              </button>
                            </div>
                          </div>
                        ))}
                        {members.length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No members registered yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Expiring Soon list with Renew button */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-fit">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-900 heading-font">Expiring Soon</h3>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Next 7 Days
                      </span>
                    </div>

                    <div className="space-y-3">
                      {expiringMembers.map((em, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2.5 hover:border-slate-200 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{em.memberName}</span>
                              <span className="text-[11px] text-slate-500 block">{em.planName}</span>
                              <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                                Expires: {formatEthDate(em.endDate)}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {em.daysRemaining}d left
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              openRenewModalForMember(em.memberId);
                              setActiveTab('memberships-payments');
                            }}
                            className="min-h-[36px] w-full py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Renew Plan
                          </button>
                        </div>
                      ))}
                      {expiringMembers.length === 0 && (
                        <div className="py-6 text-center text-slate-400 text-xs">
                          No memberships expiring in the next 7 days.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 5.4 THREE-STEP REGISTRATION WIZARD (Speed & Verification) */}
            {/* ============================================================== */}
            {activeTab === 'wizard' && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                {/* Stepper Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between relative px-4">
                    <div className="absolute top-4 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
                    <div 
                      className="absolute top-4 left-8 h-1 bg-gradient-to-r from-[#E8452C] to-orange-500 -translate-y-1/2 z-0 rounded-full transition-all duration-300"
                      style={{ width: wizardStep === 1 ? '0%' : wizardStep === 2 ? '50%' : '100%' }}
                    />
                    
                    {[
                      { step: 1, label: '1. Personal Info' },
                      { step: 2, label: '2. Plan & Dates' },
                      { step: 3, label: '3. Payment' }
                    ].map((s) => {
                      const isComplete = wizardStep > s.step;
                      const isCurrent = wizardStep === s.step;
                      return (
                        <div key={s.step} className="flex flex-col items-center relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                            isCurrent 
                              ? 'bg-gradient-to-tr from-[#E8452C] to-orange-500 text-white ring-4 ring-[#E8452C]/20 shadow-md scale-110' 
                              : isComplete 
                              ? 'bg-emerald-500 text-white shadow-xs' 
                              : 'bg-white border-2 border-slate-200 text-slate-400'
                          }`}>
                            {isComplete ? <Check className="w-4 h-4" /> : s.step}
                          </div>
                          <span className={`text-[11px] font-bold mt-2 transition-colors ${
                            isCurrent ? 'text-[#E8452C]' : isComplete ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 1: Personal Information */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 heading-font mb-0.5">Step 1: Personal Information</h3>
                      <p className="text-xs text-slate-500">Asterisk (*) fields are mandatory for front desk records.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">First Name *</label>
                        <input
                          type="text"
                          required
                          value={wizardData.first_name}
                          onChange={e => setWizardData({ ...wizardData, first_name: e.target.value })}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/10 text-sm font-semibold transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={wizardData.last_name}
                          onChange={e => setWizardData({ ...wizardData, last_name: e.target.value })}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/10 text-sm font-semibold transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={wizardData.phone}
                        onChange={e => setWizardData({ ...wizardData, phone: e.target.value })}
                        placeholder="+251-9..."
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/10 text-sm font-mono transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={wizardData.email}
                          onChange={e => setWizardData({ ...wizardData, email: e.target.value })}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/10 text-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1.5">Gender</label>
                        <select
                          value={wizardData.gender}
                          onChange={e => setWizardData({ ...wizardData, gender: e.target.value })}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] text-sm font-semibold cursor-pointer"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={() => {
                          const fnVal = validateName(wizardData.first_name, 'First Name', true);
                          if (!fnVal.isValid) {
                            showToast(fnVal.error || 'Invalid First Name', 'error');
                            return;
                          }
                          const lnVal = validateName(wizardData.last_name, 'Last Name', true);
                          if (!lnVal.isValid) {
                            showToast(lnVal.error || 'Invalid Last Name', 'error');
                            return;
                          }
                          const phoneVal = validateEthiopianPhone(wizardData.phone);
                          if (!phoneVal.isValid) {
                            showToast(phoneVal.error || 'Invalid Ethiopian phone number', 'error');
                            return;
                          }
                          if (wizardData.email && wizardData.email.trim()) {
                            const emailVal = validateEmail(wizardData.email, false);
                            if (!emailVal.isValid) {
                              showToast(emailVal.error || 'Invalid email address', 'error');
                              return;
                            }
                          }
                          // Normalize phone number to standard Ethiopian format
                          setWizardData({ ...wizardData, phone: phoneVal.normalized });
                          setWizardStep(2);
                        }}
                        className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#C7331C] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#E8452C]/25 hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        Proceed to Membership Plan →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Membership Plan */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 heading-font mb-0.5">Step 2: Choose Membership Plan</h3>
                      <p className="text-xs text-slate-500">Expiry date is calculated automatically in Ethiopian Calendar.</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Plan Type</label>
                      <select
                        value={wizardData.plan_name}
                        onChange={e => {
                          const val = e.target.value;
                          let p = 59;
                          let d = 1;
                          if (val.includes('Annual')) { p = 599; d = 12; }
                          else if (val.includes('Quarterly')) { p = 159; d = 3; }
                          setWizardData({ ...wizardData, plan_name: val, price: p, duration_months: d });
                        }}
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-[#E8452C]"
                      >
                        <option value="Monthly Standard">Monthly Standard (59 ETB / 1 Month)</option>
                        <option value="Quarterly Power">Quarterly Power (159 ETB / 3 Months)</option>
                        <option value="Annual Premium">Annual Premium (599 ETB / 12 Months)</option>
                      </select>
                    </div>

                    {/* Ethiopian Date Picker for Start Date & Live Expiration Calculation */}
                    <EthiopianDatePicker
                      label="Membership Start Date (የአባልነት መጀመሪያ ቀን)"
                      year={wizardData.eth_year}
                      month={wizardData.eth_month}
                      day={wizardData.eth_day}
                      durationMonths={Number(wizardData.duration_months)}
                      onChange={(y, m, d, iso) => {
                        setWizardData({
                          ...wizardData,
                          eth_year: y,
                          eth_month: m,
                          eth_day: d,
                          start_date: iso
                        });
                      }}
                    />

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Membership Fee (ETB)</label>
                      <input
                        type="number"
                        value={wizardData.price}
                        onChange={e => setWizardData({ ...wizardData, price: Number(e.target.value) })}
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-bold text-slate-800"
                      />
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="min-h-[42px] px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={() => setWizardStep(3)}
                        className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#C7331C] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#E8452C]/25 hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        Proceed to Payment →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Payment & Confirmation */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 heading-font mb-0.5">Step 3: Payment Confirmation</h3>
                      <p className="text-xs text-slate-500">Review registration details and confirm receipt in ETB.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Member:</span> 
                        <span className="font-bold text-slate-900">{wizardData.first_name} {wizardData.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Plan Selected:</span> 
                        <span className="font-bold text-slate-900">{wizardData.plan_name}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/80 pt-2">
                        <span className="text-slate-500 font-medium">Valid From (መጀመሪያ):</span>
                        <span className="font-bold text-slate-900">{formatEthDate(wizardData.start_date, 'withAmharic')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Expiration Date (የሚያበቃበት):</span>
                        <span className="font-bold text-[#E8452C]">{formatEthDate(calculateWizardEndDate(), 'withAmharic')}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/80 pt-2.5">
                        <span className="text-slate-700 font-black">Total Due:</span> 
                        <span className="font-black text-[#E8452C] text-base">ETB {wizardData.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Payment Method</label>
                        <select
                          value={wizardData.method}
                          onChange={e => setWizardData({ ...wizardData, method: e.target.value })}
                          className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800"
                        >
                          <option value="cash">Cash (ጥሬ ገንዘብ)</option>
                          <option value="card">Card / POS</option>
                          <option value="mobile_money">Telebirr / Mobile Money</option>
                          <option value="bank_transfer">CBE / Bank Transfer</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Payment Status</label>
                        <div className="flex items-center gap-2.5 pt-1.5">
                          <input
                            type="checkbox"
                            checked={wizardData.paid_now}
                            onChange={e => setWizardData({ ...wizardData, paid_now: e.target.checked })}
                            className="w-5 h-5 rounded-lg text-[#E8452C] accent-[#E8452C] cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-800">Paid Now at Desk</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-center">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="min-h-[42px] px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleFinishWizard}
                        className="min-h-[46px] px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 hover:-translate-y-0.5 transition-all cursor-pointer"
                      >
                        Complete Registration & Save
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success Screen */}
                {wizardStep === 4 && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 heading-font">
                      Registration Complete!
                    </h3>
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-gray-900">{createdMemberSummary?.name}</span> is now active with the <span className="font-bold text-gray-900">{createdMemberSummary?.plan}</span>.
                    </p>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 max-w-md mx-auto text-xs text-left space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valid From (Ethiopian):</span>
                        <span className="font-bold text-gray-900">{createdMemberSummary?.startDateEth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expiration Date (Ethiopian):</span>
                        <span className="font-bold text-emerald-800">{createdMemberSummary?.endDateEth}</span>
                      </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => {
                          const todayEth = getTodayEthiopian();
                          setWizardStep(1);
                          setWizardData({
                            first_name: '',
                            last_name: '',
                            phone: '',
                            email: '',
                            date_of_birth: '',
                            gender: 'male',
                            address: '',
                            emergency_contact_name: '',
                            emergency_contact_phone: '',
                            plan_name: 'Monthly Standard',
                            price: 59,
                            start_date: ethiopianToIso(todayEth.year, todayEth.month, todayEth.date),
                            eth_year: todayEth.year,
                            eth_month: todayEth.month,
                            eth_day: todayEth.date,
                            duration_months: 1,
                            method: 'cash',
                            paid_now: true
                          });
                        }}
                        className="min-h-[46px] px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs"
                      >
                        Register Another Member
                      </button>
                      <button
                        onClick={() => setActiveTab('members')}
                        className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#E8452C] text-white font-bold text-xs shadow-md"
                      >
                        View Members List →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* 5.5 MEMBERS LOOKUP PAGE */}
            {/* ============================================================== */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 heading-font">
                      Members Directory ({members.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage member records and subscription statuses</p>
                  </div>
                  <button
                    onClick={() => {
                      setWizardStep(1);
                      setActiveTab('wizard');
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#C7331C] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#E8452C]/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Register Member
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200/80">
                        <tr>
                          <th className="py-4 px-4">Member Name</th>
                          <th className="py-4 px-4">Phone</th>
                          <th className="py-4 px-4">Current Plan</th>
                          <th className="py-4 px-4">Plan Expiration (Ethiopian)</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {members.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                  {m.firstName?.charAt(0) || 'M'}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 text-sm block">{m.fullName}</span>
                                  {m.joinDate && (
                                    <span className="text-[10px] text-slate-400 block font-normal">
                                      Reg: {formatEthDate(m.joinDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{m.phone}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">{m.currentPlan || 'None'}</td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                              {m.planEndDate ? (
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {formatEthDate(m.planEndDate)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal block">
                                    {formatEthDate(m.planEndDate, 'amharic')}
                                  </span>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-3.5 px-4"><StatusBadge status={m.status} /></td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedMemberForPayment(m);
                                  setActiveTab('memberships-payments');
                                }}
                                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                              >
                                Renew / Pay
                              </button>
                              <button
                                onClick={() => setEditingMember(m)}
                                className="min-h-[34px] px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingMemberId(m.id || m._id)}
                                className="min-h-[34px] px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 5.6 MEMBERSHIPS AND PAYMENTS UNIFIED TABLE */}
            {/* ============================================================== */}
            {activeTab === 'memberships-payments' && (
              <div className="space-y-6">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 heading-font">
                      Memberships & Payments Management
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unified subscription plans, payment records, member status, and renewal operations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={exportMemPayToCSV}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      Export CSV
                    </button>
                    <button
                      onClick={loadReceptionData}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-500" />
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        if (members.length > 0) {
                          setRenewTargetMemberId(members[0].id || members[0]._id);
                        }
                        setIsRenewModalOpen(true);
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#C7331C] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#E8452C]/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Record Payment / Renew
                    </button>
                  </div>
                </div>

                {/* 4 Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Total Records
                    </span>
                    <div className="text-2xl font-black text-slate-900 heading-font">
                      {filteredUnifiedRecords.length}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {unifiedRecords.length} total entries
                    </span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      Active Memberships
                    </span>
                    <div className="text-2xl font-black text-emerald-600 heading-font">
                      {filteredUnifiedRecords.filter(r => r.status === 'active').length}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Valid & active subscriptions</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8452C] to-orange-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Total Revenue (ETB)
                    </span>
                    <div className="text-2xl font-black text-slate-900 heading-font">
                      ETB {filteredUnifiedRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Sum of filtered amounts</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                      Frozen Memberships
                    </span>
                    <div className="text-2xl font-black text-amber-600 heading-font">
                      {filteredUnifiedRecords.filter(r => r.status === 'frozen').length}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">Can be unfrozen at any time</span>
                  </div>
                </div>

                {/* Filter and Real-Time Search Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    {/* Search Bar */}
                    <div className="relative w-full sm:flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={memPaySearch}
                        onChange={e => setMemPaySearch(e.target.value)}
                        placeholder="Search by member name, phone, plan, method, or staff..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/10 bg-slate-50/50"
                      />
                      {memPaySearch && (
                        <button
                          onClick={() => setMemPaySearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <select
                        value={memPayStatusFilter}
                        onChange={e => setMemPayStatusFilter(e.target.value)}
                        className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E8452C] flex-1 sm:flex-initial cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="frozen">Frozen</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>

                      <select
                        value={memPayMethodFilter}
                        onChange={e => setMemPayMethodFilter(e.target.value)}
                        className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-[#E8452C] flex-1 sm:flex-initial cursor-pointer"
                      >
                        <option value="all">All Payment Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="direct">Direct</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Unified Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3.5 px-4">Member</th>
                          <th className="py-3.5 px-4">Plan Name</th>
                          <th className="py-3.5 px-4">Validity / Period</th>
                          <th className="py-3.5 px-4">Amount</th>
                          <th className="py-3.5 px-4">Method</th>
                          <th className="py-3.5 px-4">Date</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Staff</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUnifiedRecords.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Member */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                  {item.memberName?.charAt(0) || 'M'}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {item.memberName}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {item.memberPhone}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Plan */}
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {item.planName}
                            </td>

                            {/* Period */}
                            <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                              {item.period}
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                              ETB {Number(item.amount || 0).toFixed(2)}
                            </td>

                            {/* Method */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                {item.method}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                              {item.paidAt ? formatEthDateTime(item.paidAt) : '—'}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <StatusBadge status={item.status} />
                            </td>

                            {/* Staff */}
                            <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">
                              {item.receivedBy}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {item.membershipId && item.status === 'active' && (
                                  <button
                                    onClick={() => handleFreeze(item.membershipId, item.memberName)}
                                    title="Freeze Membership"
                                    className="p-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                                  >
                                    <Snowflake className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {item.membershipId && item.status === 'frozen' && (
                                  <button
                                    onClick={() => handleUnfreeze(item.membershipId, item.memberName)}
                                    title="Unfreeze Membership"
                                    className="px-2.5 py-1 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-[10px] hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    Unfreeze
                                  </button>
                                )}

                                {item.memberId && (
                                  <button
                                    onClick={() => openRenewModalForMember(item.memberId)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    Renew
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredUnifiedRecords.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-12 text-center text-slate-400">
                              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                              <p className="text-sm font-bold text-slate-600">No records found</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {memPaySearch ? 'Try adjusting your search query or filters.' : 'No membership or payment records exist yet.'}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer info */}
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>
                      Showing <strong className="text-slate-900 font-bold">{filteredUnifiedRecords.length}</strong> of{' '}
                      <strong className="text-slate-900 font-bold">{unifiedRecords.length}</strong> entries
                    </span>
                    <span>Sorted by most recent transactions</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 5.7 PRODUCT SALES (POINT OF SALE) */}
            {/* ============================================================== */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Tiles Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 heading-font">
                        Front-Desk Pro Shop
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Instant cashier terminal for nutritional drinks, gear & supplements</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">Tap item to add to register cart</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className={`bg-white rounded-2xl border p-4 shadow-xs hover:border-[#E8452C] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[160px] group ${
                          p.isLowStock ? 'border-amber-300' : 'border-slate-200/80'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex gap-2.5 items-start">
                            {p.imageUrl || p.image_url ? (
                              <img
                                src={p.imageUrl || p.image_url}
                                alt={p.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                              />
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-[#E8452C] transition-colors line-clamp-2 leading-snug">
                                {p.name}
                              </span>
                              {p.category && (
                                <span className="text-[10px] text-slate-400 block mt-0.5 truncate font-medium">
                                  {p.category}
                                </span>
                              )}
                            </div>
                            {p.isLowStock && (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 mt-0.5 animate-pulse" title="Low stock item" />
                            )}
                          </div>
                          <div className="text-lg font-black text-slate-900 heading-font">
                            ETB {Number(p.price).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                          <span>Stock: {p.stockQty ?? p.stock_qty}</span>
                          <span className="text-[#E8452C] font-black group-hover:translate-x-0.5 transition-transform">+ Add</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cart Panel on Right */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between h-fit">
                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                      <span>Register Cart</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {posCart.reduce((sum, i) => sum + i.quantity, 0)} items
                      </span>
                    </h3>

                    {/* Member Link (Optional for walk-ins) */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Link to Member (Optional / Walk-in)
                      </label>
                      <select
                        value={posMemberId}
                        onChange={e => setPosMemberId(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#E8452C]"
                      >
                        <option value="">Walk-in Customer (No member)</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
                        ))}
                      </select>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4">
                      {posCart.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs italic">
                          Cart is empty. Tap any product on the left to add.
                        </div>
                      ) : (
                        posCart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-900 block truncate">{item.product.name}</span>
                              <span className="text-slate-500 font-mono text-[11px]">ETB {item.product.price.toFixed(2)} each</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setPosCart(prev => prev.map(p => p.product.id === item.product.id ? { ...p, quantity: Math.max(1, p.quantity - 1) } : p))}
                                className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-300 transition-colors"
                              >
                                -
                              </button>
                              <span className="font-bold text-slate-900 px-1">{item.quantity}</span>
                              <button
                                onClick={() => setPosCart(prev => prev.map(p => p.product.id === item.product.id ? { ...p, quantity: Math.min(item.product.stockQty, p.quantity + 1) } : p))}
                                className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 font-bold flex items-center justify-center hover:bg-slate-300 transition-colors"
                              >
                                +
                              </button>
                              <button
                                onClick={() => setPosCart(prev => prev.filter(p => p.product.id !== item.product.id))}
                                className="text-slate-400 hover:text-rose-600 pl-1.5 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Payment Method & Checkout */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Payment Method Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-800">
                          Payment Method <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-black text-[#E8452C] uppercase tracking-wider bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                          {posPaymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'cash', label: 'Cash (ጥሬ ገንዘብ)', icon: DollarSign },
                          { id: 'card', label: 'Card / POS', icon: CreditCard },
                          { id: 'mobile_money', label: 'Telebirr', icon: Smartphone },
                          { id: 'bank_transfer', label: 'CBE Transfer', icon: Building2 },
                        ].map((pm) => {
                          const Icon = pm.icon;
                          const isSelected = posPaymentMethod === pm.id;
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPosPaymentMethod(pm.id as any)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#E8452C]' : 'text-slate-500'}`} />
                              <span className="truncate">{pm.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Amount:</span>
                      <span className="text-2xl font-black text-[#E8452C] heading-font">
                        ETB {cartTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      disabled={posCart.length === 0}
                      onClick={handleCompleteSale}
                      className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Complete Sale (ETB {cartTotal.toFixed(2)})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <Modal
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          title={`Edit Details — ${editingMember.fullName}`}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const fnVal = validateName(editingMember.firstName, 'First Name', true);
                if (!fnVal.isValid) {
                  showToast(fnVal.error || 'Invalid First Name', 'error');
                  return;
                }
                const lnVal = validateName(editingMember.lastName, 'Last Name', true);
                if (!lnVal.isValid) {
                  showToast(lnVal.error || 'Invalid Last Name', 'error');
                  return;
                }
                const phoneVal = validateEthiopianPhone(editingMember.phone);
                if (!phoneVal.isValid) {
                  showToast(phoneVal.error || 'Invalid Ethiopian phone number', 'error');
                  return;
                }
                if (editingMember.email && editingMember.email.trim()) {
                  const emailVal = validateEmail(editingMember.email, false);
                  if (!emailVal.isValid) {
                    showToast(emailVal.error || 'Invalid email address', 'error');
                    return;
                  }
                }
                const memberId = editingMember.id || editingMember._id;
                await api.updateMember(memberId, {
                  first_name: editingMember.firstName.trim(),
                  last_name: editingMember.lastName.trim(),
                  phone: phoneVal.normalized,
                  email: editingMember.email ? editingMember.email.trim().toLowerCase() : '',
                  gender: editingMember.gender || '',
                });
                showToast('Member details updated successfully!');
                setEditingMember(null);
                loadReceptionData();
              } catch (err: any) {
                showToast(err.message || 'Failed to update member', 'error');
              }
            }}
            className="space-y-3 text-sm"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                <input
                  placeholder="First Name"
                  required
                  value={editingMember.firstName || ''}
                  onChange={e => setEditingMember({ ...editingMember, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#E8452C]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                <input
                  placeholder="Last Name"
                  required
                  value={editingMember.lastName || ''}
                  onChange={e => setEditingMember({ ...editingMember, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#E8452C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone *</label>
              <input
                placeholder="Phone number"
                required
                value={editingMember.phone || ''}
                onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#E8452C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Email address"
                value={editingMember.email || ''}
                onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#E8452C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
              <select
                value={editingMember.gender || ''}
                onChange={e => setEditingMember({ ...editingMember, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-[#E8452C]"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 font-semibold text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#E8452C] hover:bg-[#B5301C] text-white font-bold text-xs shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renew / Record Payment Modal */}
      {isRenewModalOpen && (
        <Modal
          isOpen={isRenewModalOpen}
          onClose={() => setIsRenewModalOpen(false)}
          title="Record Payment / Renew Membership"
        >
          <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Member *</label>
              <select
                required
                value={renewTargetMemberId}
                onChange={e => setRenewTargetMemberId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#E8452C] bg-white"
              >
                <option value="">-- Choose Member --</option>
                {members.map(m => (
                  <option key={m.id || m._id} value={m.id || m._id}>
                    {m.fullName || `${m.firstName} ${m.lastName}`} ({m.phone}) - Current: {m.currentPlan || m.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Membership Plan *</label>
                <select
                  value={renewPlanName}
                  onChange={e => {
                    const plan = e.target.value;
                    setRenewPlanName(plan);
                    if (plan.includes('Annual')) {
                      setRenewAmount(599);
                      setRenewDurationMonths(12);
                    } else if (plan.includes('Quarterly')) {
                      setRenewAmount(159);
                      setRenewDurationMonths(3);
                    } else {
                      setRenewAmount(59);
                      setRenewDurationMonths(1);
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#E8452C] bg-white"
                >
                  <option value="Monthly Standard">Monthly Standard (1 mo - 59 ETB)</option>
                  <option value="Quarterly Power">Quarterly Power (3 mos - 159 ETB)</option>
                  <option value="Annual Premium">Annual Premium (12 mos - 599 ETB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount (ETB) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={renewAmount}
                  onChange={e => setRenewAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:border-[#E8452C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={renewMethod}
                  onChange={e => setRenewMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#E8452C] bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Months) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="36"
                  value={renewDurationMonths}
                  onChange={e => setRenewDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs font-bold focus:outline-none focus:border-[#E8452C]"
                />
              </div>
            </div>

            <div>
              <EthiopianDatePicker
                label="Membership Start Date (የአባልነት መጀመሪያ ቀን)"
                year={renewEthYear}
                month={renewEthMonth}
                day={renewEthDay}
                durationMonths={renewDurationMonths}
                onChange={(year, month, day) => {
                  setRenewEthYear(year);
                  setRenewEthMonth(month);
                  setRenewEthDay(day);
                }}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#E8452C] hover:bg-[#B5301C] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Confirm & Record Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Member Confirmation Dialog */}
      {deletingMemberId && (() => {
        const memberToDelete = members.find(m => (m.id || m._id) === deletingMemberId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Member</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-5">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-gray-900">
                  {memberToDelete?.fullName || 'this member'}
                </span>
                ? All associated memberships and payment records will also be removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingMemberId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.deleteMember(deletingMemberId);
                      showToast(`${memberToDelete?.fullName || 'Member'} deleted.`);
                      setDeletingMemberId(null);
                      loadReceptionData();
                    } catch (err: any) {
                      showToast(err.message || 'Failed to delete member', 'error');
                      setDeletingMemberId(null);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
