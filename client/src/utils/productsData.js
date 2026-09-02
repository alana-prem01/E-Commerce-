export const PRODUCTS = [
  {
    id: 1,
    name: "Diamond Ring",
    title: "Diamond Ring",
    category: "rings",
    categoryName: "Rings",
    price: 499,
    formattedPrice: "$499",
    rating: 5,
    image: "/Rings.png",
    description: "Meticulously crafted 18K gold ring featuring a brilliant solitaire diamond.",
    details: [
      { label: "Material", value: "18K Gold" },
      { label: "Gemstone", value: "Solitaire Diamond" },
      { label: "Certification", value: "BIS Hallmarked" },
    ],
    isBestSeller: true,
  },
  {
    id: 2,
    name: "Gold Bangles",
    title: "Gold Bangles",
    category: "bangles",
    categoryName: "Bangles",
    price: 899,
    formattedPrice: "$899",
    rating: 5,
    image: "/necklase.png",
    description: "Elegant 22K handcrafted gold bangles with intricate heritage engraving.",
    details: [
      { label: "Material", value: "22K Yellow Gold" },
      { label: "Style", value: "Traditional Heritage" },
      { label: "Pack", value: "Set of 2" },
    ],
    isBestSeller: true,
  },
  {
    id: 3,
    name: "Emerald Necklace",
    title: "Emerald Necklace",
    category: "necklaces",
    categoryName: "Necklaces",
    price: 1299,
    formattedPrice: "$1,299",
    rating: 5,
    image: "/bracelets.png",
    description: "Stunning emerald pendant necklace paired with a delicate gold chain.",
    details: [
      { label: "Material", value: "18K Yellow Gold" },
      { label: "Main Stone", value: "Natural Emerald" },
      { label: "Chain Length", value: "18 Inches" },
    ],
    isBestSeller: true,
  },
  {
    id: 4,
    name: "Pearl Earrings",
    title: "Pearl Earrings",
    category: "earrings",
    categoryName: "Earrings",
    price: 299,
    formattedPrice: "$299",
    rating: 4,
    image: "/earrings.png",
    description: "Classic freshwater cultured pearl drop earrings in polished sterling silver.",
    details: [
      { label: "Material", value: "Sterling Silver" },
      { label: "Pearl Type", value: "Freshwater Pearl" },
      { label: "Closure", value: "Push Back" },
    ],
    isBestSeller: true,
  },
  {
    id: 5,
    name: "Silver Bracelet",
    title: "Silver Bracelet",
    category: "bracelets",
    categoryName: "Bracelets",
    price: 349,
    formattedPrice: "$349",
    rating: 5,
    image: "/bangles.png",
    description: "Contemporary 925 sterling silver cuff bracelet with sleek minimalist polish.",
    details: [
      { label: "Material", value: "925 Sterling Silver" },
      { label: "Finish", value: "Rhodium Plated" },
      { label: "Size", value: "Adjustable" },
    ],
    isBestSeller: true,
  },
  {
    id: 6,
    name: "Rose Gold Pendant",
    title: "Rose Gold Pendant",
    category: "pendants",
    categoryName: "Pendants",
    price: 420,
    formattedPrice: "$420",
    rating: 5,
    image: "/jhumkas.png",
    description: "Graceful rose gold heart pendant accented with sparkling pavé zircon.",
    details: [
      { label: "Material", value: "14K Rose Gold" },
      { label: "Stone", value: "Cubic Zirconia" },
    ],
    isBestSeller: false,
  },
  {
    id: 7,
    name: "Royal Diamond Chain",
    title: "Royal Diamond Chain",
    category: "chains",
    categoryName: "Chains",
    price: 750,
    formattedPrice: "$750",
    rating: 5,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400",
    description: "Luxurious 18K yellow gold chain crafted for daily elegance and special occasions.",
    details: [
      { label: "Material", value: "18K Gold" },
      { label: "Chain Style", value: "Rope Chain" },
    ],
    isBestSeller: false,
  },
  {
    id: 8,
    name: "Bridal Kundan Choker",
    title: "Bridal Kundan Choker",
    category: "bridal",
    categoryName: "Bridal",
    price: 1599,
    formattedPrice: "$1,599",
    rating: 5,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=400",
    description: "Regal bridal Kundan necklace set with handcrafted pearl drops.",
    details: [
      { label: "Material", value: "24K Gold Plated" },
      { label: "Collection", value: "Bridal Heritage" },
    ],
    isBestSeller: true,
  }
];

export const CATEGORIES = [
  { id: 1, name: "Rings", slug: "rings", count: "120+ Products", image: "/Rings.png" },
  { id: 2, name: "Necklaces", slug: "necklaces", count: "150+ Products", image: "/necklase.png" },
  { id: 3, name: "Bracelets", slug: "bracelets", count: "75+ Products", image: "/bracelets.png" },
  { id: 4, name: "Earrings", slug: "earrings", count: "200+ Products", image: "/earrings.png" },
  { id: 5, name: "Bangles", slug: "bangles", count: "85+ Products", image: "/bangles.png" },
  { id: 6, name: "Jhumkas", slug: "jhumkas", count: "95+ Products", image: "/jhumkas.png" },
];

export const getProductById = (id) => {
  const numId = Number(id);
  return PRODUCTS.find((p) => p.id === numId) || PRODUCTS[0];
};

export const getProductsByCategory = (categorySlug) => {
  if (!categorySlug || categorySlug === 'all') return PRODUCTS;
  const slug = categorySlug.toLowerCase();
  return PRODUCTS.filter(
    (p) => p.category.toLowerCase() === slug || p.categoryName.toLowerCase() === slug
  );
};
