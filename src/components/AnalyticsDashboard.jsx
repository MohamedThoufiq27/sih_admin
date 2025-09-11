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

export default function AnalyticsDashboard({user,role,department}) {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Logic is correct: uses department for admin, 'All' otherwise.
      const { data, error } = await supabase.rpc('get_report_stats', { dept: role === 'admin' ? department : 'All' });
  
      if (error) {
        console.error("Error fetching stats:", error);
      } else if (data) {
        setStats(data);
      }
      setLoading(false);
    };
  
    // Only fetch if we have the necessary data
    if (role) {
       fetchStats();
    }

    const channel = supabase
      .channel('reports-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          if (role) { // Re-fetch on changes
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Add `department` to dependency array to refetch when it changes.
  }, [user, role, department]);

  if (loading || !role) {
    return <div className="p-4 text-center text-zinc-400">Loading analytics...</div>;
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