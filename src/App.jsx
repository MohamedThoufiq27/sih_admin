import { useEffect, useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './supabase/supabase';

import SideBar from './components/sidebar';
import Dashboard from './pages/dashboard';
import AuthPage from './pages/AuthPage';
import ReportdetailsPage from './pages/ReportdetailsPage';

const AppContent = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentId,setDepartmentId]= useState(null);
  const [filters, setFilters] = useState({
    status: 'Not Completed',
    // department_id:null,
    department: 'All',
  });

  useEffect(() => {
  const fetchUserProfile = async (session) => {
    if (!session?.user) {
      setUser(null);
      setRole(null);
      setDepartment(null);
      setDepartmentId(null);
      return;
    }

    setUser(session.user);

    const { data: userData, error } = await supabase
        .from("users")
        .select("role, departments(id, name)") // Fetches role from users, and id/name from the related department
        .eq("user_id", session.user.id)
        .single();

    if (!error && userData) {
      setRole(userData.role);
      setDepartment(userData.departments.name);
      setDepartmentId(userData.departments.id);
      console.log(department);
        
    } else {
      console.error("Error fetching profile:", error);
    }
  };

  // 1️⃣ On mount
  supabase.auth.getSession().then(({ data: { session } }) => {
    fetchUserProfile(session);
    setLoading(false);
  });

  // 2️⃣ On auth change
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    fetchUserProfile(session);
  });

  return () => subscription.unsubscribe();
}, [departmentId,department]);



  // --- Filtering logic (No changes needed) ---
  const filteredReports = useMemo(() => {
    return allReports.filter(report => {
      const statusMatch = report.status === filters.status;
      const departmentMatch = filters.department === 'All' || report.department === filters.department;
      const searchMatch = report.description.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && departmentMatch && searchMatch;
    });
  }, [allReports, filters, searchTerm]);

  // --- Fetch reports when logged in (No changes needed) ---
  useEffect(() => {
    if (!user || !role) return;

    const fetchAllReports = async () => {
      let query = supabase.from("reports").select("*, departments(name)");
      
       if (role === 'admin' && departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching reports:", error);
      } else if (data) {
        setAllReports(data);
      }
    };
    
    fetchAllReports();

    const channel = supabase
      .channel("reports-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        toast.info("Report data has been updated!");
        fetchAllReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      setAllReports([]);
    };
  }, [user, role, department,departmentId]);

  // --- Handlers (No changes needed) ---
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
    return (
      <div className="flex justify-center items-center h-screen bg-primary text-white">
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="flex h-screen font-dm-sans">
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
            setAllReports={setAllReports}
            setRole={setRole}
            setUser={setUser}
            department={department}
            loading={loading}
            setDepartment={setDepartment}
            departmentId={departmentId}
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
                    department={department}
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
    </main>
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