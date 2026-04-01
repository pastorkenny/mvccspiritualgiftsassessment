import { GiftCategory } from '@/types';
import { passionToOpportunities } from './passion-mappings';
import { skillToOpportunities } from './skill-mappings';

const MP_BASE_URL = 'https://mvccfrederick.org/opportunity-details/?id=';

export interface Opportunity {
  id: number;
  title: string;
  description: string;
}

// All Ministry Platform opportunities referenced in mappings
export const opportunities: Record<number, Opportunity> = {
  44: { id: 44, title: "Meals Ministry Team", description: "Provide meals for those in need due to newborn babies, death in the family, or medical issues." },
  51: { id: 51, title: "Ushers", description: "Help with finding seats, greeting guests, handing out bulletins — First Impressions Team." },
  52: { id: 52, title: "Children's Ministry Volunteer", description: "Serve in God's Backyard planting seeds of faith in the next generation." },
  55: { id: 55, title: "Connectors", description: "Connect with people as they enter, help them find their way, and equip them to worship." },
  56: { id: 56, title: "Student Ministry (Middle School)", description: "Invest in middle schoolers on Wednesday nights through mentoring and community." },
  57: { id: 57, title: "Student Ministry (High School)", description: "Walk alongside high schoolers on Sunday nights as they grow in faith." },
  58: { id: 58, title: "Student Ministry (College)", description: "Serve in college ministry, investing in college-age students as they grow in faith." },
  59: { id: 59, title: "Worship Tech Team", description: "Run sound, projection, and programming to support worship services." },
  61: { id: 61, title: "Outreach Team", description: "Show care and grace through acts of kindness and sharing the Gospel at local events." },
  62: { id: 62, title: "Safety & Security Team", description: "Help ensure a safe environment for everyone on campus." },
  72: { id: 72, title: "Parking", description: "Greet people in the parking lot, direct to spaces, and welcome arrivals." },
  73: { id: 73, title: "Prayer Team", description: "Lift up Spirit-led prayers for the needs of others and church leaders." },
  74: { id: 74, title: "Care Team", description: "Intentionally care for tangible needs, creating community by serving people in need." },
  75: { id: 75, title: "Marriage Mentors", description: "Build Christ-centered marriages that glorify God and provide a foundation for the next generation." },
  109: { id: 109, title: "Children's Ministry Youth Helper", description: "Youth serving in God's Backyard to plant seeds of faith in the next generation." },
  219: { id: 219, title: "Child Care Team", description: "Support classes, groups, and events throughout the year caring for children." },
  239: { id: 239, title: "Grounds Team", description: "Care for church grounds by mowing, landscaping, and helping with outdoor needs." },
  240: { id: 240, title: "Worship Team", description: "Serve through vocals, electric guitar, acoustic guitar, bass, keys, or drums." },
  54: { id: 54, title: "Coffee Bar", description: "Create a welcoming atmosphere by serving coffee and refreshments." },
  224: { id: 224, title: "Hospitality Team", description: "Help create a warm and inviting experience for everyone at MVCC." },
  900: { id: 900, title: "MVU Course Facilitator", description: "Teach or facilitate Mountain View University courses that help people grow in faith." },
};

// Gift → most relevant MP opportunity IDs
export const giftToOpportunities: Record<GiftCategory, number[]> = {
  teaching: [900, 52, 56, 57, 58],
  pastoring: [75, 74, 57, 58],
  mercy: [74, 44, 73],
  hospitality: [54, 55, 224, 51, 72],
  serving: [51, 72, 44, 239],
  leadership: [57, 56, 58, 240],
  evangelism: [61, 55],
  exhortation: [74, 75, 73],
  administration: [59, 62],
  giving: [61, 44],
  wisdom: [75, 73, 900],
};

// Questionnaire team name → closest MP opportunity ID
// "Young Adult/College" has no direct MP opportunity, so it's omitted
export const teamToOpportunity: Record<string, number> = {
  "Babies & Toddlers (Nursery)": 219,
  "School Age": 52,
  "Middle School Students": 56,
  "High School Students": 57,
  "Marriage Ministry": 75,
  "Outreach Ministry": 61,
  "Adoption & Foster Support": 74,
  "Women's Ministry": 74,
  "Men's Ministry": 74,
  "Young Adult/College": 58,
  "Mountain View University": 900,
};

export function getOpportunityUrl(id: number): string {
  if (id === 900) return 'https://mvccfrederick.com/mvu';
  return `${MP_BASE_URL}${id}`;
}

export interface SignUpOpportunity extends Opportunity {
  reason: string;
}

interface ScoredOpportunity {
  id: number;
  score: number;
  reasons: string[];
}

/**
 * Scores each of the 18 opportunities across all 4 dimensions and returns top 3.
 * Scoring:
 *   Gift #1 match: 5 pts, Gift #2: 4 pts, Gift #3: 3 pts
 *   Team interest match: 3 pts
 *   Passion match: 2 pts
 *   Skill match: 2 pts
 */
export function getTopSignUpOpportunities(
  topGifts: Array<{ gift: GiftCategory; score: number }>,
  teamInterests: string[],
  passions: string[] = [],
  skills: string[] = []
): SignUpOpportunity[] {
  const scoreMap = new Map<number, ScoredOpportunity>();

  const ensureEntry = (id: number): ScoredOpportunity => {
    if (!scoreMap.has(id)) {
      scoreMap.set(id, { id, score: 0, reasons: [] });
    }
    return scoreMap.get(id)!;
  };

  // Gift scoring: #1 = 5pts, #2 = 4pts, #3 = 3pts
  const giftWeights = [5, 4, 3];
  topGifts.slice(0, 3).forEach(({ gift }, index) => {
    const oppIds = giftToOpportunities[gift] || [];
    const giftDisplayName = gift.charAt(0).toUpperCase() + gift.slice(1);
    oppIds.forEach((id: number) => {
      if (!opportunities[id]) return;
      const entry = ensureEntry(id);
      entry.score += giftWeights[index];
      entry.reasons.push(`${giftDisplayName} gift`);
    });
  });

  // Team interest scoring: 3 pts each
  teamInterests.forEach((teamName: string) => {
    const oppId = teamToOpportunity[teamName];
    if (oppId && oppId > 0 && opportunities[oppId]) {
      const entry = ensureEntry(oppId);
      entry.score += 3;
      entry.reasons.push('your interests');
    }
  });

  // Passion scoring: 2 pts each
  passions.forEach((passion: string) => {
    const oppIds = passionToOpportunities[passion] || [];
    oppIds.forEach((id: number) => {
      if (!opportunities[id]) return;
      const entry = ensureEntry(id);
      entry.score += 2;
      entry.reasons.push('your passions');
    });
  });

  // Skill scoring: 2 pts each
  skills.forEach((skill: string) => {
    const oppIds = skillToOpportunities[skill] || [];
    oppIds.forEach((id: number) => {
      if (!opportunities[id]) return;
      const entry = ensureEntry(id);
      entry.score += 2;
      entry.reasons.push('your skills');
    });
  });

  // Sort by score descending, take top 3
  const sorted = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return sorted.map(({ id, reasons }) => {
    const opp = opportunities[id];
    // Deduplicate reasons
    const uniqueReasons = [...new Set(reasons)];
    const reason = uniqueReasons.length > 1
      ? `Matches ${uniqueReasons.slice(0, -1).join(', ')} & ${uniqueReasons[uniqueReasons.length - 1]}`
      : `Matches ${uniqueReasons[0]}`;
    return { ...opp, reason };
  });
}
