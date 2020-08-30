"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTracking = exports.getTracking = exports.allCouriers = exports.usps = exports.ups = exports.s10 = exports.ontrac = exports.fedex = exports.dhl = exports.amazon = void 0;
const amazon = __importStar(require("./tracking_number_data/couriers/amazon.json"));
exports.amazon = amazon;
const dhl = __importStar(require("./tracking_number_data/couriers/dhl.json"));
exports.dhl = dhl;
const fedex = __importStar(require("./tracking_number_data/couriers/fedex.json"));
exports.fedex = fedex;
const ontrac = __importStar(require("./tracking_number_data/couriers/ontrac.json"));
exports.ontrac = ontrac;
const s10 = __importStar(require("./tracking_number_data/couriers/s10.json"));
exports.s10 = s10;
const ups = __importStar(require("./tracking_number_data/couriers/ups.json"));
exports.ups = ups;
const usps = __importStar(require("./tracking_number_data/couriers/usps.json"));
exports.usps = usps;
const ramda_1 = require("ramda");
exports.allCouriers = [amazon, dhl, fedex, ontrac, s10, ups, usps];
const additionalCheck = (match) => (a) => a.regex_group_name === 'ServiceType'
    ? a.lookup.some((x) => x.matches_regex
        ? new RegExp(x.matches_regex).test(match.groups[a.regex_group_name])
        // seems not required to be true? https://github.com/jkeen/tracking_number_data/issues/43
        // : a.lookup.some((x: MatchServiceType) => x.matches === match.groups[a.regex_group_name]);
        : true)
    : a.regex_group_name === 'CountryCode' || a.regex_group_name === 'ShippingContainerType'
        ? a.lookup.some(x => x.matches === match.groups[a.regex_group_name])
        : true;
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
const getSerialData = (trackingNumber, 
// eslint-disable-next-line camelcase
{ regex, validation: { serial_number_format, checksum } }) => {
    const trackingData = matchTrackingData(trackingNumber, regex);
    return trackingData && trackingData.serial
        ? {
            // eslint-disable-next-line camelcase
            serial: serial_number_format
                ? formatSerial(trackingData.serial, serial_number_format)
                : trackingData.serial,
            checkDigit: trackingData.checkDigit,
            checksum: checksum,
        }
        : null;
};
const toTrackingNumber = (t, c, trackingNumber) => ({
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
const getTrackingList = (searchText) => (trackingData) => ramda_1.pipe(ramda_1.prop('regex'), ramda_1.ifElse(ramda_1.is(String), ramda_1.identity, ramda_1.join('')), (r) => new RegExp(r, 'g'), ramda_1.flip(ramda_1.match)(searchText), ramda_1.map(ramda_1.replace(/[^a-zA-Z\d]/g, '')), ramda_1.uniq)(trackingData);
const getCourierList = (searchText, couriers) => couriers.map(ramda_1.pipe(ramda_1.prop('tracking_numbers'), ramda_1.chain(ramda_1.pipe(getTrackingList(searchText), ramda_1.flatten))));
const findTrackingMatches = (searchText, couriers) => ramda_1.pipe(ramda_1.flatten, ramda_1.uniq, (a) => ramda_1.filter((t) => ramda_1.none(ramda_1.test(new RegExp(`([a-zA-Z0-9 ]+)${t}$`)), a)
// @ts-ignore Bad Dictionary Type
)(a), (a) => ramda_1.filter((t) => ramda_1.none(ramda_1.test(new RegExp(`^${t}([a-zA-Z0-9 ]+)`)), a)
// @ts-ignore Bad Dictionary Type
)(a))(getCourierList(searchText, couriers));
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getTrackingInternal = (trackingNumber) => ramda_1.reduce((prev, courier) => (prev || ramda_1.reduce((_, tn) => {
    const serialData = getSerialData(trackingNumber, tn);
    return (serialData && validator(tn)(serialData) && additional(trackingNumber, tn))
        ? ramda_1.reduced(toTrackingNumber(tn, courier, trackingNumber))
        : undefined;
}, undefined, courier.tracking_numbers)), undefined);
exports.getTracking = (trackingNumber, couriers = exports.allCouriers) => (getTrackingInternal(trackingNumber)(couriers));
exports.findTracking = (searchText, couriers) => findTrackingMatches(searchText, couriers || exports.allCouriers)
    .map(t => exports.getTracking(t, couriers || exports.allCouriers))
    .filter(ramda_1.complement(ramda_1.isNil));
//# sourceMappingURL=util.js.map