import { useState, useEffect } from "react";
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { supabase } from "../supabase/supabase";

import 'leaflet/dist/leaflet.css';
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// --- Helper function to parse WKT Polygons ---
const parseWKT = (wkt) => {
  // --- FIX: Check if wkt is a valid string before processing ---
  // This prevents the "startsWith is not a function" error if the boundary is null or not a string.
  if (typeof wkt !== 'string' || !wkt.startsWith('POLYGON')) {
    return []; // Return an empty array for invalid or empty boundaries
  }
  
  const coordString = wkt.replace('POLYGON((', '').replace('))', '');
  const pairs = coordString.split(',');
  
  return pairs.map(pair => {
    const [lng, lat] = pair.trim().split(' ').map(Number);
    return [lat, lng]; // Leaflet needs [latitude, longitude]
  });
};

// --- Helper Component for Resizing (No changes) ---
function MapResizer({ isMapExpanded }) {
  const map = useMap();
  useEffect(() => {
    if (isMapExpanded !== undefined) {
      const timer = setTimeout(() => { map.invalidateSize(); }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded, map]);
  return null;
}

// --- Main Map Component ---
export default function Map({ reports, handleReportResolve, isMapExpanded }) {
  const [wards, setWards] = useState([]);

  useEffect(() => {
    const fetchWards = async () => {
      const { data, error } = await supabase.from('wards').select('*');

      if (error) {
        console.error("Error fetching wards:", error);
      } else if (data) {
        const parsedWards = data.map(ward => ({
          ...ward,
          parsedBoundary: parseWKT(ward.boundary) // This will now safely handle empty boundaries
        }));
        setWards(parsedWards);
      }
    };

    fetchWards();
  }, []);

  const mapCenter = [13.0827, 80.2707];

  return (
    <div className='h-full w-full'>
      <MapContainer
        center={mapCenter}
        zoom={12}
        className='h-full w-full z-0'
      >
        <MapResizer isMapExpanded={isMapExpanded} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {wards.map(ward => (
          // Only render a Polygon if it has valid coordinates
          ward.parsedBoundary.length > 0 && (
            <Polygon
              key={ward.id}
              positions={ward.parsedBoundary}
              pathOptions={{ color: 'purple', weight: 2, fillOpacity: 0.1 }}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">Ward No: {ward.ward_no}</h3>
                  <p>Zone: {ward.zone_name}</p>
                </div>
              </Popup>
            </Polygon>
          )
        ))}

        <MarkerClusterGroup
          key={reports.map(r => r.id).join(',')} // Assuming 'id' is the primary key now
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
        >
          {reports.map((report) => (
            <Marker
              key={report.id} // Use the primary key 'id'
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
                  <button
                    onClick={() => handleReportResolve(report.id)} // Use the primary key 'id'
                    className='py-2 px-4 w-full cursor-pointer font-semibold text-green-700 bg-green-100 border-2 border-green-300 rounded-lg hover:bg-green-200 transition-colors'
                  >
                    {report.status === 'Not Completed' ? `Mark as Resolved` : `Resolved`}
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