import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteUserAccountCompletely } from '../services/accountService';
import ConfirmModal from './ConfirmModal';
import Snackbar from './Snackbar';

const DangerZone = () => {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeleteRequest = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDeletion = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log("Starting account deletion process...");
      const result = await deleteUserAccountCompletely();
      console.log("Account deletion successful:", result);
      
      setSuccess(result.message);
      
      // Force logout and redirect after successful deletion
      console.log("Logging out and redirecting...");
      setTimeout(async () => {
        try {
          // First logout from Firebase
          await logout();
          console.log("Firebase logout successful");
          
          // Clear any local storage or session data
          localStorage.clear();
          sessionStorage.clear();
          
          // Force redirect to home page
          console.log("Redirecting to home page...");
          window.location.replace('/');
        } catch (logoutError) {
          console.error("Logout error:", logoutError);
          // Even if logout fails, redirect anyway
          window.location.replace('/');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Omdirigerar för verifiering')) {
        setError('Du kommer att omdirigeras till Google för verifiering. Kom tillbaka efter inloggning och försök igen.');
      } else if (error.message.includes('popup')) {
        setError('Webbläsaren blockerade popup-fönstret. Tillåt popups för denna webbplats och försök igen, eller använd en annan webbläsare.');
      } else if (error.message.includes('verifiera')) {
        setError('Kunde inte verifiera din identitet. Logga ut och in igen, sedan försök på nytt.');
      } else if (error.message.includes('säkerhetsregler')) {
        setError('Problem med databasrättigheter. Kontrollera dina Firestore-säkerhetsregler.');
      } else {
        setError(error.message || 'Ett oväntat fel uppstod. Försök igen.');
      }
    } finally {
      setIsLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-red-200 dark:border-red-900/50">
      <Snackbar text={error} type="error" onClear={() => setError('')} />
      <Snackbar text={success} type="success" onClear={() => setSuccess('')} />

      <ConfirmModal
        open={confirmOpen}
        title="Radera konto permanent?"
        body="Detta kommer att permanent radera alla dina data, inklusive resor, bokningar och profil. Denna åtgärd kan inte ångras."
        onOk={handleConfirmDeletion}
        onCancel={() => setConfirmOpen(false)}
        type="danger"
      />

      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        När du raderar ditt konto finns det ingen återvändo. Vänligen var säker.
      </p>
      
      <div className="mt-4 space-y-3">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Vad som kommer att raderas:</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>• Din användarprofil och all personlig information</li>
            <li>• Alla dina resor och annonser</li>
            <li>• Alla dina bokningar</li>
            <li>• Alla kontaktupplåsningar och betalningar</li>
            <li>• Ditt autentiseringskonto (Google)</li>
          </ul>
        </div>
        
        <button
          onClick={handleDeleteRequest}
          disabled={isLoading}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? 'Raderar konto...' : 'Radera mitt konto permanent'}
        </button>
      </div>
    </div>
  );
};

export default DangerZone; 