import 'leaflet/dist/leaflet.css';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapContainer, TileLayer,Marker , Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useEffect } from "react";

import { supabase } from "../supabase/supabase";
import { toast } from "react-toastify";

// let DefaultIcon = L.icon({
//   iconUrl,
//   shadowUrl: iconShadow,
//   // iconSize:new L.Point(40, 47)
// });
// L.Marker.prototype.options.icon = DefaultIcon;

export default function Map({reports,setReports}) {  

  useEffect(() => {
    // 1. Fetch existing reports
    const fetchReports = async () => {
      const { data, error } = await supabase.from("reports").select("*").eq('status','Not Completed');
      
      if (!error) {
        setReports(data);
      }
      
    }
    fetchReports()

    // 2. Realtime subscription
    const channel = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          console.log("Realtime insert:", payload); 
          setReports((prev) => [...prev, payload.new])
          toast.success("New Issue Reported!")
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports" },
        (payload) => {
          // If the updated report is now "Completed", remove it from the map
          if (payload.new.status === 'Completed') { // <-- ADJUSTED
            setReports((prev) =>
              prev.filter((report) => report.report_id !== payload.new.report_id)
            );
            toast.success("A report has been completed!");
          } else {
            // Otherwise, update the existing report data in the state
            setReports((prev) => 
              prev.map((report) => 
                report.report_id === payload.new.report_id ? payload.new : report
              )
            );
          }
        }
      )
      .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "reports" },
      (payload) => {
        setReports((prev) =>
          prev.filter((report) => report.report_id !== payload.old.report_id)
        );
        toast.error("Report Deleted!");
      }
    )
    .subscribe();

    // 3. Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleReportResolve = async (reportId) => {
    if (!reportId) return;

    const { error } = await supabase
      .from('reports')
      .update({ status: 'Completed' }) // <-- ADJUSTED
      .eq('report_id', reportId);

    if (error) {
      toast.error("Failed to update report. Please try again.");
      console.error("Error updating report:", error);
    }
  };

  return (
    <div className="w-full h-full">
    <MapContainer
      center={[13.0843,80.2705]} // India center
      zoom={8}
      style={{ height: "100%", width: "100%" }}
    >
   
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // attribution="© OpenStreetMap contributors"
      />
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={true}
      >
      
        {reports.map((report) => (
              <Marker key={report.report_id} position={[report.latitude, report.longitude]}>
                <Popup>
                  <b>{report.department}</b> <br />
                  <img
                    src={report.image_url}
                    alt="Issue"
                    className="w-40 rounded mt-2"
                  />
                  <p>{report.description}</p>
                  <button onClick={() => handleReportResolve(report.report_id)} className='py-3 w-full cursor-pointer text-green-600 border-2 border-green-500 bg-green-300 rounded-xl'>Resolve</button>
                </Popup>
              </Marker>
        ))}
      </MarkerClusterGroup>

    </MapContainer>
    </div>
  );
}
