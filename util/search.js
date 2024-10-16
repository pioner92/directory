import { getNewArchSupportStatus, NewArchSupportStatus } from './newArchStatus';
import { isEmptyOrNull } from './strings';

const calculateMatchScore = ({ github, npmPkg, topicSearchString, unmaintained }, querySearch) => {
  const exactNameMatchPoints =
    (!isEmptyOrNull(github.name) && github.name === querySearch) ||
    (!isEmptyOrNull(npmPkg) && npmPkg === querySearch)
      ? 250
      : 0;

  const npmPkgNameMatchPoints = !isEmptyOrNull(npmPkg) && npmPkg.includes(querySearch) ? 100 : 0;
  const repoNameMatchPoints =
    !isEmptyOrNull(github.name) && github.name.includes(querySearch) ? 100 : 0;

  const descriptionMatchPoints =
    !isEmptyOrNull(github.description) && github.description.toLowerCase().includes(querySearch)
      ? 50
      : 0;

  const topicMatchPoints = topicSearchString.includes(querySearch) ? 10 : 0;

  const matchScore =
    exactNameMatchPoints +
    repoNameMatchPoints +
    npmPkgNameMatchPoints +
    descriptionMatchPoints +
    topicMatchPoints;

  if (matchScore && unmaintained) {
    return matchScore / 1000;
  } else {
    return matchScore;
  }
};

export const handleFilterLibraries = ({
  libraries,
  queryTopic,
  querySearch,
  support,
  hasExample,
  hasImage,
  hasTypes,
  isMaintained,
  isPopular,
  isRecommended,
  wasRecentlyUpdated,
  minPopularity,
  newArchitecture,
  skipLibs,
  skipTools,
  skipTemplates,
}) => {
  const viewerHasChosenTopic = !isEmptyOrNull(queryTopic);
  const viewerHasTypedSearch = !isEmptyOrNull(querySearch);
  const minPopularityValue = minPopularity && parseFloat(minPopularity) / 100;

  const processedLibraries = viewerHasTypedSearch
    ? libraries.map(library => ({
        ...library,
        matchScore: calculateMatchScore(library, querySearch),
      }))
    : libraries;

  return processedLibraries.filter(library => {
    let isTopicMatch = false;
    let isSearchMatch = false;

    if (skipLibs && !library.dev && !library.template) {
      return false;
    }

    if (skipTools && library.dev) {
      return false;
    }

    if (skipTemplates && library.template) {
      return false;
    }

    if (support.ios && !library.ios) {
      return false;
    }

    if (support.android && !library.android) {
      return false;
    }

    if (support.web && !library.web) {
      return false;
    }

    if (support.windows && !library.windows) {
      return false;
    }

    if (support.macos && !library.macos) {
      return false;
    }

    if (support.tvos && !library.tvos) {
      return false;
    }

    if (support.visionos && !library.visionos) {
      return false;
    }

    if (support.expoGo && !library.expoGo) {
      return false;
    }

    if (support.expoGo && typeof library.expoGo === 'string') {
      return false;
    }

    if (hasExample && (!library.examples || !library.examples.length)) {
      return false;
    }

    if (hasImage && (!library.images || !library.images.length)) {
      return false;
    }

    if (hasTypes && !library.github.hasTypes) {
      return false;
    }

    const newArchStatus = getNewArchSupportStatus(library);

    if (
      newArchitecture === 'true' &&
      [NewArchSupportStatus.Unsupported, NewArchSupportStatus.Untested].includes(newArchStatus)
    ) {
      return false;
    }

    if (
      newArchitecture === 'false' &&
      [NewArchSupportStatus.Supported, NewArchSupportStatus.Untested].includes(newArchStatus)
    ) {
      return false;
    }

    if (
      newArchitecture === 'untested' &&
      [NewArchSupportStatus.Supported, NewArchSupportStatus.Unsupported].includes(newArchStatus)
    ) {
      return false;
    }

    if (isMaintained === 'false' && !library.unmaintained) {
      return false;
    }

    if (isMaintained === 'true' && library.unmaintained) {
      return false;
    }

    if (isPopular && !library.matchingScoreModifiers.includes('Popular')) {
      return false;
    }

    if (isRecommended && !library.matchingScoreModifiers.includes('Recommended')) {
      return false;
    }

    if (wasRecentlyUpdated && !library.matchingScoreModifiers.includes('Recently updated')) {
      return false;
    }

    if (minPopularityValue) {
      return library.popularity >= minPopularityValue;
    }

    if (!viewerHasChosenTopic && !viewerHasTypedSearch) {
      return true;
    }

    if (viewerHasChosenTopic && library.topicSearchString.includes(queryTopic)) {
      isTopicMatch = true;
    }

    if (!viewerHasTypedSearch) {
      return isTopicMatch;
    }

    if (viewerHasTypedSearch) {
      isSearchMatch = library.matchScore && library.matchScore > 0;
    }

    if (!viewerHasChosenTopic) {
      return isSearchMatch;
    }

    return isTopicMatch && isSearchMatch;
  });
};

export function getPageQuery(basePath, query) {
  if (basePath === '/trending') {
    return { ...query, minPopularity: undefined, order: undefined };
  }
  return query;
}
