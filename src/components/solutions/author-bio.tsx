import useBaseUrl from "@docusaurus/useBaseUrl";
import type { ReactNode } from "react";
import { type Author } from "@/lib/solutions/authors";

function AuthorAvatar({ author }: { author: Author }): ReactNode {
  const photoSrc = useBaseUrl(author.photo);
  return (
    <img
      src={photoSrc}
      alt={author.name}
      loading="lazy"
      className="size-10 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15"
    />
  );
}

export function SolutionByline({
  authors,
  publishedAt,
}: {
  authors: Author[];
  publishedAt: string;
}): ReactNode {
  const formattedDate = new Date(`${publishedAt}T00:00:00Z`).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" },
  );
  const names = authors.map((author) => author.name).join(", ");
  const sharedRole =
    authors.length > 0 && authors.every((a) => a.role === authors[0].role)
      ? authors[0].role
      : null;
  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex -space-x-2">
        {authors.map((author) => (
          <AuthorAvatar key={author.id} author={author} />
        ))}
      </div>
      <div className="flex flex-col text-sm leading-tight">
        <span className="font-medium text-foreground">{names}</span>
        {sharedRole ? (
          <span className="text-muted-foreground">{sharedRole}</span>
        ) : null}
        <span className="text-muted-foreground">
          <time dateTime={publishedAt}>{formattedDate}</time>
        </span>
      </div>
    </div>
  );
}

export function AuthorBioCard({ author }: { author: Author }): ReactNode {
  const photoSrc = useBaseUrl(author.photo);
  return (
    <aside className="mt-12 flex flex-col gap-4 rounded-xl border border-black/10 bg-[#f7f6f4] p-6 sm:flex-row sm:items-start dark:border-white/10 dark:bg-[#182a32]">
      <img
        src={photoSrc}
        alt={author.name}
        loading="lazy"
        className="size-16 shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/15"
      />
      <div className="flex flex-col gap-1">
        <p className="m-0 text-base font-medium text-black dark:text-white">
          {author.name}
        </p>
        <p className="m-0 text-xs font-medium tracking-wide text-black/60 uppercase dark:text-white/60">
          {author.role}
        </p>
        <p className="m-0 mt-2 text-sm leading-relaxed text-black/72 dark:text-white/72">
          {author.bio}
        </p>
        {author.links && author.links.length > 0 ? (
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-sm">
            {author.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-db-cyan no-underline hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
