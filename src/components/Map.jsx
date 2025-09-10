import { useEffect } from "react";
import L, { LatLngBounds } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

// Import Leaflet and MarkerCluster CSS
import 'leaflet/dist/leaflet.css';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// --- Helper Component for Resizing ---
function MapResizer({ isMapExpanded }) {
  const map = useMap();

  useEffect(() => {
    if (isMapExpanded !== undefined) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded, map]);

  return null;
}

// --- Helper Component to Auto-Focus Map on Filtered Results ---
// function MapFocusController({ reports }) {
//   const map = useMap();

//   useEffect(() => {
//     if (!reports || reports.length === 0) return;

//     const bounds = new LatLngBounds(reports.map(r => [r.latitude, r.longitude]));
//     map.fitBounds(bounds, { padding: [50, 50] });
//   }, [reports, map]);

//   return null;
// }

// --- Main Map Component ---
// It no longer fetches data, it just receives it via props.
export default function Map({ reports, isMapExpanded, handleReportResolve }) {
  const mapContainerStyle = {
    width: '100%',
    height: isMapExpanded ? '100vh' : '100%',
  };

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[13.0843, 80.2705]} // Fallback center
        zoom={8}
        style={mapContainerStyle}
        key={isMapExpanded ? 'map-expanded' : 'map-collapsed'}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapResizer isMapExpanded={isMapExpanded} />
        {/* <MapFocus Controller reports={reports} /> */}

        <MarkerClusterGroup
          key={reports.map(r => r.report_id).join(',')} 
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
        >
          {/* The component now maps over the 'reports' prop */}
          {reports.map((report) => (
            <Marker
              key={report.report_id}
              position={[report.latitude, report.longitude]}
            >
              <Popup>
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">{report.department}</h3>
                  {report.image_url && (
                    <img
                      src={report.image_url}
                      alt="Issue"
                      className="w-full max-w-xs rounded"
                    />
                  )}
                  <p>{report.description}</p>
                  {/* The resolve button now calls the function passed down from the Dashboard */}
                  <button
                    onClick={() => handleReportResolve(report.report_id)}
                    className='py-2 px-4 w-full cursor-pointer font-semibold text-green-700 bg-green-100 border-2 border-green-300 rounded-lg hover:bg-green-200 transition-colors'
                  >
                    Mark as Resolved
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}