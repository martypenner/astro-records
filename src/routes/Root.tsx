import Player from '@/components/Player';
import ErrorPage from '@/error-page';
import { r } from '@/reflect';
import { searchByTerm } from '@/services/podcast-api';
import { debounce } from '@/utils';
import { ChangeEvent, FormEvent, useCallback, useMemo, useRef } from 'react';
import {
  ActionFunctionArgs,
  Form,
  NavLink,
  Outlet,
  ScrollRestoration,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const search = formData.get('search')?.toString();
  if (!search?.length) {
    return null;
  }

  const feeds = await searchByTerm(search);
  r.mutate.addFeeds({ feeds, fromSearch: true });
  return feeds;
}

export function Component() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const debouncedNavigate = useMemo(() => debounce(navigate, 300), [navigate]);

  const search = useCallback(
    (event: FormEvent<HTMLFormElement> | ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      const query = event.currentTarget.value;
      if (query.trim().length === 0) {
        navigate('/');
      } else {
        const searchParams = new URLSearchParams();
        searchParams.set('q', query);
        // @ts-expect-error: the generic type of debounce is conflicting the second overload of navigate
        debouncedNavigate('/search?' + searchParams);
      }
    },
    [navigate, debouncedNavigate],
  );

  return (
    // TODO: fade in
    <div className="wrapper flex flex-col h-screen">
      <nav
        className="w-full border-b bg-white sticky z-30"
        id="page-header"
        style={{ viewTransitionName: 'header' }}
      >
        <div className="w-full container mx-auto max-w-screen-lg px-6 lg:px-0 flex flex-nowrap items-center justify-between mt-0 py-6">
          <div>
            <NavLink
              unstable_viewTransition
              className="flex items-center tracking-tight no-underline hover:no-underline focus-visible:ring-2 focus:outline-none focus:ring-black font-bold text-black text-xl"
              to="/"
            >
              <svg
                className="w-8 h-8 mr-2"
                viewBox="0 0 1280 1280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M815.039 94.6439C824.758 106.709 829.714 122.99 839.626 155.553L1056.17 866.901C976.107 825.368 889.072 795.413 797.281 779.252L656.29 302.798C653.983 295.002 646.822 289.654 638.693 289.654C630.542 289.654 623.368 295.03 621.08 302.853L481.795 779.011C389.579 795.1 302.146 825.109 221.741 866.793L439.347 155.388L439.348 155.388C449.291 122.882 454.262 106.629 463.982 94.5853C472.562 83.9531 483.723 75.6958 496.4 70.6002C510.76 64.8284 527.756 64.8284 561.749 64.8284H717.174C751.212 64.8284 768.23 64.8284 782.603 70.6123C795.292 75.7184 806.459 83.9923 815.039 94.6439Z"
                  fill="url(#paint0_linear_709_110)"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M840.951 900.754C805.253 931.279 734.002 952.097 651.929 952.097C551.197 952.097 466.767 920.737 444.363 878.561C436.354 902.732 434.558 930.396 434.558 948.068C434.558 948.068 429.281 1034.84 489.636 1095.2C489.636 1063.86 515.042 1038.46 546.381 1038.46C600.097 1038.46 600.036 1085.32 599.987 1123.34C599.986 1124.48 599.984 1125.61 599.984 1126.73C599.984 1184.44 635.255 1233.91 685.416 1254.77C677.924 1239.36 673.721 1222.05 673.721 1203.77C673.721 1148.73 706.034 1128.23 743.588 1104.41L743.588 1104.41C773.469 1085.46 806.668 1064.41 829.548 1022.17C841.486 1000.13 848.265 974.893 848.265 948.068C848.265 931.573 845.702 915.676 840.951 900.754Z"
                  fill="#FF5D01"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M840.951 900.754C805.253 931.279 734.002 952.097 651.929 952.097C551.197 952.097 466.767 920.737 444.363 878.561C436.354 902.732 434.558 930.396 434.558 948.068C434.558 948.068 429.281 1034.84 489.636 1095.2C489.636 1063.86 515.042 1038.46 546.381 1038.46C600.097 1038.46 600.036 1085.32 599.987 1123.34C599.986 1124.48 599.984 1125.61 599.984 1126.73C599.984 1184.44 635.255 1233.91 685.416 1254.77C677.924 1239.36 673.721 1222.05 673.721 1203.77C673.721 1148.73 706.034 1128.23 743.588 1104.41L743.588 1104.41C773.469 1085.46 806.668 1064.41 829.548 1022.17C841.486 1000.13 848.265 974.893 848.265 948.068C848.265 931.573 845.702 915.676 840.951 900.754Z"
                  fill="url(#paint1_linear_709_110)"
                ></path>
                <defs>
                  <linearGradient
                    id="paint0_linear_709_110"
                    x1="882.997"
                    y1="27.1132"
                    x2="638.955"
                    y2="866.902"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#000014"></stop>
                    <stop offset="1" stopColor="#150426"></stop>
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_709_110"
                    x1="1001.68"
                    y1="652.45"
                    x2="790.326"
                    y2="1094.91"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#FF1639"></stop>
                    <stop offset="1" stopColor="#FF1639" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
              Podcast Library
            </NavLink>
          </div>

          <div>
            <Form onSubmit={search}>
              <input
                ref={inputRef}
                type="search"
                name="q"
                placeholder="Search for podcasts..."
                defaultValue={searchParams.get('q') ?? ''}
                className="border-pink-300 border px-3 py-2 rounded-md"
                onChange={search}
              />
            </Form>
          </div>
        </div>
      </nav>

      <div className="main-content flex-1 overflow-auto">
        <Outlet />

        <footer className="container mx-auto max-w-screen-lg px-6 lg:px-0 flex items-center flex-wrap pt-4 pb-32">
          <div className="container flex px-3 py-8">
            <div className="w-full mx-auto flex flex-wrap">
              <div className="flex w-full lg:w-1/2">
                <div className="px-3 md:px-0">
                  <h3 className="font-bold text-gray-900">About</h3>
                  {/* todo: */}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <div id="audio-player">
        <Player />
      </div>

      <ScrollRestoration />
    </div>
  );
}

export function ErrorBoundary() {
  return <ErrorPage />;
}
