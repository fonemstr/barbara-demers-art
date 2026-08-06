// The full census of Meadowbrook — every planned resident, cropped from
// the character sheets. A resident disappears from the coming-soon list
// automatically when a painting with a matching characterName (case-
// insensitive) is added in the admin. Regenerate crops from the sheets
// if this list changes.

export type MeadowbrookResident = {
  name: string;
  role: string;
  animal: string;
  image: string;
  width: number;
  height: number;
};

export const MEADOWBROOK_ROSTER: MeadowbrookResident[] = [
  { name: "Rowan", role: "The Rooster", animal: "Rooster", image: "/meadowbrook/residents/rowan.webp", width: 240, height: 288 },
  { name: "Henrietta", role: "The Hen", animal: "Hen", image: "/meadowbrook/residents/henrietta.webp", width: 240, height: 288 },
  { name: "Poppy", role: "The Forager", animal: "Opossum", image: "/meadowbrook/residents/poppy.webp", width: 240, height: 288 },
  { name: "Wally", role: "The Weather Watcher", animal: "Groundhog", image: "/meadowbrook/residents/wally.webp", width: 240, height: 288 },
  { name: "Barnabas", role: "The Forester", animal: "Deer", image: "/meadowbrook/residents/barnabas.webp", width: 240, height: 288 },
  { name: "Sylvie", role: "The Lavender Grower", animal: "Skunk", image: "/meadowbrook/residents/sylvie.webp", width: 240, height: 239 },
  { name: "Reggie", role: "The Night Watchman", animal: "Raccoon", image: "/meadowbrook/residents/reggie.webp", width: 240, height: 239 },
  { name: "Maisie", role: "The Pie Maker", animal: "Mouse", image: "/meadowbrook/residents/maisie.webp", width: 240, height: 239 },
  { name: "Bramwell", role: "The Historian", animal: "Badger", image: "/meadowbrook/residents/bramwell.webp", width: 240, height: 239 },
  { name: "Hazel", role: "The Nut Gatherer", animal: "Red squirrel", image: "/meadowbrook/residents/hazel.webp", width: 240, height: 239 },
  { name: "Gus", role: "The Milkman", animal: "Goat", image: "/meadowbrook/residents/gus.webp", width: 240, height: 213 },
  { name: "Ollie", role: "The Fisher", animal: "Otter", image: "/meadowbrook/residents/ollie.webp", width: 240, height: 213 },
  { name: "Morris", role: "The Gardener", animal: "Mole", image: "/meadowbrook/residents/morris.webp", width: 240, height: 213 },
  { name: "Ferdinand", role: "The Gentleman", animal: "Frog", image: "/meadowbrook/residents/ferdinand.webp", width: 240, height: 213 },
  { name: "Hattie", role: "The Seamster", animal: "Hedgehog", image: "/meadowbrook/residents/hattie.webp", width: 240, height: 213 },
  { name: "Percival", role: "The Pianist", animal: "Badger", image: "/meadowbrook/residents/percival.webp", width: 240, height: 376 },
  { name: "Della", role: "The Seamstress", animal: "Hedgehog", image: "/meadowbrook/residents/della.webp", width: 240, height: 376 },
  { name: "Barnaby", role: "The Beekeeper", animal: "Rabbit", image: "/meadowbrook/residents/barnaby.webp", width: 240, height: 376 },
  { name: "Juniper", role: "The Apothecary", animal: "Goat", image: "/meadowbrook/residents/juniper.webp", width: 240, height: 376 },
  { name: "Roscoe", role: "The Fisherman", animal: "Otter", image: "/meadowbrook/residents/roscoe.webp", width: 240, height: 376 },
  { name: "Mabel", role: "The Baker", animal: "Duck", image: "/meadowbrook/residents/mabel.webp", width: 240, height: 376 },
  { name: "Augustus", role: "The Clockmaker", animal: "Red squirrel", image: "/meadowbrook/residents/augustus.webp", width: 240, height: 376 },
  { name: "Ophelia", role: "The Artist", animal: "Mouse", image: "/meadowbrook/residents/ophelia.webp", width: 240, height: 376 },
  { name: "Hugo", role: "The Stationmaster", animal: "Bear", image: "/meadowbrook/residents/hugo.webp", width: 240, height: 376 },
  { name: "Lottie", role: "The Librarian", animal: "Fox", image: "/meadowbrook/residents/lottie.webp", width: 240, height: 376 },
  { name: "Henry", role: "The Potter", animal: "Pig", image: "/meadowbrook/residents/henry.webp", width: 264, height: 326 },
  { name: "Clara", role: "The Florist", animal: "Goose", image: "/meadowbrook/residents/clara.webp", width: 264, height: 326 },
  { name: "Arthur", role: "The Bookseller", animal: "Badger", image: "/meadowbrook/residents/arthur.webp", width: 264, height: 326 },
  { name: "Oliver", role: "The Chocolatier", animal: "Beaver", image: "/meadowbrook/residents/oliver.webp", width: 264, height: 326 },
  { name: "Edith", role: "The Gardener", animal: "Rabbit", image: "/meadowbrook/residents/edith.webp", width: 264, height: 311 },
  { name: "Walter", role: "The Tailor", animal: "Fox", image: "/meadowbrook/residents/walter.webp", width: 264, height: 311 },
  { name: "Beatrice", role: "The Tea Keeper", animal: "Red squirrel", image: "/meadowbrook/residents/beatrice.webp", width: 264, height: 311 },
  { name: "Millie", role: "The Baker", animal: "Goose", image: "/meadowbrook/residents/millie.webp", width: 264, height: 311 },
  { name: "George", role: "The Watchmaker", animal: "Hedgehog", image: "/meadowbrook/residents/george.webp", width: 264, height: 279 },
  { name: "Sophie", role: "The Painter", animal: "Mouse", image: "/meadowbrook/residents/sophie.webp", width: 264, height: 279 },
  { name: "Theodore", role: "The Gardener", animal: "Raccoon", image: "/meadowbrook/residents/theodore.webp", width: 264, height: 279 },
  { name: "Eleanor", role: "The Letter Writer", animal: "Mouse", image: "/meadowbrook/residents/eleanor.webp", width: 264, height: 279 },
];
