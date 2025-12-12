// src/pages/UserProfilePage.jsx – Version expert harmonisée
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import PageMeta from "../components/PageMeta.jsx";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, runTransaction, deleteDoc, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { updateProfile, getAuth, unlink, signOut, deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaPhone, FaEnvelope, FaEdit, FaSave, FaTimes, FaCheckCircle, FaClock, FaArrowRight } from "react-icons/fa";
import NotificationSettings from "../components/NotificationSettings.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
// import { deleteUserAccountCompletely } from "../services/accountService.js";  // Commenté - non utilisé

export default function UserProfilePage() {
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  // États de base
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info" });
  const [activeTab, setActiveTab] = useState("profile");
  const [hasRides, setHasRides] = useState(false);
  const [confirmDeleteRidesOpen, setConfirmDeleteRidesOpen] = useState(false);
  const [confirmEraseOpen, setConfirmEraseOpen] = useState(false);
  const [deletingRides, setDeletingRides] = useState(false);
  
  // Données de profil
  const [profileData, setProfileData] = useState({
    displayName: "",
    phone: "",
    sharePhone: true,
    shareEmail: true
  });
  
  // États de modification
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Fonction showMessage définie en premier
  const showMessage = useCallback((text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text, type: "info" }), 5000);
  }, []);

  // Vérifier les messages de succès depuis la navigation
  useEffect(() => {
    if (location.state?.message) {
      showMessage(location.state.message, location.state.messageType || "success");
      // Nettoyer le state pour éviter la répétition
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, showMessage]);

  // Charger les données utilisateur
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const userData = {
            displayName: user.displayName || data.displayName || "",
            phone: user.phoneNumber || data.phone || "",
            sharePhone: data.sharePhone !== false,
            shareEmail: data.shareEmail !== false,
            
          };
          setProfileData(userData);
          setEditData(userData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        showMessage("Kunde inte ladda användardata", "error");
      }
    };

    loadUserData();
  }, [user?.uid, user?.displayName, user?.phoneNumber, db, showMessage]);

  // Check if user still has rides
  const refreshHasRides = useCallback(async () => {
    try {
      if (!user?.uid) { setHasRides(false); return; }
      const snap = await getDocs(query(collection(db, "rides"), where("userId", "==", user.uid), limit(1)));
      setHasRides(!snap.empty);
    } catch {
      // If uncertain, require deletion step
      setHasRides(true);
    }
  }, [db, user?.uid]);

  useEffect(() => {
    refreshHasRides();
  }, [refreshHasRides]);

  // Live-subscribe to rides presence to gate buttons robustly
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "rides"), where("userId", "==", user.uid), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      setHasRides(!snap.empty);
    }, () => {
      // On error, be conservative: require ride deletion step
      setHasRides(true);
    });
    return () => unsub();
  }, [db, user?.uid]);

  // Sauvegarder les modifications de profil
  const handleSaveProfile = useCallback(async () => {
    if (!user?.uid || loading) return;

    setLoading(true);
    try {
      // Mettre à jour le display name dans Firebase Auth si changé
      if (editData.displayName !== profileData.displayName) {
        await updateProfile(user, { displayName: editData.displayName });
      }

      // Mettre à jour les données Firestore
      await updateDoc(doc(db, "users", user.uid), {
        displayName: editData.displayName,
        phone: editData.phone.trim(),
        sharePhone: editData.sharePhone,
        shareEmail: editData.shareEmail,
        updatedAt: Date.now()
      });
      
      setProfileData(editData);
      setIsEditing(false);
      showMessage("Profil uppdaterad framgångsrikt!", "success");
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage("Kunde inte spara profil", "error");
    } finally {
      setLoading(false);
    }
  }, [user, loading, editData, profileData, db, showMessage]);

  // Annuler les modifications
  const handleCancelEdit = useCallback(() => {
    setEditData(profileData);
    setIsEditing(false);
  }, [profileData]);

  // Changer le numéro de téléphone
  const handleChangePhone = useCallback(() => {
    navigate("/change-phone", { 
      state: { 
        phone: profileData.phone,
        userId: user?.uid,
        returnPath: "/user-profile"
      } 
    });
  }, [navigate, profileData.phone, user?.uid]);

  // Verifiera telefon (återvänd till inställningar)
  const handleVerifyPhone = useCallback(() => {
    navigate(`/verify-phone?return=${encodeURIComponent('/user-profile')}`);
  }, [navigate]);

  // Supprimer le numéro de téléphone (unlink provider + clear Firestore)
  const handleRemovePhone = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const auth = getAuth();
      // Unlink phone provider if linked
      try { await unlink(auth.currentUser, 'phone'); } catch {}
      // Clear Firestore phone fields
      await updateDoc(doc(db, "users", user.uid), {
        phone: null,
        phoneVerified: false,
        updatedAt: Date.now()
      });
      setProfileData((p) => ({ ...p, phone: "" }));
      setEditData((p) => ({ ...p, phone: "" }));
      showMessage("Telefonnummer borttaget", "success");
    } catch (e) {
      console.error("Remove phone error:", e);
      showMessage("Kunde inte ta bort telefonnummer", "error");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, db, showMessage]);

  // Delete all my rides first (driver-like deletion)
  const handleDeleteAllRides = useCallback(async () => {
    if (!user?.uid || deletingRides) return;
    setDeletingRides(true);
    try {
      const uid = user.uid;
      const ridesSnap = await getDocs(query(collection(db, "rides"), where("userId", "==", uid)));
      for (const rideDoc of ridesSnap.docs) {
        try {
          await runTransaction(db, async (tx) => {
            const bSnap = await getDocs(query(collection(db, "bookings"), where("rideId", "==", rideDoc.id)));
            bSnap.forEach((d) => tx.delete(d.ref));
            tx.delete(rideDoc.ref);
          });
        } catch (e) {
          // fallback to direct ride delete
          try { await deleteDoc(rideDoc.ref); } catch {}
        }
      }
      await refreshHasRides();
      showMessage("Alla dina resor har raderats.", "success");
    } catch (e) {
      console.error("Delete all rides error:", e);
      showMessage("Kunde inte radera alla resor. Försök igen.", "error");
    } finally {
      setDeletingRides(false);
      setConfirmDeleteRidesOpen(false);
    }
  }, [db, user?.uid, deletingRides, refreshHasRides, showMessage]);

  // Perform final erase (requires no rides remaining)
  const performEraseAndLogout = useCallback(async () => {
    if (!user?.uid || loading) return;
    setLoading(true);
    try {
      const auth = getAuth();
      const uid = user.uid;
      
      // Ensure no rides remain (hard check)
      const checkSnap = await getDocs(query(collection(db, "rides"), where("userId", "==", uid), limit(1)));
      if (!checkSnap.empty) {
        showMessage("Radera dina resor först.", "error");
        setLoading(false);
        setConfirmEraseOpen(false);
        return;
      }
      
      // Försök 1: anropa server-funktion som anonymiserar allt ثم يحذف Auth
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const res = await fetch("https://europe-west1-vagvanner.cloudfunctions.net/eraseUserDataNow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userToken: idToken })
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "erase_failed");
        }
        // Server har raderat/auth. Logga ut lokalt och gå till startsidan
        try { await signOut(auth); } catch {}
        window.location.replace("/?account=deleted");
        return;
      } catch (serverErr) {
        console.warn("Server erase fallback → lokal rensning", serverErr && serverErr.message);
      }

      // Försök 2 (fallback): lokal sanering minimal om servern inte nåddes
      const userEmail = user.email || null;

      await updateDoc(doc(db, "users", uid), {
        displayName: "",
        phone: null,
        phoneVerified: false,
        sharePhone: false,
        shareEmail: false,
        email: null,
        updatedAt: Date.now()
      });
      try {
        const { deleteDoc: fsDeleteDoc } = await import("firebase/firestore");
        await fsDeleteDoc(doc(db, "users", uid));
      } catch {}

      try { await unlink(getAuth().currentUser, 'phone'); } catch {}
      try { await updateProfile(getAuth().currentUser, { displayName: "" }); } catch {}
      if (userEmail) {
        try {
          const { deleteDoc: fsDeleteDoc } = await import("firebase/firestore");
          await fsDeleteDoc(doc(db, "user_fcm_by_email", userEmail));
        } catch {}
      }

      try {
        await deleteUser(getAuth().currentUser);
        window.location.replace("/?account=deleted");
        return;
      } catch (err) {
        if (err && err.code === 'auth/requires-recent-login') {
          try {
            const provider = new GoogleAuthProvider();
            await reauthenticateWithPopup(getAuth().currentUser, provider);
            await deleteUser(getAuth().currentUser);
            window.location.replace("/?account=deleted");
            return;
          } catch {}
          showMessage("För att slutföra raderingen, logga in igen och tryck på knappen en gång till.", "error");
          try { await signOut(getAuth()); } catch {}
          setLoading(false);
          return;
        }
      }

      try { await signOut(getAuth()); } catch {}
      window.location.replace("/");
    } catch (e) {
      console.error("Erase+Logout error:", e);
      showMessage("Kunde inte radera uppgifter. Försök igen.", "error");
      setLoading(false);
    } finally {
      setConfirmEraseOpen(false);
    }
  }, [user?.uid, db, loading, showMessage]);

  if (!user) {
    return (
      <>
        <PageMeta 
          title="Logga in - VägVänner"
          description="Logga in för att komma åt din profil och hantera dina resor"
          noindex={true}
        />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Logga in</h1>
            <p className="text-gray-600">Du måste logga in för att se din profil.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta 
        title="Min profil - VägVänner"
        description="Hantera dina personliga uppgifter och inställningar för ditt VägVänner-konto"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200">
          <div className="px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-dark rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData.displayName || "Användarprofil"}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : 
            message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : 
            "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Tabs Navigation (privacy tab removed) */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6">
            <nav className="flex space-x-8">
              {[
                { id: "profile", label: "Profil", icon: FaUser }
              ].map(tab => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-sm">
          {activeTab === "profile" && (
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Profilinformation</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors duration-200 shadow-sm"
                  >
                    <FaEdit className="w-4 h-4" />
                    Redigera
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 shadow-sm"
                    >
                      <FaSave className="w-4 h-4" />
                      {loading ? "Sparar..." : "Spara"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                    >
                      <FaTimes className="w-4 h-4" />
                      Avbryt
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visningsnamn</label>
                  <input
                    type="text"
                    value={isEditing ? editData.displayName : profileData.displayName}
                    onChange={(e) => isEditing && setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-brand disabled:bg-gray-100 transition-colors duration-200"
                    placeholder="Ditt namn"
                  />
                </div>

                {/* Email (lecture seule) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-post</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>

                {/* Telefon – verifiera / ändra / ta bort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefonnummer</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={isEditing ? editData.phone : profileData.phone}
                      onChange={(e) => isEditing && setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-brand disabled:bg-gray-100 transition-colors duration-200"
                      placeholder="+46 70 123 45 67"
                    />
                  </div>
                  {/* Telefonåtgärder */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user.phoneNumber ? (
                        <>
                          <FaCheckCircle className="w-4 h-4 text-green-500" title="Verifierat nummer" />
                          <span className="text-sm text-green-600">Verifierat</span>
                        </>
                      ) : (
                        <>
                          <FaClock className="w-4 h-4 text-orange-500" title="Ej verifierat" />
                          <span className="text-sm text-orange-600">Ej verifierat</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {!user.phoneNumber && (
                        <button
                          onClick={handleVerifyPhone}
                          disabled={loading}
                          className="flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 underline transition-colors duration-200"
                        >
                          Verifiera nummer
                        </button>
                      )}
                      <button
                        onClick={handleChangePhone}
                        disabled={loading}
                        className="flex items-center gap-1 text-sm text-brand hover:text-brand-dark underline transition-colors duration-200"
                      >
                        Ändra nummer
                        <FaArrowRight className="w-3 h-3" />
                      </button>
                      {profileData.phone && (
                        <button
                          onClick={handleRemovePhone}
                          disabled={loading}
                          className="text-sm text-rose-600 hover:text-rose-700 underline"
                        >
                          Ta bort
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              
              </div>

              {/* Notification Settings */}
              <NotificationSettings />

              {/* Kontohantering */}
              <div className="pt-4 mt-2 border-t">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Kontohantering</h3>

                {hasRides && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    Du har aktiva resor. Detta är ett krav: radera dina resor först för att kunna radera ditt konto.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfirmDeleteRidesOpen(true)}
                    disabled={deletingRides || loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingRides ? "Raderar resor…" : "Radera alla mina resor"}
                  </button>

                  <button
                    onClick={() => !hasRides && setConfirmEraseOpen(true)}
                    disabled={loading || hasRides}
                    aria-disabled={loading || hasRides}
                    title={hasRides ? "Radera dina resor först" : ""}
                    className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${hasRides ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                  >
                    {loading ? "Arbetar…" : "Radera mina uppgifter och logga ut"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* privacy tab removed */}
        </div>

        {/* Confirm delete rides */}
        <ConfirmModal
          open={confirmDeleteRidesOpen}
          title="Radera alla dina resor?"
          body="Detta tar bort samtliga resor och deras bokningar. Denna åtgärd kan inte ångras."
          onOk={handleDeleteAllRides}
          onCancel={() => setConfirmDeleteRidesOpen(false)}
          type="danger"
        />

        {/* Confirm final erase */}
        <ConfirmModal
          open={confirmEraseOpen}
          title="Radera dina uppgifter?"
          body="Detta tar bort dina uppgifter från profilen och loggar ut dig."
          onOk={performEraseAndLogout}
          onCancel={() => setConfirmEraseOpen(false)}
          type="warning"
        />
      </div>
    </div>
    </>
  );
}
