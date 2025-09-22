import { useEffect, useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
// The direct CSS import is removed to prevent build errors.
// It should be included in your main index.html or a root CSS file.
// import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabase/supabase.js'; // Bundler will resolve the extension

import SideBar from './components/SideBar.jsx';
import Dashboard from './pages/dashboard.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ReportdetailsPage from './pages/ReportdetailsPage.jsx';
import AssignTaskAdmin from './pages/AssignTaskAdmin.jsx';
// Assuming you have these components for creating admins
import CreateWardAdmin from './pages/CreateWardAdmin.jsx';

const AppContent = () => {
  // --- User and Profile State ---
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null); // Will store role-specific data
  const [loading, setLoading] = useState(true);

  // --- Application State ---
  const [isFiltering, setIsFiltering] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'Not Completed',
    department: 'All',
  });

  // --- Auth and Profile Fetching Logic ---
  useEffect(() => {
    const fetchUserProfile = async (session) => {
      if (!session?.user) {
        setUser(null);
        setRole(null);
        setProfile(null);
        return;
      }

      setUser(session.user);

      try {
        // 1. Call the database function to get the user's role
        const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', {
          p_user_id: session.user.id,
        });

        if (roleError) throw roleError;
        setRole(userRole);
        console.log(userRole);
        // 2. Fetch the detailed profile based on the role
        let userProfile = null;
        if (userRole === 'super_admin') {
            const { data } = await supabase.from('super_admins').select('*').eq('user_id', session.user.id).single();
            userProfile = data;
        } else if (userRole === 'department_admin') {
          const { data } = await supabase.from('department_admins').select('*, departments(name)').eq('user_id', session.user.id).single();
          userProfile = data;
        } else if (userRole === 'ward_admin') {
          // Note: This reflects your latest schema with a one-to-one mapping for ward admins
          const { data } = await supabase.from('ward_admins').select('*, departments(name), wards(ward_no, zone_name)').eq('user_id', session.user.id).single();
          userProfile = data;
        }
        setProfile(userProfile);

      } catch (error) {
        console.error("Error fetching user profile:", error);
        setRole(null);
        setProfile(null);
      }
    };

    // 1️⃣ On mount, get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session).finally(() => setLoading(false));
    });

    // 2️⃣ On auth state change (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      fetchUserProfile(session).finally(() => setLoading(false));
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array ensures this runs only once


  // --- Fetch Reports Based on Role ---
  useEffect(() => {
    if (!user || !role) {
      setAllReports([]); // Clear reports if no user or role
      return;
    }

    const fetchAllReports = async () => {
      let query = supabase.from("reports").select("*, departments(name), wards(zone_name, ward_no)");

      // Apply filters based on the user's role and profile
      if (role === 'department_admin' && profile?.department_id) {
        // Department admins see all reports within their department
        query = query.eq('department_id', profile.department_id);
      } else if (role === 'ward_admin' && profile?.ward_id) {
        // Ward admins see reports only from their assigned ward
        query = query.eq('ward_id', profile.ward_id);
      }
      // Super admins have no filter and see all reports

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching reports:", error);
        toast.error(`Failed to fetch reports: ${error.message}`);
      } else {
        setAllReports(data || []);
      }
    };

    fetchAllReports();

    // Set up realtime subscription
    const channel = supabase.channel("reports-changes").on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
      toast.info("Report data has been updated!");
      fetchAllReports();
    }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, role, profile]); // Re-fetch when user, role, or profile changes


  // --- Filtering logic & Handlers (No changes needed) ---
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
        const statusMatch = report.status === filters.status;
        const departmentMatch = filters.department === 'All' || (report.departments && report.departments.name === filters.department);
        const searchMatch = (report.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && departmentMatch && searchMatch;
    });
  }, [allReports, filters, searchTerm]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters({ status: newFilters.status, department: newFilters.department });
    setSearchTerm(newFilters.term);
  }, []);

  const handleReportResolve = async (reportId) => {
    // FIX: Changed from 'report_id' to 'id' to match your schema's likely primary key.
    await supabase.from('reports').update({ status: 'Completed' }).eq('id', reportId);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <main>
      <div className="flex h-screen font-dm-sans">
        {user && (
          <SideBar
            user={user}
            userRole={role}
            profile={profile}
            isFiltering={isFiltering}
            onClose={() => setIsFiltering(false)}
            allReports={allReports}
            reports={filteredReports}
            onFiltersChange={handleFiltersChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
        <div className="flex-1 flex flex-col overflow-y-auto bg-gray-900">
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} userRole={role} profile={profile} filteredReports={filteredReports} handleReportResolve={handleReportResolve} setIsFiltering={setIsFiltering} searchTerm={searchTerm} setSearchTerm={setSearchTerm} /> : <Navigate to="/login" />}/>
            <Route path="/reports/:id" element={user ? <ReportdetailsPage /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <AuthPage />} />
            <Route path="/register-dept-admin" element={user && role === 'super_admin' ? <AssignTaskAdmin /> : <Navigate to="/" />} />
            <Route path="/register-ward-admin" element={user && (role === 'super_admin' || role === 'department_admin') ? <CreateWardAdmin /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </main>
  );
};

const App = () => (
  <Router>
    <AppContent />
    <ToastContainer position="top-right" autoClose={2500} theme="dark" />
  </Router>
);

export default App;

