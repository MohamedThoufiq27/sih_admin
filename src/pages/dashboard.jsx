import React, { useState } from 'react';
import AnalyticsPieChart from '../components/AnalyticPieChart';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import Map from '../components/Map';
import SearchComponent from '../components/Search';
import { FaExpand, FaCompress } from "react-icons/fa";
import { User } from 'lucide-react';

const Dashboard = ({ filteredReports, handleReportResolve, setIsFiltering, searchTerm, setSearchTerm ,user ,role,department,departmentId}) => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const toggleMapExpansion = () => setIsMapExpanded(prev => !prev);

  return (
    <main className={`flex-1 ${isMapExpanded ? 'p-0' : 'p-8'}`}>
      {!isMapExpanded && (
        <>
          <div className="flex justify-between items-center max-w-7xl mx-auto py-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-400">Live Reports Dashboard</h1>
              <p className="mt-1 text-slate-500">Real-time overview of civic issues.</p>
            </div>
            <div className="w-1/3">
              <SearchComponent
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onFocus={() => setIsFiltering(true)}
              />
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2"><AnalyticsDashboard user={user} role={role} department={department} departmentId={departmentId} /></div>
              <div className="lg:col-span-1"><AnalyticsPieChart user={user} role={role} department={department} departmentId={departmentId} /></div>
            </div>
          </div>
        </>
      )}
      <div className={isMapExpanded ? "" : "max-w-7xl mx-auto mt-8"}>
        <div className={`relative transition-all duration-300 ${isMapExpanded ? 'fixed inset-0 z-40' : 'h-[50vh] bg-white rounded-xl shadow-md overflow-hidden'}`}>
          <button onClick={toggleMapExpansion} className='absolute top-4 right-4 z-[1000] p-2 bg-white/70 rounded-full hover:bg-white transition-colors'>
            {isMapExpanded ? <FaCompress className='size-6 text-zinc-700'/> : <FaExpand className='size-6 text-zinc-700'/>}
          </button>
          <Map 
            reports={filteredReports} 
            isMapExpanded={isMapExpanded}
            handleReportResolve={handleReportResolve}
          />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;