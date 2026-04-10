import { suggestTags, calculateMatchScore } from "../lib/fashion-engine";

console.log("--- 🕵️ Testing Creative AI Fashion Engine (27-Event High-Fi) ---");

const testCases = [
  {
    name: "Lace Dress with Gele",
    description: "Rich auntie vibes for a Saturday Owambe. Matching coral beads included."
  },
  {
    name: "Ankara Kente Blend Agbada",
    description: "Traditional regalia for the Clan's knocking ceremony. Ancestral chic."
  },
  {
    name: "Oversized Streetwear Hoodie",
    description: "Graphic urban techwear for the airport or long haul travel."
  },
  {
    name: "Clean Girl Aesthetic Linen Set",
    description: "Minimalist pastel flowy set perfect for bottomless brunch and mimosas."
  },
  {
    name: "Smart Corporate Ankara Blazer",
    description: "Modern professional disruption for a tech mixer or boardroom innovation."
  }
];

testCases.forEach(p => {
  console.log(`\n📄 PRODUCT: ${p.name}`);
  const { styles, keywords } = suggestTags(p.name, p.description);
  console.log(`✨ Detected Styles: ${styles.join(", ")}`);
  console.log(`🏷️  Detected Keywords: ${keywords.join(", ")}`);
});

const eventPool = [
  { name: "Owambe", searchKeywords: ["owambe", "spraying", "rich auntie", "gele"] },
  { name: "Traditional", searchKeywords: ["knocking", "kente", "agbada", "introduction"] },
  { name: "Travel", searchKeywords: ["airport", "long haul", "travel", "comfort"] },
  { name: "Brunch", searchKeywords: ["brunch", "mimosa", "chic", "linen"] }
];

console.log("\n--- 🎯 TESTING MATCH SCORES ---");
eventPool.forEach(e => {
  console.log(`\n📅 EVENT: ${e.name}`);
  testCases.forEach(p => {
    const score = calculateMatchScore(p, e);
    if (score > 10) {
      console.log(`✅ ${p.name}: ${score}% Match`);
    }
  });
});
