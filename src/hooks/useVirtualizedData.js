import {
import { db } from "../firebase/firebase.js";
import {
  
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where
} from "firebase/firestore";

const PAGE_SIZE = 50; // Augmenté pour de meilleures performances
const CACHE_SIZE = 1000; // Cache pour éviter les re-fetch

export default function useVirtualizedData({ 
  collectionName = "rides",
  conditions = [],
  orderByField = "createdAt",
  orderDirection = "desc",
  pageSize = PAGE_SIZE
} = {}) {
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eof, setEof] = useState(false);
  const [error, setError] = useState(null);
  
  const fetching = useRef(false);
  const lastDoc = useRef(null);
  const cache = useRef(new Map());
  const abortController = useRef(null);

  // Optimisation: Mémoisation de la requête de base
  const baseQuery = useMemo(() => {
    return query(
      collection(db, collectionName),
      ...conditions,
      orderBy(orderByField, orderDirection),
      limit(pageSize)
    );
  }, [db, collectionName, conditions, orderByField, orderDirection, pageSize]);

  // Fonction optimisée pour construire la requête
  const buildQuery = useCallback(() => {
    if (lastDoc.current) {
      return query(baseQuery, startAfter(lastDoc.current));
    }
    return baseQuery;
  }, [baseQuery]);

  // Fonction optimisée pour récupérer les données
  const fetchPage = useCallback(async (forceRefresh = false) => {
    if ((eof || fetching.current) && !forceRefresh) return;
    
    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();
    setLoading(true);
    fetching.current = true;
    setError(null);

    try {
      const snap = await getDocs(buildQuery());
      
      if (abortController.current.signal.aborted) return;

      const newData = snap.docs.map(doc => {
        const docData = { id: doc.id, ...doc.data() };
        // Cache les données pour éviter les re-fetch
        cache.current.set(doc.id, docData);
        return docData;
      });

      setData(prev => {
        if (forceRefresh) return newData;
        
        // Optimisation: Utiliser Set pour déduplication rapide
        const existingIds = new Set(prev.map(item => item.id));
        const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
        
        return [...prev, ...uniqueNewData];
      });

      lastDoc.current = snap.docs[snap.docs.length - 1] || null;
      setEof(snap.size < pageSize);
      
    } catch (err) {
      if (!abortController.current.signal.aborted) {
        console.error("Error fetching data:", err);
        setError(err.message);
      }
    } finally {
      if (!abortController.current.signal.aborted) {
        setLoading(false);
        fetching.current = false;
      }
    }
  }, [buildQuery, eof, pageSize]);

  // Fonction pour réinitialiser les données
  const reset = useCallback(() => {
    setData([]);
    setEof(false);
    setError(null);
    lastDoc.current = null;
    cache.current.clear();
    
    if (abortController.current) {
      abortController.current.abort();
    }
    
    setLoading(true);
  }, []);

  // Fonction pour rechercher dans les données en cache
  const searchInCache = useCallback((searchTerm) => {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.origin?.toLowerCase().includes(term) ||
      item.destination?.toLowerCase().includes(term) ||
      item.userName?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }, [data]);

  // Fonction pour filtrer les données
  const filterData = useCallback((filterFn) => {
    return data.filter(filterFn);
  }, [data]);

  // Fonction pour trier les données
  const sortData = useCallback((sortFn) => {
    return [...data].sort(sortFn);
  }, [data]);

  // Nettoyage du cache périodiquement
  useEffect(() => {
    const cleanupCache = () => {
      if (cache.current.size > CACHE_SIZE) {
        const entries = Array.from(cache.current.entries());
        const toDelete = entries.slice(0, CACHE_SIZE / 2);
        toDelete.forEach(([key]) => cache.current.delete(key));
      }
    };

    const interval = setInterval(cleanupCache, 60000); // Nettoyage toutes les minutes
    return () => clearInterval(interval);
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchPage();
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchPage]);

  // Rechargement automatique après reset
  useEffect(() => {
    if (loading && data.length === 0) {
      fetchPage();
    }
  }, [loading, data.length, fetchPage]);

  return {
    data,
    loading,
    eof,
    error,
    fetchPage,
    reset,
    searchInCache,
    filterData,
    sortData,
    cacheSize: cache.current.size
  };
} 