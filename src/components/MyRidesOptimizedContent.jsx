import React, { useMemo, useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import useOptimizedData from "../hooks/useOptimizedData.js";
import DriverRideCard from "./DriverRideCard.jsx";
import PassengerAdCard from "./PassengerAdCard.jsx";
import SeatBookingCard from "./SeatBookingCard.jsx";
import UnlockCard from "./UnlockCard.jsx";
import InfiniteScrollContainer from "./ui/InfiniteScrollContainer.jsx";
import NotificationIndicator from "./ui/NotificationIndicator.jsx";
import GridOrEmpty from "./ui/GridOrEmpty.jsx";

// Composant de virtualisation pour de gros volumes
const VirtualizedGrid = React.memo(({ 
  items, 
  renderItem, 
  containerHeight = 600,
  itemHeight = 200,
  onLoadMore,
  hasMore,
  loading 
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(10);
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const itemsPerView = Math.ceil(clientHeight / itemHeight);
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    const newEndIndex = Math.min(newStartIndex + itemsPerView + 5, items.length); // +5 pour le buffer

    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);

    // Déclencher le chargement de plus d'éléments
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMore && !loading) {
      onLoadMore();
    }
  }, [itemHeight, items.length, hasMore, loading, onLoadMore]);

  if (items.length < 50) {
    // Utiliser le rendu normal pour les petites listes
    return (
      <InfiniteScrollContainer
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        loading={loading}
      >
        <GridOrEmpty items={items} type="bookings">
          {items.map(renderItem)}
        </GridOrEmpty>
      </InfiniteScrollContainer>
    );
  }

  return (
    <div 
      style={{ height: containerHeight, overflowY: 'auto' }}
      onScroll={handleScroll}
      className="virtual-scroll-container"
    >
      <div style={{ 
        height: items.length * itemHeight,
        position: 'relative'
      }}>
        <div style={{ 
          transform: `translateY(${startIndex * itemHeight}px)`,
          position: 'absolute',
          width: '100%'
        }}>
          <GridOrEmpty items={visibleItems} type="bookings">
            {visibleItems.map(renderItem)}
          </GridOrEmpty>
        </div>
      </div>
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}
    </div>
  );
});

export default function MyRidesOptimizedContent({
  activeTab,
  onConfirm,
  newDriver = false,
  newBookings = false,
  newUnlocks = false,
  newDriverCount = 0,
  newBookingsCount = 0,
  newUnlocksCount = 0
}) {
  const { user } = useAuth();
  const { 
    data, 
    loading, 
    hasMore, 
    error, 
    loadMore, 
    refreshData,
    totalCacheSize,
    performanceStats 
  } = useOptimizedData(user?.uid, activeTab);

  // Fonctions de rendu optimisées avec useCallback
  const renderDriverCard = useCallback((ride) => (
    <DriverRideCard
      key={ride.id}
      ride={ride}
      bookings={[]} 
      onDeleteRide={() => onConfirm({ mode: "ride", payload: ride })}
      onCancelBooking={(b) =>
        onConfirm({ mode: "bkd", payload: { ride, booking: b } })
      }
      viewerUid={user?.uid}
    />
  ), [onConfirm, user?.uid]);

  const renderPassengerCard = useCallback((ad) => (
    <PassengerAdCard
      key={ad.id}
      ad={ad}
      onDelete={() => onConfirm({ mode: "ride", payload: ad })}
    />
  ), [onConfirm]);

  const renderBookingCard = useCallback((booking) => (
    <SeatBookingCard
      key={booking.id}
      booking={booking}
      onCancel={() => onConfirm({ mode: "booking", payload: booking })}
    />
  ), [onConfirm]);

  const renderUnlockCard = useCallback((unlock) => (
    <UnlockCard 
      key={unlock.id} 
      unlock={unlock} 
      viewerUid={user?.uid} 
    />
  ), [user?.uid]);

  // تحسين المحتوى باستخدام useMemo et virtualisation
  const tabContent = useMemo(() => {
    // معالجة الأخطاء
    if (error) {
      return (
        <div className="text-center py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-600 dark:text-red-400 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">خطأ في تحميل البيانات</p>
            <p className="text-red-500 dark:text-red-300 text-sm mb-4">{error.message}</p>
            <button 
              onClick={refreshData}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    // حالة عدم وجود بيانات مع استخدام GridOrEmpty
    if (!loading && data.length === 0) {
      const emptyMessages = {
        driver: "Inga förar-annonser.",
        passenger: "Inga passagerar-annonser.",
        bookings: "Du har inga bokningar ännu.",
        unlocks: "Du har inte låst upp några kontakter."
      };

      return (
        <GridOrEmpty 
          items={[]} 
          empty={emptyMessages[activeTab] || "Inga objekt ännu"}
          type={activeTab}
        />
      );
    }

    // استخدام التمرير الافتراضي للقوائم الكبيرة
    const useVirtualization = performanceStats?.hasVirtualScroll;

    switch (activeTab) {
      case "driver":
        return (
          <div className="space-y-6">
            {newDriver && (
              <NotificationIndicator
                message={`${newDriverCount} nya bokningar på dina resor!`}
                type="new"
                show={true}
                position="floating"
                count={newDriverCount}
              />
            )}
            
            {useVirtualization ? (
              <VirtualizedGrid
                items={data}
                renderItem={renderDriverCard}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
                itemHeight={280}
              />
            ) : (
              <InfiniteScrollContainer
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
              >
                <GridOrEmpty items={data} type="driver">
                  {data.map(renderDriverCard)}
                </GridOrEmpty>
              </InfiniteScrollContainer>
            )}
          </div>
        );

      case "passenger":
        return (
          useVirtualization ? (
            <VirtualizedGrid
              items={data}
              renderItem={renderPassengerCard}
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={loading}
              itemHeight={220}
            />
          ) : (
            <InfiniteScrollContainer
              onLoadMore={loadMore}
              hasMore={hasMore}
              loading={loading}
            >
              <GridOrEmpty items={data} type="passenger">
                {data.map(renderPassengerCard)}
              </GridOrEmpty>
            </InfiniteScrollContainer>
          )
        );

      case "bookings":
        return (
          <div className="space-y-6">
            {newBookings && (
              <NotificationIndicator
                message={`${newBookingsCount} uppdateringar på dina bokningar!`}
                type="update"
                show={true}
                position="floating"
                count={newBookingsCount}
              />
            )}
            
            {useVirtualization ? (
              <VirtualizedGrid
                items={data}
                renderItem={renderBookingCard}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
                itemHeight={250}
              />
            ) : (
              <InfiniteScrollContainer
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
              >
                <GridOrEmpty items={data} type="bookings">
                  {data.map(renderBookingCard)}
                </GridOrEmpty>
              </InfiniteScrollContainer>
            )}
          </div>
        );

      case "unlocks":
        return (
          <div className="space-y-6">
            {newUnlocks && (
              <NotificationIndicator
                message={`${newUnlocksCount} nya upplåsningar tillgängliga!`}
                type="success"
                show={true}
                position="floating"
                count={newUnlocksCount}
              />
            )}
            
            {useVirtualization ? (
              <VirtualizedGrid
                items={data}
                renderItem={renderUnlockCard}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
                itemHeight={200}
              />
            ) : (
              <InfiniteScrollContainer
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
              >
                <GridOrEmpty items={data} type="unlocks">
                  {data.map(renderUnlockCard)}
                </GridOrEmpty>
              </InfiniteScrollContainer>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    data,
    loading,
    hasMore,
    error,
    user?.uid,
    loadMore,
    refreshData,
    onConfirm,
    newDriver,
    newBookings,
    newUnlocks,
    newDriverCount,
    newBookingsCount,
    newUnlocksCount,
    performanceStats,
    renderDriverCard,
    renderPassengerCard,
    renderBookingCard,
    renderUnlockCard
  ]);

  return (
    <div className="transition-all duration-300 ease-in-out">
      {/* Performance Dashboard (en mode développement) */}
      {process.env.NODE_ENV === 'development' && performanceStats && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-blue-600 dark:text-blue-400 font-medium">Cache:</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">{totalCacheSize} entries</span>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Items:</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">{performanceStats.totalItems}</span>
            </div>
            <div>
              <span className="text-purple-600 dark:text-purple-400 font-medium">Pages:</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">{performanceStats.loadedPages}</span>
            </div>
            <div>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Mode:</span>
              <span className="ml-1 text-gray-700 dark:text-gray-300">
                {performanceStats.hasVirtualScroll ? 'Virtual' : 'Normal'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-gray-600 dark:text-gray-400">
            Tab: <span className="font-medium">{activeTab}</span> | 
            Virtual scroll activé automatiquement après 50 éléments
          </div>
        </div>
      )}
      
      {tabContent}
    </div>
  );
}
