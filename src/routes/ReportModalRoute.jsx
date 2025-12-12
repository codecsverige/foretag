// src/routes/ReportModalRoute.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import ReportModal from "../components/ReportModal.jsx";

export default function ReportModalRoute() {
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
          setRide(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        }
      } catch (e) {
        console.error("Failed to load ride for report modal:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return null;

  return (
    <ReportModal
      isOpen={true}
      onClose={() => navigate(-1)}
      rideId={id}
      rideData={ride}
    />
  );
}