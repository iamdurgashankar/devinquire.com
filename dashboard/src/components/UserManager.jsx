import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../services/api';
import userService from '../services/userService';
import { useAuth } from '../contexts/EnhancedAuthContext';
import authAuditService from '../services/authAuditService';
import rbacService from '../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Clock,
  Mail,
  MoreHorizontal,
  AlertCircle,
  Plus,
  User
} from 'lucide-react';

export default function UserManager() {
  const { currentUser } = useAuth();
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Access denied. Admins only.
      </div>
    );
  }

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const unsubscribe = userService.listenToUsers((result) => {
          if (result.success) {
            setUsers(result.data);
            setLoading(false);
          }
        });
        return unsubscribe;
      } catch (error) {
        console.error('Failed to load users:', error);
        setLoading(false);
      }
    };

    let cleanup;
    loadUsers().then(unsub => cleanup = unsub);
    return () => cleanup && cleanup();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesFilter = filter === 'all' || user.status === filter;
      const matchesSearch = !searchTerm ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [users, filter, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await apiService.approveUser(userId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject this user?')) return;
    setActionLoading(userId);
    try {
      await apiService.rejectUser(userId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Permanently remove this user?')) return;
    setActionLoading(userId);
    try {
      await apiService.deleteUser(userId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await apiService.updateUserRole(userId, newRole);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8">
      {/* Professional Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-1">
            User Directory
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Identity & Access Management
            </p>
            <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-2">
              <span className="status-indicator status-online" />
              <span className="text-[11px] text-neutral-400 font-medium">Directory Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/5">
            {['all', 'approved', 'pending', 'rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-md transition-all text-xs font-semibold capitalize ${filter === tab
                  ? 'bg-white dark:bg-neutral-800 shadow-sm text-brand-600 dark:text-brand-400'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-95">
            <Plus size={18} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
            <p className="text-sm text-neutral-500 font-medium">Synchronizing directory...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {paginatedUsers.length === 0 ? (
              <div className="col-span-full pro-card py-24 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-neutral-400" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No users found</h3>
                <p className="text-sm text-neutral-500">Your search criteria didn't match any members.</p>
              </div>
            ) : (
              paginatedUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  onApprove={() => handleApprove(user.id)}
                  onReject={() => handleReject(user.id)}
                  onRemove={() => handleRemove(user.id)}
                  onRoleChange={(newRole) => handleRoleChange(user.id, newRole)}
                  loading={actionLoading === user.id}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-white/5 pt-8">
          <p className="text-sm text-neutral-500">
            Showing <span className="font-semibold text-neutral-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-neutral-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-semibold text-neutral-900 dark:text-white">{filteredUsers.length}</span> members
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-neutral-200 dark:border-white/10 rounded-lg disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1
                    ? 'bg-brand-600 text-white'
                    : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-neutral-200 dark:border-white/10 rounded-lg disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Professional UserCard
const UserCard = React.memo(function UserCard({
  user,
  currentUser,
  onApprove,
  onReject,
  onRemove,
  onRoleChange,
  loading
}) {
  const isSelf = user.id === currentUser?.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="pro-card p-5 group flex flex-col justify-between min-h-[220px]"
    >
      <div className="flex items-start justify-between">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/10">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
              alt={user.name}
              className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </div>
          {user.status === 'approved' && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <span className="status-indicator status-online scale-75" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${user.status === 'approved'
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
            : user.status === 'pending'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20'
            }`}>
            {user.status}
          </span>
          {isSelf && (
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded">
              You
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
          {user.name}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate flex items-center gap-1.5 mt-1">
          <Mail size={12} className="opacity-60" />
          {user.email}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Access Level</span>
          {isSelf ? (
            <div className="flex items-center gap-1 text-neutral-900 dark:text-white text-xs font-bold capitalize">
              <Shield size={12} className="text-brand-600" />
              {user.role}
            </div>
          ) : (
            <select
              value={user.role}
              onChange={(e) => onRoleChange(e.target.value)}
              disabled={loading}
              className="bg-transparent text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-tight focus:outline-none cursor-pointer"
            >
              <option value="user">User</option>
              <option value="author">Author</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-1">
          {user.status === 'pending' ? (
            <>
              <button
                onClick={onApprove}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all"
                title="Approve"
              >
                <UserCheck size={16} />
              </button>
              <button
                onClick={onReject}
                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                title="Reject"
              >
                <UserX size={16} />
              </button>
            </>
          ) : (
            !isSelf && (
              <button
                onClick={onRemove}
                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                title="Remove"
              >
                <Trash2 size={16} />
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
});