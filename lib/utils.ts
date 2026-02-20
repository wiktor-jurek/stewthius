import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIngredientIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("garlic")) return "🧄";
  if (lower.includes("onion") || lower.includes("shallot")) return "🧅";
  if (lower.includes("mushroom")) return "🍄";
  if (
    lower.includes("pepper") ||
    lower.includes("chili") ||
    lower.includes("jalapeño")
  )
    return "🌶️";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("potato")) return "🥔";
  if (lower.includes("carrot")) return "🥕";
  if (
    lower.includes("basil") ||
    lower.includes("thyme") ||
    lower.includes("rosemary") ||
    lower.includes("parsley") ||
    lower.includes("cilantro") ||
    lower.includes("oregano") ||
    lower.includes("dill") ||
    lower.includes("mint") ||
    lower.includes("bay leaf")
  )
    return "🌿";
  if (lower.includes("salt")) return "🧂";
  if (
    lower.includes("beef") ||
    lower.includes("pork") ||
    lower.includes("lamb") ||
    lower.includes("steak") ||
    lower.includes("meat")
  )
    return "🥩";
  if (
    lower.includes("chicken") ||
    lower.includes("turkey") ||
    lower.includes("poultry")
  )
    return "🍗";
  if (
    lower.includes("fish") ||
    lower.includes("shrimp") ||
    lower.includes("prawn") ||
    lower.includes("lobster") ||
    lower.includes("crab") ||
    lower.includes("seafood")
  )
    return "🦐";
  if (lower.includes("cheese")) return "🧀";
  if (lower.includes("egg")) return "🥚";
  if (lower.includes("rice")) return "🍚";
  if (
    lower.includes("noodle") ||
    lower.includes("pasta") ||
    lower.includes("spaghetti")
  )
    return "🍝";
  if (
    lower.includes("bean") ||
    lower.includes("lentil") ||
    lower.includes("chickpea")
  )
    return "🫘";
  if (lower.includes("corn")) return "🌽";
  if (lower.includes("broccoli")) return "🥦";
  if (
    lower.includes("celery") ||
    lower.includes("lettuce") ||
    lower.includes("spinach") ||
    lower.includes("kale") ||
    lower.includes("cabbage") ||
    lower.includes("bok choy")
  )
    return "🥬";
  if (lower.includes("oil") || lower.includes("olive")) return "🫒";
  if (lower.includes("butter")) return "🧈";
  if (lower.includes("wine") || lower.includes("vinegar")) return "🍷";
  if (
    lower.includes("soy") ||
    lower.includes("sauce") ||
    lower.includes("stock") ||
    lower.includes("broth")
  )
    return "🫗";
  if (
    lower.includes("lemon") ||
    lower.includes("lime") ||
    lower.includes("citrus")
  )
    return "🍋";
  if (
    lower.includes("bread") ||
    lower.includes("flour") ||
    lower.includes("dough")
  )
    return "🍞";
  if (
    lower.includes("sugar") ||
    lower.includes("honey") ||
    lower.includes("maple")
  )
    return "🍯";
  if (
    lower.includes("cumin") ||
    lower.includes("paprika") ||
    lower.includes("turmeric") ||
    lower.includes("cinnamon") ||
    lower.includes("ginger") ||
    lower.includes("spice") ||
    lower.includes("nutmeg") ||
    lower.includes("curry")
  )
    return "✨";
  if (lower.includes("avocado")) return "🥑";
  if (lower.includes("coconut")) return "🥥";
  if (
    lower.includes("peanut") ||
    lower.includes("almond") ||
    lower.includes("walnut") ||
    lower.includes("nut")
  )
    return "🥜";
  if (lower.includes("apple")) return "🍎";
  if (lower.includes("pea") || lower.includes("edamame")) return "🫛";
  if (lower.includes("eggplant") || lower.includes("aubergine")) return "🍆";
  if (
    lower.includes("cucumber") ||
    lower.includes("zucchini") ||
    lower.includes("squash") ||
    lower.includes("courgette")
  )
    return "🥒";
  if (lower.includes("pineapple")) return "🍍";
  if (lower.includes("sweet potato") || lower.includes("yam")) return "🍠";
  return "🥘";
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case "super positive":
      return "#2D6A4F";
    case "positive":
      return "#4A7C59";
    case "neutral":
      return "#C9943E";
    case "negative":
      return "#BC4749";
    case "super negative":
      return "#7B2D35";
    default:
      return "#8B7355";
  }
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
