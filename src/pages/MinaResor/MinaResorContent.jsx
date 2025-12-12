import React, { useMemo, useState } from "react";
import { extractCity } from "../../utils/address.js";
import { doc, runTransaction, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { sendNotification } from "../../services/notificationService.js";
import PassengerAdInboxCard from "../../components/PassengerAdInboxCard.jsx";
import UnlockCard from "../../components/UnlockCard.jsx";
import GridOrEmpty from "../../components/ui/GridOrEmpty.jsx";
import NotificationIndicator from "../../components/ui/NotificationIndicator.jsx";

export default function MinaResorContent({
  activeTab,
  user,
  passengerAds = [],
  seatBookings = [],
  unlocks = [],
  unlocksPurchased = [],
  unlocksForMyAds = [],
  bookingsMap = {},
  onConfirm,
  newUnlocks = false,
  newUnlocksCount = 0,
  onUnlockDeleted
}) {
  // Bulk deletion removed for a simpler, safer UX (single delete per card)
  // تحسين الأداء باستخدام useMemo للعمليات المكلفة
  const memoizedContent = useMemo(() => {
    switch (activeTab) {
      case "passenger":
        return (
          <div className="space-y-6">
            {passengerAds.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">📭</p>
                <p className="mt-2">Inga passagerar-annonser.</p>
              </div>
            ) : (
              passengerAds.map((a) => {
                // البحث عن جميع unlocks المرتبطة بهذا الإعلان
                // كل unlock يمثل رسالة من سائق مختلف
                const relatedUnlocks = unlocksForMyAds.filter(u => 
                  u.rideId === a.id && u.counterpartyId === user?.uid
                );
                
                return (
                  <PassengerAdInboxCard
                    key={a.id}
                    ad={a}
                    unlocks={relatedUnlocks}
                    viewerUid={user?.uid}
                    viewerEmail={user?.email}
                    onDelete={() => onConfirm({ mode: "ride", payload: a })}
                  />
                );
              })
            )}
          </div>
        );

      case "unlocks":
        return (
          <div className="space-y-5 sm:space-y-6">
            {newUnlocks && (
              <NotificationIndicator
                message={`${newUnlocksCount} nya kontakter tillgängliga!`}
                type="success"
                show={true}
                position="floating"
                count={newUnlocksCount}
              />
            )}
            <GridOrEmpty items={unlocksPurchased} empty="Du har inte kontaktat några användare ännu." type="unlocks">
              {unlocksPurchased.map((u) => (
                <UnlockCard key={u.id} unlock={u} viewerUid={user.uid} onCardDeleted={onUnlockDeleted} />
              ))}
            </GridOrEmpty>
          </div>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    passengerAds, 
    unlocks,
    unlocksPurchased,
    unlocksForMyAds,
    bookingsMap,
    user?.uid,
    user?.email,
    onConfirm,
    onUnlockDeleted,
    newUnlocks,
    newUnlocksCount
  ]);

  return (
    <div className="transition-all duration-300 ease-in-out space-y-4 sm:space-y-5">
      {memoizedContent}
    </div>
  );
}
