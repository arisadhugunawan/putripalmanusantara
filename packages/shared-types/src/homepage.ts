export interface HomepageStatistic {
  id: string;
  label: string;
  value: string;
  icon: string | null;
  order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  status: "draft" | "published";
}
