import * as amazon from './tracking_number_data/couriers/amazon.json';
import * as dhl from './tracking_number_data/couriers/dhl.json';
import * as fedex from './tracking_number_data/couriers/fedex.json';
import * as ontrac from './tracking_number_data/couriers/ontrac.json';
import * as s10 from './tracking_number_data/couriers/s10.json';
import * as ups from './tracking_number_data/couriers/ups.json';
import * as usps from './tracking_number_data/couriers/usps.json';
import { TrackingCourier, TrackingData, Courier, TrackingNumber } from './types';
export { amazon, dhl, fedex, ontrac, s10, ups, usps, TrackingCourier, TrackingData, Courier, TrackingNumber };
export declare const allCouriers: readonly TrackingCourier[];
export declare const getTracking: (trackingNumber: string, couriers?: readonly TrackingCourier[]) => TrackingNumber | undefined;
export declare const findTracking: (searchText: string, couriers?: readonly TrackingCourier[] | undefined) => readonly TrackingNumber[];
//# sourceMappingURL=util.d.ts.map