# Visual Changes Summary

## WelcomeScreen Button Layout

### Before:
```
┌─────────────────────────────────┐
│                                 │
│      [🍎 Continue with Apple]   │  ← 85% width
│                                 │
│      [✉️  Continue with Email]   │  ← 85% width
│                                 │
│  Terms and Conditions text...   │
│                                 │
└─────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────┐
│                                 │
│       [🍎 Continue with Apple]   │  ← 75% width (smaller)
│                                 │
│       [✉️  Continue with Email]  │  ← 75% width (smaller)
│                                 │
│       [👤 Continue as Guest]    │  ← 75% width (NEW!)
│                                 │
│  Terms and Conditions text...   │
│                                 │
└─────────────────────────────────┘
```

## Button Specifications

### Continue with Apple
- **Background**: Black (#000)
- **Text Color**: White
- **Width**: 75% of screen width (was 85%)
- **Padding**: Reduced to height * 0.01 (was 0.012)
- **Icon Size**: width * 0.045 (was 0.05)
- **Text Size**: width * 0.035 (was 0.04)

### Continue with Email
- **Background**: Homerunn Red (#fc565b)
- **Text Color**: White
- **Width**: 75% of screen width (was 85%)
- **Padding**: Reduced to height * 0.01 (was 0.012)
- **Border**: 2px white border
- **Text Size**: width * 0.035 (was 0.04)

### Continue as Guest (NEW)
- **Background**: Transparent
- **Text Color**: White
- **Width**: 75% of screen width
- **Padding**: height * 0.01
- **Border**: 2px white border
- **Text Size**: width * 0.035
- **Border Radius**: width * 0.02

## Screen Flows

### Guest User Journey

```
WelcomeScreen
     │
     ├─[Continue with Apple]──→ Apple Sign In ──→ Onboarding ──→ Main App (Full Access)
     │
     ├─[Continue with Email]──→ Email Sign Up ──→ Onboarding ──→ Main App (Full Access)
     │
     └─[Continue as Guest]─────────────────────→ Main App (Limited Access)
                                                      │
                                                      ├─ Home: View only (auth prompt on swipe)
                                                      ├─ Search: Full browse ✓
                                                      ├─ Saved: "Sign in" message
                                                      ├─ Flash: "Sign in" message
                                                      └─ Profile: "Guest Mode" message
```

## Auth Prompt Modal (Guest Swipe Attempt)

```
┌────────────────────────────────────────┐
│                                        │
│            🔒  (Lock Icon)             │
│                                        │
│          Sign In Required              │
│                                        │
│  Sign in to start swiping and saving  │
│       homes to your favorites          │
│                                        │
│      ┌─────────────────────────┐      │
│      │       Sign In           │      │
│      └─────────────────────────┘      │
│                                        │
│         Continue Browsing              │
│                                        │
└────────────────────────────────────────┘
```

## Guest UI Examples

### SavedScreen (Guest)
```
┌────────────────────────────────────────┐
│   🏠 HOMERUNN                          │
├────────────────────────────────────────┤
│                                        │
│            💚  (Heart Icon)            │
│                                        │
│    Sign in to save your favorite      │
│              homes                     │
│                                        │
│      ┌─────────────────────────┐      │
│      │       Sign In           │      │
│      └─────────────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

### ProfileScreen (Guest)
```
┌────────────────────────────────────────┐
│                                        │
│            👤  (Person Icon)           │
│                                        │
│             Guest Mode                 │
│                                        │
│   Sign in to save your preferences,   │
│  view saved homes, and get            │
│  personalized recommendations          │
│                                        │
│      ┌─────────────────────────┐      │
│      │       Sign In           │      │
│      └─────────────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

### FlashScreen (Guest)
```
┌────────────────────────────────────────┐
│                                        │
│            ⚡  (Flash Icon)            │
│                                        │
│         Sign In Required               │
│                                        │
│   Sign in to access tools, connect    │
│  with agents, and get pre-qualified   │
│            for loans                   │
│                                        │
│      ┌─────────────────────────┐      │
│      │       Sign In           │      │
│      └─────────────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

## Color Palette

- **Homerunn Red**: #fc565b (primary CTA color)
- **Black**: #000 (Apple button background)
- **White**: #fff (text, borders)
- **Light Gray**: #666 (secondary text)
- **Background**: #f8f8f8 (guest screens)

## Typography

- **Titles**: 22-24pt, Bold
- **Button Text**: 16pt, Semi-bold (600)
- **Body Text**: 16pt, Regular
- **Small Text**: 14pt, Regular

## Spacing

- **Button Margins**: 12-15pt between buttons
- **Container Padding**: 30pt horizontal
- **Icon Margin**: 20pt below icon
- **Text Margin**: 15-30pt between text sections

