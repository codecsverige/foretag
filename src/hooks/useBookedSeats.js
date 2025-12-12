// src/hooks/useBookedSeats.js
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

const CHUNK = 10;

export default function useBookedSeats(rideIds) {
  const [map,setMap] = useState({});

  useEffect(()=>{
    if (rideIds.length===0) return;
    let alive = true;
    const fetch=async()=>{
      const newMap={};
      const preferWhereIn = (()=>{
        try{
          const p = new URLSearchParams(window.location.search);
          return p.get('useWhereIn')==='1';
        }catch{ return false; }
      })();

      if (preferWhereIn) {
        for (let i=0;i<rideIds.length;i+=CHUNK){
          const slice = rideIds.slice(i,i+CHUNK).filter(Boolean);
          if (slice.length===0) continue;
          try{
            const q = query(collection(db,"bookings"), where("rideId","in",slice));
            const snap = await getDocs(q);
            snap.docs.forEach(d=>{
              const { rideId, seats=1 } = d.data();
              newMap[rideId]=(newMap[rideId]||0)+seats;
            });
          }catch(err){ console.error('useBookedSeats where-in error', err); }
        }
      } else {
        for (const id of rideIds) {
          if (!id) continue;
          try {
            const q = query(collection(db,"bookings"), where("rideId","==",id));
            const snap = await getDocs(q);
            snap.docs.forEach(d=>{
              const { rideId, seats=1 } = d.data();
              newMap[rideId]=(newMap[rideId]||0)+seats;
            });
          } catch (err) {
            console.error("useBookedSeats ride fetch error", id, err);
          }
        }
      }

      if (alive) setMap(prev=>({...prev,...newMap}));
    };
    fetch();
    return ()=>{ alive = false; };
  },[db,rideIds]);

  return map;
}
