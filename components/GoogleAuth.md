# GoogleAuth Component Documentation

## Overview

The `GoogleAuth` component is a reusable Google authentication button component that integrates with Firebase Authentication. It's designed for Next.js applications with TypeScript and styled with TailwindCSS.

## Features

- ✅ Full TypeScript support with proper type definitions
- ✅ Uses Next.js `next/navigation` router (not react-router-dom)
- ✅ Integrates with Firebase Authentication via AuthContext
- ✅ Comprehensive error handling with user-friendly Swedish error messages
- ✅ Responsive design with TailwindCSS utility classes
- ✅ Customizable through props (styling, text, redirect path)
- ✅ Accessible with ARIA labels and semantic HTML
- ✅ Loading states and disabled states during authentication

## Installation

The component is located at `components/GoogleAuth.tsx` and requires:

1. Firebase configuration in `lib/firebase.ts`
2. AuthContext provider wrapped around your app
3. Next.js 14+ with App Router
4. React Icons package

## Usage

### Basic Example

```tsx
import GoogleAuth from '@/components/GoogleAuth'

export default function MyPage() {
  return (
    <GoogleAuth />
  )
}
```

### Custom Redirect Path

```tsx
<GoogleAuth redirectTo="/dashboard" />
```

### Full Width Button

```tsx
<GoogleAuth 
  fullWidth 
  buttonText="Sign in with Google"
/>
```

### With Callbacks

```tsx
<GoogleAuth 
  redirectTo="/konto"
  onSuccess={() => console.log('Login successful!')}
  onError={(error) => console.error('Login failed:', error)}
/>
```

### Custom Styling

```tsx
<GoogleAuth 
  className="my-4"
  fullWidth
  buttonText="Börja med Google"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `redirectTo` | `string` | `'/'` | Path to redirect after successful login |
| `buttonText` | `string` | `'Logga in med Google'` | Text displayed on the button |
| `fullWidth` | `boolean` | `false` | Whether button should take full width |
| `className` | `string` | `''` | Additional CSS classes for the wrapper div |
| `onSuccess` | `() => void` | `undefined` | Callback function called after successful login |
| `onError` | `(error: Error) => void` | `undefined` | Callback function called on error |
| `showLoading` | `boolean` | `true` | Whether to show loading text during authentication |

## Error Handling

The component handles the following Firebase authentication errors with user-friendly Swedish messages:

- `auth/popup-closed-by-user` - User closed the popup window
- `auth/popup-blocked` - Popup was blocked by browser
- `auth/unauthorized-domain` - Domain not authorized in Firebase
- `auth/network-request-failed` - Network connection issue
- `auth/too-many-requests` - Too many login attempts

## Styling

The component uses TailwindCSS utility classes for styling:

- Responsive hover states
- Focus ring for accessibility
- Disabled states with reduced opacity
- Google brand colors for the icon
- Smooth transitions

## Integration with Existing Code

The component integrates with:

1. **AuthContext** (`context/AuthContext.tsx`) - Provides `signInWithGoogle` function
2. **Firebase** (`lib/firebase.ts`) - Firebase configuration
3. **Next.js Router** - Uses `next/navigation` for routing

## Example: Login Page Integration

```tsx
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import GoogleAuth from '@/components/GoogleAuth'

function LoginContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Logga in</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <GoogleAuth 
            redirectTo="/konto"
            fullWidth
          />
          
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">eller</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          
          {/* Other login methods */}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
```

## Accessibility

The component includes:

- Proper ARIA labels (`aria-label` on button)
- Semantic HTML elements
- Keyboard navigation support
- Screen reader friendly error messages (`role="alert"`)

## Security Considerations

1. **Firebase Auth** handles all authentication securely
2. **HTTPS required** - Firebase requires HTTPS in production
3. **Domain authorization** - Only authorized domains can use Google sign-in
4. **Token management** - Firebase handles token refresh automatically
5. **Session persistence** - Uses browser local persistence

## Browser Compatibility

The component works in all modern browsers that support:

- ES6+ JavaScript
- Firebase SDK
- CSS Grid and Flexbox
- Modern DOM APIs

Tested in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration Notes

This component was adapted from the vägvänner repository with the following changes:

1. ✅ Converted from JavaScript to TypeScript
2. ✅ Changed from `react-router-dom` to `next/navigation`
3. ✅ Updated to use Next.js App Router patterns
4. ✅ Enhanced error handling with Swedish messages
5. ✅ Added comprehensive prop types and documentation
6. ✅ Improved accessibility features
7. ✅ Made fully reusable with customizable props

## Troubleshooting

### "Auth context not available" error
Make sure your app is wrapped with `AuthProvider` from `context/AuthContext.tsx`.

### Popup blocked error
Ensure the user action directly triggers the sign-in (e.g., button click, not automatic).

### Domain not authorized
Add your domain to Firebase Console → Authentication → Settings → Authorized domains.

### Build errors with fonts
If you encounter font loading issues during build, use system fonts instead of Google Fonts or ensure network access during build.

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for sign-in with redirect (alternative to popup)
- [ ] Customizable Google icon
- [ ] Support for other OAuth providers
- [ ] Dark mode support
- [ ] Animation options
- [ ] Multi-language support

## License

MIT License - Part of the BokaNära project

## Support

For issues or questions:
- GitHub Issues: https://github.com/codecsverige/foretag/issues
- Email: support@bokanara.se
