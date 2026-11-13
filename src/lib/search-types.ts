import type { DbUser } from "@/lib/db-types";

export type SemanticReason =
  | "semantic"
  | "name"
  | "location"
  | "skill"
  | "genre"
  | "showcase"
  | "budget";

export type MatchSource =
  | "showcase"
  | "post"
  | "bio"
  | "skills"
  | "genres"
  | "location"
  | "name"
  | "profile";

export type SemanticMusicianHit = {
  user: DbUser;
  similarity: number;
  reasons: SemanticReason[];
  matchedText: string;
  matchedSource: MatchSource;
  matchedTerms: string[];
  showcaseCount: number;
  thumbnailYoutubeId?: string;
};
