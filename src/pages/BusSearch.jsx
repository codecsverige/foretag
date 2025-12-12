import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, Timestamp, startAt, endAt } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { BUS_ROUTES_CONFIG } from '../config/busRoutes.config';
import PageMeta from '../components/PageMeta';
import BusCard from '../components/bus/BusCard';
import BusFilters from '../components/bus/BusFilters';
import { HiArrowLeft } from 'react-icons/hi2';
import TransportTypeTabs from '../components/TransportTypeTabs';

export default function BusSearch() {
  const navigate = useNavigate();
  const [busRoutes, setBusRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: '',
    company: '',
    amenities: [],
    q: ''
  });

  // Fetch bus routes
  useEffect(() => {
    fetchBusRoutes();
  }, [filters]);

  const fetchBusRoutes = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, BUS_ROUTES_CONFIG.collection));
      
      // Apply filters
      if (filters.from) {
        q = query(q, where('from', '==', filters.from));
      }
      if (filters.to) {
        q = query(q, where('to', '==', filters.to));
      }
      if (filters.company) {
        q = query(q, where('company', '==', filters.company));
      }
      
      if (filters.date) {
        // Create start/end of selected day and query by departureAt Timestamp
        const date = new Date(filters.date);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        q = query(q, orderBy('departureAt'), startAt(Timestamp.fromDate(start)), endAt(Timestamp.fromDate(end)));
      } else {
        // Fallback ordering when no date filter
        q = query(q, orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      let routes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Client-side free-text filter: matches company, from, to, busNumber
      const qText = (filters.q || '').trim().toLowerCase();
      if (qText) {
        routes = routes.filter(r => (
          (r.company || '').toLowerCase().includes(qText) ||
          (r.from || '').toLowerCase().includes(qText) ||
          (r.to || '').toLowerCase().includes(qText) ||
          (r.busNumber || '').toLowerCase().includes(qText)
        ));
      }
      
      setBusRoutes(routes);
    } catch (error) {
      console.error('Error fetching bus routes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta 
        title="Bussresor i Sverige - Hitta billiga bussbiljetter | VägVänner"
        description="Jämför och boka bussresor mellan svenska städer. FlixBus, Vy Buss och fler. Enkelt, säkert och bekvämt."
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Transport Type Tabs */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-center">
              <TransportTypeTabs currentType="bus" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <BusFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : busRoutes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Inga bussresor hittades</p>
              <p className="text-gray-400 mt-2">Prova att ändra dina sökkriterier</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {busRoutes.map(route => (
                <BusCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}