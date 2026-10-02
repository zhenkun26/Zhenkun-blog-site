# Asset brief

This brief records the current asset inventory and a safe intake/publication contract for Zhenkun-blog-site. It is based on filesystem, Git, configuration, and image-decoder inspection on 2026-10-01 (America/New_York). It does not schedule work or duplicate task status: [ROADMAP](../../docs/ROADMAP.md) remains the single task-state source. See the [reference-site assessment](report.md) and [architecture proposal](../../docs/ARCHITECTURE.md) for context.

The correctness repairs already identified for paths, feeds, search, and keyboard interaction require **no new photographs or illustrations**. The existing avatar and five wallpaper candidates are available. New material should follow an approved content or visual purpose rather than delay those repairs.

## Verified existing assets

The six files introduced by commit `703656465c2f9e90b12d112c0970f76b38e9ee42` are still present and tracked. Pillow decoded each as a single-frame RGB AVIF image; no EXIF or other decoder-exposed `info` fields were reported. This is a decoder check, not a comprehensive privacy or rights audit. Existing artwork rights have not been independently established by this brief.

| File | Dimensions | File size | Current configuration |
|---|---:|---:|---|
| [Avatar](../../src/assets/images/zhenkun/avatar.avif) | 1080 × 1079 | 64.9 KiB | Referenced by `profileConfig.avatar`; enabled |
| [Sandrone desktop candidate](../../src/assets/images/DesktopWallpaper/sandrone.avif) | 2056 × 1169 | 312.3 KiB | Available; not in the active wallpaper array |
| [Sangonomiya Kokomi desktop candidate](../../src/assets/images/DesktopWallpaper/sangonomiya-kokomi.avif) | 1828 × 860 | 290.8 KiB | Available; not in the active wallpaper array |
| [Aha desktop candidate](../../src/assets/images/DesktopWallpaper/aha.avif) | 1260 × 565 | 165.2 KiB | Available; not in the active wallpaper array |
| [Cyrene and Mimi mobile candidate](../../src/assets/images/MobileWallpaper/cyrene-and-mimi.avif) | 991 × 1587 | 388.3 KiB | Available; not in the active wallpaper array |
| [Nahida mobile candidate](../../src/assets/images/MobileWallpaper/nahida.avif) | 1080 × 2076 | 387.0 KiB | Available; not in the active wallpaper array |

The wallpaper arrays currently reference upstream `d1–d6` and `m1–m6`, not these five candidates. The supplied avatar is already selected. No existing material should be replaced, renamed, or moved in bulk as part of this proposal.

## Where the owner can provide material

Place originals under the existing ignored `tmp/` boundary. Only the folders needed for the chosen material need to be created.

| Purpose | Intake directory, relative to the repository root | Material and suggested composition | Need |
|---|---|---|---|
| Avatar | `tmp/asset-intake/raw/profile/` | A roughly square image with the subject clear near the center; existing avatar is sufficient | Already available |
| Desktop background | `tmp/asset-intake/raw/desktop/` | Landscape artwork or photograph, often around 16:9 or wider; space around the intended headline and a known subject focal point | Already available; replacement optional |
| Mobile background | `tmp/asset-intake/raw/mobile/` | Portrait composition, often around 9:16; room for headline/navigation without covering the main subject | Already available; replacement optional |
| Article image | `tmp/asset-intake/raw/posts/<slug>/` | A relevant photograph, diagram, or screenshot; a landscape cover can work near 2:1, while explanatory figures should preserve their natural ratio | Provide when an article benefits from it; an article may have no cover |
| Project evidence | `tmp/asset-intake/raw/projects/<slug>/` | Real project screenshots, architecture figures, or result images with credentials, private records, and unrelated people removed | Defer until the project presentation format is chosen |
| Public photo album | `tmp/asset-intake/raw/albums/<id>/` | Photographs intentionally approved for public display; mixed ratios are supported, with a separate landscape cover if needed | Defer until an album has actual content and an approved purpose |

These ratios are composition suggestions, not admission requirements. File dimensions alone do not establish suitability. Check actual subject cropping, text readability, loading cost, and the intended display before choosing a derivative.

`tmp/asset-intake/raw/` is **not a backup**. Keep the master originals in the owner's normal photo/archive storage. `git check-ignore -v` confirmed that intake paths match `.gitignore:52` (`tmp/`). Originals and their private notes must not be automatically staged, committed, uploaded, published, or cleaned up. The current no-filesystem-deletion instruction also applies to intake material.

## Accompanying notes

For each supplied image, add an adjacent note or a folder-level `asset-notes.md` mapping filenames to the following information. A plain Markdown note is sufficient; this is not an automated ingestion format.

| Field | Information to record |
|---|---|
| Intended use | Avatar, background, named article, named project, or named album; explain what the image contributes |
| Source and permission | Creator/source URL where applicable, ownership or license, and any attribution or reuse limits; a publicly accessible image is not permission to reuse it |
| Publication decision | Explicitly state whether the image and any people/locations in it may be public; record any areas requiring redaction |
| Subject focal point | Identify the subject or an approximate preferred focus, such as upper-right or `60% 30%`; note content that must not be cropped |
| Alternative description | Describe the meaningful content in the blog's content language; mark genuinely decorative material as decorative rather than inventing an informative description |
| Caption/context | Optional caption, project/article association, and whether date/location may be public |

Notes containing private identities, unpublished project details, or location information remain with the ignored raw intake. Only an approved public caption/description and necessary provenance belong in publishable content. No image-generation or external-image-copying step is implied.

## Verified publication contracts

### Shared image handling

[`ImageWrapper.astro`](../../src/components/common/ImageWrapper.astro) distinguishes source images, public assets, and remote URLs at lines 64–101. Local paths without a leading `/` resolve inside `src` and use Astro image processing; leading `/` paths address `public` and are published directly; HTTP URLs retain a remote-service dependency. The local lookup supports PNG, JPG/JPEG, WebP, and AVIF. The default image class uses `object-cover`, with `object-position` defaulting to the center at lines 43 and 95–98.

The current image output configuration is WebP at quality 85, as recorded in [`siteConfig.ts`](../../src/config/siteConfig.ts) at lines 323–330. An AVIF source file does not imply that the delivered optimized image is AVIF.

### Avatar and backgrounds

The active avatar path is `assets/images/zhenkun/avatar.avif`, relative to `src`; [`Profile.astro`](../../src/components/widget/Profile.astro) requests a 350-pixel image width at lines 32–40. Reviewed replacement derivatives can remain under `src/assets/images/zhenkun/` without changing existing upstream filenames.

[`WallpaperSection.astro`](../../src/components/layout/WallpaperSection.astro) requests desktop variants at 1280/1920 pixels and mobile variants at 640/828 pixels, using the viewport width in `sizes`. These are current component output choices, not mandatory input sizes. Mobile selection switches below the 1024-pixel breakpoint. Both surfaces use cover cropping and the configured background position. The active banner position is `0% 20%` in [`backgroundWallpaper.ts`](../../src/config/backgroundWallpaper.ts).

The homepage banner is 65vh; desktop non-home banners use a 45vh height with a 380-pixel floor, as defined in [`constants.ts`](../../src/constants/constants.ts) and applied by the layout. Cropping therefore varies with viewport shape. The smaller Aha image may look softer when enlarged on a wide desktop. Select and inspect a composition before tuning its focus; do not promise that every subject remains completely visible.

New approved background derivatives may use `src/assets/images/zhenkun/desktop/` or `src/assets/images/zhenkun/mobile/`. Existing candidate files stay where they are unless a later, specifically scoped migration is approved.

### Articles and project evidence

The post schema in [`content.config.ts`](../../src/content.config.ts) makes the `image` field optional, with an empty default. For new articles, a source-managed derivative can be colocated as `src/content/posts/<slug>/cover.avif`, referenced from the article with `image: "./cover.avif"`. [`PostCard.astro`](../../src/components/layout/PostCard.astro) and the article route pass the article file's directory as `basePath`, while [`url-utils.ts`](../../src/utils/url-utils.ts) removes the `src/` prefix at lines 67–69. Do not rewrite existing articles or relocate old assets just to adopt this convention.

The cover component currently produces an 828-pixel variant. Grid/mobile card covers use a 2:1 crop; the desktop list's side image uses a variable ratio. The default article detail view uses natural-height mode, while the optional title-overlay view uses a fixed-height crop. Important annotations should therefore be kept in an explanatory figure within the article rather than baked into a card cover.

There is no dedicated projects route or project content collection in the inspected repository. Until an architecture decision establishes one, project screenshots can accompany a genuine project article using its existing content directory. Intake folder names do not create a new site section or authorize publishing a project.

### Albums and privacy

[`gallery-utils.ts`](../../src/utils/gallery-utils.ts) currently scans `public/gallery/<id>/` for JPG/JPEG, PNG, WebP, AVIF, and GIF files, optionally adding remote URLs from `urls.txt`. Cover selection is explicit cover → `cover.*` → first image. The album card uses a 4:3 crop, the detail banner uses an approximately 3:1 crop with height constraints, and photo cards retain natural image height.

Only reviewed **public derivatives** belong in `public/gallery/<id>/`. They bypass Astro image optimization and are reachable as static files. Strip unnecessary metadata, confirm public consent, prepare suitable display-size copies, and inspect the result before publication. Originals or private photos must never be put in `public`.

The album password encrypts the rendered photo-list HTML through [`EncryptedContent.astro`](../../src/components/features/EncryptedContent.astro); it does **not** encrypt or protect the image files in `public`. The cover is also rendered outside that password region in [`gallery/[album].astro`](../../src/pages/gallery/[album].astro). A private-photo requirement would need a separate access-control/storage architecture and approval; the current static gallery must not be presented as private storage.

## Asset handoff

Use the existing project process: retain raw originals, record provenance/publication intent, produce a separately named publishable derivative, wire only the approved use, inspect desktop/mobile cropping, and keep acceptance evidence in `references/`. Update task status only in ROADMAP. This brief is an inventory and contract, not permission to publish, add dependencies, delete files, deploy, or migrate existing assets.
