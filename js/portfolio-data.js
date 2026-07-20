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
window.SR_PROJECTS = [
  /* first six feed the home-page grid — keep them watermark-free */
  { img: "Images/web/8.webp",  title: "Twilight Villa",         category: "exterior",   alt: "Modern Kerala villa lit up at dusk with carport" },
  { img: "Images/web/10.webp", title: "Berry Modular Kitchen",  category: "kitchen",    alt: "Modular kitchen with cream and berry-toned cabinets" },
  { img: "Images/web/12.webp", title: "Amber Lounge",           category: "livingroom", alt: "Warm living room with tan corner sofa" },
  { img: "Images/web/5.webp",  title: "Slate Master Suite",     category: "bedroom",    alt: "Master bedroom with textured slate feature wall" },
  { img: "Images/web/19.webp", title: "Daylight Dining",        category: "diningroom", alt: "Dining room with timber table and sheer curtains" },
  { img: "Images/web/21.webp", title: "Panelled Wardrobe",      category: "wardrobe",   alt: "Minimal panelled wardrobe with timber inlay" },
  { img: "Images/web/14.webp", title: "Night Facade",           category: "exterior",   alt: "Contemporary two-storey home glowing at night" },
  { img: "Images/web/1.webp",  title: "Sage Island Kitchen",    category: "kitchen",    alt: "Open kitchen with sage-green island and bar seating" },
  { img: "Images/web/16.webp", title: "Living, Reframed",       category: "livingroom", alt: "Bright living area with sectional sofa and warm ceiling" },
  { img: "Images/web/9.webp",  title: "Golden Bedroom",         category: "bedroom",    alt: "Bedroom with warm cove lighting and platform bed" },
  { img: "Images/web/6.webp",  title: "Marble Living Room",     category: "livingroom", alt: "Living room with marble media wall and ceiling fan" },
  { img: "Images/web/20.webp", title: "Fitted Wardrobe Wall",   category: "wardrobe",   alt: "Full-height fitted wardrobe with study nook" },
  { img: "Images/web/2.webp",  title: "White Gable Home",       category: "exterior",   alt: "White contemporary Kerala home with balconies" },
  { img: "Images/web/11.webp", title: "Carved Foyer",           category: "interior",   alt: "Entrance foyer with carved partition and cove lighting" },
  { img: "Images/web/15.webp", title: "Copper Kitchen",         category: "kitchen",    alt: "Kitchen with copper-toned upper cabinets" },
  { img: "Images/web/24.webp", title: "Kids' Room",             category: "bedroom",    alt: "Playful kids bedroom with teal accent wall" },
  { img: "Images/web/4.webp",  title: "Garden Elevation",       category: "exterior",   alt: "Flat-roof modern home with landscaped lawn" },
  { img: "Images/web/13.webp", title: "Sculpted Ceiling",       category: "interior",   alt: "Interior with sculpted false ceiling and warm lighting" },
  { img: "Images/web/18.webp", title: "Sage Kitchen II",        category: "kitchen",    alt: "Sage-green island kitchen, alternate view" },
  { img: "Images/web/17.webp", title: "Timber Galley",          category: "kitchen",    alt: "L-shaped kitchen with timber and white cabinetry" },
  { img: "Images/web/22.webp", title: "Courtyard Facade",       category: "exterior",   alt: "Modern home exterior with courtyard entrance" },
  { img: "Images/web/23.webp", title: "Heritage Villa",         category: "exterior",   alt: "Traditional Kerala home with sloped tiled roof" },
  { img: "Images/web/7.webp",  title: "Open Dining",            category: "diningroom", alt: "Open-plan dining space flowing into the living area" },
  { img: "Images/web/3.webp",  title: "Tiled-Roof Home",        category: "exterior",   alt: "Large home with layered sloping tiled roofs" }
];
