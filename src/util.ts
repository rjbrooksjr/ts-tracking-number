import * as amazon from './tracking_number_data/couriers/amazon.json';
import * as canadapost from './tracking_number_data/couriers/canadapost.json';
import * as dpd from './tracking_number_data/couriers/dpd.json';
import * as dhl from './tracking_number_data/couriers/dhl.json';
import * as fedex from './tracking_number_data/couriers/fedex.json';
import * as landmark from './tracking_number_data/couriers/landmark.json';
import * as lasership from './tracking_number_data/couriers/lasership.json';
import * as ontrac from './tracking_number_data/couriers/ontrac.json';
import * as s10 from './tracking_number_data/couriers/s10.json';
import * as ups from './tracking_number_data/couriers/ups.json';
import * as usps from './tracking_number_data/couriers/usps.json';
import {
  is, pipe, split, map, sum, zip, multiply, complement, pickBy, values, prop, join, flip, match, uniq,
  identity, ifElse, filter, none, test, flatten, chain, isNil, replace, reduce, reduced
} from 'ramda';
import {
  TrackingCourier, TrackingData, SerialData, Additional, Lookup, LookupServiceType, MatchCourier, SerialNumberFormat,
  Courier, TrackingNumber
} from './types';

export { amazon, canadapost, dhl, dpd, fedex, landmark, lasership, ontrac, s10, ups, usps, TrackingCourier, TrackingData, Courier, TrackingNumber };

export const allCouriers: readonly TrackingCourier[] = [amazon, canadapost, dhl, dpd, fedex, landmark, lasership, ontrac, s10, ups, usps];

const additionalCheck = (match: Partial<SerialData>) => (a: Additional): boolean =>
  a.regex_group_name === 'ServiceType'
    ? a.lookup.some((x: Lookup) => (x as LookupServiceType).matches_regex
      ? new RegExp((x as LookupServiceType).matches_regex).test(match.groups![a.regex_group_name])
      // seems not required to be true? https://github.com/jkeen/tracking_number_data/issues/43
      // : a.lookup.some((x: MatchServiceType) => x.matches === match.groups[a.regex_group_name]);
      : true
    )
    : a.regex_group_name === 'CountryCode' || a.regex_group_name === 'ShippingContainerType'
      ? a.lookup.some(x => (x as MatchCourier).matches === match.groups![a.regex_group_name])
      : true;

const matchTrackingData = (trackingNumber: string, regex: string | readonly string[]): Partial<SerialData> => {
  const r = is(String, regex)
  ? regex as string
  : (regex as readonly string[]).join('');

  const match = new RegExp(`\\b${r}\\b`).exec(trackingNumber.replace(/[^a-zA-Z\d]/g, ''));

  return match && {
    serial: match.groups!.SerialNumber.replace(/\s/g, ''),
    checkDigit: match.groups!.CheckDigit,
    groups: match.groups,
  } || {};
};

const additional = (t: string, tracking: TrackingData): boolean => tracking.additional
  ? tracking.additional.every(additionalCheck(matchTrackingData(t, tracking.regex)))
  : true;

const dummy = (_serialData: SerialData): boolean => true;

const formatList = (tracking: string): readonly number[] => pipe(
  split(''),
  map(
    (x: string | number) => isNaN(x as number)
      ? ((x as string).charCodeAt(0) - 3) % 10
      : parseInt(x as string)
    )
)(tracking);

const toObj = (list: readonly number[]): Record<string, string | number> =>
  Object.assign({}, list) as unknown as Record<string, string | number>;

const evenKeys = (_v: number, k: number): boolean => k % 2 === 0;

const oddKeys = complement(evenKeys);

const getSum = (parityFn: (v: number, k: number) => boolean, tracking: readonly number[]): number => pipe<
  readonly number[],
  Record<string, string | number>,
  Record<string, number>,
  readonly number[],
  number
>(
  toObj,
  // @ts-ignore Bad Ramda types
  pickBy(parityFn),
  values,
  sum
)(tracking);

const mod10 = ({ serial, checkDigit, checksum }: SerialData): boolean => {
  const t = formatList(serial.replace(/[^\da-zA-Z]/g, ''));
  const keySum = sum([
    getSum(evenKeys, t) * (checksum.evens_multiplier || 1),
    getSum(oddKeys, t) * (checksum.odds_multiplier || 1),
  ]);

  return (10 - keySum % 10) % 10 === parseInt(checkDigit);
};

const mod7 = ({ serial, checkDigit }: SerialData): boolean => parseInt(serial) % 7 === parseInt(checkDigit);

const addWeight = (weightings: readonly number[], serial: string): number => sum(
  zip(
    serial.split('').map(s => parseInt(s)),
    weightings || []
  ).map(x => x.reduce(multiply))
);

const validateS10 = ({ serial, checkDigit }: SerialData): boolean => {
  const remainder = addWeight([8, 6, 4, 2, 3, 5, 9, 7], serial) % 11;

  const check = remainder === 1
    ? 0
    : remainder === 0
      ? 5
      : 11 - remainder;

  return check === parseInt(checkDigit);
};

const sumProductWithWeightingsAndModulo = ({ serial, checkDigit, checksum }: SerialData): boolean =>
  addWeight(checksum.weightings!, serial) % checksum.modulo1! % checksum.modulo2! === parseInt(checkDigit);

const validator = ({ validation: { checksum } }: TrackingData): (x: SerialData) => boolean =>
  checksum?.name === 'mod10'
    ? mod10
    : checksum?.name === 'sum_product_with_weightings_and_modulo'
      ? sumProductWithWeightingsAndModulo
      : checksum?.name === 'mod7'
        ? mod7
        : checksum?.name === 's10'
          ? validateS10
          : dummy;

const formatSerial = (serial: string, numberFormat: SerialNumberFormat): string =>
  numberFormat.prepend_if && new RegExp(numberFormat.prepend_if.matches_regex).test(serial)
    ? `${numberFormat.prepend_if.content}${serial}`
    : serial;

const getSerialData = (
  trackingNumber: string,
  // eslint-disable-next-line camelcase
  { regex, validation: { serial_number_format, checksum } }: TrackingData
): SerialData | null => {
  const trackingData = matchTrackingData(trackingNumber, regex);

  return trackingData && trackingData.serial
    ? {
      // eslint-disable-next-line camelcase
      serial: serial_number_format
        ? formatSerial(trackingData.serial, serial_number_format)
        : trackingData.serial,
      checkDigit: trackingData.checkDigit!,
      checksum: checksum!,
    }
    : null;
};

const toTrackingNumber = (t: TrackingData, c: TrackingCourier, trackingNumber: string): TrackingNumber => ({
  name: t.name,
  trackingUrl: t.tracking_url || null,
  description: t.description || null,
  trackingNumber: trackingNumber.replace(/[^a-zA-Z\d]/g, ''),
  // @todo add lookups
  courier: {
    name: c.name,
    code: c.courier_code,
  },
});

const getTrackingList = (searchText: string) => (trackingData: TrackingData): readonly string[] => pipe<
  TrackingData,
  string | readonly string[],
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  readonly string[],
  readonly string[],
  readonly string[]
>(
  prop('regex'),
  ifElse(
    is(String),
    identity,
    join(''),
  ),
  (r: string) => new RegExp(r, 'g'),
  flip(match)(searchText),
  map(replace(/[^a-zA-Z\d\n\r]/g, '')),
  uniq,
)(trackingData);

const getCourierList = (searchText: string, couriers: readonly TrackingCourier[]): readonly string[] => couriers.map(
  pipe<TrackingCourier, readonly TrackingData[], unknown>(
    prop('tracking_numbers'),
    chain(pipe(getTrackingList(searchText), flatten)),
  )
) as readonly string[];

const findTrackingMatches = (searchText: string, couriers: readonly TrackingCourier[]): readonly string[] => pipe<
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[],
  readonly string[]
>(
  flatten,
  uniq,
  (a: readonly string[]) => filter((t: string) =>
    none(test(new RegExp(`([a-zA-Z0-9 ]+)${t}$`)), a)
  // @ts-ignore Bad Dictionary Type
  )(a) as readonly string[],
  (a: readonly string[]) => filter((t: string) =>
    none(test(new RegExp(`^${t}([a-zA-Z0-9 ]+)`)), a)
  // @ts-ignore Bad Dictionary Type
  )(a) as readonly string[]
)(getCourierList(searchText, couriers));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getTrackingInternal = (trackingNumber: string) => reduce(
  (prev: unknown, courier: TrackingCourier) => (
    prev || reduce((_: TrackingNumber | undefined, tn: TrackingData) => {
      const serialData = getSerialData(trackingNumber, tn);

      return (serialData && validator(tn)(serialData) && additional(trackingNumber, tn))
        ? reduced(toTrackingNumber(tn, courier, trackingNumber))
        : undefined;
    }, undefined, courier.tracking_numbers)
  ),
  undefined
) as (couriers: readonly TrackingCourier[]) => TrackingNumber | undefined;

export const getTracking = (
  trackingNumber: string,
  couriers: readonly TrackingCourier[] = allCouriers
): TrackingNumber | undefined => (
  getTrackingInternal(trackingNumber)(couriers)
);

export const findTracking = (searchText: string, couriers?: readonly TrackingCourier[]): readonly TrackingNumber[] =>
  findTrackingMatches(searchText, couriers || allCouriers)
    .map(t => getTracking(t, couriers || allCouriers))
    .filter(complement(isNil)) as readonly TrackingNumber[];
