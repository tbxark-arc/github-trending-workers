import {fetchDevelopers, fetchRepositories} from './fetch.js';
import {Router} from 'itty-router';


/**
 * Handles the fetch requests for the API.
 *
 * @param {Request} req - The request object.
 * @param {Object} env - The environment object.
 * @param {Object} ctx - The context object.
 * @return {Promise<Response>} - The response object.
 */
async function fetchHandler(req, env, ctx) {
  // eslint-disable-next-line
  const router = Router();
  router.get('/repositories', async (req) => {
    const {language, since, spokenLanguage} = req.query;
    const repositories = await fetchRepositories({
      language,
      since,
      spokenLanguage,
    });
    return new Response(JSON.stringify(repositories), {
      headers: {'content-type': 'application/json'},
    });
  });

  router.get('/developers', async (req) => {
    const {language, since} = req.query;
    const developers = await fetchDevelopers({
      language,
      since,
    });
    return new Response(JSON.stringify(developers, null, "  "), {
      headers: {'content-type': 'application/json'},
    });
  });

  router.all('*', (req) => {
    return new Response(JSON.stringify({
      message: 'Not found',
    }, null, "  "), {status: 404});
  });

  return router.handle(req).catch((err) => {
    return new Response(JSON.stringify({
      message: err.message,
    }, null, "  "), {status: 500});
  });
}

export default {
  fetch: fetchHandler,
};
