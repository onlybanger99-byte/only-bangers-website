# Only Bangers placeholder image inventory

This site currently uses a mix of missing-image fallbacks and content-managed image slots. The main fallback is the generic SVG placeholder in src/lib/safe-image.ts, and several public-facing sections are wired to site-content keys that will display that fallback until real images are uploaded.

## 1) Global fallback image
- Where used: Any missing image across the site, including hero, service cards, barber avatars, and other content slots.
- Current source: Generic SVG data URI in src/lib/safe-image.ts.
- Replace with: A premium dark barbering placeholder image with a black/gold palette, subtle lighting, and a clean abstract barber-chair or grooming aesthetic.
- Best dimensions: 1200 x 800 px
- Notes: This should work as a safe fallback for both portrait and landscape layouts.

## 2) Site logo
- Site-content key: site_logo
- Where used: Header and footer logo.
- Replace with: A clean, high-contrast logo for Only Bangers. Prefer a bold wordmark or icon + wordmark in black, gold, or white on transparent background.
- Best dimensions: 1600 x 600 px
- Notes: Use a transparent PNG or SVG for best scaling.

## 3) Homepage hero banner
- Site-content keys: site_banner_image, home_hero_image
- Where used: Main homepage hero section.
- Replace with: A high-end barbering hero shot showing a sharp haircut, beard detail, or premium grooming setup in a modern studio.
- Best dimensions: 1600 x 1400 px
- Notes: This is a prominent hero image, so use strong lighting and a polished brand feel.

## 4) Homepage proof image 1
- Site-content key: home_section_1_image
- Where used: Proof-of-work carousel / rail card 1.
- Replace with: A close-up of a precise skin fade, line-up, or detail-heavy cut.
- Best dimensions: 1600 x 1000 px
- Notes: This should feel sharp, detailed, and premium.

## 5) Homepage proof image 2
- Site-content key: home_section_2_image
- Where used: Proof-of-work carousel / rail card 2.
- Replace with: A premium beard grooming or facial detailing shot with crisp styling and texture.
- Best dimensions: 1600 x 1000 px
- Notes: Emphasize grooming quality and texture.

## 6) Homepage proof image 3
- Site-content key: home_section_3_image
- Where used: Proof-of-work carousel / rail card 3.
- Replace with: A polished final style shot showing a full haircut finish, confidence, and modern presentation.
- Best dimensions: 1600 x 1000 px
- Notes: This should look editorial and premium.

## 7) Homepage call-to-action background
- Site-content key: home_section_7_image
- Where used: Bottom CTA section background.
- Replace with: A wide, cinematic barbering scene, ideally a client sitting in the chair with strong lighting and a confident atmosphere.
- Best dimensions: 1800 x 1000 px
- Notes: Use a wide layout because this is a full-width background image.

## 8) Services page background
- Site-content key: services_background_image
- Where used: Services landing page hero/header background.
- Replace with: A premium service environment image, such as a clean barbershop interior, tools in frame, or a styled client chair scene.
- Best dimensions: 1920 x 1080 px
- Notes: This should feel polished and consistent with the brand.

## 9) About page founder image
- Site-content key: about_founder_image
- Where used: About page founder profile section.
- Replace with: A clean portrait of Antonio Prince in a professional, confident, personal style.
- Best dimensions: 1000 x 1000 px
- Notes: Use a square crop for the strongest presentation.

## 10) Default barber avatar
- Site-content key: default_barber_avatar
- Where used: Barber cards and fallback profiles where no avatar exists.
- Replace with: A professional headshot of a barber or a clean brand-style portrait with simple background.
- Best dimensions: 800 x 800 px
- Notes: Square format is ideal for avatars.

## 11) Service-specific images
These are managed through service media content keys:
- service_classic_fade_media
- service_fade_with_dye_media
- service_brush_with_trim_media
- service_beard_trim_media
- service_clean_shave_media
- service_hair_beard_combo_media

For each service, use a photo that clearly matches the service:
- Classic fade: close-up of a clean fade with crisp edges.
- Fade with dye: color work plus faded shape.
- Brush with trim: textured top and tidy sides.
- Beard trim: beard shaping or grooming detail.
- Clean shave: clean facial finish, fresh grooming aesthetic.
- Hair & beard combo: full service look with both hair and beard styled.

Best dimensions for all service images: 1200 x 900 px

## 12) Shared background images
These are optional background slots used on various pages:
- global_page_background
- site_background_image
- home_background_image
- barber_dashboard_background
- admin_dashboard_background
- login_background_image

Replace with: A dark, premium barbershop background with subtle gold accents, texture, or lighting. Avoid busy imagery that hurts readability.
Best dimensions: 1920 x 1200 px

## 13) Email header logo
- Current source: src/app/api/test-email/route.ts
- Replace with: A branded logo suitable for email clients.
- Best dimensions: 200 x 60 px
- Notes: Keep it simple and readable at small sizes.

## Existing local image assets already in the repo
These files already exist in public/images and may be useful as the first batch of replacements:
- public/images/book-cut.jpg
- public/images/feature-beard.jpg
- public/images/feature-fade.jpg
- public/images/feature-glowup.jpg
- public/images/get-featured.jpg
- public/images/receive-footage.jpg
- public/images/record-cut.jpg

These names suggest they were meant to support grooming, booking, content, and brand moments. They are not currently wired into the public pages, so they should be assigned to the relevant site-content slots above.

## Recommended delivery order
1. Logo
2. Hero image
3. Proof images (3)
4. Founder portrait
5. Default barber avatar
6. Service images (6)
7. Background images (shared + page-specific)
8. CTA image
