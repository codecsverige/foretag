// src/routes/RideDetailsModalRoute.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import RideDetailsModal from "../components/rides/RideDetailsModal.jsx";

export default function RideDetailsModalRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "rides", id));
        if (!cancelled) {
          if (snap.exists()) {
            setRide({ id: snap.id, ...snap.data() });
          } else {
            navigate("/", { replace: true });
          }
        }
      } catch (e) {
        console.error("Failed to load ride for modal:", e);
        if (!cancelled) navigate("/", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, navigate]);

  if (loading || !ride) return null;

  return (
    <RideDetailsModal
      ride={ride}
      onClose={() => navigate(-1)}
    />
  );
}