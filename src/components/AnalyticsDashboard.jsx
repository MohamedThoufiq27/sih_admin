import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase"; // Adjust the path to your supabase client

// A simple component for a single statistic card
function StatCard({ title, value, color }) {
  return (
    <div className="flex-1 flex flex-col justify-between items-start p-4 bg-gray-800/50 rounded-lg shadow-lg backdrop-blur-sm">
      <h3 className="text-lg text-gray-300 font-bold">{title}</h3>
      <p className={`text-5xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

// The component is now simpler, only needing the user object.
export default function AnalyticsDashboard({ user }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Calls the new, more powerful database function
        const { data, error } = await supabase.rpc("get_report_stats_for_role", {
          p_user_id: user.id,
        });

        if (error) {
          console.error("Error fetching stats:", error);
        } else if (data && data.length > 0) {
          setStats(data[0]);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const channel = supabase
      .channel("reports-stats-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center text-zinc-400">Loading analytics...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full p-4 bg-gray-900 rounded-xl">
      <div className="flex flex-1 gap-4">
        <StatCard title="Total Reports" value={stats.total} color="text-blue-400" />
        <StatCard title="Pending Reports" value={stats.pending} color="text-orange-400" />
        <StatCard title="Completed Reports" value={stats.completed} color="text-green-400" />
      </div>
    </div>
  );
}
