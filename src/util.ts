import * as amazon from '../data/tracking_number_data/couriers/amazon.json';
import * as dhl from '../data/tracking_number_data/couriers/dhl.json';
import * as fedex from '../data/tracking_number_data/couriers/fedex.json';
import * as ontrac from '../data/tracking_number_data/couriers/ontrac.json';
import * as s10 from '../data/tracking_number_data/couriers/s10.json';
import * as ups from '../data/tracking_number_data/couriers/ups.json';
import * as usps from '../data/tracking_number_data/couriers/usps.json';
import { is, pipe, split, map, sum, zip, multiply, complement, pickBy, values } from 'ramda';
import {
  Courier, TrackingData, SerialData, Additional, Lookup, LookupServiceType, MatchCourier, SerialNumberFormat,
  TrackingNumber
} from './types';

export const couriers: Courier[] = [amazon, dhl, fedex, ontrac, s10, ups, usps];

const additionalCheck = (match: Partial<SerialData>) => (a: Additional): boolean => {
  switch(a.regex_group_name) {
    case 'ServiceType':
      return a.lookup.some((x: Lookup) => (x as LookupServiceType).matches_regex
          ? new RegExp((x as LookupServiceType).matches_regex).test(match.groups![a.regex_group_name])
          // seems not required to be true? https://github.com/jkeen/tracking_number_data/issues/43
          // : a.lookup.some((x: MatchServiceType) => x.matches === match.groups[a.regex_group_name]);
          : true
      );
    case 'CountryCode':
    case 'ShippingContainerType':
      return a.lookup.some(x => (x as MatchCourier).matches === match.groups![a.regex_group_name]);
    default:
      return true;
  }
};

const matchTrackingData = (trackingNumber: string, regex: string | string[]): Partial<SerialData> => {
  const r = is(String, regex)
  ? regex as string
  : (regex as string[]).join('');

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

const formatList = (tracking: string): number[] => pipe(
  split(''),
  map(
    (x: string | number) => isNaN(x as number)
      ? ((x as string).charCodeAt(0) - 3) % 10
      : parseInt(x as string)
    )
)(tracking);

const toObj = (list: number[]) => Object.assign({}, list) as unknown as Record<string, string | number>;

const evenKeys = (_v: number, k: number): boolean => k % 2 === 0;

const oddKeys = complement(evenKeys);

const getSum = (parityFn: (v: number, k: number) => boolean, tracking: number[]): number => pipe<
  number[],
  Record<string, string | number>,
  Record<string, number>,
  number[],
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

const addWeight = (weightings: number[], serial: string) => sum(
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
  { regex, validation: { serial_number_format, checksum }}: TrackingData
): SerialData | null => {
  const trackingData = matchTrackingData(trackingNumber, regex);

  return trackingData && trackingData.serial
    ? {
      serial: serial_number_format
        ? formatSerial(trackingData.serial, serial_number_format)
        : trackingData.serial,
      checkDigit: trackingData.checkDigit!,
      checksum: checksum!,
    }
    : null;
};

const toTrackingNumber = (t: TrackingData, c: Courier) => ({
  name: t.name,
  trackingUrl: t.tracking_url || null,
  description: t.description || null,
  // @todo add lookups
  courier: {
    name: c.name,
    code: c.courier_code,
  },
});

export const getTracking = (trackingNumber: string): TrackingNumber | undefined => {
  for (const courier of couriers) {
    for (const tn of courier.tracking_numbers) {
      const serialData = getSerialData(trackingNumber, tn);

      if (serialData && validator(tn)(serialData) && additional(trackingNumber, tn)) {
        return toTrackingNumber(tn, courier);
      }
    }
  }
};

// export const findTracking = (searchText: string): TrackingNumber[] => {

// }