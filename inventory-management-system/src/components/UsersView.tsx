/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  AlertTriangle,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { addUserProfile, updateUserRole, deleteUser } from '../firebase';

interface UsersViewProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
}

export default function UsersView({ users, currentUser, onSetToast }: UsersViewProps) {
  const isAdmin = currentUser?.role === "Admin";

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("Staff");
  const [isSaving, setIsSaving] = React.useState(false);

  const roles: UserRole[] = ["Admin", "Manager", "Staff"];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onSetToast("Access Denied: Only Admins can create or invite other users.", "error");
      return;
    }
    if (!name.trim() || !email.trim()) {
      onSetToast("Please supply both a name and an email address", "warn");
      return;
    }

    setIsSaving(true);
    try {
      // Form a unique Id for the user registration to align schemas
      const randId = 'uid_' + Math.random().toString(36).substr(2, 9);
      await addUserProfile(randId, name.trim(), email.trim(), role);
      onSetToast(`Successfully invited ${name} as ${role}!`, 'success');
      
      // Reset fields
      setName("");
      setEmail("");
      setRole("Staff");
      setShowAddModal(false);
    } catch (err) {
      onSetToast(`Unable to register team profile: ${err}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, userDisplayName: string) => {
    if (!isAdmin) {
      onSetToast("Access Denied: Inline role modification requires Admin status.", "error");
      return;
    }

    if (userId === currentUser?.uid) {
      onSetToast("Operation Blocked: You cannot modify your own administrative role in-session.", "warn");
      return;
    }

    if (confirm(`Change ${userDisplayName} role to "${newRole}"?`)) {
      try {
        await updateUserRole(userId, newRole);
        onSetToast(`Role updated to ${newRole} for ${userDisplayName}!`, 'success');
      } catch (err) {
        onSetToast(`Failed role update: ${err}`, 'error');
      }
    }
  };

  const handleDeleteUser = async (userId: string, userDisplayName: string) => {
    if (!isAdmin) {
      onSetToast("Access Denied: Inline deletion requires Admin status.", "error");
      return;
    }

    if (userId === currentUser?.uid) {
      onSetToast("Operation Blocked: You cannot delete your current log-in session profile.", "warn");
      return;
    }

    if (confirm(`Remove user ${userDisplayName} permanently from stockroom registries?`)) {
      try {
        await deleteUser(userId);
        onSetToast(`Removed ${userDisplayName} successful.`, 'success');
      } catch (err) {
        onSetToast(`Deletion failed: ${err}`, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Information Header Block */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm shrink-0">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Team Credentials Directory</h3>
          <p className="text-[10px] text-slate-400">Manage user access privileges, lock status levels, and invitatons</p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer shadow shadow-blue-950/20"
          >
            <UserPlus className="h-4.5 w-4.5 shrink-0" />
            <span>Invite Partner</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>Modification Locked (Admin Only)</span>
          </div>
        )}
      </div>

      {/* Users table list */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-[300px]">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="py-4 px-5">Associate Profile</th>
              <th className="py-4 px-3">E-mail</th>
              <th className="py-4 px-3">Role Authority</th>
              <th className="py-4 px-3">Status</th>
              {isAdmin && <th className="py-4 px-4 text-center">Controls</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-sans">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-5 font-bold text-slate-800 max-w-[200px] truncate">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="ml-1.5 bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-500 flex items-center space-x-1.5 h-14">
                    <Mail className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                    <span>{u.email}</span>
                  </td>
                  <td className="py-3 px-3">
                    {/* Role updates list dropdown if Admin, otherwise static badge */}
                    {isAdmin && !isSelf ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.name)}
                        className="p-1 px-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[10px] tracking-wide uppercase border ${
                        u.role === "Admin" ? "bg-red-50 text-red-700 border-red-150" :
                        u.role === "Manager" ? "bg-amber-50 text-amber-705 text-amber-700 border-amber-150" :
                        "bg-green-50 text-green-700 border-green-150"
                      }`}>
                        <Shield className="h-3 w-3 shrink-0" />
                        <span>{u.role}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center space-x-1 text-emerald-600 font-semibold font-mono text-[10px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>ACTIVE</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-center">
                      {!isSelf ? (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-550 text-red-500 hover:bg-red-50 transition cursor-pointer border-0"
                          title="Revoke access permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Profile Locked</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* INVITE ASSOCIATE DIALOG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleCreateUser}
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl relative border border-slate-100 p-6 flex flex-col animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm">Assemble Team Invites</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="my-4 space-y-4 flex-1">
              {/* Name */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] uppercase font-bold text-slate-400">Associate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Email */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] uppercase font-bold text-slate-400">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. johndoe@apex.corp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Designated Authority */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] uppercase font-bold text-slate-400">Security Clearance Level *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="pt-2 px-1 flex items-start space-x-1.5 text-[10px] text-slate-400 leading-tight border-t border-slate-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p>Clearance determines layout visibility. Invitation will pre-bake standard login password as **Password@123**.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 mr-2 hover:bg-slate-50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded shadow cursor-pointer transition disabled:opacity-50"
              >
                {isSaving ? "Inviting..." : "Inject Partner Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
