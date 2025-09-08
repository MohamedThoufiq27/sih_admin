import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
// Import your components
import Dashboard from './pages/dashboard'; // This is your map page
import SideBar from './components/sidebar';

// A simple SVG logo component for the sidebar



const App = () => {
  const [reports, setReports] = useState([]);

  return (
    <>
      <div className="flex h-screen bg-zinc-900 font-sans">
        
        {/* --- Sidebar --- */}
        <SideBar />

        {/* --- Main Content Area --- */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          
          <Dashboard reports={reports} setReports={setReports} />

        </div>
      </div>

      {/* --- Toast Notifications --- */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        theme="colored"
      />
    </>
  );
};

export default App;

