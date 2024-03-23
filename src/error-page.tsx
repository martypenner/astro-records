import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function ErrorBoundary() {}
export default function ErrorPage() {
  const error = useRouteError() as Error;
  console.error(error);

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      {isRouteErrorResponse(error) ? (
        <h1>
          {error.status} {error.statusText}
        </h1>
      ) : (
        <h1>{error.message}</h1>
      )}
    </div>
  );
}
