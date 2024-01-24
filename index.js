import {fetchDevelopers, fetchRepositories} from './fetch.js';
import {Router} from 'itty-router';


/**
 * Handles the fetch requests for the API.
 *
 * @param {Request} request - The request object.
 * @param {Object} env - The environment object.
 * @param {Object} ctx - The context object.
 * @return {Promise<Response>} - The response object.
 */
async function fetchHandler(request, env, ctx) {
  // eslint-disable-next-line
  const router = Router();
  const josnResponse = (obj, status) => {
    return new Response(JSON.stringify(obj, null, '  '), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
        'Content-Type': 'application/json; charset=utf-8',
      },
      status: status || 200,
    });
  };

  router.get('/', (req) => {
    return josnResponse({
      repositories: `${req.url}repositories`,
      developers: `${req.url}developers`,
    }, 200);
  });

  router.get('/repositories', async (req) => {
    const {language, since, spokenLanguage} = req.query;
    const repositories = await fetchRepositories({
      language,
      since,
      spokenLanguage,
    });
    return josnResponse(repositories);
  });

  router.get('/developers', async (req) => {
    const {language, since} = req.query;
    const developers = await fetchDevelopers({
      language,
      since,
    });
    return josnResponse(developers);
  });

  router.all('*', (req) => {
    return josnResponse({
      message: `Not found: ${new URL(req.url).pathname}`,
    }, 404);
  });

  return router.handle(request).catch((err) => {
    return josnResponse({
      message: err.message,
    }, 500);
  });
}

export default {
  fetch: fetchHandler,
};
