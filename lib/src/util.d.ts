import { Courier, TrackingNumber } from './types';
export declare const couriers: Courier[];
export declare const getTracking: (trackingNumber: string) => TrackingNumber | undefined;
