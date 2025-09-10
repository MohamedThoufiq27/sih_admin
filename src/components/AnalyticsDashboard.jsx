import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase"; // Adjust the path to your supabase client

// A simple component for a single statistic card
function StatCard({ title, value, color}) {
  return (
    <div className="flex-1 flex flex-col justify-between items-start p-4 bg-linear-to-br from-white/15 to-white/25 rounded-lg shadow-lg backdrop-blur-2xl">
      <h3 className="xl:text-4xl md:text-2xl sm:text-xl  text-gray-300 font-bold">{title}</h3>
      <p className={`xl:text-7xl md:text-4xl sm:text-2xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

export default function AnalyticsDashboard({user,role}) {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch the stats from our database function
    const fetchStats = async () => {
  
    const { data, error } = await supabase.rpc('get_report_stats', { dept: role==='admin' ? user?.user_metadata?.department : 'All' });
  
      if (error) {
        console.error("Error fetching stats:", error);
      } else {
        setStats(data);
      }
      setLoading(false);
    };
  
    // Fetch initial data
    fetchStats();

    // Set up a real-time subscription to re-fetch data on any change
    const channel = supabase
      .channel('reports-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          // When any report is inserted, updated, or deleted, fetch the stats again
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup function to remove the subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user,role]);

  if (loading) {
    return <div className="p-4 text-center ">Loading analytics...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full p-4 bg-linear-90 from-[#000046] to-[#1CB5E0] rounded-xl border-4 ">
      <div className="flex flex-1 gap-4">
        <StatCard title="Total Reports" value={stats.total} color="text-blue-400" />
        <StatCard title="Pending Reports" value={stats.pending} color="text-orange-500" />
        <StatCard title="Completed Reports" value={stats.completed} color="text-green-500" />
      </div>
    </div>
  );
}