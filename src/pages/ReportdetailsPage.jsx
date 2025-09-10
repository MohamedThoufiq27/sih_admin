import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("report_id", id)
        .single();

      if (!error) setReport(data);
    };

    fetchReport();
  }, [id]);

  if (!report) return <div className="text-white p-4">Loading...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">{report.department}</h1>
      <p className="mb-2">{report.description}</p>
      <p className="text-sm text-gray-400">Status: {report.status}</p>
    </div>
  );
};

export default ReportDetails;
