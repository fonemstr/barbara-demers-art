// The full census of Budderlee — every planned resident, cropped from
// the character sheets. A resident disappears from the coming-soon list
// automatically when a painting with a matching characterName (case-
// insensitive) is added in the admin. Regenerate crops from the sheets
// if this list changes.

export type BudderleeResident = {
  name: string;
  role: string;
  animal: string;
  image: string;
  width: number;
  height: number;
};

export const BUDDERLEE_ROSTER: BudderleeResident[] = [
  { name: "Rowan", role: "The Rooster", animal: "Rooster", image: "/budderlee/residents/rowan.webp", width: 240, height: 288 },
  { name: "Henrietta", role: "The Hen", animal: "Hen", image: "/budderlee/residents/henrietta.webp", width: 240, height: 288 },
  { name: "Poppy", role: "The Forager", animal: "Opossum", image: "/budderlee/residents/poppy.webp", width: 240, height: 288 },
  { name: "Wally", role: "The Weather Watcher", animal: "Groundhog", image: "/budderlee/residents/wally.webp", width: 240, height: 288 },
  { name: "Barnabas", role: "The Forester", animal: "Deer", image: "/budderlee/residents/barnabas.webp", width: 240, height: 288 },
  { name: "Sylvie", role: "The Lavender Grower", animal: "Skunk", image: "/budderlee/residents/sylvie.webp", width: 240, height: 239 },
  { name: "Reggie", role: "The Night Watchman", animal: "Raccoon", image: "/budderlee/residents/reggie.webp", width: 240, height: 239 },
  { name: "Maisie", role: "The Pie Maker", animal: "Mouse", image: "/budderlee/residents/maisie.webp", width: 240, height: 239 },
  { name: "Bramwell", role: "The Historian", animal: "Badger", image: "/budderlee/residents/bramwell.webp", width: 240, height: 239 },
  { name: "Hazel", role: "The Nut Gatherer", animal: "Red squirrel", image: "/budderlee/residents/hazel.webp", width: 240, height: 239 },
  { name: "Gus", role: "The Milkman", animal: "Goat", image: "/budderlee/residents/gus.webp", width: 240, height: 213 },
  { name: "Ollie", role: "The Fisher", animal: "Otter", image: "/budderlee/residents/ollie.webp", width: 240, height: 213 },
  { name: "Morris", role: "The Gardener", animal: "Mole", image: "/budderlee/residents/morris.webp", width: 240, height: 213 },
  { name: "Ferdinand", role: "The Gentleman", animal: "Frog", image: "/budderlee/residents/ferdinand.webp", width: 240, height: 213 },
  { name: "Hattie", role: "The Seamster", animal: "Hedgehog", image: "/budderlee/residents/hattie.webp", width: 240, height: 213 },
  { name: "Percival", role: "The Pianist", animal: "Badger", image: "/budderlee/residents/percival.webp", width: 240, height: 376 },
  { name: "Della", role: "The Seamstress", animal: "Hedgehog", image: "/budderlee/residents/della.webp", width: 240, height: 376 },
  { name: "Barnaby", role: "The Beekeeper", animal: "Rabbit", image: "/budderlee/residents/barnaby.webp", width: 240, height: 376 },
  { name: "Juniper", role: "The Apothecary", animal: "Goat", image: "/budderlee/residents/juniper.webp", width: 240, height: 376 },
  { name: "Roscoe", role: "The Fisherman", animal: "Otter", image: "/budderlee/residents/roscoe.webp", width: 240, height: 376 },
  { name: "Mabel", role: "The Baker", animal: "Duck", image: "/budderlee/residents/mabel.webp", width: 240, height: 376 },
  { name: "Augustus", role: "The Clockmaker", animal: "Red squirrel", image: "/budderlee/residents/augustus.webp", width: 240, height: 376 },
  { name: "Ophelia", role: "The Artist", animal: "Mouse", image: "/budderlee/residents/ophelia.webp", width: 240, height: 376 },
  { name: "Hugo", role: "The Stationmaster", animal: "Bear", image: "/budderlee/residents/hugo.webp", width: 240, height: 376 },
  { name: "Lottie", role: "The Librarian", animal: "Fox", image: "/budderlee/residents/lottie.webp", width: 240, height: 376 },
  { name: "Henry", role: "The Potter", animal: "Pig", image: "/budderlee/residents/henry.webp", width: 264, height: 326 },
  { name: "Clara", role: "The Florist", animal: "Goose", image: "/budderlee/residents/clara.webp", width: 264, height: 326 },
  { name: "Arthur", role: "The Bookseller", animal: "Badger", image: "/budderlee/residents/arthur.webp", width: 264, height: 326 },
  { name: "Oliver", role: "The Chocolatier", animal: "Beaver", image: "/budderlee/residents/oliver.webp", width: 264, height: 326 },
  { name: "Edith", role: "The Gardener", animal: "Rabbit", image: "/budderlee/residents/edith.webp", width: 264, height: 311 },
  { name: "Walter", role: "The Tailor", animal: "Fox", image: "/budderlee/residents/walter.webp", width: 264, height: 311 },
  { name: "Beatrice", role: "The Tea Keeper", animal: "Red squirrel", image: "/budderlee/residents/beatrice.webp", width: 264, height: 311 },
  { name: "Millie", role: "The Baker", animal: "Goose", image: "/budderlee/residents/millie.webp", width: 264, height: 311 },
  { name: "George", role: "The Watchmaker", animal: "Hedgehog", image: "/budderlee/residents/george.webp", width: 264, height: 279 },
  { name: "Sophie", role: "The Painter", animal: "Mouse", image: "/budderlee/residents/sophie.webp", width: 264, height: 279 },
  { name: "Theodore", role: "The Gardener", animal: "Raccoon", image: "/budderlee/residents/theodore.webp", width: 264, height: 279 },
  { name: "Eleanor", role: "The Letter Writer", animal: "Mouse", image: "/budderlee/residents/eleanor.webp", width: 264, height: 279 },
];
