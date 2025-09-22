import React, { useState } from 'react';
import AnalyticsPieChart from '../components/AnalyticPieChart';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import Map from '../components/Map';
import SearchComponent from '../components/Search';
import { Expand, Shrink } from 'lucide-react'; // Changed to a consistent icon library

// The props are simplified to reflect the new structure in App.jsx
const Dashboard = ({
  filteredReports,
  handleReportResolve,
  setIsFiltering,
  searchTerm,
  setSearchTerm,
  user
}) => {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const toggleMapExpansion = () => setIsMapExpanded(prev => !prev);

  return (
    <main className={`flex-1 transition-all duration-300 ${isMapExpanded ? 'p-0' : 'p-4 md:p-8'}`}>
      {/* This content is hidden when the map is expanded */}
      <div className={`transition-opacity duration-300 ${isMapExpanded ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center max-w-7xl mx-auto py-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-300">Live Reports Dashboard</h1>
            <p className="mt-1 text-slate-500">Real-time overview of civic issues.</p>
          </div>
          <div className="w-full md:w-1/3 mt-4 md:mt-0">
            <SearchComponent
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onFocus={() => setIsFiltering(true)}
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* The analytics components now only need the 'user' prop */}
            <div className="lg:col-span-2">
              <AnalyticsDashboard user={user} />
            </div>
            <div className="lg:col-span-1">
              <AnalyticsPieChart user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className={isMapExpanded ? "" : "max-w-7xl mx-auto mt-8"}>
        <div className={`relative transition-all duration-500 ${isMapExpanded ? 'fixed inset-0 z-40' : 'h-[50vh] rounded-xl shadow-md overflow-hidden'}`}>
          <button
            onClick={toggleMapExpansion}
            className='absolute top-4 right-4 z-[1000] p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg'
            aria-label={isMapExpanded ? "Compress map" : "Expand map"}
          >
            {isMapExpanded ? <Shrink className='h-5 w-5 text-gray-700'/> : <Expand className='h-5 w-5 text-gray-700'/>}
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

