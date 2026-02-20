const SYSTEM_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Trebuchet MS',
  'Palatino',
];

const GOOGLE_FONTS = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Nunito', 'Playfair Display', 'Oswald', 'Source Sans 3',
  'Merriweather', 'Ubuntu', 'PT Sans', 'Noto Sans', 'Rubik',
  'Work Sans', 'Quicksand', 'Cabin', 'Lora', 'Karla',
  'Inter', 'Fira Sans', 'Barlow', 'Mulish', 'Josefin Sans',
  'DM Sans', 'Bebas Neue', 'Lobster', 'Pacifico', 'Dancing Script',
  'Permanent Marker', 'Abril Fatface', 'Righteous', 'Comfortaa',
  'Satisfy', 'Indie Flower', 'Amatic SC', 'Shadows Into Light',
  'Patrick Hand', 'Caveat', 'Zilla Slab', 'Archivo', 'Lexend',
  'Space Grotesk', 'Outfit', 'Figtree', 'Onest',
];

const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string): Promise<void> {
  if (loadedFonts.has(family) || SYSTEM_FONTS.includes(family)) return Promise.resolve();
  loadedFonts.add(family);
  return new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
    link.onload = () => {
      document.fonts.load(`16px "${family}"`).then(() => resolve(), () => resolve());
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

export function isSystemFont(family: string): boolean {
  return SYSTEM_FONTS.includes(family);
}

export function getAllFonts(): { system: string[]; google: string[] } {
  return { system: [...SYSTEM_FONTS], google: [...GOOGLE_FONTS] };
}

export function populateFontSelect(select: HTMLSelectElement): void {
  select.innerHTML = '';

  const sysGroup = document.createElement('optgroup');
  sysGroup.label = 'System';
  for (const f of SYSTEM_FONTS) {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    sysGroup.appendChild(opt);
  }
  select.appendChild(sysGroup);

  const gGroup = document.createElement('optgroup');
  gGroup.label = 'Google Fonts';
  for (const f of GOOGLE_FONTS) {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    gGroup.appendChild(opt);
  }
  select.appendChild(gGroup);
}
