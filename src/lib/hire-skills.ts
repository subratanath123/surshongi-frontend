import type { Role } from "@/data/catalog";

export type HireSkill = {
  id:
    | "vocalistHire"
    | "guitaristHire"
    | "tablaHire"
    | "drummerHire"
    | "fluteHire"
    | "harmoniumHire"
    | "violinHire"
    | "keyboardHire"
    | "bassHire"
    | "dholHire"
    | "mixing"
    | "mastering"
    | "beatmakers";
  token: string;
  terms: string[];
  roles: Role[];
  useRole: boolean;
  image: string;
  position: string;
  onHome: boolean;
};

/** Skills a musician can tap on their profile. Home hire cards use the same terms. */
export const hireSkills: HireSkill[] = [
  {
    id: "vocalistHire",
    token: "Vocals",
    terms: ["vocal", "singer", "কণ্ঠ"],
    roles: ["vocalist"],
    useRole: true,
    image: "/covers/cover-mic.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "guitaristHire",
    token: "Guitar",
    terms: ["guitar", "গিটার"],
    roles: ["guitarist"],
    useRole: true,
    image: "/covers/cover-guitar.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "tablaHire",
    token: "Tabla",
    terms: ["tabla", "তবলা"],
    roles: [],
    useRole: false,
    image: "/covers/cover-tabla.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "drummerHire",
    token: "Drums",
    terms: ["drum", "ড্রাম"],
    roles: [],
    useRole: false,
    image: "/covers/cover-drums.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "fluteHire",
    token: "Flute",
    terms: ["flute", "bansuri", "বাঁশি"],
    roles: ["flute"],
    useRole: true,
    image: "/covers/cover-flute.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "harmoniumHire",
    token: "Harmonium",
    terms: ["harmonium", "হারমোনিয়াম", "হারমোনিয়াম"],
    roles: [],
    useRole: false,
    image: "/covers/cover-harmonium.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "violinHire",
    token: "Violin",
    terms: ["violin", "বেহালা"],
    roles: [],
    useRole: false,
    image: "/covers/cover-violin.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "keyboardHire",
    token: "Keyboard",
    terms: ["keyboard", "piano", "কীবোর্ড", "পিয়ানো", "পিয়ানো"],
    roles: [],
    useRole: false,
    image: "/covers/cover-keyboard.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "bassHire",
    token: "Bass",
    terms: ["bass", "বেস"],
    roles: [],
    useRole: false,
    image: "/covers/cover-bass.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "dholHire",
    token: "Dhol",
    terms: ["dhol", "ঢোল"],
    roles: [],
    useRole: false,
    image: "/covers/cover-dhol.jpg",
    position: "center",
    onHome: true,
  },
  {
    id: "mixing",
    token: "Mixing",
    terms: ["mixing", "মিক্সিং"],
    roles: ["producer"],
    useRole: true,
    image: "/covers/cover-mixing.jpg",
    position: "center",
    onHome: false,
  },
  {
    id: "mastering",
    token: "Mastering",
    terms: ["mastering", "মাস্টারিং"],
    roles: ["producer"],
    useRole: true,
    image: "/covers/cover-mastering.jpg",
    position: "center",
    onHome: false,
  },
  {
    id: "beatmakers",
    token: "Beats",
    terms: ["beat", "বিট"],
    roles: ["producer"],
    useRole: true,
    image: "/covers/cover-beats.jpg",
    position: "center",
    onHome: false,
  },
];

export function skillIsOn(skill: HireSkill, instruments: string[]) {
  const hay = instruments.join(" ").toLowerCase();
  return skill.terms.some((term) => hay.includes(term.toLowerCase()));
}

export function toggleSkill(instruments: string[], skill: HireSkill) {
  if (skillIsOn(skill, instruments)) {
    return instruments.filter(
      (item) => !skill.terms.some((term) => item.toLowerCase().includes(term.toLowerCase())),
    );
  }
  return [...instruments, skill.token].slice(0, 12);
}
