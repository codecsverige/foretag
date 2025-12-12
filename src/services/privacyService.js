import { doc, updateDoc, getDoc, writeBatch, query, where, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebase.js";



/**
 * Service pour gérer les paramètres de confidentialité et le respect du GDPR
 */
export class PrivacyService {
  
  /**
   * Charger les paramètres de confidentialité d'un utilisateur
   */
  static async loadPrivacySettings(userId) {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          sharePhone: data.sharePhone !== false,
          shareEmail: data.shareEmail !== false,
          allowNotifications: data.allowNotifications !== false,
          allowMarketing: data.allowMarketing === true,
          dataRetention: data.dataRetention || "1year",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }
      
      // Paramètres par défaut si l'utilisateur n'existe pas
      return {
        sharePhone: true,
        shareEmail: true,
        allowNotifications: true,
        allowMarketing: false,
        dataRetention: "1year"
      };
    } catch (error) {
      console.error("Error loading privacy settings:", error);
      throw new Error("Kunde inte ladda sekretessinställningar");
    }
  }

  /**
   * Sauvegarder les paramètres de confidentialité
   */
  static async savePrivacySettings(userId, settings) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...settings,
        updatedAt: Date.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error saving privacy settings:", error);
      throw new Error("Kunde inte spara sekretessinställningar");
    }
  }

  /**
   * Exporter toutes les données d'un utilisateur (GDPR)
   */
  static async exportUserData(userId, userAuth) {
    try {
      const data = {
        user: {
          uid: userId,
          email: userAuth.email,
          displayName: userAuth.displayName,
          phoneNumber: userAuth.phoneNumber
        },
        rides: [],
        bookings: [],
        notifications: [],
        exports: {
          timestamp: new Date().toISOString(),
          version: "1.0",
          gdprCompliant: true
        }
      };

      // Récupérer les rides
      const ridesQuery = query(collection(db, "rides"), where("userId", "==", userId));
      const ridesSnap = await getDocs(ridesQuery);
      data.rides = ridesSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        exportedAt: new Date().toISOString()
      }));

      // Récupérer les bookings
      const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", userId));
      const bookingsSnap = await getDocs(bookingsQuery);
      data.bookings = bookingsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        exportedAt: new Date().toISOString()
      }));

      // Récupérer les notifications
      const notificationsQuery = query(collection(db, "notifications"), where("userEmail", "==", userAuth.email));
      const notificationsSnap = await getDocs(notificationsQuery);
      data.notifications = notificationsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        exportedAt: new Date().toISOString()
      }));

      // Récupérer les données utilisateur
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        data.userData = {
          ...userSnap.data(),
          exportedAt: new Date().toISOString()
        };
      }

      return data;
    } catch (error) {
      console.error("Error exporting user data:", error);
      throw new Error("Kunde inte exportera användardata");
    }
  }

  /**
   * Anonymiser les données d'un utilisateur (GDPR)
   */
  static async anonymizeUserData(userId) {
    try {
      const batch = writeBatch(db);

      // Anonymiser les rides
      const ridesQuery = query(collection(db, "rides"), where("userId", "==", userId));
      const ridesSnap = await getDocs(ridesQuery);
      ridesSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          userId: "ANONYMIZED",
          driverName: "Anonym",
          driverEmail: "anonym@example.com",
          driverPhone: "",
          anonymizedAt: Date.now()
        });
      });

      // Anonymiser les bookings
      const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", userId));
      const bookingsSnap = await getDocs(bookingsQuery);
      bookingsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          userId: "ANONYMIZED",
          passengerName: "Anonym",
          passengerEmail: "anonym@example.com",
          passengerPhone: "",
          anonymizedAt: Date.now()
        });
      });

      // Anonymiser le profil utilisateur
      const userRef = doc(db, "users", userId);
      batch.update(userRef, {
        email: "anonym@example.com",
        phone: "",
        displayName: "Anonym",
        anonymizedAt: Date.now()
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Error anonymizing user data:", error);
      throw new Error("Kunde inte anonymisera användardata");
    }
  }

  /**
   * Supprimer complètement les données d'un utilisateur (GDPR)
   */
  static async deleteUserData(userId, userEmail) {
    try {
      const batch = writeBatch(db);

      // Supprimer toutes les rides
      const ridesQuery = query(collection(db, "rides"), where("userId", "==", userId));
      const ridesSnap = await getDocs(ridesQuery);
      ridesSnap.docs.forEach(doc => batch.delete(doc.ref));

      // Supprimer tous les bookings
      const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", userId));
      const bookingsSnap = await getDocs(bookingsQuery);
      bookingsSnap.docs.forEach(doc => batch.delete(doc.ref));

      // Supprimer les notifications
      const notificationsQuery = query(collection(db, "notifications"), where("userEmail", "==", userEmail));
      const notificationsSnap = await getDocs(notificationsQuery);
      notificationsSnap.docs.forEach(doc => batch.delete(doc.ref));

      // Supprimer le document utilisateur
      const userRef = doc(db, "users", userId);
      batch.delete(userRef);

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw new Error("Kunde inte radera användardata");
    }
  }

  /**
   * Vérifier si un utilisateur peut partager ses informations selon ses paramètres
   */
  static canShareInfo(privacySettings, infoType) {
    switch (infoType) {
      case "phone":
        return privacySettings.sharePhone;
      case "email":
        return privacySettings.shareEmail;
      case "both":
        return privacySettings.sharePhone && privacySettings.shareEmail;
      default:
        return false;
    }
  }

  /**
   * Obtenir les informations partageables d'un utilisateur
   */
  static getShareableInfo(user, privacySettings) {
    return {
      phone: privacySettings.sharePhone ? user.phoneNumber : null,
      email: privacySettings.shareEmail ? user.email : null,
      name: user.displayName || "Anonym"
    };
  }

  /**
   * Valider les paramètres de confidentialité
   */
  static validatePrivacySettings(settings) {
    const errors = [];
    
    if (typeof settings.sharePhone !== "boolean") {
      errors.push("sharePhone must be a boolean");
    }
    
    if (typeof settings.shareEmail !== "boolean") {
      errors.push("shareEmail must be a boolean");
    }
    
    if (typeof settings.allowNotifications !== "boolean") {
      errors.push("allowNotifications must be a boolean");
    }
    
    if (typeof settings.allowMarketing !== "boolean") {
      errors.push("allowMarketing must be a boolean");
    }
    
    if (!["1year", "2years", "forever"].includes(settings.dataRetention)) {
      errors.push("dataRetention must be one of: 1year, 2years, forever");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PrivacyService; 