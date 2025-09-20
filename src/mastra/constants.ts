export const stylePrompts: { [key: string]: { prefix: string; suffix: string } } = {
  'Cinematic': {
    prefix: 'Cinematic film still, photorealistic,',
    suffix: ', 4k, hyper-detailed, professional color grading, sharp focus'
  },
  'Photographic': {
    prefix: 'Professional photograph, photorealistic,',
    suffix: ', 85mm lens, sharp focus, high quality photo'
  },
  'Anime': {
    prefix: 'Vibrant anime style, key visual,',
    suffix: ', cel-shaded, detailed characters, trending on Pixiv, by Makoto Shinkai'
  },
  'Manga': {
    prefix: 'Black and white manga panel,',
    suffix: ', screentones, sharp lines, detailed ink work, dynamic action'
  },
  'Ghibli-esque': {
    prefix: 'Ghibli-esque animation style,',
    suffix: ', beautiful hand-drawn background, whimsical, soft color palette'
  },
  'Disney-esque': {
    prefix: 'Classic Disney animation style,',
    suffix: ', expressive characters, vibrant colors, storybook illustration'
  },
  'Coloring Book': {
    prefix: 'Coloring book art style,',
    suffix: ', simplified, bold line drawings designed for easy coloring. The focus is on clear, enclosed outlines that can be filled with color later. It avoids shading, gradients, or excessive detail that would interfere with coloring'
  },
  'Line Art': {
    prefix: 'Line art style,',
    suffix: ', drawing that relies exclusively on clean, deliberate lines to define form, structure, and detail. Avoids gradients, painterly effects, or full shading. Emphasis is on clarity, contour, and precise strokes'
  },
  'Comic Book': {
    prefix: 'American comic book art style,',
    suffix: ', bold outlines, vibrant colors, halftone dots, action-packed'
  },
  'Graphic Novel': {
    prefix: 'Mature graphic novel art style,',
    suffix: ', detailed inks, atmospheric lighting, moody colors'
  },
  'Watercolor': {
    prefix: 'Beautiful watercolor painting,',
    suffix: ', soft edges, vibrant washes of color, on textured paper'
  },
  'Low Poly': {
    prefix: 'Low poly 3D render,',
    suffix: ', geometric shapes, simple color palette, isometric view'
  },
  'Pixel Art': {
    prefix: 'Detailed pixel art, 16-bit,',
    suffix: ', vibrant color palette, nostalgic retro video game style'
  },
  'Steampunk': {
    prefix: 'Steampunk style illustration,',
    suffix: ', intricate gears and cogs, brass and copper details, Victorian aesthetic'
  },
  'Cyberpunk': {
    prefix: 'Cyberpunk cityscape,',
    suffix: ', neon-drenched, high-tech low-life, Blade Runner aesthetic, moody lighting'
  },
  'Fantasy Art': {
    prefix: 'Epic fantasy art, D&D style,',
    suffix: ', dramatic lighting, detailed armor and landscapes, magical atmosphere'
  },
  'Film Noir': {
    prefix: 'Black and white film noir style,',
    suffix: ', high contrast, dramatic shadows, 1940s detective movie aesthetic'
  },
  'Photorealistic': {
    prefix: 'Photorealistic style, highly detailed,',
    suffix: ', realistic photography, lifelike quality'
  }
};

export enum OpenAIImageBackgrounds {
  opaque = 'opaque',
  transparent = 'transparent',
  auto = 'auto'
}

export enum OpenAIImageFormats {
  jpeg = 'jpeg',
  png = 'png',
  webp = 'webp',
}

export enum OpenAIEditFidelity {
  high = 'high',
  low = 'low',
}

export enum OpenAIImageQuality {
  standard = 'standard',
  hd = 'hd',
  low = 'low',
  medium = 'medium',
  high = 'high',
  auto = 'auto',
}

export enum OpenAIImageModels {
  DALLE_3 = 'dalle-3',
  GPT_IMAGE_1 = 'gpt-image-1',
}

export enum OpenAIImageSize {
  auto = 'auto',
  x1024x1024 = '1024x1024',
  x1536x1024 = '1536x1024',
  x1024x1536 = '1024x1536',
  x256x256 = '256x256',
  x512x512 = '512x512',
  x1792x1024 = '1792x1024',
  x1024x1792 = '1024x1792',
}

