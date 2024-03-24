import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: '*',
  }),
);

app.post('/download-episode', async (c) => {
  const formData = await c.req.formData();
  const episodeUrl = formData.get('episodeUrl')?.toString();
  if (!episodeUrl) {
    c.status(400);
    c.text('Must provide episodeUrl in form data.');
    return;
  }

  const response = await fetch(episodeUrl);
  // Clone the response to return a response with modifiable headers
  const newResponse = new Response(response.body, response);
  return newResponse;
});

export default app;
