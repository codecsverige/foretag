import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { BUS_ROUTES_CONFIG, createBusRoute } from '../config/busRoutes.config';
import PageMeta from '../components/PageMeta';
import { HiPlus, HiPencil, HiTrash, HiCheck, HiXMark as HiX } from 'react-icons/hi2';

// Allowed emails for bus admin access
const ALLOWED_EMAILS = [
  'riadh.ma.riadh@gmail.com', // Your email for testing
  // Add bus company emails here later
];

export default function BusAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState(createBusRoute());
  const [saving, setSaving] = useState(false);

  // Check access
  useEffect(() => {
    if (!user) {
      navigate('/google-auth');
      return;
    }
    
    // Check if user is allowed
    if (!ALLOWED_EMAILS.includes(user.email)) {
      // Also check if user has bus_company role in Firestore
      checkUserRole();
    } else {
      fetchRoutes();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.userType !== 'bus_company' && userData?.userType !== 'admin') {
        navigate('/');
        return;
      }
      
      fetchRoutes();
    } catch (error) {
      console.error('Error checking user role:', error);
      navigate('/');
    }
  };

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      // For bus companies, only show their routes
      let q = query(
        collection(db, BUS_ROUTES_CONFIG.collection),
        orderBy('createdAt', 'desc')
      );
      
      // مؤقتاً - كل شخص يرى كل الرحلات
      
      const snapshot = await getDocs(q);
      const routesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build Timestamp fields from date + time strings if provided
      let departureAt = null;
      let arrivalAt = null;
      if (formData.date) {
        const [depH = '00', depM = '00'] = (formData.departureTime || '').split(':');
        const [arrH = '00', arrM = '00'] = (formData.arrivalTime || '').split(':');
        const dateOnly = new Date(formData.date);
        const depDate = new Date(dateOnly);
        depDate.setHours(parseInt(depH) || 0, parseInt(depM) || 0, 0, 0);
        const arrDate = new Date(dateOnly);
        arrDate.setHours(parseInt(arrH) || 0, parseInt(arrM) || 0, 0, 0);
        departureAt = Timestamp.fromDate(depDate);
        arrivalAt = Timestamp.fromDate(arrDate);
      }

      // Basic validations
      const totalSeats = Number(formData.totalSeats) || 0;
      const availableSeats = Number(formData.availableSeats) || 0;
      if (availableSeats > totalSeats) {
        throw new Error('Available seats cannot exceed total seats');
      }

      const routeData = {
        ...formData,
        createdBy: user.uid,
        departureAt,
        arrivalAt,
        createdAt: editingRoute ? formData.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingRoute) {
        // Update existing route
        await updateDoc(doc(db, BUS_ROUTES_CONFIG.collection, editingRoute.id), routeData);
      } else {
        // Create new route
        await addDoc(collection(db, BUS_ROUTES_CONFIG.collection), routeData);
      }

      // Reset form
      setFormData(createBusRoute());
      setShowForm(false);
      setEditingRoute(null);
      
      // Refresh list
      fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Ett fel uppstod när rutten skulle sparas');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (route) => {
    setFormData(route);
    setEditingRoute(route);
    setShowForm(true);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna rutt?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, BUS_ROUTES_CONFIG.collection, routeId));
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Ett fel uppstod när rutten skulle tas bort');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta 
        title="Bus Admin - Hantera bussrutter | VägVänner"
        description="Administrationsverktyg för bussbolag"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Bussrutter Administration</h1>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <HiPlus className="w-5 h-5" />
                  Lägg till rutt
                </button>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingRoute ? 'Redigera rutt' : 'Ny bussrutt'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bussbolag *
                    </label>
                    <select
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Välj bolag</option>
                      {BUS_ROUTES_CONFIG.allowedCompanies.map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>

                  {/* From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Från stad *
                    </label>
                    <select
                      value={formData.from}
                      onChange={(e) => handleInputChange('from', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Välj stad</option>
                      {BUS_ROUTES_CONFIG.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Till stad *
                    </label>
                    <select
                      value={formData.to}
                      onChange={(e) => handleInputChange('to', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Välj stad</option>
                      {BUS_ROUTES_CONFIG.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Datum *
                    </label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avgångstid *
                    </label>
                    <input
                      type="time"
                      value={formData.departureTime}
                      onChange={(e) => handleInputChange('departureTime', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  {/* Arrival Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ankomsttid *
                    </label>
                    <input
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pris (SEK) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                    />
                  </div>

                  {/* Available Seats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tillgängliga platser *
                    </label>
                    <input
                      type="number"
                      value={formData.availableSeats}
                      onChange={(e) => handleInputChange('availableSeats', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                      min="0"
                      max={formData.totalSeats}
                    />
                  </div>

                  {/* Booking URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bokningslänk *
                    </label>
                    <input
                      type="url"
                      value={formData.bookingUrl}
                      onChange={(e) => handleInputChange('bookingUrl', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  {/* Bus Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bussnummer
                    </label>
                    <input
                      type="text"
                      value={formData.busNumber}
                      onChange={(e) => handleInputChange('busNumber', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Ex: 123"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bekvämligheter
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(BUS_ROUTES_CONFIG.amenities).map(([key, amenity]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(key)}
                          onChange={() => handleAmenityToggle(key)}
                          className="text-blue-600"
                        />
                        <span className="text-lg" title={amenity.label}>
                          {amenity.icon}
                        </span>
                        <span className="text-sm">{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <HiCheck className="w-5 h-5" />
                    {saving ? 'Sparar...' : 'Spara rutt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRoute(null);
                      setFormData(createBusRoute());
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <HiX className="w-5 h-5" />
                    Avbryt
                  </button>
                </div>
              </form>
            )}

            {/* Routes List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dina rutter ({routes.length})</h3>
              
              {routes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Inga rutter än. Klicka på "Lägg till rutt" för att börja.
                </p>
              ) : (
                <div className="space-y-2">
                  {routes.map(route => (
                    <div key={route.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {route.from} → {route.to}
                        </div>
                        <div className="text-sm text-gray-600">
                          {route.company} • {route.departureTime} - {route.arrivalTime} • {route.price} kr
                        </div>
                        <div className="flex gap-2 mt-1">
                          {route.amenities.map(amenity => {
                            const amenityConfig = BUS_ROUTES_CONFIG.amenities[amenity];
                            return amenityConfig ? (
                              <span key={amenity} className="text-lg" title={amenityConfig.label}>
                                {amenityConfig.icon}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(route)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}