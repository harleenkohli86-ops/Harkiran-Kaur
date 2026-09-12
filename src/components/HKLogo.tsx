import React, { useId } from 'react';

interface HKLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const HKLogo: React.FC<HKLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  // Unique ID prefix to prevent DOM gradient/filter conflicts across instances
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, '');

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
    xl: 'w-28 h-28 sm:w-36 sm:h-36',
  };

  return (
    <div className={`flex items-center gap-3.5 group cursor-pointer ${className}`}>
      <div
        className={`relative rounded-full ${sizeClasses[size]} shrink-0 drop-shadow-md group-hover:scale-105 group-hover:drop-shadow-[0_4px_20px_rgba(200,164,93,0.5)] transition-all duration-300`}
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Crisp, Ultra-High-Definition Vector Crest Emblem (Photo-Fidelity) */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="geometricPrecision"
          textRendering="geometricPrecision"
        >
          <defs>
            {/* Rich 3D Metallic Gold Gradient - Multiple Specular Stops */}
            <linearGradient id={`goldBevel_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF7D6" />
              <stop offset="18%" stopColor="#F5D77F" />
              <stop offset="42%" stopColor="#D4AF37" />
              <stop offset="68%" stopColor="#A87F1E" />
              <stop offset="86%" stopColor="#E5C158" />
              <stop offset="100%" stopColor="#6E4C0A" />
            </linearGradient>

            {/* Bright Specular Gold for Upper Facets */}
            <linearGradient id={`goldLight_${id}`} x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FFFCEB" />
              <stop offset="35%" stopColor="#F7DA85" />
              <stop offset="70%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#B38A24" />
            </linearGradient>

            {/* Deep Shaded Gold for 3D Bevel Facets */}
            <linearGradient id={`goldDark_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BA8E26" />
              <stop offset="50%" stopColor="#7E5910" />
              <stop offset="100%" stopColor="#4A3408" />
            </linearGradient>

            {/* Star Specular Highlights */}
            <linearGradient id={`starLight_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#FFECA8" />
              <stop offset="100%" stopColor="#D8AD34" />
            </linearGradient>

            <linearGradient id={`starDark_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C89B2B" />
              <stop offset="100%" stopColor="#73500B" />
            </linearGradient>

            {/* Tactile Ivory Enamel Plate with Studio Spotlight */}
            <radialGradient id={`ivoryPlate_${id}`} cx="45%" cy="38%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#FAF6EF" />
              <stop offset="82%" stopColor="#EFE5D0" />
              <stop offset="100%" stopColor="#D8C8A6" />
            </radialGradient>

            {/* 3D Deep Drop Shadow */}
            <filter id={`drop3D_${id}`} x="-15%" y="-15%" width="135%" height="135%">
              <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
            </filter>

            {/* Subtle Raised Shadow for Details */}
            <filter id={`subtle3D_${id}`} x="-15%" y="-15%" width="135%" height="135%">
              <feDropShadow dx="1.5" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.32" />
            </filter>

            {/* Outer Rim Golden Bloom */}
            <filter id={`rimBloom_${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#C8A45D" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 1. Outer Jet Black Boundary */}
          <circle cx="250" cy="250" r="248" fill="#0A0A0A" />

          {/* 2. Beveled 3D Metallic Gold Rim */}
          <circle
            cx="250"
            cy="250"
            r="239"
            fill="none"
            stroke={`url(#goldBevel_${id})`}
            strokeWidth="16"
            filter={`url(#rimBloom_${id})`}
          />
          {/* Outer highlight hairline */}
          <circle cx="250" cy="250" r="247" fill="none" stroke="#FFF7D6" strokeWidth="1.5" opacity="0.75" />
          {/* Inner groove shadow */}
          <circle cx="250" cy="250" r="231" fill="none" stroke="#4F3607" strokeWidth="2.5" />

          {/* 3. Recessed Warm Ivory Enamel Plate */}
          <circle cx="250" cy="250" r="228" fill={`url(#ivoryPlate_${id})`} />
          <circle cx="250" cy="250" r="228" fill="none" stroke="#C8A45D" strokeWidth="2" opacity="0.65" />
          <circle cx="250" cy="250" r="221" fill="none" stroke="#E2D4B5" strokeWidth="1" opacity="0.8" />

          {/* 4. Left Golden Crescent Accent Wing */}
          <path
            d="M 84 250 C 84 148 144 95 204 84 C 136 108 102 165 102 250 C 102 335 140 392 208 416 C 142 404 84 352 84 250 Z"
            fill={`url(#goldBevel_${id})`}
            filter={`url(#subtle3D_${id})`}
          />

          {/* 5. The Black 'H' Monogram in Polished Black Onyx with Classical Serifs */}
          <g filter={`url(#drop3D_${id})`}>
            {/* Left Vertical Pillar with Bracketed Serifs */}
            <path
              d="M 132 110 L 194 110 L 194 124 L 180 124 L 180 274 L 194 274 L 194 288 L 132 288 L 132 274 L 146 274 L 146 124 L 132 124 Z"
              fill="#0F0F0F"
            />
            {/* Right Vertical Pillar (Upper Portion) */}
            <path
              d="M 224 110 L 286 110 L 286 124 L 272 124 L 272 195 L 238 195 L 238 124 L 224 124 Z"
              fill="#0F0F0F"
            />
            {/* Crossbar */}
            <path d="M 178 180 L 240 180 L 240 208 L 178 208 Z" fill="#0F0F0F" />
          </g>

          {/* 6. Dynamic Upward Golden Swoosh connecting H to K and Launching to Star */}
          <path
            d="M 138 294 C 184 242 234 186 288 136 C 324 103 358 79 374 69 L 360 63 C 320 89 274 131 218 186 C 170 233 132 283 129 296 Z"
            fill={`url(#goldBevel_${id})`}
            filter={`url(#drop3D_${id})`}
          />

          {/* 7. 3D Metallic Gold 'K' Monogram with Faceted Dimensional Bevels */}
          {/* Upper Right Diagonal Arm of K */}
          <g filter={`url(#drop3D_${id})`}>
            {/* Light Facet */}
            <polygon points="242,192 355,80 372,92 258,206" fill={`url(#goldLight_${id})`} />
            {/* Dark Bevel Facet */}
            <polygon points="258,206 372,92 376,98 252,216" fill={`url(#goldDark_${id})`} />
          </g>

          {/* Lower Right Diagonal Arm of K */}
          <g filter={`url(#drop3D_${id})`}>
            {/* Light Facet */}
            <polygon points="250,202 388,300 376,312 238,218" fill={`url(#goldLight_${id})`} />
            {/* Dark Bevel Facet */}
            <polygon points="238,218 376,312 368,322 232,228" fill={`url(#goldDark_${id})`} />
          </g>

          {/* 8. 3D Faceted Gold Star at the Summit (10 Triangular Bevel Facets) */}
          <g transform="translate(358, 56) rotate(12)" filter={`url(#drop3D_${id})`}>
            {/* Top Point */}
            <polygon points="0,0 0,-34 7,-10" fill={`url(#starLight_${id})`} />
            <polygon points="0,0 0,-34 -7,-10" fill={`url(#starDark_${id})`} />
            {/* Top-Right Point */}
            <polygon points="0,0 32,-11 11,2" fill={`url(#starLight_${id})`} />
            <polygon points="0,0 32,-11 10,-8" fill={`url(#starDark_${id})`} />
            {/* Bottom-Right Point */}
            <polygon points="0,0 20,28 3,12" fill={`url(#starLight_${id})`} />
            <polygon points="0,0 20,28 17,4" fill={`url(#starDark_${id})`} />
            {/* Bottom-Left Point */}
            <polygon points="0,0 -20,28 -17,4" fill={`url(#starLight_${id})`} />
            <polygon points="0,0 -20,28 -3,12" fill={`url(#starDark_${id})`} />
            {/* Top-Left Point */}
            <polygon points="0,0 -32,-11 -10,-8" fill={`url(#starLight_${id})`} />
            <polygon points="0,0 -32,-11 -11,2" fill={`url(#starDark_${id})`} />
          </g>

          {/* 9. Open Book & Mentor Helping Student (Core Philosophy Graphic) */}
          <g filter={`url(#drop3D_${id})`} transform="translate(0, -6)">
            {/* Tiered Open Book Pages */}
            {/* Left Page Fan */}
            <path
              d="M 160 365 C 215 348 248 358 248 374 L 168 392 C 215 372 248 378 248 386 Z"
              fill="#1C1A17"
            />
            <path
              d="M 156 368 C 215 350 248 360 248 376 L 248 382 C 215 365 158 374 158 374 Z"
              fill={`url(#goldLight_${id})`}
              opacity="0.85"
            />

            {/* Right Page Fan */}
            <path
              d="M 340 365 C 285 348 252 358 252 374 L 332 392 C 285 372 252 378 252 386 Z"
              fill="#1C1A17"
            />
            <path
              d="M 344 368 C 285 350 252 360 252 376 L 252 382 C 285 365 342 374 342 374 Z"
              fill={`url(#goldDark_${id})`}
              opacity="0.85"
            />

            {/* Central Book Spine in Polished Gold */}
            <path
              d="M 246 370 Q 250 362 254 370 L 254 394 Q 250 388 246 394 Z"
              fill={`url(#goldBevel_${id})`}
            />

            {/* Mentor Figure (Standing Tall in Shining Gold on Left Book Step, extending hand) */}
            <circle cx="218" cy="250" r="10" fill={`url(#goldLight_${id})`} />
            {/* Body */}
            <path d="M 218 262 L 202 312 L 222 312 L 228 274 Z" fill={`url(#goldBevel_${id})`} />
            {/* Extended Right Arm */}
            <path d="M 224 270 L 254 286 L 250 292 L 220 276 Z" fill={`url(#goldLight_${id})`} />
            {/* Left Leg */}
            <path d="M 206 312 L 198 348 L 210 348 L 216 312 Z" fill={`url(#goldDark_${id})`} />
            {/* Right Leg */}
            <path d="M 220 312 L 228 344 L 238 344 L 226 312 Z" fill={`url(#goldBevel_${id})`} />

            {/* Student Figure (Climbing Upwards in Onyx Black on Right Book Step, taking mentor's hand) */}
            <circle cx="282" cy="285" r="8.5" fill="#111111" />
            {/* Body */}
            <path d="M 280 295 L 292 334 L 274 334 L 272 304 Z" fill="#111111" />
            {/* Reaching Left Arm meeting Mentor's Hand */}
            <path d="M 274 300 L 252 288 L 250 294 L 270 306 Z" fill="#111111" />
            {/* Climbing Legs */}
            <path d="M 290 334 L 302 360 L 288 360 L 278 334 Z" fill="#111111" />
            <path d="M 274 334 L 262 352 L 254 352 L 268 334 Z" fill="#111111" />
          </g>

          {/* 10. Bottom Arched High-Contrast 3D Text: "CODE OF RANKERS" */}
          <path id={`textArch_${id}`} d="M 90 330 A 185 185 0 0 0 410 330" fill="none" />
          <text
            fontFamily="'Montserrat', 'Cinzel', 'Arial Black', sans-serif"
            fontSize="24"
            fontWeight="900"
            letterSpacing="5"
            filter={`url(#subtle3D_${id})`}
          >
            <textPath href={`#textArch_${id}`} startOffset="50%" textAnchor="middle">
              <tspan fill="#141414" fontWeight="900">
                CODE OF{' '}
              </tspan>
              <tspan fill={`url(#goldDark_${id})`} fontWeight="900">
                RANKERS
              </tspan>
            </textPath>
          </text>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center items-start">
          <div className="flex items-center gap-1.5">
            <span className="font-cinzel text-xl md:text-2xl font-black text-[#0F0F0F] tracking-wider leading-none">
              HK
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FFE3A0] to-[#C8A45D] shadow-sm" />
          </div>

          {/* Luxury Metallic Golden Badge with Shimmer Sweep & Ranker Star */}
          <div className="mt-1 relative overflow-hidden rounded-md bg-gradient-to-r from-[#FFF0C3] via-[#D8B25C] to-[#AA8221] p-[1px] shadow-[0_2px_10px_rgba(200,164,93,0.3)] group-hover:shadow-[0_4px_14px_rgba(200,164,93,0.5)] transition-all duration-300">
            <div className="relative flex items-center justify-center px-2.5 py-0.5 rounded-[5px] bg-gradient-to-r from-[#FFEFA6] via-[#E2BA62] to-[#C8A45D] text-black">
              <span className="text-[9px] md:text-[11px] font-montserrat font-black tracking-[0.2em] text-[#0F0F0F] uppercase block whitespace-nowrap drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                CODE OF RANKERS
              </span>
              
              {/* Continuous Light Beam Sweep Effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent -translate-x-full animate-gold-shimmer pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


