type Props = {
  id: string;
  title: string;
  author: string;
  image: string;
};

export function Card({ id, title, author, image }: Props) {
  return (
    <div className="flex flex-col">
      <a
        href={`/podcast/${id}`}
        className="text-black hover:text-pink-700 focus-visible:ring-2 focus:outline-none focus:ring-black"
      >
        <div
          className="shadow-md hover:shadow-lg relative"
          // transition:name={`podcast-${id}`}
        >
          <img
            className="card-image rounded-md relative z-10"
            src={image}
            alt=""
            aria-hidden="true"
            width="400"
            height="400"
          />
          <img
            src="/vynil-lp.webp"
            alt=""
            width="400"
            height="400"
            // transition:name={`vinyl-${id}`}
            className="absolute top-0 vynil-image opacity-0"
            aria-hidden="true"
          />
        </div>
        <div className="pt-4 font-semibold">{title}</div>
        <span className="sr-only"> by</span>
        <div className="pt-1 text-gray-700">{author}</div>
      </a>
    </div>
  );
}
