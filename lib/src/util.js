"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTracking = exports.couriers = void 0;
const amazon = require("../data/tracking_number_data/couriers/amazon.json");
const dhl = require("../data/tracking_number_data/couriers/dhl.json");
const fedex = require("../data/tracking_number_data/couriers/fedex.json");
const ontrac = require("../data/tracking_number_data/couriers/ontrac.json");
const s10 = require("../data/tracking_number_data/couriers/s10.json");
const ups = require("../data/tracking_number_data/couriers/ups.json");
const usps = require("../data/tracking_number_data/couriers/usps.json");
const ramda_1 = require("ramda");
exports.couriers = [amazon, dhl, fedex, ontrac, s10, ups, usps];
const additionalCheck = (match) => (a) => {
    switch (a.regex_group_name) {
        case 'ServiceType':
            return a.lookup.some((x) => x.matches_regex
                ? new RegExp(x.matches_regex).test(match.groups[a.regex_group_name])
                // seems not required to be true? https://github.com/jkeen/tracking_number_data/issues/43
                // : a.lookup.some((x: MatchServiceType) => x.matches === match.groups[a.regex_group_name]);
                : true);
        case 'CountryCode':
        case 'ShippingContainerType':
            return a.lookup.some(x => x.matches === match.groups[a.regex_group_name]);
        default:
            return true;
    }
};
const matchTrackingData = (trackingNumber, regex) => {
    const r = ramda_1.is(String, regex)
        ? regex
        : regex.join('');
    const match = new RegExp(`\\b${r}\\b`).exec(trackingNumber.replace(/[^a-zA-Z\d]/g, ''));
    return match && {
        serial: match.groups.SerialNumber.replace(/\s/g, ''),
        checkDigit: match.groups.CheckDigit,
        groups: match.groups,
    } || {};
};
const additional = (t, tracking) => tracking.additional
    ? tracking.additional.every(additionalCheck(matchTrackingData(t, tracking.regex)))
    : true;
const dummy = (_serialData) => true;
const formatList = (tracking) => ramda_1.pipe(ramda_1.split(''), ramda_1.map((x) => isNaN(x)
    ? (x.charCodeAt(0) - 3) % 10
    : parseInt(x)))(tracking);
const toObj = (list) => Object.assign({}, list);
const evenKeys = (_v, k) => k % 2 === 0;
const oddKeys = ramda_1.complement(evenKeys);
const getSum = (parityFn, tracking) => ramda_1.pipe(toObj, 
// @ts-ignore Bad Ramda types
ramda_1.pickBy(parityFn), ramda_1.values, ramda_1.sum)(tracking);
const mod10 = ({ serial, checkDigit, checksum }) => {
    const t = formatList(serial.replace(/[^\da-zA-Z]/g, ''));
    const keySum = ramda_1.sum([
        getSum(evenKeys, t) * (checksum.evens_multiplier || 1),
        getSum(oddKeys, t) * (checksum.odds_multiplier || 1),
    ]);
    return (10 - keySum % 10) % 10 === parseInt(checkDigit);
};
const mod7 = ({ serial, checkDigit }) => parseInt(serial) % 7 === parseInt(checkDigit);
const addWeight = (weightings, serial) => ramda_1.sum(ramda_1.zip(serial.split('').map(s => parseInt(s)), weightings || []).map(x => x.reduce(ramda_1.multiply)));
const validateS10 = ({ serial, checkDigit }) => {
    const remainder = addWeight([8, 6, 4, 2, 3, 5, 9, 7], serial) % 11;
    const check = remainder === 1
        ? 0
        : remainder === 0
            ? 5
            : 11 - remainder;
    return check === parseInt(checkDigit);
};
const sumProductWithWeightingsAndModulo = ({ serial, checkDigit, checksum }) => addWeight(checksum.weightings, serial) % checksum.modulo1 % checksum.modulo2 === parseInt(checkDigit);
const validator = ({ validation: { checksum } }) => (checksum === null || checksum === void 0 ? void 0 : checksum.name) === 'mod10'
    ? mod10
    : (checksum === null || checksum === void 0 ? void 0 : checksum.name) === 'sum_product_with_weightings_and_modulo'
        ? sumProductWithWeightingsAndModulo
        : (checksum === null || checksum === void 0 ? void 0 : checksum.name) === 'mod7'
            ? mod7
            : (checksum === null || checksum === void 0 ? void 0 : checksum.name) === 's10'
                ? validateS10
                : dummy;
const formatSerial = (serial, numberFormat) => numberFormat.prepend_if && new RegExp(numberFormat.prepend_if.matches_regex).test(serial)
    ? `${numberFormat.prepend_if.content}${serial}`
    : serial;
const getSerialData = (trackingNumber, { regex, validation: { serial_number_format, checksum } }) => {
    const trackingData = matchTrackingData(trackingNumber, regex);
    return trackingData && trackingData.serial
        ? {
            serial: serial_number_format
                ? formatSerial(trackingData.serial, serial_number_format)
                : trackingData.serial,
            checkDigit: trackingData.checkDigit,
            checksum: checksum,
        }
        : null;
};
const toTrackingNumber = (t, c) => ({
    name: t.name,
    trackingUrl: t.tracking_url || null,
    description: t.description || null,
    // @todo add lookups
    courier: {
        name: c.name,
        code: c.courier_code,
    },
});
exports.getTracking = (trackingNumber) => {
    for (const courier of exports.couriers) {
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
