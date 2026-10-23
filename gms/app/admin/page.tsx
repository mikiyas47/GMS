'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Dumbbell,
  Users, 
  CreditCard, 
  DollarSign, 
  Award, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  BarChart3, 
  UserCheck, 
  Search, 
  Bell, 
  LogOut, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  CheckCircle, 
  X, 
  Menu, 
  Eye, 
  Flame, 
  Snowflake, 
  RefreshCw,
  Printer,
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Info,
  Receipt,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  ShieldAlert,
  Lock,
  Shield
} from 'lucide-react';
import { api, getStoredUser, clearSession, UserSession } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import {
  formatEthDate,
  formatEthDateTime,
  formatEthPeriod
} from '@/lib/ethiopianCalendar';
import {
  validateEthiopianPhone,
  validateEmail,
  validateName,
  validatePassword
} from '@/lib/validators';

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'classes' | 'products' | 'sales' | 'reports' | 'staff'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [todayEthDate, setTodayEthDate] = useState<string>('');

  // Core Data States
  const [members, setMembers] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any | null>(null);
  const [expiringReport, setExpiringReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [globalSearch, setGlobalSearch] = useState('');
  const [memberFilterStatus, setMemberFilterStatus] = useState('all');

  // Memberships search & filter states
  const [membershipSearch, setMembershipSearch] = useState('');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState('all');

  // Payments search & filter states
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  // Products search & filter states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');

  // Sales Transactions search & filter states (name & date)
  const [salesSearchName, setSalesSearchName] = useState('');
  const [salesSearchDate, setSalesSearchDate] = useState('');
  const [salesPaymentMethodFilter, setSalesPaymentMethodFilter] = useState('all');

  // Modal States

  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'memberships' | 'payments'>('overview');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: string; id: string; name: string }>({
    open: false,
    type: '',
    id: '',
    name: ''
  });

  // Form inputs

  const initialClassForm = {
    name: '',
    duration_minutes: 60
  };

  const [classForm, setClassForm] = useState(initialClassForm);

  const [sessionForm, setSessionForm] = useState({
    class_id: '',
    day_of_week: 1,
    start_time: '07:00',
    end_time: '08:00',
    room: 'Studio A'
  });

  const initialProductForm = {
    id: '',
    name: '',
    category: 'Free Weights',
    price: 29.99,
    stock_qty: 15,
    reorder_level: 5,
    is_active: true,
    image_url: '',
    description: ''
  };

  const [productForm, setProductForm] = useState(initialProductForm);
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  const [staffForm, setStaffForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'receptionist'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToasts(prev => [...prev, { id: `toast_${Date.now()}`, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    setTodayEthDate(formatEthDate(new Date()));
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/reception');
      return;
    }
    setCurrentUser(user);
    loadAllData();
  }, [router]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [
        mems,
        msList,
        clss,
        sess,
        prods,
        sls,
        pays,
        stf,
        rev,
        exp
      ] = await Promise.all([
        api.getMembers(),
        api.getMemberships(),
        api.getClasses(),
        api.getSessions(),
        api.getProducts(),
        api.getProductSales(),
        api.getPayments(),
        api.getStaffUsers(),
        api.getRevenueReport(),
        api.getExpiringMembershipsReport(7)
      ]);

      setMembers(mems || []);
      setMemberships(msList || []);
      setClasses(clss || []);
      setSessions(sess || []);
      setProducts(prods || []);
      setSales(sls || []);
      setPayments(pays || []);
      setStaffUsers(stf || []);
      setRevenueData(rev || null);
      setExpiringReport(exp || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Load Member Profile Modal
  async function openMemberProfile(id: string, membershipFallback?: any) {
    if (!id && !membershipFallback) return;
    const modalKey = id || (membershipFallback?.id ? `ms_${membershipFallback.id}` : 'temp_member');
    setMemberProfileId(modalKey);
    setProfileTab('overview');

    // Pre-populate with synchronous local data if found in loaded members list
    const localMember = members.find(m => m.id === id || m._id === id);
    if (localMember) {
      setProfileData({
        ...localMember,
        first_name: localMember.firstName || localMember.first_name,
        last_name: localMember.lastName || localMember.last_name,
        fullName: localMember.fullName || `${localMember.firstName || ''} ${localMember.lastName || ''}`.trim(),
        emergency_contact_name: localMember.emergencyContactName || localMember.emergency_contact_name,
        emergency_contact_phone: localMember.emergencyContactPhone || localMember.emergency_contact_phone,
        join_date: localMember.joinDate || localMember.join_date,
        memberships: membershipFallback ? [membershipFallback] : (localMember.memberships || [])
      });
    } else if (membershipFallback) {
      const parts = (membershipFallback.memberName || '').split(' ');
      setProfileData({
        id: membershipFallback.memberId || id,
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || '',
        fullName: membershipFallback.memberName,
        phone: membershipFallback.memberPhone,
        email: membershipFallback.memberEmail,
        status: membershipFallback.status,
        memberships: [membershipFallback]
      });
    } else {
      setProfileData(null);
    }

    if (id) {
      try {
        const data = await api.getMember(id);
        if (data) {
          if (membershipFallback && (!data.memberships || data.memberships.length === 0)) {
            data.memberships = [membershipFallback];
          }
          setProfileData(data);
        }
      } catch {
        if (!localMember && !membershipFallback) {
          showToast('Could not fetch member profile', 'error');
        }
      }
    }
  }

  // Handle Freeze
  async function handleFreeze(membershipId: string) {
    try {
      await api.freezeMembership(membershipId);
      showToast('Membership frozen successfully.');
      loadAllData();
      if (memberProfileId) openMemberProfile(memberProfileId);
    } catch (err: any) {
      showToast(err.message || 'Freeze action failed', 'error');
    }
  }

  // Handle Unfreeze
  async function handleUnfreeze(membershipId: string) {
    try {
      await api.unfreezeMembership(membershipId);
      showToast('Membership unfrozen & extended!');
      loadAllData();
      if (memberProfileId) openMemberProfile(memberProfileId);
    } catch (err: any) {
      showToast(err.message || 'Unfreeze action failed', 'error');
    }
  }

  // Handle Deletion
  async function handleConfirmDelete() {
    try {
      if (deleteConfirm.type === 'member') {
        await api.deleteMember(deleteConfirm.id);
        showToast('Member removed successfully.');
      } else if (deleteConfirm.type === 'session') {
        await api.deleteSession(deleteConfirm.id);
        showToast('Session removed from timetable.');
      } else if (deleteConfirm.type === 'product') {
        await api.deleteProduct(deleteConfirm.id);
        showToast('Product deleted.');
      } else if (deleteConfirm.type === 'class') {
        await api.deleteClass(deleteConfirm.id);
        showToast('Class type removed.');
      }
      setDeleteConfirm({ open: false, type: '', id: '', name: '' });
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'classes', label: 'Classes & Timetable', icon: Calendar },
    { key: 'products', label: 'Products', icon: ShoppingBag },
    { key: 'sales', label: 'Transactions of the Sales', icon: Receipt },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'staff', label: 'Staff Accounts', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="flex flex-1">
        {/* 4.1 Left Sidebar (240px Desktop, collapses to 80px icons, mobile drawer) */}
        <aside
          className={`fixed lg:sticky top-0 h-screen z-40 bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#0B0F19] text-white flex flex-col transition-all duration-300 border-r border-slate-800/80 shrink-0 shadow-2xl ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo & Gym Title */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E8452C] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#E8452C]/30">
                <Dumbbell className="w-5 h-5 -rotate-45" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="text-base font-black tracking-wider heading-font block leading-none">
                    TITAN<span className="text-[#E8452C]">GYM</span>
                  </span>
                  <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase block mt-1">
                    Admin Portal
                  </span>
                </div>
              )}
            </div>
            {/* Collapse toggle button on desktop */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer"
              title="Toggle sidebar width"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="px-4 pt-4 pb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Management
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key as any);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#E8452C] to-[#C7331C] text-white shadow-lg shadow-[#E8452C]/25 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* User info & Logout at bottom */}
          <div className="m-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className={`flex items-center gap-2.5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E8452C] to-orange-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {currentUser?.fullName.charAt(0) || 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden flex-1">
                  <div className="text-xs font-bold text-white truncate">{currentUser?.fullName}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{currentUser?.role}</div>
                </div>
              )}
              <button
                onClick={() => {
                  clearSession();
                  router.push('/login');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
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
                  Titan Admin Portal
                </span>
                <h1 className="text-lg font-black text-slate-900 heading-font uppercase tracking-wide mt-0.5">
                  {activeTab === 'sales' ? 'Transactions of the Sales' : activeTab.replace('-', ' ')}
                </h1>
              </div>
            </div>

            {/* Notification Bell & Ethiopian Date Badge */}
            <div className="flex items-center gap-3">
              {/* Live Ethiopian Calendar Date Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{todayEthDate ? `የዛሬ ቀን: ${todayEthDate}` : 'የዛሬ ቀን'}</span>
              </div>

              <div className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                <Bell className="w-4 h-4" />
                {expiringReport.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E8452C] ring-2 ring-white" />
                )}
              </div>
            </div>
          </header>

          {/* Main Workspace Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* ============================================================== */}
            {/* VIEW 1: DASHBOARD */}
            {/* ============================================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 4.2 Top Row: 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Active Members */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Active Members
                      </span>
                      <div className="text-3xl font-black text-slate-900 heading-font">
                        {members.filter(m => m.status === 'active').length}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold mt-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Active community</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-emerald-500/10">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 2: Total Members */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Total Registered
                      </span>
                      <div className="text-3xl font-black text-slate-900 heading-font">
                        {members.length}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mt-1.5">
                        {members.filter(m => m.status === 'active').length} active memberships
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-blue-500/10">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 3: Revenue This Month */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8452C] to-orange-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Revenue This Month
                      </span>
                      <div className="text-3xl font-black text-slate-900 heading-font">
                        ETB {revenueData?.summary?.grossRevenue ? Number(revenueData.summary.grossRevenue).toFixed(2) : '1,257.00'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold mt-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Gross volume in ETB</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#E8452C] flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-[#E8452C]/10">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 4: Expiring in 7 Days (Warning Color) */}
                  <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                        Expiring in 7 Days
                      </span>
                      <div className="text-3xl font-black text-amber-700 heading-font">
                        {expiringReport.length}
                      </div>
                      <div className="text-xs text-amber-600 font-semibold mt-1.5">
                        Requires renewal reminder
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform ring-4 ring-amber-500/15">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Middle Row: Two Columns (Revenue Chart & Membership Overview) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Revenue Summary & Method Breakdown */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 heading-font">Revenue Breakdown</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Subscriptions & Pro-Shop income</p>
                      </div>
                      <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">All-Time</span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-slate-600">Membership Subscriptions</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          ETB {revenueData?.summary?.membershipRevenue ? Number(revenueData.summary.membershipRevenue).toFixed(2) : '1,198.00'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-xs font-bold text-slate-600">Pro-Shop Product Sales</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          ETB {revenueData?.summary?.productSalesRevenue ? Number(revenueData.summary.productSalesRevenue).toFixed(2) : '59.00'}
                        </span>
                      </div>

                      {/* Payment method pill bars */}
                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                          Transactions by Payment Method
                        </span>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {['cash', 'card', 'mobile_money', 'bank_transfer'].map((m) => (
                            <div key={m} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                                {m.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-black text-slate-800 mt-0.5 block">
                                {payments.filter(p => p.method === m).length} tx
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Membership Status Overview */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 heading-font">Membership Status Overview</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Active, frozen & expired breakdown</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {memberships.filter(m => m.status === 'active').length} Active Plans
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Active</span>
                          <span className="text-2xl font-black text-emerald-900 heading-font mt-0.5 block">
                            {members.filter(m => m.status === 'active').length}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                          <span className="text-[11px] font-bold text-amber-700 uppercase block">Frozen</span>
                          <span className="text-2xl font-black text-amber-900 heading-font mt-0.5 block">
                            {members.filter(m => m.status === 'frozen').length}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100">
                          <span className="text-[11px] font-bold text-rose-700 uppercase block">Expired</span>
                          <span className="text-2xl font-black text-rose-900 heading-font mt-0.5 block">
                            {members.filter(m => m.status === 'expired').length}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Pro-Shop Inventory</span>
                        <span className="text-sm font-black text-slate-900">{products.length} Products in Stock</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Fitness Classes</span>
                        <span className="text-sm font-black text-slate-900">{classes.length} Scheduled Classes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Expiring Memberships Table & Recent Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Expiring memberships table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 heading-font">Expiring Memberships</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Ethiopian Calendar validity ending</p>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Next 7 Days
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200/80">
                          <tr>
                            <th className="py-3 px-4">Member</th>
                            <th className="py-3 px-4">Plan</th>
                            <th className="py-3 px-4">End Date</th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {expiringReport.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400">
                                No memberships expiring in the next 7 days.
                              </td>
                            </tr>
                          ) : (
                            expiringReport.map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900">{row.memberName}</td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{row.planName}</td>
                                <td className="py-3 px-4 font-bold text-amber-700 font-mono">{formatEthDate(row.endDate)}</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => openMemberProfile(row.memberId)}
                                    className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px] hover:bg-slate-200 transition-colors cursor-pointer"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Recent Payments */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 heading-font">Recent Payments</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Recorded front desk & online collections</p>
                      </div>
                      <button onClick={() => setActiveTab('sales')} className="text-xs text-[#E8452C] font-bold hover:underline cursor-pointer">
                        View All Sales →
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {payments.slice(0, 5).map((pay, i) => (
                        <div key={i} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                          <div>
                            <span className="font-bold text-slate-900 block">{pay.memberName}</span>
                            <span className="text-[11px] text-slate-500 capitalize">{pay.planName} • {pay.method}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900 block text-sm font-mono">ETB {pay.amount.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400">
                              {formatEthDateTime(pay.paidAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: MEMBERS */}
            {/* ============================================================== */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 heading-font">
                      Members Directory ({members.length})
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage member records, active memberships, and contact details.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="/reception"
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#C7331C] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#E8452C]/20 hover:-translate-y-0.5 transition-all cursor-pointer"
                      title="Navigate to Reception Desk to register new members"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Register at Front Desk →
                    </a>
                    <button
                      onClick={() => {
                        const csv = "Name,Phone,Email,Status,CurrentPlan,EndDate\n" + members.map(m => `"${m.fullName}","${m.phone}","${m.email || ''}","${m.status}","${m.currentPlan || ''}","${m.planEndDate || ''}"`).join("\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `gym_members_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        showToast('CSV exported successfully');
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by name, phone, or email..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-4 focus:ring-[#E8452C]/10 text-slate-800 transition-all"
                    />
                  </div>

                  <select
                    value={memberFilterStatus}
                    onChange={(e) => setMemberFilterStatus(e.target.value)}
                    className="min-h-[38px] px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none font-bold cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="frozen">Frozen</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold text-[11px] border-b border-slate-200/80">
                        <tr>
                          <th className="py-4 px-4">Member</th>
                          <th className="py-4 px-4">Phone</th>
                          <th className="py-4 px-4">Current Plan</th>
                          <th className="py-4 px-4">End Date (Ethiopian)</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {members
                          .filter(m => {
                            if (memberFilterStatus !== 'all' && m.status !== memberFilterStatus) return false;
                            if (globalSearch) {
                              const s = globalSearch.toLowerCase();
                              return m.fullName.toLowerCase().includes(s) || m.phone.includes(s) || (m.email && m.email.toLowerCase().includes(s));
                            }
                            return true;
                          })
                          .map((m) => {
                            const isExpired = m.status === 'expired';
                            const isWarning = m.planEndDate && new Date(m.planEndDate) <= new Date(Date.now() + 7 * 86400000) && !isExpired;

                            return (
                              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div
                                    onClick={() => openMemberProfile(m.id)}
                                    className="flex items-center gap-3 cursor-pointer group"
                                  >
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                      {m.firstName.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 group-hover:text-[#E8452C] transition-colors block text-sm">
                                        {m.fullName}
                                      </span>
                                      {m.email && (
                                        <span className="text-[11px] text-slate-400">{m.email}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{m.phone}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-800">{m.currentPlan || 'No Active Plan'}</td>
                                <td className="py-3.5 px-4 font-semibold">
                                  {m.planEndDate ? (
                                    <div>
                                      <span className={isExpired ? 'text-rose-600 font-bold block' : isWarning ? 'text-amber-600 font-bold block' : 'text-slate-900 font-bold block'}>
                                        {formatEthDate(m.planEndDate)}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal block">
                                        {formatEthDate(m.planEndDate, 'amharic')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <StatusBadge status={m.status} />
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openMemberProfile(m.id)}
                                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                      title="View Profile"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 6: CLASSES AND TIMETABLE */}
            {/* ============================================================== */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#E8452C]" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule & Disciplines</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 heading-font tracking-tight">
                      Class Catalog & Timetable
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage group fitness disciplines and weekly timetable schedules.</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setClassForm(initialClassForm);
                        setAddClassOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-orange-400" />
                      Add Class Type
                    </button>
                    <button
                      onClick={() => setAddSessionOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#FF6B4A] hover:from-[#d03720] hover:to-[#e8452c] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#E8452C]/20 transition-all hover:shadow-lg hover:shadow-[#E8452C]/30 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Schedule Session
                    </button>
                  </div>
                </div>

                {/* Timetable Weekly Grid with Edit & Delete Controls */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 heading-font">Weekly Schedule Master</h3>
                      <p className="text-xs text-slate-500 mt-0.5">7-day active timetable for member classes & studio rooms</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {sessions.length} Scheduled Sessions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
                    {[
                      { num: 1, name: 'Monday', short: 'Mon' },
                      { num: 2, name: 'Tuesday', short: 'Tue' },
                      { num: 3, name: 'Wednesday', short: 'Wed' },
                      { num: 4, name: 'Thursday', short: 'Thu' },
                      { num: 5, name: 'Friday', short: 'Fri' },
                      { num: 6, name: 'Saturday', short: 'Sat' },
                      { num: 7, name: 'Sunday', short: 'Sun' },
                    ].map((d) => {
                      const daySess = sessions.filter(s => s.dayOfWeek === d.num);
                      return (
                        <div key={d.num} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 min-h-[280px] flex flex-col transition-all hover:border-slate-300">
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                            <span className="font-bold text-xs text-slate-800">{d.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${daySess.length > 0 ? 'bg-[#E8452C]/10 text-[#E8452C]' : 'bg-slate-200/60 text-slate-400'}`}>
                              {daySess.length}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mt-2.5 flex-1 overflow-y-auto max-h-[360px] pr-0.5">
                            {daySess.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-center py-8">
                                <span className="text-[11px] text-slate-400 font-medium italic">No sessions</span>
                              </div>
                            ) : (
                              daySess.map((s, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200/90 text-xs shadow-xs group relative hover:shadow-md hover:border-[#E8452C]/30 transition-all">
                                  <div className="flex items-start justify-between pr-4">
                                    <div className="font-extrabold text-slate-900 leading-snug">{s.class?.name || s.className}</div>
                                  </div>
                                  <div className="inline-flex items-center gap-1 text-[11px] text-[#E8452C] font-mono font-bold mt-1.5 bg-orange-50 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 text-[#E8452C]" />
                                    {s.startTime} – {s.endTime}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {s.room || 'Studio A'}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm({
                                        open: true,
                                        type: 'session',
                                        id: s.sessionId || s.id,
                                        name: `${s.class?.name} (${d.name} ${s.startTime})`
                                      });
                                    }}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg hover:bg-rose-50"
                                    title="Remove session"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Class types table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 heading-font">Registered Class Types</span>
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                          {classes.length} Types
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Discipline templates configured for timetable scheduling</p>
                    </div>
                    <button
                      onClick={() => {
                        setClassForm(initialClassForm);
                        setAddClassOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-400" />
                      Add Class Type
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200/80">
                        <tr>
                          <th className="py-3 px-5">Class Title</th>
                          <th className="py-3 px-5">Duration</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classes.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-10 text-center text-slate-400">
                              <Dumbbell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <span className="block font-medium">No class types created yet.</span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">Click &quot;Add Class Type&quot; above to create one.</span>
                            </td>
                          </tr>
                        ) : (
                          classes.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-bold text-slate-900">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-xl bg-orange-50 text-[#E8452C] flex items-center justify-center font-bold shrink-0 ring-4 ring-[#E8452C]/10">
                                    <Dumbbell className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <span className="font-extrabold text-slate-900 text-xs block">{c.name}</span>
                                    {c.description && (
                                      <span className="block text-[11px] font-normal text-slate-500 truncate max-w-md mt-0.5">
                                        {c.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {c.durationMinutes} mins
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <button
                                  onClick={() => {
                                    setDeleteConfirm({
                                      open: true,
                                      type: 'class',
                                      id: c.id,
                                      name: c.name
                                    });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete class type"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 8: PRODUCTS */}
            {/* ============================================================== */}
            {activeTab === 'products' && (() => {
              const productCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

              const filteredProducts = products.filter(p => {
                if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
                if (productStockFilter === 'low_stock' && !p.isLowStock) return false;
                if (productStockFilter === 'in_stock' && (p.stockQty ?? p.stock_qty ?? 0) <= 0) return false;
                if (productStockFilter === 'out_of_stock' && (p.stockQty ?? p.stock_qty ?? 0) > 0) return false;
                if (productStockFilter === 'inactive' && p.isActive !== false && p.is_active !== false) return false;

                if (productSearch.trim()) {
                  const q = productSearch.toLowerCase();
                  const name = (p.name || '').toLowerCase();
                  const cat = (p.category || '').toLowerCase();
                  const desc = (p.description || '').toLowerCase();
                  if (!name.includes(q) && !cat.includes(q) && !desc.includes(q)) return false;
                }
                return true;
              });

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retail & POS Catalog</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 heading-font tracking-tight">
                        Pro-Shop Products & Inventory ({filteredProducts.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Manage products, retail prices in ETB, and inventory reorder alerts.</p>
                    </div>
                    <button
                      onClick={() => {
                        setProductForm(initialProductForm);
                        setIsEditingProduct(false);
                        setAddProductOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#FF6B4A] hover:from-[#d03720] hover:to-[#e8452c] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#E8452C]/20 transition-all hover:shadow-lg hover:shadow-[#E8452C]/30 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>

                  {/* Product Search & Filter Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-3 shadow-xs">
                    <div className="flex-1 min-w-[240px] relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search products by name, category, or description..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-2 focus:ring-[#E8452C]/10 transition-all"
                      />
                      {productSearch && (
                        <button
                          onClick={() => setProductSearch('')}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {productCategories.map((c) => (
                        <option key={String(c)} value={String(c)}>{String(c)}</option>
                      ))}
                    </select>

                    <select
                      value={productStockFilter}
                      onChange={(e) => setProductStockFilter(e.target.value)}
                      className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="all">All Stock Statuses</option>
                      <option value="low_stock">⚠️ Low Stock Alert</option>
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock (0)</option>
                      <option value="inactive">Archived / Inactive</option>
                    </select>

                    {(productSearch || productCategoryFilter !== 'all' || productStockFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setProductSearch('');
                          setProductCategoryFilter('all');
                          setProductStockFilter('all');
                        }}
                        className="text-xs text-rose-600 font-bold hover:underline px-2.5 py-1.5 cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200/80">
                          <tr>
                            <th className="py-3 px-5">Product</th>
                            <th className="py-3 px-5">Category</th>
                            <th className="py-3 px-5">Retail Price</th>
                            <th className="py-3 px-5">Stock Quantity</th>
                            <th className="py-3 px-5">Reorder Level</th>
                            <th className="py-3 px-5">Status</th>
                            <th className="py-3 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <span className="block font-medium">No products found matching your search.</span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">Try adjusting your filters or search terms.</span>
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p, idx) => (
                              <tr key={idx} className={`hover:bg-slate-50/70 transition-colors ${p.isLowStock ? 'bg-amber-50/40' : ''}`}>
                                <td className="py-3.5 px-5">
                                  <div className="flex items-center gap-3">
                                    {p.imageUrl || p.image_url ? (
                                      <img
                                        src={p.imageUrl || p.image_url}
                                        alt={p.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50 shadow-xs"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                        <ShoppingBag className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className="max-w-xs">
                                      <span className="font-extrabold text-slate-900 block truncate leading-tight text-xs" title={p.name}>
                                        {p.name}
                                      </span>
                                      {p.description && (
                                        <span className="text-[11px] text-slate-400 block truncate mt-0.5" title={p.description}>
                                          {p.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-5">
                                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 whitespace-nowrap">
                                    {p.category || 'Equipment & Gear'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 font-mono font-black text-slate-900 text-xs">ETB {Number(p.price).toFixed(2)}</td>
                                <td className="py-3.5 px-5">
                                  <span className={`font-mono font-black text-xs ${p.isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                                    {p.stockQty ?? p.stock_qty}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">{p.reorderLevel ?? p.reorder_level}</td>
                                <td className="py-3.5 px-5">
                                  <div className="flex flex-col gap-1 items-start">
                                    {p.isLowStock ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        ⚠️ Low Stock
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        In Stock
                                      </span>
                                    )}
                                    {(p.isActive === false || p.is_active === false) && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                        Archived
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setProductForm({
                                          id: p.id || p._id,
                                          name: p.name || '',
                                          category: p.category || 'Free Weights',
                                          price: Number(p.price) || 0,
                                          stock_qty: Number(p.stockQty ?? p.stock_qty ?? 0),
                                          reorder_level: Number(p.reorderLevel ?? p.reorder_level ?? 5),
                                          is_active: p.isActive !== undefined ? p.isActive : (p.is_active !== undefined ? p.is_active : true),
                                          image_url: p.imageUrl || p.image_url || p.image || '',
                                          description: p.description || ''
                                        });
                                        setIsEditingProduct(true);
                                        setAddProductOpen(true);
                                      }}
                                      title="Edit Product"
                                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteConfirm({
                                          open: true,
                                          type: 'product',
                                          id: p.id,
                                          name: p.name
                                        });
                                      }}
                                      title="Delete Product"
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ============================================================== */}
            {/* VIEW 8.5: TRANSACTIONS OF THE SALES */}
            {/* ============================================================== */}
            {activeTab === 'sales' && (() => {
              const filteredSales = sales.filter(s => {
                // Date filter
                if (salesSearchDate) {
                  const saleDateStr = s.soldAt ? new Date(s.soldAt).toISOString().split('T')[0] : '';
                  const localDateStr = s.soldAt ? new Date(s.soldAt).toLocaleDateString('en-CA') : '';
                  if (saleDateStr !== salesSearchDate && localDateStr !== salesSearchDate) return false;
                }
                // Payment method filter
                if (salesPaymentMethodFilter !== 'all') {
                  const method = s.paymentMethod || 'cash';
                  if (method !== salesPaymentMethodFilter) return false;
                }
                // Name filter (product name, buyer name, or staff name)
                if (salesSearchName.trim()) {
                  const q = salesSearchName.toLowerCase();
                  const productName = (s.productName || '').toLowerCase();
                  const buyerName = (s.member?.name || 'walk-in').toLowerCase();
                  const staffName = (s.soldBy?.name || '').toLowerCase();
                  if (!productName.includes(q) && !buyerName.includes(q) && !staffName.includes(q)) return false;
                }
                return true;
              });

              const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
              const totalUnits = filteredSales.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

              return (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Point of Sale Audit</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 heading-font tracking-tight">
                        Transactions of the Sales ({filteredSales.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Audit point-of-sale receipt logs, customer purchases, and register revenue in ETB.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const csv = "Date,Product,Quantity,TotalAmount,PaymentMethod,Buyer,SoldBy\n" + filteredSales.map(s => {
                          const d = s.soldAt ? new Date(s.soldAt).toISOString().split('T')[0] : '';
                          const pName = `"${(s.productName || '').replace(/"/g, '""')}"`;
                          const buyer = `"${(s.member?.name || 'Walk-in').replace(/"/g, '""')}"`;
                          const staff = `"${(s.soldBy?.name || 'Staff').replace(/"/g, '""')}"`;
                          return `${d},${pName},${s.quantity},${s.totalAmount || 0},${s.paymentMethod || 'cash'},${buyer},${staff}`;
                        }).join("\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sales_transactions_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        showToast('Sales transactions exported as CSV');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white font-bold text-xs hover:bg-slate-50 flex items-center gap-2 transition-all shadow-xs hover:shadow-sm cursor-pointer self-start sm:self-auto"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      Export Sales CSV
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Filtered Sales Revenue</span>
                      <div className="text-2xl font-black text-emerald-600 heading-font">
                        ETB {totalRevenue.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-1">From {filteredSales.length} transaction records</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Units Sold</span>
                      <div className="text-2xl font-black text-slate-900 heading-font">
                        {totalUnits}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-1">Total retail items checked out</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Avg Transaction Size</span>
                      <div className="text-2xl font-black text-slate-900 heading-font">
                        ETB {filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(2) : '0.00'}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-1">Per transaction average</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Payment Methods</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Cash: {filteredSales.filter(s => (s.paymentMethod || 'cash') === 'cash').length}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Card: {filteredSales.filter(s => s.paymentMethod === 'card').length}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Other: {filteredSales.filter(s => s.paymentMethod && !['cash', 'card'].includes(s.paymentMethod)).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SEARCH BAR WITH DATE AND NAME */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search by Name */}
                      <div className="flex-1 min-w-[240px] relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Search by product, customer, or staff name..."
                          value={salesSearchName}
                          onChange={(e) => setSalesSearchName(e.target.value)}
                          className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#E8452C] focus:ring-2 focus:ring-[#E8452C]/10 transition-all"
                        />
                        {salesSearchName && (
                          <button
                            onClick={() => setSalesSearchName('')}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Filter by Date */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Date:
                        </label>
                        <input
                          type="date"
                          value={salesSearchDate}
                          onChange={(e) => setSalesSearchDate(e.target.value)}
                          className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-700 font-semibold cursor-pointer"
                        />
                        {salesSearchDate && (
                          <button
                            onClick={() => setSalesSearchDate('')}
                            className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                            title="Clear date filter"
                          >
                            Clear Date
                          </button>
                        )}
                      </div>

                      {/* Payment Method filter */}
                      <select
                        value={salesPaymentMethodFilter}
                        onChange={(e) => setSalesPaymentMethodFilter(e.target.value)}
                        className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none font-semibold cursor-pointer"
                      >
                        <option value="all">All Payment Methods</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>

                      {/* Reset All */}
                      {(salesSearchName || salesSearchDate || salesPaymentMethodFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSalesSearchName('');
                            setSalesSearchDate('');
                            setSalesPaymentMethodFilter('all');
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sales Transactions Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="p-5 border-b border-slate-200/80 font-black text-sm text-slate-900 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="heading-font">Transaction History</span>
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                          {filteredSales.length} Records
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        Total {sales.length} logs
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200/80">
                          <tr>
                            <th className="py-3 px-5">Product Name</th>
                            <th className="py-3 px-5">Qty</th>
                            <th className="py-3 px-5">Total Amount</th>
                            <th className="py-3 px-5">Payment Method</th>
                            <th className="py-3 px-5">Customer / Buyer</th>
                            <th className="py-3 px-5">Sold By</th>
                            <th className="py-3 px-5">Ethiopian Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSales.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <span className="block font-medium">No sales transactions found matching your search.</span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">Try clearing or adjusting your date or name search filters.</span>
                              </td>
                            </tr>
                          ) : (
                            filteredSales.map((s, i) => (
                              <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-5 font-bold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-xl bg-orange-50 text-[#E8452C] flex items-center justify-center font-bold shrink-0 ring-2 ring-[#E8452C]/10">
                                      <ShoppingBag className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="font-extrabold text-slate-900">{s.productName}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-5 font-mono font-black text-slate-800">
                                  {s.quantity}
                                </td>
                                <td className="py-3.5 px-5 font-mono font-black text-emerald-600 text-xs">
                                  ETB {Number(s.totalAmount || 0).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                                    {(s.paymentMethod || 'cash').replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="py-3.5 px-5">
                                  {s.member ? (
                                    <span className="font-bold text-slate-900">{s.member.name}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Walk-in Customer</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-5 text-slate-600 font-medium">
                                  {s.soldBy?.name || 'Staff'}
                                </td>
                                <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap font-medium text-[11px]">
                                  {s.soldAt ? formatEthDateTime(s.soldAt) : '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ============================================================== */}
            {/* VIEW 9: REPORTS */}
            {/* ============================================================== */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analytics & Insights</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 heading-font tracking-tight">
                      Executive Reports & Analytics
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Revenue, subscriptions, and retention analysis in ETB.</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black flex items-center gap-2 shadow-sm transition-all hover:shadow-md cursor-pointer self-start sm:self-auto"
                  >
                    <Printer className="w-4 h-4" />
                    Print PDF Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Gross Revenue</span>
                    <div className="text-3xl font-black text-slate-900 heading-font mt-2">
                      ETB {revenueData?.summary?.grossRevenue ? Number(revenueData.summary.grossRevenue).toFixed(2) : '1,257.00'}
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold block mt-1">Across all gym income channels</span>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Subscribed Memberships</span>
                    <div className="text-3xl font-black text-slate-900 heading-font mt-2">
                      {members.filter(m => m.status === 'active').length}
                    </div>
                    <span className="text-xs text-blue-600 font-semibold block mt-1">Currently active members</span>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8452C] to-orange-500" />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pro-Shop Retail Sales</span>
                    <div className="text-3xl font-black text-slate-900 heading-font mt-2">
                      ETB {sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0).toFixed(2)}
                    </div>
                    <span className="text-xs text-[#E8452C] font-semibold block mt-1">Total retail gear volume</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 heading-font">Retention & Expiring Memberships (Next 30 Days)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Members needing renewal contact based on Ethiopian Calendar dates</p>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      {expiringReport.length} Members Expiring
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {expiringReport.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No memberships expiring in the next 30 days.
                      </div>
                    ) : (
                      expiringReport.map((row, i) => (
                        <div key={i} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">{row.memberName}</span>
                            <span className="text-slate-500 text-xs">Phone: <span className="font-mono">{row.memberPhone}</span> • Plan: <span className="font-semibold text-slate-800">{row.planName}</span></span>
                          </div>
                          <div className="text-right">
                            <span className="text-amber-700 font-extrabold block">Expires: {formatEthDate(row.endDate)}</span>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">{row.daysRemaining} days left</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 10: STAFF ACCOUNTS */}
            {/* ============================================================== */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Control</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 heading-font tracking-tight">
                      Staff Accounts Management
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Only administrators can create receptionist or admin accounts.</p>
                  </div>
                  <button
                    onClick={() => setAddStaffOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E8452C] to-[#FF6B4A] hover:from-[#d03720] hover:to-[#e8452c] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#E8452C]/20 transition-all hover:shadow-lg hover:shadow-[#E8452C]/30 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create Staff Account
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200/80">
                        <tr>
                          <th className="py-3 px-5">Staff Member</th>
                          <th className="py-3 px-5">Email</th>
                          <th className="py-3 px-5">Role</th>
                          <th className="py-3 px-5">Status</th>
                          <th className="py-3 px-5">Created Date</th>
                          <th className="py-3 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staffUsers.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-900">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                  {u.fullName.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-extrabold text-slate-900 text-xs">{u.fullName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">
                              <div>{u.email}</div>
                              {u.phone && <div className="text-[11px] text-slate-400 font-mono">{u.phone}</div>}
                            </td>
                            <td className="py-3.5 px-5 capitalize">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-5">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {u.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-slate-500 font-medium text-xs">
                              {u.createdAt ? formatEthDate(u.createdAt) : '—'}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              {u.id !== currentUser?.id && (
                                <button
                                  onClick={async () => {
                                    await api.updateStaffUser(u.id, { is_active: !u.isActive });
                                    showToast('Staff status updated.');
                                    loadAllData();
                                  }}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${u.isActive ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                                >
                                  {u.isActive ? 'Deactivate' : 'Enable'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: MEMBER PROFILE 4.4 */}
      {/* ============================================================== */}
      <Modal
        isOpen={Boolean(memberProfileId)}
        onClose={() => setMemberProfileId(null)}
        title="Member Profile Details"
        maxWidth="max-w-2xl"
      >
        {profileData ? (() => {
          const firstName = (profileData.first_name || profileData.firstName || '').trim();
          const lastName = (profileData.last_name || profileData.lastName || '').trim();
          const fullName = profileData.fullName || [firstName, lastName].filter(Boolean).join(' ') || profileData.memberName || 'Member Details';
          const phone = (profileData.phone || profileData.memberPhone || '').trim();
          const email = (profileData.email || profileData.memberEmail || '').trim();
          const gender = (profileData.gender || '').trim();
          const address = (profileData.address || '').trim();
          const ecName = (profileData.emergency_contact_name || profileData.emergencyContactName || '').trim();
          const ecPhone = (profileData.emergency_contact_phone || profileData.emergencyContactPhone || '').trim();
          const notes = (profileData.notes || '').trim();
          const joinDate = (profileData.join_date || profileData.joinDate || (profileData.createdAt ? profileData.createdAt.split('T')[0] : '') || '').trim();
          const registeredBy = (profileData.registered_by?.full_name || profileData.registeredBy?.name || '').trim();
          const status = profileData.status || 'active';
          const membershipsList: any[] = profileData.memberships || [];
          const paymentsList: any[] = profileData.payments || [];

          // Helper to check valid entered string
          const hasVal = (val: string | null | undefined) => Boolean(val && val !== 'N/A' && val !== 'None recorded' && val !== 'null' && val !== 'undefined');

          return (
            <div className="space-y-5 text-xs">
              {/* Header Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#E8452C] text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                    {(firstName || fullName || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{fullName}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-gray-600 mt-0.5">
                      {hasVal(phone) && (
                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {phone}
                        </span>
                      )}
                      {hasVal(email) && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Profile Tabs */}
              <div className="flex border-b border-gray-200 gap-4 text-xs font-semibold">
                <button
                  onClick={() => setProfileTab('overview')}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    profileTab === 'overview' ? 'border-[#E8452C] text-[#E8452C]' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Overview & Details
                </button>
                <button
                  onClick={() => setProfileTab('memberships')}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    profileTab === 'memberships' ? 'border-[#E8452C] text-[#E8452C]' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Memberships ({membershipsList.length})
                </button>
                <button
                  onClick={() => setProfileTab('payments')}
                  className={`pb-2 border-b-2 cursor-pointer transition-colors ${
                    profileTab === 'payments' ? 'border-[#E8452C] text-[#E8452C]' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Payments ({paymentsList.length})
                </button>
              </div>

              {/* Tab: Overview (ONLY SHOW DATA THAT IS ENTERED) */}
              {profileTab === 'overview' && (
                <div className="space-y-3">
                  {/* Dynamic Grid: Only show fields that have values entered */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {hasVal(phone) && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                        <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 block">Phone Number</span>
                          <span className="font-bold text-gray-900 font-mono text-xs">{phone}</span>
                        </div>
                      </div>
                    )}

                    {hasVal(email) && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 block">Email Address</span>
                          <span className="font-semibold text-gray-900 text-xs">{email}</span>
                        </div>
                      </div>
                    )}

                    {hasVal(gender) && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 block">Gender</span>
                          <span className="font-semibold text-gray-900 text-xs capitalize">{gender}</span>
                        </div>
                      </div>
                    )}

                    {hasVal(address) && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 block">Residential Address</span>
                          <span className="font-semibold text-gray-900 text-xs">{address}</span>
                        </div>
                      </div>
                    )}

                    {hasVal(joinDate) && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 block">Join Date</span>
                          <span className="font-semibold text-gray-900 text-xs">{formatEthDate(joinDate)}</span>
                        </div>
                      </div>
                    )}

                    {hasVal(registeredBy) && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                        <UserCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-gray-500 block">Registered By</span>
                          <span className="font-semibold text-gray-900 text-xs">{registeredBy}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact - Only if entered */}
                  {(hasVal(ecName) || hasVal(ecPhone)) && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 block">Emergency Contact</span>
                        <span className="font-bold text-gray-900 text-xs">
                          {ecName}
                          {hasVal(ecPhone) && (
                            <span className="font-normal font-mono text-gray-600 ml-1.5">({ecPhone})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Health Notes - Only if entered */}
                  {hasVal(notes) && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200 flex items-start gap-2.5">
                      <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-semibold text-gray-500 block">Health & Physical Notes</span>
                        <p className="text-gray-800 text-xs leading-relaxed mt-0.5">{notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Active / Current Membership Highlight */}
                  {membershipsList.length > 0 && (
                    <div className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200 space-y-2">
                      <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                        Current Membership Plan
                      </span>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-gray-900 text-sm block">
                            {membershipsList[0].plan_name || membershipsList[0].planName}
                          </span>
                          <span className="text-gray-600 text-[11px]">
                            {formatEthPeriod(membershipsList[0].start_date || membershipsList[0].startDate, membershipsList[0].end_date || membershipsList[0].endDate)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-gray-900 block font-mono">
                            ETB {Number(membershipsList[0].price || 0).toFixed(2)}
                          </span>
                          <StatusBadge status={membershipsList[0].status} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Memberships */}
              {profileTab === 'memberships' && (
                <div className="space-y-2">
                  {membershipsList.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-lg">
                      No membership plans recorded for this member.
                    </div>
                  ) : (
                    membershipsList.map((ms: any, i: number) => (
                      <div key={ms.id || ms._id || i} className="p-3 bg-white rounded-lg border border-gray-200 flex justify-between items-center hover:border-gray-300 transition-colors">
                        <div>
                          <span className="font-bold text-gray-900 text-xs block">
                            {ms.plan_name || ms.planName}
                          </span>
                          <span className="text-gray-500 text-[11px] block mt-0.5">
                            Duration: {formatEthPeriod(ms.start_date || ms.startDate, ms.end_date || ms.endDate)}
                          </span>
                          {ms.frozen_from && (
                            <span className="text-[10px] text-amber-600 font-medium block">
                              Frozen since: {formatEthDate(ms.frozen_from)}
                            </span>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <span className="font-mono font-bold text-gray-900 text-xs block">
                            ETB {Number(ms.price || 0).toFixed(2)}
                          </span>
                          <StatusBadge status={ms.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Payments */}
              {profileTab === 'payments' && (
                <div className="space-y-2">
                  {paymentsList.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-lg">
                      No payment transactions recorded for this member.
                    </div>
                  ) : (
                    paymentsList.map((p: any, i: number) => {
                      const paidDateStr = p.paid_at || p.paidAt || p.createdAt;
                      const formattedDate = paidDateStr ? formatEthDateTime(paidDateStr) : '—';
                      return (
                        <div key={p.id || p._id || i} className="p-3 bg-white rounded-lg border border-gray-200 flex justify-between items-center hover:border-gray-300 transition-colors">
                          <div>
                            <span className="font-bold text-gray-900 text-xs block">
                              ETB {Number(p.amount || 0).toFixed(2)}
                            </span>
                            <span className="text-gray-500 text-[11px] block mt-0.5">
                              Method: <span className="capitalize font-medium text-gray-700">{p.method?.replace('_', ' ') || 'Cash'}</span> • Date: {formattedDate}
                            </span>
                            {p.received_by?.full_name && (
                              <span className="text-[10px] text-gray-400 block">
                                Received by: {p.received_by.full_name}
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Completed
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })() : (
          <div className="py-8 text-center text-gray-400">Loading member profile...</div>
        )}
      </Modal>



      {/* ============================================================== */}
      {/* MODAL: ADD CLASS */}
      {/* ============================================================== */}
      <Modal
        isOpen={addClassOpen}
        onClose={() => {
          setAddClassOpen(false);
          setClassForm(initialClassForm);
        }}
        title="Add Class Type"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!classForm.name.trim()) {
              showToast('Class title is required.', 'error');
              return;
            }
            if (!classForm.duration_minutes || Number(classForm.duration_minutes) <= 0) {
              showToast('Please enter a valid duration in minutes.', 'error');
              return;
            }

            try {
              await api.createClass({
                name: classForm.name.trim(),
                duration_minutes: Number(classForm.duration_minutes)
              });
              showToast('Class created successfully!');
              setAddClassOpen(false);
              setClassForm(initialClassForm);
              loadAllData();
            } catch (err: any) {
              showToast(err.message || 'Failed to create class', 'error');
            }
          }}
          className="space-y-4 text-xs"
        >
          {/* TITLE ONLY */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HIIT Power, Vinyasa Yoga, Spin Interval"
              value={classForm.name}
              onChange={e => setClassForm({ ...classForm, name: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-hidden transition-all shadow-2xs"
            />
          </div>

          {/* DURATION */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Duration (Minutes) <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  required
                  min={5}
                  max={240}
                  step={5}
                  placeholder="e.g. 45 or 60"
                  value={classForm.duration_minutes || ''}
                  onChange={e => setClassForm({ ...classForm, duration_minutes: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-hidden transition-all shadow-2xs font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px] font-medium pointer-events-none">
                  mins
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {[
                  { label: '30 mins', val: 30 },
                  { label: '45 mins', val: 45 },
                  { label: '60 mins', val: 60 },
                  { label: '90 mins', val: 90 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setClassForm({ ...classForm, duration_minutes: preset.val })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                      Number(classForm.duration_minutes) === preset.val
                        ? 'bg-[#E8452C] text-white border-[#E8452C]'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setAddClassOpen(false);
                setClassForm(initialClassForm);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#E8452C] text-white font-bold rounded-lg hover:bg-[#B5301C] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Save Class
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: ADD SESSION */}
      {/* ============================================================== */}
      <Modal isOpen={addSessionOpen} onClose={() => setAddSessionOpen(false)} title="Schedule Timetable Session" maxWidth="max-w-md">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!sessionForm.class_id) {
            showToast('Please select a class type.', 'error');
            return;
          }
          await api.createSession(sessionForm);
          showToast('Session scheduled on timetable!');
          setAddSessionOpen(false);
          loadAllData();
        }} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Class Discipline <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={sessionForm.class_id}
              onChange={e => setSessionForm({ ...sessionForm, class_id: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all cursor-pointer"
            >
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.durationMinutes} mins)</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Day of Week <span className="text-rose-500">*</span>
              </label>
              <select
                value={sessionForm.day_of_week}
                onChange={e => setSessionForm({ ...sessionForm, day_of_week: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all cursor-pointer"
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={7}>Sunday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Room / Studio
              </label>
              <input
                placeholder="e.g. Studio A, Mat Room"
                value={sessionForm.room}
                onChange={e => setSessionForm({ ...sessionForm, room: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={sessionForm.start_time}
                onChange={e => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={sessionForm.end_time}
                onChange={e => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddSessionOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#E8452C] to-[#FF6B4A] hover:from-[#d03720] hover:to-[#e8452c] text-white font-bold rounded-xl shadow-md shadow-[#E8452C]/20 cursor-pointer transition-all"
            >
              Schedule Session
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ============================================================== */}
      <Modal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        title={isEditingProduct ? "Edit Pro-Shop Product" : "Add Pro-Shop Item"}
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!productForm.name.trim()) {
              showToast('Product name is required.', 'error');
              return;
            }
            if (productForm.price === undefined || productForm.price === null || productForm.price < 0 || isNaN(productForm.price)) {
              showToast('Product price cannot be negative.', 'error');
              return;
            }
            if (productForm.stock_qty === undefined || productForm.stock_qty === null || productForm.stock_qty < 0 || isNaN(productForm.stock_qty)) {
              showToast('Stock quantity cannot be negative.', 'error');
              return;
            }
            if (productForm.reorder_level === undefined || productForm.reorder_level === null || productForm.reorder_level < 0 || isNaN(productForm.reorder_level)) {
              showToast('Reorder level cannot be negative.', 'error');
              return;
            }

            try {
              if (isEditingProduct && productForm.id) {
                await api.updateProduct(productForm.id, productForm);
                showToast('Product updated successfully!');
              } else {
                await api.createProduct(productForm);
                showToast('Product added to catalog!');
              }
              setAddProductOpen(false);
              loadAllData();
            } catch (err: any) {
              showToast(err.message || 'Failed to save product', 'error');
            }
          }}
          className="space-y-4 text-xs"
        >
          {/* IMAGE UPLOAD & PREVIEW SECTION */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3">
            <span className="font-bold text-gray-900 block text-xs">Product Image</span>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Image Preview Box */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden flex items-center justify-center shrink-0 relative group shadow-2xs">
                {productForm.image_url ? (
                  <>
                    <img
                      src={productForm.image_url}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, image_url: '' })}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-gray-400 flex flex-col items-center">
                    <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
                    <span className="text-[10px] leading-tight">No image</span>
                  </div>
                )}
              </div>

              {/* Upload Controls & URL Input */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-gray-500" />
                    Upload from Computer
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            showToast('Image file must be under 5MB', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            setProductForm({ ...productForm, image_url: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <span className="text-gray-400 text-[11px]">or paste link below</span>
                </div>

                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-xs focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
                />

                {/* Quick Presets */}
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Quick Sample Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '🏋️ Dumbbell', url: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?q=80&w=800&auto=format&fit=crop', cat: 'Free Weights' },
                      { label: '🦾 Barbell', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop', cat: 'Strength Equipment' },
                      { label: '🔔 Kettlebell', url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=800&auto=format&fit=crop', cat: 'Functional Training' },
                      { label: '🥛 Whey Protein', url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=800&auto=format&fit=crop', cat: 'Supplements & Nutrition' },
                      { label: '⚡ Pre-Workout', url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop', cat: 'Supplements & Nutrition' },
                      { label: '🥤 Shaker', url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=800&auto=format&fit=crop', cat: 'Hydration & Gear' },
                      { label: '🥊 Lever Belt', url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop', cat: 'Apparel & Accessories' },
                      { label: '🛋️ Bench', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', cat: 'Benches & Racks' },
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setProductForm({
                          ...productForm,
                          image_url: preset.url,
                          category: preset.cat
                        })}
                        className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[11px] text-gray-700 font-medium transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT IDENTIFICATION (NAME & CATEGORY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Product / Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                placeholder="e.g. Hex Rubber Dumbbell (20kg)"
                required
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={productForm.category}
                onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
              >
                <option value="Free Weights">Free Weights</option>
                <option value="Strength Equipment">Strength Equipment</option>
                <option value="Benches & Racks">Benches & Racks</option>
                <option value="Supplements & Nutrition">Supplements & Nutrition</option>
                <option value="Apparel & Accessories">Apparel & Accessories</option>
                <option value="Hydration & Gear">Hydration & Gear</option>
                <option value="Functional Training">Functional Training</option>
                <option value="Equipment & Gear">Equipment & Gear</option>
              </select>
            </div>
          </div>

          {/* PRICING & INVENTORY (MATCHING PRODUCT TABLE COLUMNS) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Retail Price (ETB) <span className="text-rose-500">*</span>
              </label>
              <input
                placeholder="0.00"
                type="number"
                step="0.01"
                min="0"
                required
                value={productForm.price}
                onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                placeholder="0"
                type="number"
                min="0"
                required
                value={productForm.stock_qty}
                onChange={e => setProductForm({ ...productForm, stock_qty: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Reorder Alert Level <span className="text-rose-500">*</span>
              </label>
              <input
                placeholder="5"
                type="number"
                min="0"
                required
                value={productForm.reorder_level}
                onChange={e => setProductForm({ ...productForm, reorder_level: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
              />
              <span className="text-[10px] text-gray-400 block mt-0.5">Triggers Low Stock alert</span>
            </div>
          </div>

          {/* STATUS TOGGLE */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Catalog Status
            </label>
            <select
              value={productForm.is_active ? 'active' : 'inactive'}
              onChange={e => setProductForm({ ...productForm, is_active: e.target.value === 'active' })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
            >
              <option value="active">Active (Available for sale & listed)</option>
              <option value="inactive">Inactive / Archived (Hidden from shop & POS)</option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="Product materials, size, warranty, or usage details..."
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-[#E8452C] focus:border-[#E8452C] outline-hidden"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddProductOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#E8452C] text-white font-bold rounded-lg hover:bg-[#B5301C] transition-colors cursor-pointer shadow-xs"
            >
              {isEditingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: ADD STAFF ACCOUNT */}
      {/* ============================================================== */}
      <Modal isOpen={addStaffOpen} onClose={() => setAddStaffOpen(false)} title="Create Staff Account" maxWidth="max-w-md">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const nameVal = validateName(staffForm.full_name, 'Full Name', true);
          if (!nameVal.isValid) {
            showToast(nameVal.error || 'Invalid full name', 'error');
            return;
          }

          const emailVal = validateEmail(staffForm.email, true);
          if (!emailVal.isValid) {
            showToast(emailVal.error || 'Invalid email address', 'error');
            return;
          }

          let normalizedPhone: string | null = null;
          if (staffForm.phone && staffForm.phone.trim()) {
            const phoneVal = validateEthiopianPhone(staffForm.phone);
            if (!phoneVal.isValid) {
              showToast(phoneVal.error || 'Invalid Ethiopian phone number', 'error');
              return;
            }
            normalizedPhone = phoneVal.normalized;
          }

          const passVal = validatePassword(staffForm.password);
          if (!passVal.isValid) {
            showToast(passVal.error || 'Password must be at least 6 characters', 'error');
            return;
          }

          try {
            await api.createStaffUser({
              ...staffForm,
              full_name: staffForm.full_name.trim(),
              email: emailVal.normalized,
              phone: normalizedPhone
            });
            showToast('Staff account created successfully!');
            setAddStaffOpen(false);
            setStaffForm({
              full_name: '',
              email: '',
              phone: '',
              password: '',
              role: 'receptionist'
            });
            loadAllData();
          } catch (err: any) {
            showToast(err.message || 'Failed to create staff account', 'error');
          }
        }} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                placeholder="e.g. Abebe Kebede"
                required
                value={staffForm.full_name}
                onChange={e => setStaffForm({ ...staffForm, full_name: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                placeholder="staff@titanfitness.et"
                type="email"
                required
                value={staffForm.email}
                onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Ethiopian Phone <span className="text-slate-400 font-normal">(Optional, +251 9... / 09... / 07...)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                placeholder="+251-9..."
                type="tel"
                value={staffForm.phone}
                onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Initial Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                placeholder="••••••••"
                type="password"
                required
                value={staffForm.password}
                onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              System Role <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={staffForm.role}
                onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-[#E8452C]/20 focus:border-[#E8452C] outline-none transition-all cursor-pointer"
              >
                <option value="receptionist">Receptionist (Front Desk POS & Registration)</option>
                <option value="admin">Administrator (Full Access & Reporting)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddStaffOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#E8452C] to-[#FF6B4A] hover:from-[#d03720] hover:to-[#e8452c] text-white font-bold rounded-xl shadow-md shadow-[#E8452C]/20 cursor-pointer transition-all"
            >
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, type: '', id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        title="Confirm Removal"
        itemName={deleteConfirm.name}
      />
    </div>
  );
}
