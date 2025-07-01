const { default: purgecss } = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    // Only run PurgeCSS in production
    ...(process.env.NODE_ENV === 'production' ? [
      purgecss({
        content: [
          './src/**/*.{js,jsx,ts,tsx,html}',
          './public/**/*.html',
          './.output/**/*.html'
        ],
        
        // Safelist for Radix UI classes and dynamic content
        safelist: {
          // Always preserve these patterns
          standard: [
            // Root theme classes
            /^(light|dark)(-theme)?$/,
            
            // Radix UI base classes - preserve all rt- classes for now
            /^rt-/,
            
            // CSS custom properties (CSS variables)
            /^--/,
          ],
          
          // Deep preserve (including children)
          deep: [
            // Theme color patterns for all used colors
            /^rt-r-(purple|cyan|iris|jade|teal|orange|gray|blue|red|amber|green|pink|violet|sky|indigo|plum|navy|slate)-/,
            
            // Component state classes
            /rt.*-(open|closed|checked|unchecked|active|inactive|disabled|enabled)/,
            
            // Size and variant classes
            /rt.*-(size|variant)-/,
          ],
          
          // Greedy preserve (very permissive)
          greedy: [
            // Color-related CSS variables for used colors
            /--.*-(purple|cyan|iris|jade|teal|orange|gray|blue|red|amber|green|pink|violet|sky|indigo|plum|navy|slate)-/,
            
            // Surface and indicator variables
            /--.*-(surface|indicator|track)$/,
          ]
        },
        
        // Default content extractor - handles standard CSS class extraction
        defaultExtractor: content => {
          // Extract classes, CSS variables, and other selectors
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
          const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
          return broadMatches.concat(innerMatches);
        },
        
        // Custom extractors for specific file types
        extractors: [
          {
            extractor: content => {
              // Extract Radix UI component names from imports
              const imports = content.match(/import\s*{[^}]+}\s*from\s*['"]@radix-ui\/themes['"]/) || [];
              const components = imports.join('').match(/\b(Theme|Box|Flex|Grid|Card|Text|Heading|Button|IconButton|TextField|Switch|Checkbox|RadioGroup|Select|Dialog|DropdownMenu|HoverCard|Tooltip|Callout|Code|Badge|DataList|Skeleton|Separator)\b/g) || [];
              
              // Extract color names from themeConstants and utils
              const colors = content.match(/\b(purple|cyan|iris|jade|teal|orange|gray|blue|red|amber|green|pink|violet|sky|indigo|plum|navy|slate)\b/g) || [];
              
              // Extract variant and size values
              const variants = content.match(/variant\s*=\s*["']([^"']+)["']/) || [];
              const sizes = content.match(/size\s*=\s*["']([^"']+)["']/) || [];
              
              return [
                ...components.map(c => `rt-${c}`),
                ...colors,
                ...variants.map(v => v[1]),
                ...sizes.map(s => s[1])
              ];
            },
            extensions: ['tsx', 'jsx', 'ts', 'js']
          }
        ],
        
        // Skip files that shouldn't be processed
        rejected: [],
        
        // Keep CSS rules that match these selectors even if content doesn't reference them
        variables: true,
        keyframes: true,
        fontFace: true,
      })
    ] : [])
  ]
};