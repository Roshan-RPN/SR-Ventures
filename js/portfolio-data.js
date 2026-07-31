/* Portfolio data — single source of truth (Sanity-ready shape).
   To add a project later, add one object here (or swap this array for a
   fetch() to a CMS). img is relative to site root.
   Category map (image number → category), fixed per client brief:
   exterior 2,3,4,8,14,22,23 · interior 11,13 · kitchen 1,10,15,17,18 ·
   bedroom 5,9,24 · livingroom 6,12,16 · diningroom 7,19 · wardrobe 20,21 */
window.SR_CAT_LABELS = {
  exterior: "Exterior", interior: "Interior", kitchen: "Kitchen", bedroom: "Bedroom",
  livingroom: "Living Room", diningroom: "Dining Room", wardrobe: "Wardrobe"
};
/* ALT TEXT RULE (read before editing):
   Each alt describes what is actually in the photo FIRST, then anchors it to the
   service and place — e.g. "…modular kitchen built by SR Ventures in Kollam,
   Kerala". That ordering matters: alt text exists for screen-reader users, so the
   description has to lead and stay truthful. The location tail is what makes the
   image eligible for "modular kitchen Kollam"-type image search, which the old
   generic captions ("Kitchen with copper-toned upper cabinets") could never rank
   for. Keep them under ~125 characters — screen readers cut off around there — and
   never repeat the same phrasing twice, or it reads as keyword stuffing. */
window.SR_PROJECTS = [
  /* first six pinned per client request — order fixed, do not auto-shuffle */
  { img: "Images/web/flat-roof-modern-home-landscaped-lawn-kollam.webp",  title: "Garden Elevation",       category: "exterior",   alt: "Flat-roof modern home with landscaped lawn, built by SR Ventures in Kollam, Kerala" },
  { img: "Images/web/master-bedroom-slate-feature-wall-kerala.webp",  title: "Slate Master Suite",     category: "bedroom",    alt: "Master bedroom with textured slate feature wall, interior design by SR Ventures, Kerala" },
  { img: "Images/web/living-room-marble-media-wall-kerala.webp",  title: "Marble Living Room",     category: "livingroom", alt: "Living room with marble media wall and ceiling fan in a Kerala home by SR Ventures" },
  { img: "Images/web/dining-room-timber-table-sheer-curtains-kollam.webp", title: "Daylight Dining",        category: "diningroom", alt: "Dining room with timber table and sheer curtains, interior work by SR Ventures, Kollam" },
  { img: "Images/web/panelled-wardrobe-timber-inlay-kerala.webp", title: "Panelled Wardrobe",      category: "wardrobe",   alt: "Minimal panelled wardrobe with timber inlay, custom joinery by SR Ventures, Kerala" },
  { img: "Images/web/sage-green-modular-kitchen-island-kerala.webp",  title: "Sage Island Kitchen",    category: "kitchen",    alt: "Sage-green modular kitchen with island and hanging plants, fitted by SR Ventures in Kerala" },
  { img: "Images/web/modern-home-exterior-courtyard-entrance-kollam.webp", title: "Courtyard Facade",       category: "exterior",   alt: "Modern home exterior with courtyard entrance, turnkey build by SR Ventures, Kollam" },
  { img: "Images/web/white-contemporary-kerala-home-balconies.webp",  title: "White Gable Home",       category: "exterior",   alt: "White contemporary Kerala home with balconies, designed and built by SR Ventures" },
  { img: "Images/web/l-shaped-timber-white-modular-kitchen-kerala.webp", title: "Timber Galley",          category: "kitchen",    alt: "L-shaped kitchen in timber and white cabinetry, modular kitchen work by SR Ventures, Kerala" },
  { img: "Images/web/living-area-sectional-sofa-warm-ceiling-kollam.webp", title: "Living, Reframed",       category: "livingroom", alt: "Bright living area with sectional sofa and warm ceiling, interiors by SR Ventures, Kollam" },
  { img: "Images/web/bedroom-cove-lighting-platform-bed-kerala.webp",  title: "Golden Bedroom",         category: "bedroom",    alt: "Bedroom with warm cove lighting and platform bed, interior design by SR Ventures, Kerala" },
  { img: "Images/web/two-storey-home-night-facade-kerala.webp", title: "Night Facade",           category: "exterior",   alt: "Contemporary two-storey home glowing at night, constructed by SR Ventures in Kerala" },
  { img: "Images/web/modular-kitchen-copper-upper-cabinets-kollam.webp", title: "Copper Kitchen",         category: "kitchen",    alt: "Modular kitchen with copper-toned upper cabinets, installed by SR Ventures, Kollam" },
  { img: "Images/web/kids-bedroom-teal-accent-wall-fitted-storage-kerala.webp", title: "Kids' Room",             category: "bedroom",    alt: "Kids bedroom with teal accent wall and fitted storage, interiors by SR Ventures, Kerala" },
  { img: "Images/web/traditional-kerala-home-sloped-tiled-roof-kollam.webp", title: "Heritage Villa",         category: "exterior",   alt: "Traditional Kerala home with sloped tiled roof, built by SR Ventures near Kollam" },
  { img: "Images/web/entrance-foyer-carved-partition-cove-lighting-kerala.webp", title: "Carved Foyer",           category: "interior",   alt: "Entrance foyer with carved partition and cove lighting, interior work by SR Ventures, Kerala" },
  { img: "Images/web/full-height-fitted-wardrobe-study-nook-kollam.webp", title: "Fitted Wardrobe Wall",   category: "wardrobe",   alt: "Full-height fitted wardrobe with study nook, custom furniture by SR Ventures, Kollam" },
  { img: "Images/web/open-plan-dining-living-kerala-home.webp",  title: "Open Dining",            category: "diningroom", alt: "Open-plan dining space flowing into the living area in a Kerala home by SR Ventures" },
  { img: "Images/web/sculpted-false-ceiling-warm-lighting-kerala.webp", title: "Sculpted Ceiling",       category: "interior",   alt: "Sculpted false ceiling with warm lighting, interior finishing by SR Ventures, Kerala" },
  { img: "Images/web/kerala-home-layered-sloping-tiled-roofs.webp",  title: "Tiled-Roof Home",        category: "exterior",   alt: "Large Kerala home with layered sloping tiled roofs, turnkey build by SR Ventures" },
  { img: "Images/web/l-shaped-kitchen-timber-cabinets-granite-counters-kollam.webp", title: "Classic Wood Kitchen",   category: "kitchen",    alt: "L-shaped kitchen with timber cabinets and granite counters by SR Ventures, Kollam" },
  { img: "Images/web/open-kitchen-walnut-island-pendant-lights-kerala.webp", title: "Walnut Breakfast Bar",   category: "kitchen",    alt: "Open kitchen with walnut island, pendant lights and bar stools by SR Ventures, Kerala" },
  { img: "Images/web/rosewood-ivory-modular-kitchen-marble-floor-kollam.webp", title: "Rosewood & Ivory Kitchen", category: "kitchen",  alt: "Two-tone rosewood and ivory modular kitchen with marble floor by SR Ventures, Kollam" },
  { img: "Images/web/modern-kerala-villa-dusk-carport.webp",  title: "Twilight Villa",         category: "exterior",   alt: "Modern Kerala villa lit at dusk with carport, designed and built by SR Ventures" },
  { img: "Images/web/modular-kitchen-cream-berry-cabinets-kerala.webp", title: "Berry Modular Kitchen",  category: "kitchen",    alt: "Modular kitchen with cream and berry-toned cabinets, fitted by SR Ventures in Kerala" },
  { img: "Images/web/living-room-tan-corner-sofa-amber-lighting.webp", title: "Amber Lounge",           category: "livingroom", alt: "Living room with tan corner sofa and warm amber lighting, interiors by SR Ventures" }
];
