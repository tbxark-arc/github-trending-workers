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
  const josnResponse = (obj, status) => {
    return new Response(JSON.stringify(obj, null, "  "), {
        headers: {'content-type': 'application/json'},
        status: status || 200,
      });
  }
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
      message: 'Not found',
    }, 404);
  });

  return router.handle(req).catch((err) => {
    return josnResponse({
      message: err.message,
    }, 500);
  });
}

export default {
  fetch: fetchHandler,
};
