import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativetime from 'dayjs/plugin/relativeTime';
import {
  MSEC_IN_HOUR,
  MSEC_IN_DAY,
  DateFormat,
  DurationFormat,
  FilterType,
  SortType,
  DESTINATIONS_NAMES_MAX_COUNT
} from './const.js';

dayjs.extend(duration);
dayjs.extend(relativetime);

const getRandomArrayElement = (items) => items[Math.floor(Math.random() * items.length)];
const getRandomPositiveNumber = (min = 0, max = 1) => {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return Math.floor(lower + Math.random() * (upper - lower + 1));
};
const getRandomDate = (start = new Date(2023, 3, 1), end = new Date(2023, 4, 1)) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const formatDate = (currentDate, format = DateFormat.FULL) => dayjs(currentDate).format(format);

const getDatesDiff = (dateStringFrom, dateStringTo) => dayjs(dateStringTo).diff(dayjs(dateStringFrom));
const getDuration = (dateStringFrom, dateStringTo) => dayjs.duration(getDatesDiff(dateStringFrom, dateStringTo));

const calculateDuration = (dateFrom, dateTo) => {
  const diff = getDatesDiff(dateFrom, dateTo);

  let pointDuration;

  switch (true) {
    case (diff >= MSEC_IN_DAY):
      pointDuration = dayjs.duration(diff).format(DurationFormat.DAYS);
      break;
    case (diff >= MSEC_IN_HOUR):
      pointDuration = dayjs.duration(diff).format(DurationFormat.HOURS);
      break;
    case (diff < MSEC_IN_HOUR):
      pointDuration = dayjs.duration(diff).format(DurationFormat.MINS);
      break;
  }

  return pointDuration;
};

const incrementCounter = (START_FROM) => {
  let counterStart = START_FROM;
  return function() {
    return counterStart++;
  };
};

const toCapitalize = (str) => `${str[0].toUpperCase()}${str.slice(1)}`;

const isPointFuture = (point) => dayjs().isBefore(point.dateFrom);
const isPointPresent = (point) => dayjs().isAfter(point.dateFrom) && dayjs().isBefore(point.dateTo);
const isPointPast = (point) => dayjs().isAfter(point.dateTo);

const filterByType = {
  [FilterType.ANY]: (points) => [...points],
  [FilterType.FUTURE]: (points) => points.filter((point) => isPointFuture(point)),
  [FilterType.PRESENT]: (points) => points.filter((point) => isPointPresent(point)),
  [FilterType.PAST]: (points) => points.filter((point) => isPointPast(point))
};


const sortPointsByDate = (pointA, pointB) => getDatesDiff(pointB.dateFrom, pointA.dateFrom);
const sortPointsByTime = (pointA, pointB) => {
  const pointADuration = getDuration(pointA.dateFrom, pointA.dateTo).asMilliseconds();
  const pointBDuration = getDuration(pointB.dateFrom, pointB.dateTo).asMilliseconds();
  return pointBDuration - pointADuration;
};
const sortPointsByPrice = (pointA, pointB) => pointB.basePrice - pointA.basePrice;

const sortByType = {
  [SortType.DAY]: (points) => points.toSorted(sortPointsByDate),
  [SortType.EVENT]: () => {
    throw new Error(`Sort by ${SortType.EVENT} is disabled`);
  },
  [SortType.TIME]: (points) => points.toSorted(sortPointsByTime),
  [SortType.PRICE]: (points) => points.toSorted(sortPointsByPrice),
  [SortType.OFFER]: () => {
    throw new Error(`Sort by ${SortType.OFFER} is disabled`);
  },
};

const updateItem = (items, update) => items.map((item) => item.id === update.id ? update : item);
const deleteItem = (items, del) => items.filter((item) => item.id !== del.id);

const convertSnakeCaseToCamelCase = (string) => string.replace(/_([a-z])/g, (result) => result[1].toUpperCase());
const deepCamelise = (object) => {
  if (typeof object !== 'object' || object === null) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map(deepCamelise);
  }

  const res = Object.fromEntries(Object.entries(object).map(([key, value]) => [convertSnakeCaseToCamelCase(key), deepCamelise(value)]));
  return res;
};

const convertCamelCaseToSnakeCase = (string) => string.replace(/[A-Z]/g, (result) => `_${result.toLowerCase()}`);
const deepSnake = (object) => {
  if (typeof object !== 'object' || object === null) {
    return object;
  }

  if (Array.isArray(object)) {
    return object.map(deepSnake);
  }

  const res = Object.fromEntries(Object.entries(object).map(([key, value]) => [convertCamelCaseToSnakeCase(key), deepSnake(value)]));
  return res;
};

const getRouteLabel = (sortedPoints, destinations) => {
  const pointsDestinations = sortedPoints
    .map((point) => destinations.find((destination) => destination.id === point.destination)?.name);

  if (pointsDestinations.length <= DESTINATIONS_NAMES_MAX_COUNT) {
    return pointsDestinations.join(' &mdash; ');
  }
  return `${pointsDestinations.at(0)}&nbsp;&mdash;&nbsp;...&nbsp;&mdash;&nbsp;${pointsDestinations.at(-1)}`;
};

const getDurationPeriod = (sortedPoints) => {
  if (!sortedPoints.length) {
    return '';
  }

  const startDateTime = dayjs(sortedPoints[0].dateFrom).format(DateFormat.SHORT);
  if (sortedPoints.length === 1) {
    return startDateTime;
  }

  return `${startDateTime}&nbsp;&mdash;&nbsp;${dayjs(sortedPoints.at(-1).dateTo).format(DateFormat.SHORT)}`;
};
const getPointOffersCost = (pointOffersIds, offers) => pointOffersIds.reduce((offerCost, id) => offerCost + (offers.find((offer) => offer.id === id)?.price ?? 0), 0);
const getTotalPointsCost = (points, offers) => points.reduce((total, point) => {
  const typeOffers = offers.find((offer) => offer.type === point.type)?.offers ?? [];
  return total + point.basePrice + getPointOffersCost(point.offers, typeOffers);
}, 0);

const mapApiDataToPoint = (data) => deepCamelise(data);
const mapPointToApiData = (point) => deepSnake(point);

export {
  getRandomArrayElement,
  getRandomPositiveNumber,
  getRandomDate,
  formatDate,
  calculateDuration,
  incrementCounter,
  toCapitalize,
  filterByType,
  sortByType,
  updateItem,
  deleteItem,
  getRouteLabel,
  getDurationPeriod,
  getTotalPointsCost,
  mapApiDataToPoint,
  mapPointToApiData
};
