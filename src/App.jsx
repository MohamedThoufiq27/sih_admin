import { useEffect, useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabase/supabase';

import SideBar from './components/sidebar';
import Dashboard from './pages/dashboard';
import AuthPage from './pages/AuthPage';
import ReportdetailsPage from './pages/ReportdetailsPage';

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [role,setRole] = useState('');
  const [loading, setLoading] = useState(true); // ⏳ wait until we know auth state
  const [isFiltering, setIsFiltering] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'Not Completed',
    department: 'All',
  });

  const navigate = useNavigate();

  // --- Check auth state on mount ---
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("user_id", user.id)   // ✅ fixed
          .single();

        if (userError) {
          console.error("Error fetching user info:", userError);
          return;
        }

        console.log("Role:", userData.role);
        setRole(userData.role);

      if (user) {
        navigate('/'); // ✅ logged in → dashboard
      } else {
        navigate('/login'); // ❌ logged out → login
      }
    };
    getUser().finally(() => setLoading(false));

    // Subscribe to auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (!newUser) {
        // clear state on logout
        setRole('');
        setAllReports([]);
        navigate('/login');
        return;
      }

      // user logged in: fetch role immediately
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, department')
          .eq('user_id', newUser.id)
          .single();

        if (!userError && userData) {
          setRole(userData.role);
          // optionally set department state if you track it separately
          // setDepartment(userData.department);
        } else {
          setRole(''); // fallback
        }
        navigate('/');
      } catch (err) {
        console.error('Error fetching role on auth change', err);
        setRole('');
        navigate('/');
      }finally{
        setLoading(false)
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Filtering logic ---
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const statusMatch = report.status === filters.status;
      const departmentMatch = filters.department === 'All' || report.department === filters.department;
      const searchMatch = report.description.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && departmentMatch && searchMatch;
    });
  }, [allReports, filters, searchTerm]);

  // --- Fetch reports when logged in ---
  useEffect(() => {
    if (!user) return;

    const fetchAllReports = async () => {
      const { data } = role === 'admin' ? await supabase.from("reports").select("*").eq('department', user?.user_metadata?.department )
            : await supabase.from("reports").select("*")
      
      if (data) setAllReports(data);
    };
    fetchAllReports();

    const channel = supabase
      .channel("reports-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        toast.info("Report data has been updated!");
        fetchAllReports();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user,role]);

  // --- Handlers ---
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters({
      status: newFilters.status,
      department: newFilters.department,
    });
    setSearchTerm(newFilters.term);
  }, []);

  const handleReportResolve = async (reportId) => {
    await supabase.from('reports').update({ status: 'Completed' }).eq('report_id', reportId);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-hero font-dm-sans">
      {user && (
        <SideBar
          user={user}
          isFiltering={isFiltering}
          onClose={() => setIsFiltering(false)}
          allReports={allReports}
          reports={filteredReports}
          onFiltersChange={handleFiltersChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          role={role}
        />
      )}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Dashboard
                  user={user}
                  filteredReports={filteredReports}
                  handleReportResolve={handleReportResolve}
                  setIsFiltering={setIsFiltering}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  role={role}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/reports/:id"
            element={user ? <ReportdetailsPage /> : <Navigate to="/login" />}
          />
          
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <AuthPage />}
          />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
    <ToastContainer 
      position="top-right" 
      autoClose={2500} 
      theme="dark" />
  </Router>
);

export default App;
