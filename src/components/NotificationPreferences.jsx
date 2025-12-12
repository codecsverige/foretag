import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

const NotificationPreferences = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    newBookings: true,
    bookingUpdates: true,
    rideReminders: true,
    unlockNotifications: true,
    marketingEmails: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId) return;

      try {
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setPreferences({
            newBookings: data.newBookings !== false,
            bookingUpdates: data.bookingUpdates !== false,
            rideReminders: data.rideReminders !== false,
            unlockNotifications: data.unlockNotifications !== false,
            marketingEmails: data.marketingEmails === true,
            pushNotifications: data.pushNotifications !== false,
            emailNotifications: data.emailNotifications !== false,
            smsNotifications: data.smsNotifications === true
          });
        }
      } catch (error) {
        console.error("Error loading notification preferences:", error);
      }
    };

    loadPreferences();
  }, [userId]);

  const savePreferences = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...preferences,
        updatedAt: Date.now()
      });

      setMessage("Inställningar sparade!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      setMessage("Kunde inte spara inställningar");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Notifikationsinställningar</h3>
        <p className="text-blue-700 text-sm">
          Kontrollera vilka notifikationer du vill få.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes("sparade") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-700">Nya bokningar</label>
              <p className="text-sm text-gray-500">När någon bokar din resa</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.newBookings}
                onChange={() => handleToggle("newBookings")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-700">Bokningsuppdateringar</label>
              <p className="text-sm text-gray-500">När bokningar ändras eller avbryts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.bookingUpdates}
                onChange={() => handleToggle("bookingUpdates")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-700">Resepåminnelser</label>
              <p className="text-sm text-gray-500">Påminnelser innan resan</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.rideReminders}
                onChange={() => handleToggle("rideReminders")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-700">Upplåsningsnotifikationer</label>
              <p className="text-sm text-gray-500">När någon låser upp kontakt</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.unlockNotifications}
                onChange={() => handleToggle("unlockNotifications")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-800 mb-4">Leveransmetoder</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="font-medium text-gray-700">Push-notifikationer</label>
                <p className="text-sm text-gray-500">I webbläsaren</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={() => handleToggle("pushNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="font-medium text-gray-700">E-post</label>
                <p className="text-sm text-gray-500">E-postmeddelanden</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="font-medium text-gray-700">SMS</label>
                <p className="text-sm text-gray-500">Textmeddelanden</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={() => handleToggle("smsNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <label className="font-medium text-gray-700">Marknadsföring</label>
              <p className="text-sm text-gray-500">Erbjudanden och nyheter</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.marketingEmails}
                onChange={() => handleToggle("marketingEmails")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <button
          onClick={savePreferences}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Sparar..." : "Spara inställningar"}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences; 