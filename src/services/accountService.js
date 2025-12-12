import {
  getFirestore,
  getAuth,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  GoogleAuthProvider,
  deleteUser,
  getRedirectResult,
} from "firebase/auth";
import { db } from "../firebase/firebase.js";
import {
  
  writeBatch,
  query,
  collection,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

/**
 * Re-authenticates the current user using Google.
 * First tries popup, then falls back to redirect if popup fails.
 * @returns {Promise<void>}
 * @throws {Error} If re-authentication fails.
 */
async function reauthenticateWithGoogle() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Ingen användare är inloggad.");
  }

  const provider = new GoogleAuthProvider();
  
  // First, check if we're returning from a redirect
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Redirect re-authentication successful");
      return;
    }
  } catch (error) {
    console.error("Redirect result error:", error);
  }

  // Try popup first
  try {
    console.log("Attempting popup re-authentication...");
    await reauthenticateWithPopup(user, provider);
    console.log("Popup re-authentication successful");
  } catch (error) {
    console.error("Popup re-authentication failed:", error);
    
    // If popup fails due to blocking or user cancellation, try redirect
    if (error.code === 'auth/popup-closed-by-user' || 
        error.code === 'auth/popup-blocked' || 
        error.code === 'auth/cancelled-popup-request') {
      
      console.log("Popup failed, trying redirect method...");
      try {
        await reauthenticateWithRedirect(user, provider);
        // Note: This will redirect the page, so we won't reach the next line
        // The user will need to come back and try again
        throw new Error("Omdirigerar för verifiering. Kom tillbaka efter inloggning och försök igen.");
      } catch (redirectError) {
        console.error("Redirect re-authentication failed:", redirectError);
        throw new Error("Kunde inte verifiera din identitet. Kontrollera dina webbläsarinställningar och försök igen.");
      }
    }
    
    // For other errors, provide specific messages
    if (error.code === 'auth/popup-blocked') {
      throw new Error("Webbläsaren blockerade popup-fönstret. Vänligen tillåt popups för den här webbplatsen och försök igen.");
    }
    throw new Error("Kunde inte verifiera din identitet. Logga in igen och försök på nytt.");
  }
}

/**
 * Deletes all data associated with the current user from Firestore and Auth.
 * This includes their user profile, rides, and bookings.
 * @returns {Promise<{success: boolean, message: string}>}
 * @throws {Error} If any step of the deletion process fails.
 */
export async function deleteUserAccountCompletely() {
  const auth = getAuth();
  const initialUser = auth.currentUser;
  
  if (!initialUser) {
    throw new Error("Ingen användare är inloggad.");
  }

  console.log("=== BÖRJAR KONTORADERING ===");
  console.log("Användar ID:", initialUser.uid);
  console.log("Användar email:", initialUser.email);

  // 1. Re-authenticate to confirm user identity
  console.log("Steg 1: Påbörjar återverifiering...");
  await reauthenticateWithGoogle();
  console.log("Steg 1: Återverifiering lyckades.");

  // After re-auth, user object might be updated. It's safer to get it again.
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Användarsessionen är ogiltig efter verifiering. Ladda om sidan.");
  }
  
  // Verify user is still the same
  if (user.uid !== initialUser.uid) {
    throw new Error("Användar-ID matchar inte efter verifiering. Försök igen.");
  }
  
  console.log("Användarverifiering bekräftad:", user.uid);
  
  
  const uid = user.uid;
  const batch = writeBatch(db);

  // 2. Find and stage all user data for deletion from Firestore
  console.log("Steg 2: Hittar och förbereder användardata för radering...");
  
  let totalDocumentsToDelete = 0;
  
  try {
    // a. User profile document - check if it exists first
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      batch.delete(userDocRef);
      totalDocumentsToDelete++;
      console.log("- Användarprofil hittad och markerad för radering");
    } else {
      console.log("- Användarprofil finns inte i databasen");
    }

    // b. User's created rides
    const ridesQuery = query(collection(db, "rides"), where("userId", "==", uid));
    const ridesSnapshot = await getDocs(ridesQuery);
    ridesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      totalDocumentsToDelete++;
    });
    console.log(`- Hittade ${ridesSnapshot.size} resor att radera.`);

    // c. User's bookings
    const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", uid));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    bookingsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      totalDocumentsToDelete++;
    });
    console.log(`- Hittade ${bookingsSnapshot.size} bokningar att radera.`);
    
    // d. Bookings made ON the user's rides by others
    const counterpartyBookingsQuery = query(collection(db, "bookings"), where("counterpartyId", "==", uid));
    const counterpartyBookingsSnapshot = await getDocs(counterpartyBookingsQuery);
    counterpartyBookingsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      totalDocumentsToDelete++;
    });
    console.log(`- Hittade ${counterpartyBookingsSnapshot.size} motpartsbokningar att radera.`);

    // e. Contact unlock data
    const contactUnlockQuery = query(collection(db, "contact_unlock"), where("userId", "==", uid));
    const contactUnlockSnapshot = await getDocs(contactUnlockQuery);
    contactUnlockSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      totalDocumentsToDelete++;
    });
    console.log(`- Hittade ${contactUnlockSnapshot.size} kontaktupplåsningar att radera.`);

    console.log(`Totalt antal dokument att radera: ${totalDocumentsToDelete}`);
    
  } catch(error) {
      console.error("Fel vid sökning av Firestore-dokument:", error);
      throw new Error("Kunde inte hämta dina data för radering. Kontrollera dina säkerhetsregler i Firestore.");
  }

  // 3. Commit the batch deletion from Firestore
  console.log("Steg 3: Raderar data från databasen...");
  try {
    if (totalDocumentsToDelete > 0) {
      await batch.commit();
      console.log("Steg 3: Databasdata raderad framgångsrikt.");
    } else {
      console.log("Steg 3: Inga dokument att radera från databasen.");
    }
  } catch (error) {
    console.error("Fel vid radering av databasdata:", error);
    throw new Error("Kunde inte radera data från databasen. Kontrollera dina säkerhetsregler.");
  }

  // 4. Delete the user from Firebase Authentication
  console.log("Steg 4: Raderar autentiseringskonto...");
  try {
    // Final verification that user still exists
    const finalUser = auth.currentUser;
    if (!finalUser || finalUser.uid !== uid) {
      throw new Error("Användaren finns inte längre. Kontot kan redan ha raderats.");
    }
    
    await deleteUser(finalUser);
    console.log("Steg 4: Autentiseringskonto raderat framgångsrikt.");
  } catch (error) {
    console.error("Error deleting user from Auth:", error);
    if (error.code === 'auth/user-not-found') {
      console.log("Användaren finns inte längre i Auth - kan redan ha raderats.");
    } else {
      throw new Error("Kunde inte radera ditt autentiseringskonto. Vänligen kontakta support för att slutföra raderingen.");
    }
  }
  
  console.log("=== KONTORADERING SLUTFÖRD ===");
  return { success: true, message: "Ditt konto och all din data har raderats permanent." };
} 