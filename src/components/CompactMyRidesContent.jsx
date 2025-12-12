import React, { useMemo } from "react";
import CompactDriverRideCard from "./CompactDriverRideCard.jsx";
import { CompactPassengerAdCard, CompactSeatBookingCard, CompactUnlockCard } from "./CompactCards.jsx";
import { ResponsiveCompactGrid } from "./ui/CompactGrid.jsx";

// Composant compact pour les cartes de conducteur
const CompactDriverCard = React.memo(({ ride, bookings, onDeleteRide, onCancelBooking, viewerUid }) => {
  return (
    <CompactDriverRideCard
      ride={ride}
      bookings={bookings}
      onDeleteRide={onDeleteRide}
      onCancelBooking={onCancelBooking}
      viewerUid={viewerUid}
    />
  );
});

// Composant compact pour les annonces passager
const CompactPassengerCard = React.memo(({ ad, onDelete }) => {
  return (
    <CompactPassengerAdCard
      ad={ad}
      onDelete={onDelete}
    />
  );
});

// Composant compact pour les réservations
const CompactBookingCard = React.memo(({ booking, onCancel }) => {
  return (
    <CompactSeatBookingCard
      booking={booking}
      onCancel={onCancel}
    />
  );
});

// Composant compact pour les déverrouillages
const CompactUnlockCardWrapper = React.memo(({ unlock, viewerUid }) => {
  return (
    <CompactUnlockCard
      unlock={unlock}
      viewerUid={viewerUid}
    />
  );
});

export default function CompactMyRidesContent({
  activeTab,
  user,
  driverRides = [],
  passengerAds = [],
  seatBookings = [],
  unlocks = [],
  bookingsMap = {},
  onConfirm,
  newDriver = false,
  newBookings = false,
  newUnlocks = false,
  newDriverCount = 0,
  newBookingsCount = 0,
  newUnlocksCount = 0
}) {
  const content = useMemo(() => {
    switch (activeTab) {
      case "driver":
        return (
          <div className="space-y-4">
            {newDriver && newDriverCount > 0 && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="font-bold">🎉 {newDriverCount} nya bokningar!</span>
                </div>
              </div>
            )}
            
            <ResponsiveCompactGrid
              items={driverRides}
              empty="Inga förar-resor ännu. Skapa din första resa!"
            >
              {driverRides.map((ride) => (
                <CompactDriverCard
                  key={ride.id}
                  ride={ride}
                  bookings={bookingsMap[ride.id] || []}
                  onDeleteRide={() => onConfirm({ mode: "ride", payload: ride })}
                  onCancelBooking={(booking) =>
                    onConfirm({ mode: "bkd", payload: { ride, booking } })
                  }
                  viewerUid={user.uid}
                />
              ))}
            </ResponsiveCompactGrid>
          </div>
        );

      case "passenger":
        return (
          <ResponsiveCompactGrid
            items={passengerAds}
            empty="Inga passagerar-annonser. Lägg till en annons för att hitta resor!"
          >
            {passengerAds.map((ad) => (
              <CompactPassengerCard
                key={ad.id}
                ad={ad}
                onDelete={() => onConfirm({ mode: "ride", payload: ad })}
              />
            ))}
          </ResponsiveCompactGrid>
        );

      case "bookings":
        return (
          <div className="space-y-4">
            {newBookings && newBookingsCount > 0 && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <span className="font-bold">📋 {newBookingsCount} uppdateringar på dina bokningar!</span>
                </div>
              </div>
            )}
            
            <ResponsiveCompactGrid
              items={seatBookings}
              empty="Inga bokningar ännu. Boka en resa för att komma igång!"
            >
              {seatBookings.map((booking) => (
                <CompactBookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={() => onConfirm({ mode: "booking", payload: booking })}
                />
              ))}
            </ResponsiveCompactGrid>
          </div>
        );

      case "unlocks":
        return (
          <div className="space-y-4">
            {newUnlocks && newUnlocksCount > 0 && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-orange-700">
                  <span className="font-bold">🔓 {newUnlocksCount} nya upplåsningar tillgängliga!</span>
                </div>
              </div>
            )}
            
            <ResponsiveCompactGrid
              items={unlocks}
              empty="Inga upplåsningar ännu. Lås upp kontakter för att se dem här!"
            >
              {unlocks.map((unlock) => (
                <CompactUnlockCardWrapper
                  key={unlock.id}
                  unlock={unlock}
                  viewerUid={user?.uid}
                />
              ))}
            </ResponsiveCompactGrid>
          </div>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    driverRides,
    passengerAds,
    seatBookings,
    unlocks,
    bookingsMap,
    onConfirm,
    user,
    newDriver,
    newBookings,
    newUnlocks,
    newDriverCount,
    newBookingsCount,
    newUnlocksCount
  ]);

  return (
    <div className="transition-all duration-300 ease-in-out">
      {content}
    </div>
  );
}
