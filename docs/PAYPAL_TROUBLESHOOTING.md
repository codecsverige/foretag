# Guide de Dépannage PayPal

## Problèmes Courants et Solutions

### 1. Erreur 400 - PayPal SDK ne se charge pas

**Symptômes :**
- Erreur 400 lors du chargement du script PayPal
- Bouton PayPal ne s'affiche pas
- Messages d'erreur dans la console

**Solutions :**

#### A. Vérifier la configuration d'environnement
```bash
# Créer un fichier .env.local dans la racine du projet
REACT_APP_PAYPAL_CLIENT_ID=votre_client_id_ici
NODE_ENV=development
```

#### B. Utiliser le bon Client ID
- En développement : Utilisez un Client ID de test PayPal
- En production : Utilisez un Client ID de production PayPal

#### C. Vérifier les paramètres PayPal
```javascript
// Configuration recommandée pour localhost
const paypalOptions = {
  "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID,
  currency: "SEK",
  intent: "capture" // Utiliser 'capture' en développement
};
```

### 2. Problèmes de Callback Refs

**Symptômes :**
- Avertissements React dans la console
- "Unexpected return value from a callback ref"

**Solution :**
```javascript
// ❌ Incorrect
const observeCard = useCallback(el => {
  if (!el) return;
  visObserver.current.observe(el);
  return () => visObserver.current.unobserve(el); // Ne pas retourner de fonction
}, []);

// ✅ Correct
const observeCard = useCallback(el => {
  if (!el) return;
  visObserver.current.observe(el);
  // Ne pas retourner de fonction
}, []);
```

### 3. Problèmes de Configuration PayPal

#### A. Vérifier les variables d'environnement
```bash
# Dans votre terminal
echo $REACT_APP_PAYPAL_CLIENT_ID
```

#### B. Redémarrer le serveur de développement
```bash
npm start
```

#### C. Vider le cache du navigateur
- Ctrl+Shift+R (Windows/Linux)
- Cmd+Shift+R (Mac)

### 4. Test de la Configuration

Utilisez le composant `PayPalDebug` pour diagnostiquer :

```jsx
import PayPalDebug from './components/PayPalDebug';

// Dans votre page de test
<PayPalDebug />
```

### 5. Configuration Recommandée

#### Pour le Développement (localhost)
```javascript
{
  "client-id": "votre_client_id_test",
  currency: "SEK",
  intent: "capture"
}
```

#### Pour la Production
```javascript
{
  "client-id": "votre_client_id_production",
  currency: "SEK",
  intent: "authorize"
}
```

### 6. Étapes de Dépannage

1. **Vérifier les variables d'environnement**
2. **Redémarrer le serveur de développement**
3. **Tester avec PayPalDebug**
4. **Vérifier la console pour les erreurs**
5. **Tester avec un montant minimal (1 SEK)**

### 7. Ressources Utiles

- [Documentation PayPal React](https://developer.paypal.com/docs/business/javascript-sdk/javascript-sdk-configuration/)
- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
- [PayPal Sandbox](https://www.sandbox.paypal.com/)

### 8. Contact Support

Si les problèmes persistent :
1. Vérifiez les logs de la console
2. Testez avec le composant PayPalDebug
3. Vérifiez votre configuration PayPal
4. Contactez le support PayPal si nécessaire 