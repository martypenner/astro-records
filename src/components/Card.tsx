import { NavLink } from 'react-router-dom';

type Props = {
  id: string;
  title: string;
  author: string;
  image: string;
};

export function Card({ id, title, author, image }: Props) {
  return (
    <div className="flex flex-col">
      <NavLink
        to={`/podcast/${id}`}
        className="text-black hover:text-pink-700 focus-visible:ring-2 focus:outline-none focus:ring-black"
        unstable_viewTransition
      >
        <div className="shadow-md hover:shadow-lg relative">
          <img
            className="card-image rounded-md relative z-10"
            src={image}
            alt=""
            aria-hidden="true"
            width="400"
            height="400"
            data-podcast-expand
          />
          <img
            src="/vynil-lp.webp"
            alt=""
            width="400"
            height="400"
            className="absolute top-0 vynil-image opacity-0"
            aria-hidden="true"
            data-vinyl-expand
          />
        </div>
        <div className="pt-4 font-semibold">{title}</div>
        <span className="sr-only"> by</span>
        <div className="pt-1 text-gray-700">{author}</div>
      </NavLink>
    </div>
  );
}
