/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cloud, CloudOff, Info, UserCheck, ShieldAlert } from 'lucide-react';
import { UserProfile, UserRole, SystemSettings } from '../types';
import { loginWithMock, isFirebaseConfigured } from '../firebase';

interface TopbarProps {
  currentUser: UserProfile | null;
  settings: SystemSettings;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
}

export default function Topbar({ currentUser, settings, onSetToast }: TopbarProps) {
  const [showRolePanel, setShowRolePanel] = React.useState(false);

  const roles: UserRole[] = ["Admin", "Manager", "Staff"];

  const handleQuickRoleSwitch = async (role: UserRole) => {
    try {
      if (isFirebaseConfigured) {
        onSetToast(`Note: System is connected to Live Firebase. Creating a local switch isn't supported for live profiles directly; please change your register details.`, 'warn');
        return;
      }
      
      const names = {
        Admin: "Abebe Admin",
        Manager: "Mary Manager",
        Staff: "Sam Staff"
      };
      
      await loginWithMock(role, names[role]);
      onSetToast(`Role switched to ${role} (${names[role]})!`, 'success');
      setShowRolePanel(false);
    } catch (e) {
      onSetToast(`Trouble switching roles: ${e}`, 'error');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative">
      {/* Left side: Business name loaded from settings state */}
      <div className="flex items-center space-x-2.5">
        <span className="font-extrabold text-slate-800 tracking-tight text-lg uppercase font-sans">
          {settings.businessName || "Apex Grocers"}
        </span>
      </div>

      {/* Right side: Connection status, user card, mock role togglers */}
      <div className="flex items-center space-x-4">
        {/* Connection status badge */}
        <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
          isFirebaseConfigured 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
        }`}>
          {isFirebaseConfigured ? (
            <>
              <Cloud className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Cloud Firestore Active</span>
            </>
          ) : (
            <>
              <CloudOff className="h-3.5 w-3.5 text-indigo-600 shrink-0 animate-pulse" />
              <span className="hidden md:inline">Simulated Workspace Stage Active</span>
              <span className="md:hidden">Local Preview</span>
            </>
          )}
        </div>

        {/* Quick Role switcher if in simulation mode */}
        {!isFirebaseConfigured && (
          <div className="relative">
            <button 
              onClick={() => setShowRolePanel(!showRolePanel)}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-100 transition duration-150 cursor-pointer"
              title="Click to quickly switch user roles for testing permissions"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Simulate Role</span>
            </button>

            {showRolePanel && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 py-3 animate-in fade-in slide-in-from-top-2 duration-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 px-3 pb-2 font-mono tracking-wider">Test System Roles</p>
                <div className="space-y-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleQuickRoleSwitch(r)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-md transition ${
                        currentUser?.role === r 
                          ? 'bg-blue-50 text-blue-700 font-bold' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r} Mode
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-3 flex items-start space-x-1.5">
                  <Info className="h-3 w-3 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-500 leading-tight">These switch access rights to test table locks. Set up Firebase secrets to transition to Cloud Storage.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User identification avatar */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight leading-none mt-0.5">{currentUser?.email}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs select-none">
            {currentUser?.name?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
