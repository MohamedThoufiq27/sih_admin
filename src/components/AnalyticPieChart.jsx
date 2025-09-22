import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from "../supabase/supabase"; // Adjust path to your supabase client

const COLORS = {
  'Pending': '#fb923c', // Tailwind orange-400
  'Completed': '#4ade80', // Tailwind green-400
};

// The component now only needs the user object.
export default function AnalyticsPieChart({ user }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAndSetChartData = async () => {
      setLoading(true);
      try {
        // Calls the new database function
        const { data, error } = await supabase.rpc('get_report_stats_for_role', { p_user_id: user.id });

        if (error) {
          console.error("Error fetching chart data:", error);
          setChartData([]);
        } else if (data && data.length > 0) {
          const stats = data[0];
          const formattedData = [
            { name: 'Pending', value: stats.pending },
            { name: 'Completed', value: stats.completed }
          ];
          setChartData(formattedData);
        }
      } catch (err) {
        console.error("Unexpected error fetching chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetChartData();

    const channel = supabase
      .channel('reports-piechart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchAndSetChartData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center text-lg text-slate-400">Loading chart...</div>;
  }
  
  if (chartData.every(item => item.value === 0)) {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-gray-900 rounded-xl shadow-md">
            <p className="text-slate-500">No report data available.</p>
        </div>
    );
  }

  return (
    <div className="w-full p-6 bg-gray-900 rounded-xl shadow-md flex flex-col">
      <h3 className="text-xl font-bold text-slate-300 mb-4 flex-shrink-0">
        Reports Overview
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937', // gray-800
                borderColor: '#4b5563', // gray-600
                borderRadius: '0.75rem',
              }}
            />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
