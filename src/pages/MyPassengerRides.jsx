import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import TabNav from "../components/ui/TabNav.jsx";
import PassengerActiveBookings from "../components/PassengerActiveBookings.jsx";
import PassengerUnlockedBookings from "../components/PassengerUnlockedBookings.jsx";

export default function MyPassengerRides() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");

  const tabs = [
    {
      id: "bookings",
      label: "Mina bokningar",
      icon: "🎫",
      notificationCount: 0
    },
    {
      id: "unlocked",
      label: "Kontakter",
      icon: "🔓",
      notificationCount: 0
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "bookings":
        return <PassengerActiveBookings />;
      case "unlocked":
        return <PassengerUnlockedBookings />;
      default:
        return <PassengerActiveBookings />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Mina Passagerar-resor
          </h1>
          <p className="text-gray-600 text-lg">
            Hantera dina bokningar som passagerare
          </p>
        </div>

        {/* Tabs Navigation */}
        <TabNav 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-8"
        />

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
