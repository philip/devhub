export type Author = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  links?: { label: string; href: string }[];
};

export const authors: Author[] = [
  {
    id: "andre-landgraf",
    name: "Andre Landgraf",
    role: "Staff Developer Advocate, Databricks",
    bio: "Andre is a staff developer advocate at Databricks, focused on the developer experience for building data and AI apps on the Databricks platform.",
    photo: "/img/authors/andre-landgraf.jpg",
    links: [
      {
        label: "github.com/andrelandgraf",
        href: "https://github.com/andrelandgraf",
      },
    ],
  },
];

export function getAuthor(id: string): Author {
  const author = authors.find((entry) => entry.id === id);
  if (!author) {
    throw new Error(`Author not found: ${id}`);
  }
  return author;
}
