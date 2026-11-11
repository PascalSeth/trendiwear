// lib/ai/market-radar/calendar-occasions.ts
/**
 * Verified Local and Regional Calendar Occasions Engine
 * 
 * Dynamic calculations for:
 * - Fixed national and cultural public holidays
 * - Movable Christian holidays (Easter, Good Friday, Kwahu Easter)
 * - Movable Islamic holidays (Eid al-Fitr, Eid al-Adha)
 * - Regional festivals (Homowo, Chale Wote, Hogbetsotso, December in GH)
 * - Lookahead preparation windows (e.g. 3-6 weeks production lead time)
 */

import { RadarOccasion } from "./types";

/**
 * Anonymous Gregorian Easter calculation (Meeus/Jones/Butcher algorithm)
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Approximate Islamic Lunar dates for given Gregorian year (Umm al-Qura alignment)
 */
function getIslamicHolidays(year: number): { eidAlFitr: Date; eidAlAdha: Date } {
  // Base reference points for recent years
  const eidFitrYearMap: Record<number, { m: number; d: number }> = {
    2023: { m: 3, d: 21 }, // April 21
    2024: { m: 3, d: 10 }, // April 10
    2025: { m: 2, d: 30 }, // March 30
    2026: { m: 2, d: 20 }, // March 20
    2027: { m: 2, d: 9 },  // March 9
    2028: { m: 1, d: 27 }, // Feb 27
  };

  const eidAdhaYearMap: Record<number, { m: number; d: number }> = {
    2023: { m: 5, d: 28 }, // June 28
    2024: { m: 5, d: 16 }, // June 16
    2025: { m: 5, d: 6 },  // June 6
    2026: { m: 4, d: 27 }, // May 27
    2027: { m: 4, d: 16 }, // May 16
    2028: { m: 4, d: 5 },  // May 5
  };

  const fitr = eidFitrYearMap[year] || { m: 2, d: 20 };
  const adha = eidAdhaYearMap[year] || { m: 4, d: 27 };

  return {
    eidAlFitr: new Date(Date.UTC(year, fitr.m, fitr.d)),
    eidAlAdha: new Date(Date.UTC(year, adha.m, adha.d)),
  };
}

function getFirstFridayOfDecember(year: number): Date {
  const d = new Date(Date.UTC(year, 11, 1));
  while (d.getUTCDay() !== 5) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

function getFirstSaturdayOfNovember(year: number): Date {
  const d = new Date(Date.UTC(year, 10, 1));
  while (d.getUTCDay() !== 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export interface OccasionSeed {
  id: string;
  name: string;
  category: RadarOccasion["category"];
  startDate: Date;
  endDate: Date;
  preparationDaysBefore: number;
  description: string;
  clothingImplications: string;
  sourceUrl?: string;
  applicableCountries: string[]; // e.g. ["GH", "NG", "ALL"]
}

export function generateCalendarOccasions(targetYear: number, countryCode: string = "GH"): OccasionSeed[] {
  const easterSun = getEasterSunday(targetYear);
  const goodFri = new Date(easterSun.getTime() - 2 * 86400000);
  const easterMon = new Date(easterSun.getTime() + 1 * 86400000);
  const { eidAlFitr, eidAlAdha } = getIslamicHolidays(targetYear);
  const farmersDay = getFirstFridayOfDecember(targetYear);
  const hogbetsotso = getFirstSaturdayOfNovember(targetYear);

  const list: OccasionSeed[] = [
    // Ghana / West Africa Independence & Public Holidays
    {
      id: `gh-independence-${targetYear}`,
      name: "Independence Day & Celebrations",
      category: "national_holiday",
      startDate: new Date(Date.UTC(targetYear, 2, 6)),
      endDate: new Date(Date.UTC(targetYear, 2, 6)),
      preparationDaysBefore: 30,
      description: "Official national holiday with schools and civic parades across Ghana.",
      clothingImplications: "High demand for youth khaki shorts, parade uniforms, and patriotic kente/ghana-flag motif accents.",
      sourceUrl: "https://www.mint.gov.gh/statutory-public-holidays/",
      applicableCountries: ["GH"],
    },
    {
      id: `easter-festival-${targetYear}`,
      name: "Easter Weekend & Kwahu Mountain Festival",
      category: "religious",
      startDate: goodFri,
      endDate: easterMon,
      preparationDaysBefore: 35,
      description: "Easter church celebrations followed by paragliding and social events in Kwahu, Eastern Region.",
      clothingImplications: "Church white & floral dresses for Easter Sunday; durable casual denim, linen sets, and festival outfits for Kwahu paragliding parties.",
      sourceUrl: "https://visitghana.com/events/kwahu-easter-festival/",
      applicableCountries: ["GH", "NG"],
    },
    {
      id: `eid-al-fitr-${targetYear}`,
      name: "Eid al-Fitr (End of Ramadan)",
      category: "religious",
      startDate: eidAlFitr,
      endDate: new Date(eidAlFitr.getTime() + 86400000),
      preparationDaysBefore: 30,
      description: "Islamic celebration following 30 days of Ramadan fasting with community prayers and family feasts.",
      clothingImplications: "Surge in bespoke Men's Kaftans, embroidered Boubous, and modest satin gowns for women.",
      sourceUrl: "https://visitghana.com/",
      applicableCountries: ["GH", "NG"],
    },
    {
      id: `eid-al-adha-${targetYear}`,
      name: "Eid al-Adha (Feast of Sacrifice)",
      category: "religious",
      startDate: eidAlAdha,
      endDate: new Date(eidAlAdha.getTime() + 2 * 86400000),
      preparationDaysBefore: 30,
      description: "Major Islamic holiday marked by communal Eid prayers and celebratory gatherings.",
      clothingImplications: "Luxurious embroidered agbadas, polished cotton kaftans, and matching family group textiles.",
      sourceUrl: "https://visitghana.com/",
      applicableCountries: ["GH", "NG"],
    },
    {
      id: `homowo-festival-${targetYear}`,
      name: "Homowo Harvest Festival",
      category: "festival",
      startDate: new Date(Date.UTC(targetYear, 7, 10)),
      endDate: new Date(Date.UTC(targetYear, 7, 24)),
      preparationDaysBefore: 25,
      description: "Traditional Ga harvest celebration across Accra (Jamestown, Osu, Teshie, La, Nungua).",
      clothingImplications: "Traditional Ga red-and-white festive textiles, plain white calico wrappers, and traditional accessories.",
      sourceUrl: "https://visitghana.com/festivals/homowo-festival/",
      applicableCountries: ["GH"],
    },
    {
      id: `chale-wote-${targetYear}`,
      name: "Chale Wote Street Art Festival",
      category: "cultural",
      startDate: new Date(Date.UTC(targetYear, 7, 21)),
      endDate: new Date(Date.UTC(targetYear, 7, 27)),
      preparationDaysBefore: 30,
      description: "West Africa's largest alternative arts and street fashion gathering in Jamestown / Osu, Accra.",
      clothingImplications: "Peak opportunity for edgy Afro-streetwear, graphic tees, upcycled denim, crochet tops, and adire sets.",
      sourceUrl: "https://visitghana.com/events/chale-wote-street-art-festival/",
      applicableCountries: ["GH"],
    },
    {
      id: `hogbetsotso-${targetYear}`,
      name: "Hogbetsotso Festival",
      category: "cultural",
      startDate: hogbetsotso,
      endDate: new Date(hogbetsotso.getTime() + 86400000),
      preparationDaysBefore: 28,
      description: "Historic migration festival of the Anlo Ewe people in Volta Region.",
      clothingImplications: "High demand for authentic woven Ewe Kente (Kete), velvet wraps, and regal ceremonial ensembles.",
      sourceUrl: "https://visitghana.com/festivals/hogbetsotso-festival/",
      applicableCountries: ["GH"],
    },
    {
      id: `farmers-day-${targetYear}`,
      name: "National Farmers Day Long Weekend",
      category: "national_holiday",
      startDate: farmersDay,
      endDate: new Date(farmersDay.getTime() + 86400000),
      preparationDaysBefore: 20,
      description: "Statutory national public holiday marking the official kick-off to December holiday travel.",
      clothingImplications: "Casual travel wear, weekend resort outfits, and early Christmas party orders.",
      sourceUrl: "https://www.mint.gov.gh/statutory-public-holidays/",
      applicableCountries: ["GH"],
    },
    {
      id: `december-in-gh-${targetYear}`,
      name: "December in GH & Holiday Festival Season",
      category: "festival",
      startDate: new Date(Date.UTC(targetYear, 11, 15)),
      endDate: new Date(Date.UTC(targetYear + 1, 0, 8)),
      preparationDaysBefore: 45,
      description: "Peak diaspora homecoming season with major music festivals (AfroFuture, Detty December), weddings, and private galas.",
      clothingImplications: "The highest grossing season in West Africa. Huge demand for gala dresses, luxury ready-to-wear, and wedding guest outfits.",
      sourceUrl: "https://visitghana.com/december-in-gh-events/",
      applicableCountries: ["GH", "NG"],
    },
    {
      id: `christmas-newyear-${targetYear}`,
      name: "Christmas, Boxing Day & New Year Cross-Over",
      category: "religious",
      startDate: new Date(Date.UTC(targetYear, 11, 24)),
      endDate: new Date(Date.UTC(targetYear + 1, 0, 2)),
      preparationDaysBefore: 45,
      description: "Christmas church services, family reunions, and Dec 31 Watch-Night church services.",
      clothingImplications: "Dec 31 church cross-over services have a massive cultural mandate for pure all-white lace and damask garments.",
      sourceUrl: "https://visitghana.com/",
      applicableCountries: ["GH", "NG", "ALL"],
    },
  ];

  return list.filter((occ) => occ.applicableCountries.includes("ALL") || occ.applicableCountries.includes(countryCode));
}

/**
 * Filter and resolve occasions relevant to the current analysis date and view mode
 */
export function resolveOccasionsForContext(
  analysisDate: Date,
  viewMode: "sell-now" | "prepare-next" | "explore-month",
  countryCode: string = "GH",
  selectedMonth?: number,
  selectedYear?: number
): RadarOccasion[] {
  const currentYear = analysisDate.getUTCFullYear();
  const yearsToScan = [currentYear, currentYear + 1];
  if (selectedYear && !yearsToScan.includes(selectedYear)) {
    yearsToScan.push(selectedYear);
  }

  const allOccasions: OccasionSeed[] = [];
  for (const y of yearsToScan) {
    allOccasions.push(...generateCalendarOccasions(y, countryCode));
  }

  const nowMs = analysisDate.getTime();

  return allOccasions
    .map((seed) => {
      const startMs = seed.startDate.getTime();
      const endMs = seed.endDate.getTime();
      const prepStartMs = startMs - seed.preparationDaysBefore * 86400000;

      const daysUntilStart = Math.round((startMs - nowMs) / 86400000);
      const daysUntilEnd = Math.round((endMs - nowMs) / 86400000);

      let timingPhase: RadarOccasion["timingPhase"] = "upcoming_prep";
      if (daysUntilEnd < 0) {
        timingPhase = "recently_ended";
      } else if (daysUntilStart <= 3 && daysUntilEnd >= 0) {
        timingPhase = "happening_now";
      } else {
        timingPhase = "upcoming_prep";
      }

      return {
        id: seed.id,
        name: seed.name,
        category: seed.category,
        startDate: formatDateISO(seed.startDate),
        endDate: formatDateISO(seed.endDate),
        timingPhase,
        preparationDaysBefore: seed.preparationDaysBefore,
        description: seed.description,
        clothingImplications: seed.clothingImplications,
        sourceUrl: seed.sourceUrl,
        daysUntilStart,
        prepStartMs,
        startMs,
        endMs,
      };
    })
    .filter((occ) => {
      if (viewMode === "sell-now") {
        // Happening now or starting within 14 days
        return (occ.daysUntilStart >= -3 && occ.daysUntilStart <= 16) || occ.timingPhase === "happening_now";
      }

      if (viewMode === "prepare-next") {
        // Starting in 14 to 65 days
        return occ.daysUntilStart > 10 && occ.daysUntilStart <= 65;
      }

      if (viewMode === "explore-month" && selectedMonth && selectedYear) {
        // Match occasions touching the target month and year
        const targetMonthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1)).getTime();
        const targetMonthEnd = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59)).getTime();
        return occ.startMs <= targetMonthEnd && occ.endMs >= targetMonthStart;
      }

      return occ.daysUntilStart >= -2 && occ.daysUntilStart <= 60;
    })
    .slice(0, 3)
    .map(({ prepStartMs, startMs, endMs, daysUntilStart, ...rest }): RadarOccasion => rest);
}

export const getOccasionsForContext = resolveOccasionsForContext;

