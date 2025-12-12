Update 108 – Ride Search Optimizations (handoff)

This folder contains ready-to-apply edits for improving search performance and UX without breaking the app. Apply these on top of branch `update-108-favicon-fix`.

Included updates
- Reduce initial reads and enable realtime “new-only”.
- Server-side filtering for status/role/date/roundTrip to cut reads.
- Better ranking and client match for from/to and free text.
- Add From/To inputs with smart city suggestions.

Files to copy over the project (same relative paths)
- src/hooks/usePaginatedRides.js
- src/pages/SearchDynamic.jsx
- src/components/rides/RideGrid.jsx
- src/components/rides/RideFilters.jsx

Suggested apply steps
1) git checkout update-108-favicon-fix
2) Copy files from this folder into the repo root, preserving paths
   - cp -f handoff/update-108-optimizations/src/hooks/usePaginatedRides.js src/hooks/usePaginatedRides.js
   - cp -f handoff/update-108-optimizations/src/pages/SearchDynamic.jsx src/pages/SearchDynamic.jsx
   - cp -f handoff/update-108-optimizations/src/components/rides/RideGrid.jsx src/components/rides/RideGrid.jsx
   - cp -f handoff/update-108-optimizations/src/components/rides/RideFilters.jsx src/components/rides/RideFilters.jsx
3) git add -A
4) git commit -m "perf(search): reduce Firestore reads; realtime new-only; server-side filters; improved From/To UX"
5) git push origin update-108-favicon-fix

Notes
- Firestore persistence is already enabled in src/firebase/firebase.js.
- From/To server-side filters for cities can be enabled later when originNorm/destNorm fields and composite indexes are available.
