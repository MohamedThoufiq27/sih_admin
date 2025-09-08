import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase"; // Adjust the path to your supabase client

// A simple component for a single statistic card
function StatCard({ title, value, color }) {
  return (
    <div className="flex-1 p-4 bg-zinc-500 border border-gray-600 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Function to fetch the stats from our database function
    const fetchStats = async () => {
      const { data, error } = await supabase.rpc('get_report_stats');

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
  }, []);

  if (loading) {
    return <div className="p-4 text-center ">Loading analytics...</div>;
  }

  return (
    <div className="w-full p-4 bg-gray-500 rounded-xl border-4 border-zinc-700">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Reports" value={stats.total} color="text-blue-400" />
        <StatCard title="Pending Reports" value={stats.pending} color="text-orange-500" />
        <StatCard title="Completed Reports" value={stats.completed} color="text-green-600" />
      </div>
    </div>
  );
}