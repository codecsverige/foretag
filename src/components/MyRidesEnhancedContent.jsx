import React, { memo, useMemo } from "react";
import { useMyRides } from "../context/MyRidesContext.jsx";
import DriverRideCard from "./DriverRideCard.jsx";
import PassengerAdCard from "./PassengerAdCard.jsx";
import SeatBookingCard from "./SeatBookingCard.jsx";
import UnlockCard from "./UnlockCard.jsx";
import GridOrEmpty from "./ui/GridOrEmpty.jsx";
import NotificationIndicator from "./ui/NotificationIndicator.jsx";

// مكونات محسنة بـ memo
const MemoizedDriverRideCard = memo(DriverRideCard);
const MemoizedPassengerAdCard = memo(PassengerAdCard);
const MemoizedSeatBookingCard = memo(SeatBookingCard);
const MemoizedUnlockCard = memo(UnlockCard);

function MyRidesEnhancedContent({ onConfirm }) {
  const { state } = useMyRides();
  
  const {
    activeTab,
    driverRides,
    passengerAds,
    seatBookings,
    unlocks,
    bookingsMap,
    notifications,
    loading,
    hasOptimisticUpdates
  } = state;

  // تحسين الأداء مع useMemo
  const tabContent = useMemo(() => {
    const renderOptimisticIndicator = () => {
      if (hasOptimisticUpdates) {
        return (
          <div className="fixed top-4 right-4 z-50 bg-blue-100 border border-blue-300 rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
              <span className="text-sm text-blue-700 font-medium">
                Synkroniserar ändringar...
              </span>
            </div>
          </div>
        );
      }
      return null;
    };

    switch (activeTab) {
      case "driver":
        return (
          <div className="space-y-6">
            {renderOptimisticIndicator()}
            
            {notifications.newDriver && (
              <NotificationIndicator
                message={`${notifications.newDriverCount} nya bokningar på dina resor!`}
                type="new"
                show={true}
                position="floating"
                count={notifications.newDriverCount}
              />
            )}
            
            <GridOrEmpty 
              items={driverRides} 
              empty="Inga förar-annonser." 
              type="driver"
              loading={loading.driver}
            >
              {driverRides.map((ride) => (
                <MemoizedDriverRideCard
                  key={ride.id}
                  ride={ride}
                  bookings={bookingsMap[ride.id] || []}
                  onDeleteRide={() => onConfirm({ mode: "ride", payload: ride })}
                  onCancelBooking={(booking) =>
                    onConfirm({ mode: "bkd", payload: { ride, booking } })
                  }
                  viewerUid={state.user?.uid}
                />
              ))}
            </GridOrEmpty>
          </div>
        );

      case "passenger":
        return (
          <div className="space-y-6">
            {renderOptimisticIndicator()}
            
            <GridOrEmpty 
              items={passengerAds} 
              empty="Inga passagerar-annonser." 
              type="passenger"
              loading={loading.passenger}
            >
              {passengerAds.map((ad) => (
                <MemoizedPassengerAdCard
                  key={ad.id}
                  ad={ad}
                  onDelete={() => onConfirm({ mode: "ride", payload: ad })}
                />
              ))}
            </GridOrEmpty>
          </div>
        );

      case "bookings":
        return (
          <div className="space-y-6">
            {renderOptimisticIndicator()}
            
            {notifications.newBookings && (
              <NotificationIndicator
                message={`${notifications.newBookingsCount} uppdateringar på dina bokningar!`}
                type="update"
                show={true}
                position="floating"
                count={notifications.newBookingsCount}
              />
            )}
            
            <GridOrEmpty 
              items={seatBookings} 
              empty="Du har inga bokningar ännu." 
              type="bookings"
              loading={loading.bookings}
            >
              {seatBookings.map((booking) => (
                <MemoizedSeatBookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={() => onConfirm({ mode: "booking", payload: booking })}
                />
              ))}
            </GridOrEmpty>
          </div>
        );

      case "unlocks":
        return (
          <div className="space-y-6">
            {renderOptimisticIndicator()}
            
            {notifications.newUnlocks && (
              <NotificationIndicator
                message={`${notifications.newUnlocksCount} nya upplåsningar tillgängliga!`}
                type="success"
                show={true}
                position="floating"
                count={notifications.newUnlocksCount}
              />
            )}
            
            <GridOrEmpty 
              items={unlocks} 
              empty="Du har inte låst upp några kontakter." 
              type="unlocks"
              loading={loading.unlocks}
            >
              {unlocks.map((unlock) => (
                <MemoizedUnlockCard 
                  key={unlock.id} 
                  unlock={unlock} 
                  viewerUid={state.user?.uid} 
                />
              ))}
            </GridOrEmpty>
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
    notifications,
    loading,
    hasOptimisticUpdates,
    onConfirm,
    state.user?.uid
  ]);

  return (
    <div className="transition-all duration-300 ease-in-out">
      {/* مؤشر الأداء (في وضع التطوير) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <div className="grid grid-cols-4 gap-2">
            <span>Cache: {state.cache.size}</span>
            <span>Optimistic: {state.optimisticUpdates.size}</span>
            <span>Tab: {activeTab}</span>
            <span>Updated: {state.lastUpdate ? new Date(state.lastUpdate).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
      )}
      
      {tabContent}
    </div>
  );
}

// تصدير مع memo للتحسين الإضافي
export default memo(MyRidesEnhancedContent);
