import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { BUS_ROUTES_CONFIG } from '../config/busRoutes.config';
import PageMeta from '../components/PageMeta';
import { HiArrowLeft, HiClock, HiCurrencyDollar, HiArrowTopRightOnSquare as HiExternalLink } from 'react-icons/hi2';

export default function BusDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRouteDetails();
  }, [id]);

  const fetchRouteDetails = async () => {
    try {
      const docRef = doc(db, BUS_ROUTES_CONFIG.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setRoute({
          id: docSnap.id,
          ...docSnap.data()
        });
      } else {
        navigate('/bus');
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
      navigate('/bus');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <>
      <PageMeta 
        title={`${route.from} → ${route.to} - ${route.company} | VägVänner`}
        description={`Bussresa från ${route.from} till ${route.to} med ${route.company}. Avgång ${route.departureTime}, pris ${route.price} kr.`}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate('/bus')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <HiArrowLeft className="w-5 h-5" />
              Tillbaka till sökresultat
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🚌</span>
                <h1 className="text-2xl font-bold">{route.company}</h1>
              </div>
              <div className="text-3xl font-bold">
                {route.from} → {route.to}
              </div>
            </div>

            {/* Main Info */}
            <div className="p-6 space-y-6">
              {/* Time and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Avgång</div>
                  <div className="text-xl font-bold">
                    {route.departureAt?.seconds
                      ? new Date(route.departureAt.seconds * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                      : route.departureTime}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Ankomst</div>
                  <div className="text-xl font-bold">
                    {route.arrivalAt?.seconds
                      ? new Date(route.arrivalAt.seconds * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit' })
                      : route.arrivalTime}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-1">Pris</div>
                  <div className="text-2xl font-bold text-green-700">{route.price} kr</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HiClock className="w-5 h-5 text-gray-500" />
                  <span>Restid: {route.duration || 'N/A'}</span>
                </div>
                {route.busNumber && (
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-gray-500">🚌</span>
                    <span>Bussnummer: {route.busNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tillgängliga platser:</span>
                  <span className="font-semibold">{route.availableSeats} av {route.totalSeats}</span>
                </div>
              </div>

              {/* Amenities */}
              {route.amenities && route.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Bekvämligheter</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {route.amenities.map(amenity => {
                      const amenityConfig = BUS_ROUTES_CONFIG.amenities[amenity];
                      return amenityConfig ? (
                        <div key={amenity} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                          <span className="text-2xl">{amenityConfig.icon}</span>
                          <span className="text-sm">{amenityConfig.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Booking Button */}
              <div className="pt-6 border-t">
                <a
                  href={route.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2"
                >
                  Boka nu hos {route.company}
                  <HiExternalLink className="w-5 h-5" />
                </a>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Du kommer att omdirigeras till {route.company}s webbplats för bokning
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Bra att veta</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Var på plats minst 15 minuter innan avgång</li>
                  <li>• Ha din biljett redo (digital eller utskriven)</li>
                  <li>• Kontrollera bagagepolicy hos {route.company}</li>
                  <li>• Ändringar och avbokningar enligt {route.company}s villkor</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}