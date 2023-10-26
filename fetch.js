// https://github.com/huchenme/github-trending-api/blob/master/src/functions/utils/fetch.js
import cheerio from 'cheerio';

const GITHUB_URL = 'https://github.com';


/**
 * Filters out null and undefined values from an object.
 *
 * @param {object} obj - The object to filter.
 * @return {object} The filtered object.
 */
function omitNil(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Removes the default avatar size from the given source URL.
 *
 * @param {string} src - The source URL of the avatar image.
 * @return {string} The modified source URL without the default avatar size.
 */
function removeDefaultAvatarSize(src) {
  if (!src) {
    return src;
  }
  return src.replace(/\?s=.*$/, '');
}

/**
 * Fetches repositories based on the specified language, time period, and spoken language.
 *
 * @param {Object} options - The options for fetching repositories.
 * @param {string} options.language - The language of the repositories to fetch.
 * @param {string} options.since - The time period for which to fetch repositories.
 * @param {string} options.spokenLanguage - The spoken language of the repositories to fetch.
 * @return {Promise<Array>} An array of repository objects containing information such as author, name, avatar, url, description, language, language color, stars, forks, current period stars, and built by.
 */
export async function fetchRepositories({
  language = '',
  since = 'daily',
  spokenLanguage = '',
} = {}) {
  const url = `${GITHUB_URL}/trending/${encodeURIComponent(
      language,
  )}?since=${since}&spoken_language_code=${encodeURIComponent(spokenLanguage)}`;
  const data = await fetch(url);
  const $ = cheerio.load(await data.text());
  return (
    $('.Box article.Box-row')
        .get()
    // eslint-disable-next-line complexity
        .map((repo) => {
          const $repo = $(repo);
          const title = $repo.find('.h3').text().trim();
          const [username, repoName] = title.split('/').map((v) => v.trim());
          const relativeUrl = $repo.find('.h3').find('a').attr('href');
          const currentPeriodStarsString =
          $repo.find('.float-sm-right').text().trim() ||
          /* istanbul ignore next */ '';

          const builtBy = $repo
              .find('span:contains("Built by")')
              .find('[data-hovercard-type="user"]')
              .map((i, user) => {
                const altString = $(user).children('img').attr('alt');
                const avatarUrl = $(user).children('img').attr('src');
                return {
                  username: altString ?
                altString.slice(1) /* istanbul ignore next */ :
                null,
                  href: `${GITHUB_URL}${user.attribs.href}`,
                  avatar: removeDefaultAvatarSize(avatarUrl),
                };
              })
              .get();

          const colorNode = $repo.find('.repo-language-color');
          const langColor = colorNode.length ?
          colorNode.css('background-color') :
          null;

          const langNode = $repo.find('[itemprop=programmingLanguage]');

          const lang = langNode.length ?
          langNode.text().trim() /* istanbul ignore next */ :
          null;

          return omitNil({
            author: username,
            name: repoName,
            avatar: `${GITHUB_URL}/${username}.png`,
            url: `${GITHUB_URL}${relativeUrl}`,
            description: $repo.find('p.my-1').text().trim() || '',
            language: lang,
            languageColor: langColor,
            stars: parseInt(
                $repo
                    .find('.mr-3 svg[aria-label=\'star\']')
                    .first()
                    .parent()
                    .text()
                    .trim()
                    .replace(',', '') || /* istanbul ignore next */ '0',
                10,
            ),
            forks: parseInt(
                $repo
                    .find('svg[aria-label=\'fork\']')
                    .first()
                    .parent()
                    .text()
                    .trim()
                    .replace(',', '') || /* istanbul ignore next */ '0',
                10,
            ),
            currentPeriodStars: parseInt(
                currentPeriodStarsString.split(' ')[0].replace(',', '') ||
                /* istanbul ignore next */ '0',
                10,
            ),
            builtBy,
          });
        })
  );
}

/**
 * Fetches developers from the GitHub API based on the specified language and time period.
 *
 * @param {Object} options - Optional parameters for the API request.
 * @param {string} options.language - The language to filter the developers by. Defaults to an empty string.
 * @param {string} options.since - The time period to filter the developers by. Defaults to 'daily'.
 * @return {Promise<Array>} An array of developer objects containing their username, name, type, URL, sponsor URL, avatar, and repository information.
 */
export async function fetchDevelopers({language = '', since = 'daily'} = {}) {
  const data = await fetch(
      `${GITHUB_URL}/trending/developers/${language}?since=${since}`,
  );
  const $ = cheerio.load(await data.text());
  return $('.Box article.Box-row')
      .get()
      .map((dev) => {
        const $dev = $(dev);
        const relativeUrl = $dev.find('.h3 a').attr('href');
        const sponsorRelativeUrl = $dev
            .find('span:contains("Sponsor")')
            .parent()
            .attr('href');
        const name = $dev.find('.h3 a').text().trim();

        const username = relativeUrl.slice(1);

        const type = $dev.find('img').parent().attr('data-hovercard-type');

        const $repo = $dev.find('.mt-2 > article');

        $repo.find('svg').remove();

        return omitNil({
          username,
          name,
          type,
          url: `${GITHUB_URL}${relativeUrl}`,
          sponsorUrl: sponsorRelativeUrl ?
          `${GITHUB_URL}${sponsorRelativeUrl}` :
          undefined,
          avatar: removeDefaultAvatarSize($dev.find('img').attr('src')),
          repo: $repo.length ?
          {
            name: $repo.find('a').text().trim(),
            description:
                $repo.find('.f6.mt-1').text().trim() ||
                /* istanbul ignore next */ '',
            url: `${GITHUB_URL}${$repo.find('a').attr('href')}`,
          } :
          null,
        });
      });
}
