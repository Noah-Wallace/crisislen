import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { crisisTypes } from '../data/sampleCrisisData.js'
import { divIcon } from 'leaflet'

const CrisisMap = ({ events, onSelectEvent }) => {
  // Create custom marker icons for different crisis types
  const createMarkerIcon = (type, urgency) => {
    const crisisType = crisisTypes[type] || crisisTypes.other
    const sizeClass = urgency >= 8 ? 'w-8 h-8' : 'w-6 h-6'
    const pulseClass = urgency >= 8 ? 'animate-pulse' : ''
    
    return divIcon({
      html: `
        <div class="relative ${sizeClass}">
          <span class="absolute inset-0 ${pulseClass} flex items-center justify-center text-xl">
            ${crisisType.icon}
          </span>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })
  }

  return (
    <MapContainer
      center={[20, 0]} // Default center
      zoom={2}
      className="h-full w-full rounded-lg overflow-hidden"
      style={{ minHeight: '600px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {events.map(event => (
        <Marker
          key={event.id}
          position={[event.coordinates.lat, event.coordinates.lng]}
          icon={createMarkerIcon(event.type, event.analysis?.urgency)}
          eventHandlers={{
            click: () => onSelectEvent(event)
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{crisisTypes[event.type]?.icon || '⚠️'}</span>
                {event.analysis && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    Urgency: {event.analysis.urgency}/10
                  </span>
                )}
              </div>
              
              <h3 className="font-medium mb-1 capitalize">
                {event.type.replace('_', ' ')}
              </h3>
              
              <p className="text-sm text-gray-600 mb-2">
                {event.text.length > 100 
                  ? `${event.text.substring(0, 100)}...`
                  : event.text
                }
              </p>
              
              <div className="text-xs text-gray-500">
                <div>📍 {event.location}</div>
                {event.verified && (
                  <div className="text-green-600">✓ Verified Source</div>
                )}
              </div>
              
              <button
                onClick={() => onSelectEvent(event)}
                className="mt-2 w-full px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Details →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default CrisisMap
