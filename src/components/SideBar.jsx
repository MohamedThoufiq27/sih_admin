import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Settings, Search, ListFilter, CheckCircle, Clock, X, LogOut } from 'lucide-react';
import { supabase } from '../supabase/supabase'; // Corrected path

const Logo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// The props are updated to match what App.jsx now provides.
const SideBar = ({ user, userRole, profile, isFiltering, onClose, allReports, reports, onFiltersChange, searchTerm, setSearchTerm }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- FILTERING MODE ---
  if (isFiltering) {
    return (
      <FilterView
        allReports={allReports}
        reports={reports}
        onFiltersChange={onFiltersChange}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onClose={onClose}
      />
    );
  }

  // --- NAVIGATION MODE ---
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    // Conditionally add admin registration links based on user role
    ...(userRole === 'super_admin'
      ? [{ to: '/register-dept-admin', icon: UserPlus, label: 'Register Dept Admin' }]
      : []),
    ...(userRole === 'super_admin' || userRole === 'department_admin'
      ? [{ to: '/register-ward-admin', icon: UserPlus, label: 'Register Ward Admin' }]
      : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  // The logout function is simplified. The onAuthStateChange listener in App.jsx will handle state cleanup.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Helper to display role-specific information from the profile object.
  const renderProfileInfo = () => {
    if (!profile) return null;
    switch (userRole) {
      case 'department_admin': {
        return <p className="text-sm text-slate-400 truncate mb-2">Dept: {profile.departments?.name || 'N/A'}</p>;
      }
      case 'ward_admin': {
        // Display the first assigned ward for simplicity, or list all.
        const wardInfo = profile?.wards;
        // console.log(profile);
        return (
          <>
          <p className="text-sm text-slate-400 truncate mb-2">Dept: {profile.departments?.name || 'N/A'}</p>
          <p className="text-sm text-slate-400 truncate mb-2">Ward: {wardInfo ? `${wardInfo.zone_name} - ${wardInfo.ward_no}` : 'N/A'}</p>
          </>
        );
      }
      default: {
        return null;
      }
    }
  };

  return (
    <aside className="w-64 shrink-0 bg-gray-900 border-r border-slate-800 p-4 flex flex-col justify-between">
      {/* Top section */}
      <div>
        <div className="flex items-center space-x-3 mb-8">
          <Logo />
          <span className="text-white font-bold text-xl">CivicTrack</span>
        </div>
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === item.to
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom user section */}
      <div className="mt-6 border-t border-slate-800 pt-4">
        <p className="text-sm text-white font-medium truncate mb-1">
          {profile?.name || user.email}
        </p>
        <p className="text-xs text-indigo-400 uppercase font-semibold mb-2">
          {userRole?.replace('_', ' ')}
        </p>
        {renderProfileInfo()}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 w-full text-left px-3 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-red-500/80 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};


const FilterView = ({ allReports, reports, onFiltersChange, searchTerm, setSearchTerm, onClose }) => {
    const [activeStatus, setActiveStatus] = useState('Not Completed');
    const [activeDepartment, setActiveDepartment] = useState('All');
    const navigate = useNavigate();
    
    // FIX: Departments are now nested in the reports data. This correctly extracts them.
    const departments = useMemo(() => {
        const deptSet = new Set(allReports.map(r => r.departments?.name).filter(Boolean));
        return ['All', ...Array.from(deptSet)];
    }, [allReports]);

    useEffect(() => {
        onFiltersChange({ status: activeStatus, department: activeDepartment, term: searchTerm });
    }, [activeStatus, activeDepartment, searchTerm, onFiltersChange]);
    
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    return (
        <aside className="w-64 shrink-0 bg-gray-950 border-r border-slate-800 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Filter Reports</h2>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md"><X size={20} /></button>
            </div>
            <div className="flex flex-col space-y-4">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={() => setActiveStatus('Not Completed')} className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-md ${activeStatus === 'Not Completed' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}>
                        <Clock size={13} /> <span>Pending</span>
                    </button>
                    <button onClick={() => setActiveStatus('Completed')} className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-md ${activeStatus === 'Completed' ? 'bg-green-500/20 text-green-400' : 'text-slate-400'}`}>
                        <CheckCircle size={13} /> <span>Completed</span>
                    </button>
                </div>
                <select value={activeDepartment} onChange={(e) => setActiveDepartment(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-full py-1.5">
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-1">
                {reports.map((report) => (
                    <div key={report.report_id} onClick={() => { navigate(`/reports/${report.report_id}`); onClose(); }} className="p-2 cursor-pointer rounded-md hover:bg-slate-800/70">
                        {/* FIX: Display department name from the nested object */}
                        <p className="text-sm font-medium text-slate-200 truncate">{report.departments?.name || 'N/A'}</p>
                        <p className="text-xs text-slate-400 truncate">{report.description}</p>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default SideBar;
