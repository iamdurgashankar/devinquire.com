# DevInquire Theme System

This document explains how to use and customize the centralized theme system for the DevInquire website and dashboard.

## Overview

The theme system has been centralized into a single file (`src/styles/base-theme.css`) that contains all color variables, making it easy to update the entire application's color scheme from one place.

## File Structure

```
devinquire.com/
├── src/
│   ├── styles/
│   │   ├── base-theme.css          # Main theme file - UPDATE COLORS HERE
│   │   ├── theme.css               # Legacy theme structure (minimal)
│   │   ├── glass.css               # Glass morphism effects
│   │   └── navbar.css              # Navbar-specific styles
│   └── index.css                   # Main CSS file (imports base-theme.css)
└── dashboard/
    └── src/
        ├── styles/
        │   ├── base-theme.css      # Dashboard theme file - UPDATE COLORS HERE
        │   ├── theme.css           # Legacy theme structure (minimal)
        │   ├── glass.css           # Glass morphism effects
        │   └── navbar.css          # Navbar-specific styles
        └── index.css               # Dashboard CSS file (imports base-theme.css)
```

## How to Update Colors

### 1. Primary Color Changes

To change the main theme color, edit `src/styles/base-theme.css`:

```css
:root {
  /* Primary Color Palette */
  --primary: #22577a; /* Change this for main brand color */
  --primary-light: #2d6a8f; /* Lighter version of primary */
  --primary-dark: #1a4561; /* Darker version of primary */
  --primary-rgb: 34, 87, 122; /* RGB values for transparency */

  /* Secondary Colors */
  --secondary: #38a3a5; /* Change this for secondary brand color */
  --secondary-light: #4db3b5; /* Lighter version of secondary */
  --secondary-dark: #2d8a8c; /* Darker version of secondary */
  --secondary-rgb: 56, 163, 165; /* RGB values for transparency */

  /* Accent Colors */
  --accent: #57cc99; /* Change this for accent color */
  --accent-light: #6dd4a6; /* Lighter version of accent */
  --accent-dark: #45a67a; /* Darker version of accent */
  --accent-rgb: 87, 204, 153; /* RGB values for transparency */
}
```

### 2. Status Colors

```css
:root {
  /* Status Colors */
  --success: #10b981; /* Green for success states */
  --warning: #f59e0b; /* Yellow for warning states */
  --error: #ef4444; /* Red for error states */
  --info: #3b82f6; /* Blue for info states */
}
```

### 3. Neutral Colors

```css
:root {
  /* Neutral Colors */
  --neutral-50: #f8fafc; /* Lightest neutral */
  --neutral-100: #f1f5f9; /* Very light neutral */
  --neutral-200: #e2e8f0; /* Light neutral */
  --neutral-300: #cbd5e1; /* Medium light neutral */
  --neutral-400: #94a3b8; /* Medium neutral */
  --neutral-500: #64748b; /* Medium dark neutral */
  --neutral-600: #475569; /* Dark neutral */
  --neutral-700: #334155; /* Very dark neutral */
  --neutral-800: #1e293b; /* Darkest neutral */
  --neutral-900: #0f172a; /* Black neutral */
}
```

### 4. Background and Text Colors

```css
:root {
  /* Background Colors */
  --bg-primary: #ffffff; /* Main background */
  --bg-secondary: #f8fafc; /* Secondary background */
  --bg-tertiary: #f1f5f9; /* Tertiary background */

  /* Text Colors */
  --text-primary: #1e293b; /* Main text color */
  --text-secondary: #475569; /* Secondary text color */
  --text-tertiary: #64748b; /* Tertiary text color */
  --text-inverse: #ffffff; /* Text on dark backgrounds */
}
```

## Available CSS Classes

The theme system provides ready-to-use CSS classes:

### Color Classes

- `.text-primary`, `.text-secondary`, `.text-accent`
- `.bg-primary`, `.bg-secondary`, `.bg-accent`
- `.border-primary`, `.border-secondary`, `.border-accent`

### Button Classes

- `.btn-primary` - Primary button with gradient
- `.btn-secondary` - Secondary button with outline

### Card Classes

- `.card` - Standard card
- `.card-glass` - Glass morphism card

### Utility Classes

- `.gradient-text` - Text with gradient background
- `.shadow-primary` - Primary shadow
- `.focus-ring` - Focus outline
- `.hover-lift` - Hover lift effect
- `.hover-glow` - Hover glow effect

## Dark Mode Support

The theme system automatically supports dark mode:

```css
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
}
```

## Gradient System

The theme includes predefined gradients:

```css
:root {
  /* Gradient Colors */
  --gradient-primary: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--secondary) 100%
  );
  --gradient-secondary: linear-gradient(
    135deg,
    var(--secondary) 0%,
    var(--accent) 100%
  );
  --gradient-hero: linear-gradient(
    135deg,
    var(--neutral-900) 0%,
    var(--primary) 25%,
    var(--secondary) 50%,
    var(--accent) 75%,
    var(--neutral-900) 100%
  );
}
```

## Glass Morphism Effects

Glass effects automatically use theme colors:

```css
.glass-effect {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px 0 var(--glass-shadow);
}
```

## Responsive Design

The theme system includes responsive breakpoints and mobile-optimized glass effects:

```css
@media (max-width: 768px) {
  .glass-effect {
    backdrop-filter: blur(8px) saturate(150%);
    -webkit-backdrop-filter: blur(8px) saturate(150%);
  }
}
```

## Performance Optimizations

- High performance mode support for users who prefer reduced motion
- Optimized backdrop-filter usage
- Efficient CSS variable usage

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Update colors in `base-theme.css`** only
3. **Use semantic color names** (e.g., `--primary`, `--success`)
4. **Test both light and dark themes** when making changes
5. **Use the provided utility classes** when possible

## Example: Changing Brand Colors

To change the brand from blue to green:

1. Edit `src/styles/base-theme.css`
2. Update the primary color:
   ```css
   --primary: #059669; /* Green-600 */
   --primary-light: #10b981; /* Green-500 */
   --primary-dark: #047857; /* Green-700 */
   --primary-rgb: 5, 150, 105; /* RGB values */
   ```
3. Save the file
4. The entire application will automatically use the new green theme

## Troubleshooting

### Colors Not Updating

- Ensure you're editing the correct `base-theme.css` file
- Check that the CSS file is being imported in `index.css`
- Clear browser cache and reload

### Glass Effects Not Working

- Verify backdrop-filter support in your browser
- Check that the glass CSS files are imported
- Ensure proper z-index values

### Dark Mode Issues

- Verify the `[data-theme="dark"]` selector is working
- Check that dark mode variables are properly defined
- Ensure theme context is properly set up

## Migration from Old System

If you have components using old hardcoded colors:

1. Replace `#3a86ff` with `var(--primary)`
2. Replace `#60a5fa` with `var(--secondary)`
3. Replace `#93c5fd` with `var(--accent)`
4. Use utility classes like `.btn-primary` instead of custom button styles

## Support

For theme-related issues or questions:

1. Check this documentation first
2. Review the CSS variables in `base-theme.css`
3. Ensure proper file imports
4. Test in both light and dark modes
