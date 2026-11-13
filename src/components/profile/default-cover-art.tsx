import type { Role } from "@/data/catalog";

export type CoverChoice = {
  id: string;
  src: string;
  roles: Role[];
  /** Lowercase words matched against the musician's genres and instruments. */
  terms: string[];
};

export const coverChoices: CoverChoice[] = [
  {
    id: "folk",
    src: "/covers/cover-guitar.jpg",
    roles: ["guitarist"],
    terms: ["folk", "লোক", "acoustic", "country"],
  },
  {
    id: "vocal",
    src: "/covers/cover-mic.jpg",
    roles: ["vocalist", "lyricist"],
    terms: ["vocal", "singer", "pop", "modern", "আধুনিক", "কণ্ঠ"],
  },
  {
    id: "studio",
    src: "/covers/cover-studio.jpg",
    roles: ["producer"],
    terms: ["producer", "mixing", "electronic", "hip-hop", "hip hop", "beat", "edm", "fusion", "studio", "মিক্স"],
  },
  {
    id: "percussion",
    src: "/covers/cover-tabla.jpg",
    roles: ["percussion"],
    terms: ["tabla", "drum", "percussion", "তবলা", "ড্রাম", "তাল"],
  },
  {
    id: "flute",
    src: "/covers/cover-flute.jpg",
    roles: ["flute"],
    terms: ["flute", "bansuri", "বাঁশি", "বাঁশী"],
  },
  {
    id: "classical",
    src: "/covers/cover-classical.jpg",
    roles: [],
    terms: ["classical", "শাস্ত্র", "rabindra", "রবীন্দ্র", "nazrul", "নজরুল", "harmonium", "sitar"],
  },
  {
    id: "baul",
    src: "/covers/cover-baul.jpg",
    roles: [],
    terms: ["baul", "বাউল", "ektara"],
  },
  {
    id: "rock",
    src: "/covers/cover-rock.jpg",
    roles: [],
    terms: ["rock", "metal", "রক"],
  },
];

export function coverMatchScore(choice: CoverChoice, hints: string[], role?: string) {
  const blob = hints.join(" ").toLowerCase();
  let score = 0;
  for (const term of choice.terms) {
    if (blob.includes(term.toLowerCase())) score += 5;
  }
  if (role && choice.roles.includes(role as Role)) score += 2;
  return score;
}

export function rankedCovers(hints: string[] = [], role?: string) {
  return coverChoices
    .map((cover, index) => ({
      cover,
      index,
      score: coverMatchScore(cover, hints, role),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

export function getDefaultCoverUrl(seed = "surshongi", role?: string, hints: string[] = []): string {
  const ranked = rankedCovers(hints, role);
  if (ranked[0] && ranked[0].score > 0) return ranked[0].cover.src;
  const index =
    seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % coverChoices.length;
  return coverChoices[index]!.src;
}

export function DefaultCoverArt({
  seed = "surshongi",
  role,
  hints = [],
  positionY = 50,
}: {
  seed?: string;
  role?: string;
  hints?: string[];
  compact?: boolean;
  positionY?: number;
}) {
  const src = getDefaultCoverUrl(seed, role, hints);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#120d0a]" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover select-none"
        style={{ objectPosition: `center ${positionY}%` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/25 to-transparent" />
    </div>
  );
}
