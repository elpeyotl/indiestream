# App Icons

This directory contains the PWA app icons for Fairtune.

## Required Icons

- `icon-192.png` - 192x192px icon (required for PWA)
- `icon-512.png` - 512x512px icon (required for PWA)

## Generation Instructions

To generate the app icons:

1. **Using Figma/Design Tool**:
   - Export the Fairtune logo at 512x512px
   - Export at 192x192px
   - Save as PNG with transparent background
   - Use the brand violet color (#8b5cf6) on dark background (#09090b)

2. **Using Online Tools**:
   - Use [PWA Icon Generator](https://www.pwabuilder.com/)
   - Upload your logo/icon
   - Generate all required sizes
   - Download and replace placeholder files

3. **Using ImageMagick** (if you have a source SVG):
   ```bash
   # Convert SVG to 192x192 PNG
   convert -background none -resize 192x192 logo.svg icon-192.png

   # Convert SVG to 512x512 PNG
   convert -background none -resize 512x512 logo.svg icon-512.png
   ```

## Temporary Placeholders

For development, you can use favicons or create simple colored squares:

```bash
# Create simple placeholder (violet square with 'I' text)
convert -size 192x192 xc:'#8b5cf6' -pointsize 120 -fill white -gravity center -annotate +0+0 'I' icon-192.png
convert -size 512x512 xc:'#8b5cf6' -pointsize 320 -fill white -gravity center -annotate +0+0 'I' icon-512.png
```

## Icon Design Guidelines

- **Purpose**: Both "any" and "maskable" (safe area for OS masking)
- **Background**: Use brand dark color (#09090b) or transparent
- **Foreground**: Use brand violet (#8b5cf6)
- **Style**: Simple, recognizable, works at small sizes
- **Format**: PNG with transparency
- **Safe Zone**: Keep important content in center 80% for maskable icons
