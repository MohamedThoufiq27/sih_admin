import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from "../supabase/supabase"; // Adjust path to your supabase client

// Define colors for the pie chart slices
const COLORS = {
  'Pending': '#fb923c', // Tailwind orange-400
  'Completed': '#3b82f6', // Tailwind blue-500
};

export default function AnalyticsPieChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This function fetches the stats and formats them for the chart
    const fetchAndSetChartData = async () => {
      const { data, error } = await supabase.rpc('get_report_stats');

      if (error) {
        console.error("Error fetching chart data:", error);
        setChartData([]); // Set to empty on error
      } else if (data) {
        // Transform the data into the format Recharts expects
        const formattedData = [
          { name: 'Pending', value: data.pending },
          { name: 'Completed', value: data.completed }
        ];
        setChartData(formattedData);
      }
      setLoading(false);
    };

    // Fetch initial data
    fetchAndSetChartData();

    // Real-time subscription to update the chart on any change
    const channel = supabase
      .channel('reports-piechart-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchAndSetChartData();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-slate-500">Loading chart...</div>;
  }
  
  if (chartData.every(item => item.value === 0)) {
    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-white rounded-xl shadow-md">
            <p className="text-slate-500">No report data available.</p>
        </div>
    );
  }

  return (
    // UPDATED: Removed h-full for more predictable sizing in a grid.
    <div className="w-full p-6 bg-white rounded-xl shadow-md flex flex-col">
      <h3 className="text-lg font-semibold text-slate-700 mb-4 flex-shrink-0">
        Reports Overview
      </h3>
      {/* This div now has a fixed height to ensure consistent rendering */}
      <div className="w-full h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius="85%" // Use percentage for responsiveness
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              // A cleaner label showing just the percentage
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} // slate-100 with opacity
              contentStyle={{
                borderRadius: '0.75rem',
                borderColor: '#e2e8f0', // slate-200
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend iconType="circle" verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

