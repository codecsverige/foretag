# Changelog - BokaNära

## Version 1.1.0 - 2024-12-24

### 🔧 Corrections et Optimisations

#### Images
- **CompanyCard.tsx**: Ajout de `loading="lazy"` et `unoptimized` pour les images Firebase Storage
- **foretag/[id]/page.tsx**: Correction du chargement des images Firebase avec `unoptimized`

#### Performance
- **page.tsx (Homepage)**: 
  - Remplacement de `window.location.href` par `router.push()` pour navigation client-side plus rapide
  - Import dynamique de `CompanyCard` avec lazy loading
  - Utilisation de `useCallback` pour optimiser les re-renders

#### Base de données
- **firestore.indexes.json**: Ajout de l'index manquant `status + createdAt` pour la requête homepage

### 📁 Fichiers modifiés
- `components/company/CompanyCard.tsx`
- `app/page.tsx`
- `app/foretag/[id]/page.tsx`
- `firestore.indexes.json`

### 🚀 Déploiement requis
```bash
# Déployer les index Firestore
firebase deploy --only firestore:indexes

# Redémarrer le serveur de développement
npm run dev
```
