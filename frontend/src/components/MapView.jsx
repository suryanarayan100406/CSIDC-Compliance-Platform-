import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const statusColors = {
    'Compliant': '#10b981',
    'Encroachment Detected': '#ef4444',
    'Vacant/Unused': '#f59e0b',
    'Boundary Deviation': '#8b5cf6',
    'Unauthorized Construction': '#ef4444',
}

export default function MapView({ plots }) {
    const center = [21.2514, 81.6296] // Raipur, Chhattisgarh

    const createIcon = (status) => {
        const color = statusColors[status] || '#3b82f6'
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
        width: 14px; height: 14px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 8px ${color}80;
      "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
        })
    }

    return (
        <MapContainer
            center={center}
            zoom={11}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {plots.map(plot => (
                <Marker
                    key={plot.id}
                    position={plot.coordinates}
                    icon={createIcon(plot.status)}
                >
                    <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200 }}>
                            <strong style={{ fontSize: '14px' }}>{plot.id}</strong>
                            <br />
                            <span style={{ fontSize: '12px', color: '#666' }}>{plot.name}</span>
                            <br />
                            <span style={{
                                display: 'inline-block',
                                marginTop: '6px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: (statusColors[plot.status] || '#3b82f6') + '20',
                                color: statusColors[plot.status] || '#3b82f6',
                            }}>
                                {plot.status}
                            </span>
                            <br />
                            <span style={{ fontSize: '11px', color: '#888', marginTop: '4px', display: 'block' }}>
                                Lessee: {plot.lessee} | Area: {plot.area_sqm?.toLocaleString()} sqm
                            </span>
                        </div>
                    </Popup>
                    <Circle
                        center={plot.coordinates}
                        radius={200}
                        pathOptions={{
                            color: statusColors[plot.status] || '#3b82f6',
                            fillColor: statusColors[plot.status] || '#3b82f6',
                            fillOpacity: 0.1,
                            weight: 1,
                        }}
                    />
                </Marker>
            ))}
        </MapContainer>
    )
}
