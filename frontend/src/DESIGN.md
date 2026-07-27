---
name: Yuanfen Harmony
colors:
  surface: '#fdf9f3'
  surface-dim: '#dddad4'
  surface-bright: '#fdf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ed'
  surface-container: '#f1ede7'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e6e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#5a4042'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f4f0ea'
  outline: '#8e6f71'
  outline-variant: '#e2bec0'
  surface-tint: '#ba1340'
  primary: '#b60e3d'
  on-primary: '#ffffff'
  primary-container: '#da3054'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb2b8'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#ffc300'
  on-secondary-container: '#6d5200'
  tertiary: '#9d3854'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc506d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdadb'
  primary-fixed-dim: '#ffb2b8'
  on-primary-fixed: '#40000f'
  on-primary-fixed-variant: '#91002d'
  secondary-fixed: '#ffdf9a'
  secondary-fixed-dim: '#f8be00'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4300'
  tertiary-fixed: '#ffd9df'
  tertiary-fixed-dim: '#ffb1c1'
  on-tertiary-fixed: '#3f0017'
  on-tertiary-fixed-variant: '#812240'
  background: '#fdf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e6e2dc'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  caption-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 20px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

This design system is crafted to evoke a sense of "Yuanfen" (destined affinity)—balancing modern digital dating efficiency with traditional Chinese warmth and sincerity. The brand personality is romantic yet grounded, targeting Chinese singles who value both emotional connection and social trust.

The visual style follows a **Modern Tactile** approach. It avoids the coldness of pure minimalism by using soft, layered surfaces, gentle gradients, and organic shapes. The emotional response should be one of "safe excitement"—the thrill of meeting someone new, backed by a UI that feels stable, premium, and culturally resonant. Subtle references to the "Red Thread of Fate" are integrated through linear accents and curved dividers.

## Colors

The palette is anchored by **Romantic Rose Red**, a vibrant hue that symbolizes passion and vitality without the aggression of a pure red. **Warm Gold** is used sparingly for high-value accents, such as "Super Likes," premium features, or verified badges, signaling prestige and quality.

The background uses a **Cream/Soft White** (#FFFBF5) rather than a sterile pure white to maintain a "paper-like" warmth. Neutrals for text range from a deep charcoal for readability to a soft terracotta-grey for secondary information, ensuring the UI feels harmonious and approachable.

- **Primary:** #FF4D6D (Main actions, branding)
- **Accent:** #FFC300 (Trust, premium, verification)
- **Background:** #FFFBF5 (Surface warmth)
- **Success:** #4CAF50 (Matches, confirmations)

## Typography

While the implementation will use **PingFang SC** for Simplified Chinese characters to ensure native system legibility, the design system utilizes **Plus Jakarta Sans** for Latin numerals and headers to provide a friendly, rounded geometric feel. 

Hierarchy is strictly enforced to manage information density in dating profiles. Use `Display-LG` for user names and major milestones. `Body-MD` is optimized for bio descriptions with a generous line-height to ensure comfortable reading of Chinese characters, which require more vertical breathing room than Latin script.

## Layout & Spacing

The layout utilizes a **Fluid Grid** model optimized for mobile-first consumption. 
- **Mobile (Default):** 4-column grid with 20px outside margins.
- **Tablet:** 8-column grid with 40px margins and a max-content width of 720px for profile views.

Spacing follows a 4px baseline, but emphasizes larger "breathing zones" (24px+) between profile sections to prevent visual fatigue. Card-based layouts should use a 12px gutter to create a clear separation of "options" in discovery feeds.

## Elevation & Depth

Depth is communicated through **Ambient Shadows** and **Tonal Layering**. Avoid harsh black shadows; instead, use shadows tinted with the primary Rose Red (e.g., `rgba(255, 77, 109, 0.08)`) to maintain the warm, romantic aesthetic.

- **Level 0 (Base):** Soft Cream background.
- **Level 1 (Cards):** Subtle 1px border (#F0E6D8) + 4px blur shadow. Used for profile cards in the feed.
- **Level 2 (Modals/Pop-ups):** 16px blur shadow with a slight vertical offset to suggest "floating" over the interface.
- **Interactions:** When a user taps a card, it should subtly scale down (98%) and the shadow should tighten, mimicking a physical press into a soft surface.

## Shapes

The design system employs a **Rounded** language to reinforce friendliness and safety. 
- **Standard UI Elements:** 16px (rounded-lg) for buttons and input fields.
- **Container Cards:** 24px (rounded-xl) for main profile cards and image containers.
- **Decorative Elements:** Use perfectly circular shapes for avatars and "Red Thread" line terminators.

Soft corners help mitigate the "high-stakes" feeling of dating, making the application feel more like a supportive community.

## Components

### Buttons
- **Primary:** Rose Red background, white text, 16px corner radius. High-intensity shadows on hover/active.
- **Secondary (Action):** White background with a Rose Red 1.5px border.
- **Floating Action Buttons (FAB):** Circular buttons for "Like/Pass" with icon-only labels, using high elevation.

### Form Fields & Inputs
- Inputs should have a soft cream-colored background slightly darker than the page base to create a "well" effect.
- Focus states use a 2px Warm Gold border.

### Status Badges
- **Verified:** Warm Gold background with a white "seal" or checkmark icon.
- **Pending:** Soft terracotta-grey ghost style.
- **New Match:** Rose Red pulse animation on the badge.

### Profile Cards
Profile cards are the core component. They must feature a gradient overlay at the bottom (transitioning from transparent to 60% black) to ensure white text overlay is readable. Use a 24px corner radius for the main image container.

### Traditional Motifs
Incorporate the "Red Thread" as a 2px curved line used for dividers between sections (e.g., separating "About Me" from "Interests"). Use abstract heart patterns as subtle watermarks in the background of empty states.