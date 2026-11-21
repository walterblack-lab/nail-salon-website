import type { ImageName } from './images.generated';

/**
 * Gallery photos, shown in this order.
 *
 * To add a photo:
 *   1. Put the file in /images-src (e.g. gal-my-new-set.jpg)
 *   2. Run `npm run images`
 *   3. Add a line below with its name, category and a short caption in both languages.
 *
 * gal-handpainted-abstract and gal-sculpted-blue are used in the hero, so they are not repeated here.
 */
export const galleryCategories = ['french', 'chrome', 'art', 'nude', 'sculpted', 'seasonal'] as const;
export type GalleryCategory = (typeof galleryCategories)[number];

export interface GalleryItem {
  image: ImageName;
  category: GalleryCategory;
  caption: { hu: string; en: string };
}

export const gallery: GalleryItem[] = [
  { image: 'gal-chrome-jewel', category: 'chrome', caption: { hu: 'Króm stiletto, kristályokkal és 3D díszítéssel', en: 'Chrome stilettos with crystals and 3D detail' } },
  { image: 'gal-french-flower', category: 'french', caption: { hu: 'Klasszikus francia, finom ívvel', en: 'Classic French with a soft smile line' } },
  { image: 'gal-handpainted-leopard', category: 'art', caption: { hu: 'Kézzel festett leopárd és levélminta', en: 'Hand-painted leopard and leaf motifs' } },
  { image: 'gal-nude-bloom', category: 'nude', caption: { hu: 'Meleg nude, mandula forma', en: 'Warm nude, almond shape' } },
  { image: 'gal-autumn-tortoise', category: 'seasonal', caption: { hu: 'Őszi teknőcpáncél-minta, fekete akcentussal', en: 'Autumn tortoiseshell with black accents' } },
  { image: 'gal-chrome-gold', category: 'chrome', caption: { hu: 'Arany króm, mandula forma', en: 'Gold chrome, almond shape' } },
  { image: 'gal-french-glitter', category: 'french', caption: { hu: 'Francia, csillámos kiemeléssel', en: 'French with glitter accents' } },
  { image: 'gal-winter-glitter', category: 'seasonal', caption: { hu: 'Téli mályva, fehér és ezüst csillám', en: 'Winter mauve, white and silver glitter' } },
  { image: 'gal-sculpted-ombre', category: 'sculpted', caption: { hu: 'Kék-fehér ombré, épített forma', en: 'Blue and white ombré, sculpted shape' } },
  { image: 'gal-bridal-french', category: 'french', caption: { hu: 'Menyasszonyi francia manikűr', en: 'Bridal French manicure' } },
  { image: 'gal-nude-linen', category: 'nude', caption: { hu: 'Natúr rózsaszín, rövid forma', en: 'Natural pink, short shape' } },
  { image: 'gal-valentine', category: 'seasonal', caption: { hu: 'Valentin-napi felirat, mélyvörös', en: "Valentine's lettering in deep red" } },
];
