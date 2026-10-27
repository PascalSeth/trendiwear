const raw2 = `## What People Are Buying Right Now: Accra

### Most Popular Clothes & What Buyers Pay
| Outfit Style | How Many People Want It | Normal Price in Accra | Best Fabric to Use |
| Corset Tops & Dresses | Very High (94/100) | GH₵ 380 - GH₵ 550 | Duchess Satin, Brocade |
| Relaxed 2-Piece Linen Sets | Very High (91/100) | GH₵ 220 - GH₵ 340 | Pure Linen |
| Silk & Satin Boubous | High (88/100) | GH₵ 450 - GH₵ 750 | Raw Silk, Chiffon |
| Maxi Print Dresses | High (82/100) | GH₵ 260 - GH₵ 420 | Quality African Print |
| Tailored Kaftans | High (79/100) | GH₵ 320 - GH₵ 490 | Guinea Brocade, Cotton |

### Top 3 Pieces to Sew & Sell This Week
1. **Structured Corset Top**: Very popular for weekend dinners and parties. Best fabrics: Duchess Satin or boned print. Suggested price: GH₵ 380.
2. **Relaxed Linen 2-Piece Set**: Easy everyday wear for warm weather. Earth colors like chocolate brown and olive green sell fastest. Suggested price: GH₵ 260.
3. **Clean Embroidered Kaftan**: High profit margin. Best fabric: Guinea brocade with neat neckline seams. Suggested price: GH₵ 520.

### Simple Tips for Buying Fabric
- Buy your fabric early in the week at local markets before weekend prices go up.
- Sew only 2 or 3 sample pieces first (Sizes M and L) before making more, so you do not get stuck with unsold stock.`;

function preprocessMarkdownNew(raw) {
  if (!raw) return "";

  let text = raw.replace(/\r\n/g, "\n");

  // 1. Separate common intelligence headings that have a leading bullet or dash
  const commonHeaders = [
    "Strategic Recommendations & Benchmark Pricing",
    "Tactical \\d+-Day Implementation Directives",
    "Top \\d+ Pieces to Sew & Sell This Week",
    "Simple Tips for Buying Fabric",
    "Best Clothes to Sew & Sell",
    "What Buyers Want in [^\\n:]+",
    "Market Advice[^\\n:]*",
    "Immediate Reorder Priorities",
    "High-Converting Outfit & Service Bundles",
    "Local Market Pricing Benchmarks",
    "Profit Margin Expansion Tactics",
    "Primary Conversion Bottlenecks",
    "7-Day Revenue Action Plan",
    "Actionable Quality Control Directives",
    "Actionable Quality Control",
    "Executive Summary",
    "Key Directives",
    "Top Viral Recommendation",
  ];

  for (const h of commonHeaders) {
    const regex = new RegExp(`(?:[-*•#\\s]*\\b(${h})\\b[:.]?)\\s*(?=(\\d+\\.|[-*•]|[A-Z]))`, "gi");
    text = text.replace(regex, "\n\n### $1\n\n");
  }

  // 2. Break inline numbered list items that were bunched onto a single line
  text = text.replace(/([^\n])\s+(\d+\.\s+\*\*)/g, "$1\n\n$2");
  text = text.replace(/([.!?])\s+(\d{1,2}\.\s+)/g, "$1\n\n$2");

  // 3. Break inline bullet items
  text = text.replace(/([^\n])\s+([-*•]\s+\*\*)/g, "$1\n\n$2");
  text = text.replace(/([.!?])\s+([-*•]\s+)/g, "$1\n\n$2");

  // 4. Ensure headings have empty lines before and after
  text = text.replace(/([^\n])\n(#{1,6}\s+[^\n]+)/g, "$1\n\n$2");
  text = text.replace(/(#{1,6}\s+[^\n]+)\n([^\n#])/g, "$1\n\n$2");

  // 5. Ensure numbered items have empty lines if preceded by non-list line
  text = text.replace(/([^\n0-9])\n(\d+\.\s+)/g, "$1\n\n$2");

  // 6. Ensure bullets have empty lines if preceded by non-bullet line
  text = text.replace(/([^\n\-*])\n([-*]\s+)/g, "$1\n\n$2");

  // 7. Ensure table lines are separated
  text = text.replace(/([^\n|])\n(\|)/g, "$1\n\n$2");
  text = text.replace(/(\|\n)([^\n|])/g, "$1\n\n$2");

  return text.trim();
}

console.log("=== TEST RAW2 RESULT ===");
const res2 = preprocessMarkdownNew(raw2);
const blocks2 = res2.split(/\n\n+/);
console.log("BLOCKS 2 COUNT:", blocks2.length);
blocks2.forEach((b, i) => console.log(`\n--- Block ${i} ---\n${b}`));
