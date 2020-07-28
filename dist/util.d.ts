import { TrackingCourier } from './types';
export declare type Courier = {
    readonly name: string;
    readonly code: string;
};
export declare type TrackingNumber = {
    readonly name: string;
    readonly trackingNumber: string;
    readonly trackingUrl: string | null;
    readonly description: string | null;
    readonly courier: Courier;
};
export declare const couriers: readonly TrackingCourier[];
export declare const getTracking: (trackingNumber: string) => TrackingNumber | undefined;
export declare const findTracking: (searchText: string) => readonly TrackingNumber[];
//# sourceMappingURL=util.d.ts.map