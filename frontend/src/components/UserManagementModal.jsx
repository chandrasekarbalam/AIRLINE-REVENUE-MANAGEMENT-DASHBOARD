import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  X,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  Loader2
} from 'lucide-react';

export default function UserManagementModal() {
  const { isUserManagementOpen, setIsUserManagementOpen, user } = useApp();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audit'
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, logs] = await Promise.all([
        api.getAdminUsers(),
        api.getAuditLogs()
      ]);
      setUsers(uList || []);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Failed to load user management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserManagementOpen) {
      loadData();
      setMsg('');
    }
  }, [isUserManagementOpen]);

  if (!isUserManagementOpen) return null;

  const handleToggleStatus = async (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'deactivated' : 'active';
    try {
      await api.updateAdminUserStatus(targetUser.id, nextStatus);
      setMsg(`User ${targetUser.username} set to ${nextStatus}.`);
      loadData();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateAdminUserRole(userId, newRole);
      setMsg(`Role updated to ${newRole}.`);
      loadData();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">User & Access Management</h2>
              <p className="text-xs text-slate-500">Administrator Governance, Role Privileges & Audit Trail</p>
            </div>
          </div>
          <button
            onClick={() => setIsUserManagementOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs & Search */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Users Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Security Audit Logs ({auditLogs.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'users' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}
            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Message notification */}
        {msg && (
          <div className="mx-6 mt-3 p-2.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
            {msg}
          </div>
        )}

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'users' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Login</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400">@{u.username}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.username === 'admin'}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-60"
                        >
                          <option value="administrator">Administrator</option>
                          <option value="revenue_manager">Revenue Manager</option>
                          <option value="analyst">Data Analyst</option>
                          <option value="operations_manager">Operations Manager</option>
                          <option value="viewer">Viewer</option>
                          <option value="guest">Guest</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {u.last_login ? u.last_login.split('T')[0] : 'Never'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                              u.status === 'active'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">@{log.username}</td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                      <td className="py-2 px-3 text-slate-600">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No audit records recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
