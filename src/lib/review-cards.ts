// Card layouts and menu-icon avatars a customer can pick when writing a homepage review.
// Keep in sync with the check constraints in 20261012000700_review_cards.sql.
export const CARD_STYLES = [
  { id: "classic", label: "Classic" },
  { id: "spotlight", label: "Spotlight" },
  { id: "bubble", label: "Bubble" },
  { id: "ribbon", label: "Ribbon" },
] as const;

// Icons for these live in TREAT_ICONS (components/home/review-card).
export const TREATS = [
  { id: "donut", label: "Donut" },
  { id: "roll", label: "Cinnamon Roll" },
  { id: "cookie", label: "Cookie" },
  { id: "tart", label: "Cookie Tart" },
] as const;

export type CardStyle = (typeof CARD_STYLES)[number]["id"];
export type Treat = (typeof TREATS)[number]["id"];
export const RATING_TITLES = ["", "Not for me", "It was okay", "Pretty good", "Really loved it", "Heavenly!"];
