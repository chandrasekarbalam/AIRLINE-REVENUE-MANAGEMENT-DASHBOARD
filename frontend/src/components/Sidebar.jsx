import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  TrendingUp,
  Ticket,
  MapPin,
  Plane,
  Users,
  Sliders,
  Layers,
  LineChart,
  FileText,
  Settings,
  ChevronRight,
  PlaneTakeoff,
  UploadCloud
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'revenue', label: 'Revenue Analytics', icon: TrendingUp },
  { id: 'tickets', label: 'Ticket Sales', icon: Ticket },
  { id: 'routes', label: 'Route Performance', icon: MapPin },
  { id: 'flights', label: 'Flight Performance', icon: Plane },
  { id: 'demand', label: 'Passenger Demand', icon: Users },
  { id: 'fare', label: 'Fare Optimization', icon: Sliders },
  { id: 'inventory', label: 'Seat Inventory', icon: Layers },
  { id: 'forecast', label: 'Revenue Forecasting', icon: LineChart },
  { id: 'reports', label: 'Reports & Exports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { activeTab, setActiveTab, setIsUploadModalOpen } = useApp();

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setActiveTab('overview')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
            <PlaneTakeoff className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="leading-tight">
              <span className="font-bold text-white text-base tracking-tight block">AeroRevenue</span>
              <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider block">Intelligence Suite</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'}`} />
              {isOpen && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {isOpen && isActive && (
                <ChevronRight className="w-4 h-4 text-sky-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Quick Action: Upload Data */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all shadow-sm ${
            !isOpen ? 'px-0' : ''
          }`}
          title="Upload Airline Dataset"
        >
          <UploadCloud className="w-4 h-4 shrink-0" />
          {isOpen && <span>Import Data</span>}
        </button>
      </div>
    </aside>
  );
}
