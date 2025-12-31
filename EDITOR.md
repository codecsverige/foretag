# 📝 Guide de l'Éditeur Professionnel

## Vue d'ensemble

L'éditeur en direct permet aux propriétaires d'entreprises de modifier leur page publique de manière intuitive avec prévisualisation en temps réel, sauvegarde automatique et contrôles professionnels.

---

## 🎯 Fonctionnalités Principales

### ✅ Édition en Direct
- Cliquez sur n'importe quelle section pour l'éditer
- Modifications visibles instantanément
- Interface intuitive sans code

### 💾 Sauvegarde Automatique
- Sauvegarde automatique après 1.5 secondes d'inactivité
- Indicateur d'état en temps réel
- Option de sauvegarde manuelle

### 👁️ Mode Prévisualisation
- Voir exactement ce que vos clients verront
- Retour facile à l'édition
- Aucune modification n'affecte la version publiée tant que non sauvegardée

### 🎨 Sections Éditables
1. **Hero** - Images, nom, catégorie, ville
2. **Services** - Ajouter, modifier, supprimer des services
3. **Om oss** - Description de l'entreprise
4. **Kontakt** - Informations de contact et heures d'ouverture

---

## 🚀 Comment Utiliser l'Éditeur

### Accéder à l'Éditeur

1. **Depuis le Dashboard**:
   ```
   Dashboard → Mes Entreprises → Bouton "Redigera"
   ```

2. **URL directe**:
   ```
   /foretag/[company-id]/edit
   ```

### Interface de l'Éditeur

```
┌─────────────────────────────────────────────────────────┐
│  ← Tillbaka  |  Redigera din sida  |  Status  |  Actions │ ← Toolbar
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Section Hero - Cliquez pour éditer]                    │
│                                                           │
│  [Section Services - Cliquez pour éditer]                │
│                                                           │
│  [Section Om oss - Cliquez pour éditer]                  │
│                                                           │
│  [Section Kontakt - Cliquez pour éditer]                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
                                                    │
                                        Sidebar → ┌─┴──────┐
                                                  │Settings│
                                                  │Visibility│
                                                  └────────┘
```

---

## 📐 Structure des Composants

### Architecture Modulaire

```
app/foretag/[id]/edit/page.tsx          # Route principale
└── components/editor/
    ├── LiveEditor.tsx                   # Orchestrateur principal
    ├── EditToolbar.tsx                  # Barre d'outils supérieure
    ├── EditSidebar.tsx                  # Panneau latéral
    ├── PreviewMode.tsx                  # Mode prévisualisation
    └── sections/
        ├── EditableHero.tsx             # Section Hero
        ├── EditableServices.tsx         # Section Services
        ├── EditableAbout.tsx            # Section À propos
        └── EditableContact.tsx          # Section Contact
```

### Flux de Données

```
Page (authentification)
    ↓
LiveEditor (état global)
    ↓
├── EditToolbar (actions)
├── EditSidebar (paramètres)
└── Sections éditables (modifications locales)
    ↓
Sauvegarde auto → Firestore
```

---

## 🔧 Modification des Sections

### 1. Section Hero

**Éléments modifiables**:
- ✏️ Nom de l'entreprise
- 📷 Images (upload, suppression)
- 🏷️ Catégorie
- 📍 Ville

**Actions**:
```typescript
// Upload d'images
<input type="file" multiple accept="image/*" />

// Suppression d'image
handleRemoveImage(index)

// Réorganisation (drag & drop futur)
handleReorderImage(fromIndex, toIndex)
```

### 2. Section Services

**Éléments modifiables**:
- ➕ Ajouter un service
- ✏️ Nom, prix, durée
- 📋 Dupliquer un service
- 🗑️ Supprimer un service

**Actions**:
```typescript
// Ajouter
handleAddService()

// Modifier
handleUpdateService(index, field, value)

// Dupliquer
handleDuplicateService(index)

// Supprimer
handleRemoveService(index)
```

### 3. Section Om oss (À propos)

**Éléments modifiables**:
- 📝 Description (max 2000 caractères)
- Compteur de caractères en temps réel

**Actions**:
```typescript
onUpdate('description', newText)
```

### 4. Section Kontakt

**Éléments modifiables**:
- 📍 Adresse
- 📞 Téléphone
- 📧 E-mail
- 🌐 Site web
- 🕐 Heures d'ouverture (7 jours)

**Actions**:
```typescript
// Contact simple
onUpdate('phone', newPhone)

// Heures d'ouverture
handleHoursUpdate(day, field, value)
```

---

## 💡 Panneau Latéral (Sidebar)

### Onglet "Inställningar" (Paramètres)

**Grundinformation**:
- Nom de l'entreprise
- Ville
- Adresse

**Kontaktinformation**:
- Téléphone
- E-mail
- Site web

**Status**:
- ☑️ Publicerad (actif/draft)

### Onglet "Synlighet" (Visibilité)

Contrôle de l'affichage des sections:
- ☑️ Om oss (description + images)
- ☑️ Kontakt (infos + heures)
- ☑️ Karta (Google Maps)
- ☑️ Omdömen (avis clients)

---

## 🎬 Barre d'Outils (Toolbar)

### Éléments de la Barre

```
[← Tillbaka] [Redigera din sida] [Status] [Actions →]
```

### Indicateurs de Statut

1. **Sparar...** (En cours de sauvegarde)
   - Animation de spinner
   - Couleur: gris

2. **Osparade ändringar** (Modifications non sauvegardées)
   - Point orange clignotant
   - Couleur: orange

3. **Allt sparat** (Tout sauvegardé)
   - Icône checkmark
   - Couleur: vert

### Actions Disponibles

- 👁️ **Förhandsgranska** - Mode prévisualisation
- 💾 **Spara nu** - Sauvegarde manuelle
- 📱 **Visa publik sida** - Ouvrir la page publique
- ☰ **Toggle Sidebar** - Afficher/masquer le panneau

---

## 🔒 Sécurité & Permissions

### Contrôle d'Accès

```typescript
// Vérification propriétaire
if (!user || company.ownerId !== user.uid) {
  // Accès refusé
  return <AccessDenied />
}
```

### États de la Page

1. **Loading** - Chargement initial
2. **Access Denied** - Non-propriétaire
3. **Edit Mode** - Mode édition
4. **Preview Mode** - Prévisualisation

---

## 💾 Système de Sauvegarde

### Sauvegarde Automatique

```typescript
// Délai de 1.5 secondes après modification
const timeoutId = setTimeout(() => {
  saveChanges(updates)
}, 1500)
```

### Gestion des Changements Locaux

```typescript
const [localChanges, setLocalChanges] = useState({})

// Modifications locales prioritaires
const currentData = {
  ...company,
  ...localChanges
}
```

### Sauvegarde Firestore

```typescript
await updateDoc(doc(db, 'companies', companyId), {
  ...updates,
  updatedAt: new Date()
})
```

---

## 🎨 Personnalisation

### Styles des Sections Actives

```css
/* Section sélectionnée */
.active {
  ring-4 ring-brand shadow-xl
}

/* Section au survol */
.hover {
  ring-2 ring-gray-300
}
```

### Animations

- ✅ Transition de sélection (300ms)
- 🔄 Spinner de sauvegarde
- ⚡ Changement d'onglets fluide

---

## 📱 Responsive Design

### Points de Rupture

```typescript
// Mobile (< 768px)
- Sidebar en overlay
- Sections empilées

// Tablet (768px - 1024px)
- Sidebar fixe optionnelle
- Grid 2 colonnes pour services

// Desktop (> 1024px)
- Sidebar fixe affichée
- Grid 3 colonnes pour services
```

---

## 🐛 Gestion des Erreurs

### Erreurs d'Upload

```typescript
try {
  await uploadBytes(fileRef, file)
} catch (error) {
  alert('Kunde inte ladda upp bilder')
}
```

### Erreurs de Sauvegarde

```typescript
try {
  await updateDoc(docRef, updates)
  return true
} catch (error) {
  console.error('Error saving:', error)
  return false
}
```

---

## 🚀 Améliorations Futures

### Phase 2 (Planifié)

- [ ] **Drag & Drop** pour réorganiser les services
- [ ] **Undo/Redo** pour annuler les modifications
- [ ] **Image Cropping** pour redimensionner les images
- [ ] **Templates** pour styles prédéfinis
- [ ] **Version History** pour restaurer anciennes versions
- [ ] **Collaborative Editing** pour plusieurs utilisateurs
- [ ] **AI Assistant** pour suggestions de contenu

### Phase 3 (Future)

- [ ] **Custom CSS** pour utilisateurs avancés
- [ ] **A/B Testing** pour tester différentes versions
- [ ] **Analytics Integration** pour voir l'impact des modifications
- [ ] **SEO Suggestions** basées sur l'IA
- [ ] **Mobile Editor** optimisé pour tablettes

---

## 📊 Métriques de Performance

### Temps de Chargement

- **Initial Load**: < 2s
- **Section Switch**: < 100ms
- **Auto-save**: < 500ms
- **Image Upload**: Variable (dépend de la taille)

### Optimisations Appliquées

- ✅ Debouncing de sauvegarde (1.5s)
- ✅ Lazy loading des images
- ✅ Memoization des composants
- ✅ Batch updates Firestore

---

## 📚 Exemples de Code

### Ajouter une Nouvelle Section Éditable

```typescript
// 1. Créer le composant
// components/editor/sections/EditableNewSection.tsx
export default function EditableNewSection({ 
  data, 
  isActive, 
  onActivate, 
  onUpdate 
}) {
  return (
    <div onClick={onActivate} className={/* ... */}>
      {/* Contenu éditable */}
    </div>
  )
}

// 2. Intégrer dans LiveEditor
import EditableNewSection from './sections/EditableNewSection'

<EditableNewSection
  data={currentData}
  isActive={activeSection === 'new'}
  onActivate={() => setActiveSection('new')}
  onUpdate={handleUpdate}
/>
```

### Ajouter un Champ au Sidebar

```typescript
// EditSidebar.tsx - Onglet Settings
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Nouveau Champ
  </label>
  <input
    type="text"
    value={company.newField || ''}
    onChange={(e) => onUpdate('newField', e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  />
</div>
```

---

## 🎓 Guide de Débogage

### Problèmes Courants

**1. Les modifications ne se sauvegardent pas**
```typescript
// Vérifier la console
console.log('Saving:', updates)
console.log('DB:', db ? 'initialized' : 'not initialized')
```

**2. Section ne devient pas active**
```typescript
// Vérifier activeSection state
console.log('Active section:', activeSection)
```

**3. Upload d'images échoue**
```typescript
// Vérifier Storage et permissions
console.log('Storage:', storage ? 'OK' : 'Not initialized')
console.log('User:', user ? user.uid : 'Not logged in')
```

---

## 🔗 Ressources

- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev

---

**Version**: 1.0.0  
**Dernière mise à jour**: Décembre 2024  
**Auteur**: BokaNära Development Team
