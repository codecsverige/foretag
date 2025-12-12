import React from "react";
import PropTypes from "prop-types";

/**
 * NetworkError - Composant d'erreur réseau amélioré
 * 
 * @param {string} message - Message d'erreur personnalisé
 * @param {Function} onRetry - Fonction de retry
 * @param {string} type - Type d'erreur (network, data, payment)
 */
export default function NetworkError({ 
  message = "Problème de connexion réseau", 
  onRetry, 
  type = "network" 
}) {
  const getIcon = () => {
    switch (type) {
      case "payment":
        return "💳";
      case "data":
        return "📊";
      case "network":
      default:
        return "🌐";
    }
  };

  const getTitle = () => {
    switch (type) {
      case "payment":
        return "Problème de paiement";
      case "data":
        return "Erreur de données";
      case "network":
      default:
        return "Erreur de connexion";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "payment":
        return "Le paiement n'a pas pu être traité. Vérifiez votre connexion et réessayez.";
      case "data":
        return "Impossible de charger les données. Vérifiez votre connexion et réessayez.";
      case "network":
      default:
        return "Vérifiez votre connexion internet et réessayez.";
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white rounded-xl shadow-lg p-6 border border-red-200">
      <div className="text-center">
        {/* Icône */}
        <div className="text-4xl mb-4" role="img" aria-label="Error icon">
          {getIcon()}
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-red-600 mb-2">
          {getTitle()}
        </h2>

        {/* Message personnalisé */}
        {message && (
          <p className="text-gray-700 mb-3 font-medium">
            {message}
          </p>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6">
          {getDescription()}
        </p>

        {/* Bouton de retry */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <span>🔄</span>
            <span>Réessayer</span>
          </button>
        )}

        {/* Bouton de retour */}
        <button
          onClick={() => window.history.back()}
          className="mt-3 text-gray-500 hover:text-gray-700 underline text-sm transition-colors"
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

NetworkError.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  type: PropTypes.oneOf(["network", "data", "payment"])
}; 