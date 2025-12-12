import React from "react";
import { FaBell, FaCheckCircle } from "react-icons/fa";

export default function CompactMyRidesHeader({ 
  newDriverCount = 0, 
  newBookingsCount = 0, 
  newUnlocksCount = 0 
}) {
  const totalNewCount = newDriverCount + newBookingsCount + newUnlocksCount;
  const hasNewActivities = totalNewCount > 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-4 mb-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        {/* Title compact */}
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold">Mina Resor</h1>
            <p className="text-sm opacity-90">Hantera dina resor och bokningar</p>
          </div>
        </div>

        {/* Notification indicator compact */}
        <div className="flex items-center gap-2">
          {hasNewActivities ? (
            <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-3 py-2">
              <FaBell className="w-4 h-4 text-yellow-300 animate-pulse" />
              <div className="text-sm font-bold">
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {totalNewCount}
                </span>
                <span className="ml-2 text-xs">nya</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-full px-3 py-2">
              <FaCheckCircle className="w-4 h-4 text-green-300" />
              <span className="text-xs opacity-75">Allt uppdaterat</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed breakdown when there are notifications */}
      {hasNewActivities && (
        <div className="mt-3 pt-3 border-t border-white border-opacity-20">
          <div className="grid grid-cols-3 gap-4 text-center">
            {newDriverCount > 0 && (
              <div className="bg-white bg-opacity-10 rounded-lg p-2">
                <div className="text-xs opacity-75">Förar-resor</div>
                <div className="text-lg font-bold">{newDriverCount}</div>
              </div>
            )}
            {newBookingsCount > 0 && (
              <div className="bg-white bg-opacity-10 rounded-lg p-2">
                <div className="text-xs opacity-75">Bokningar</div>
                <div className="text-lg font-bold">{newBookingsCount}</div>
              </div>
            )}
            {newUnlocksCount > 0 && (
              <div className="bg-white bg-opacity-10 rounded-lg p-2">
                <div className="text-xs opacity-75">Upplåsningar</div>
                <div className="text-lg font-bold">{newUnlocksCount}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
