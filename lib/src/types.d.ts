export declare type SerialNumberFormat = {
    prepend_if: {
        matches_regex: string;
        content: string;
    };
};
declare type Checksum = {
    name: string;
    evens_multiplier?: number;
    odds_multiplier?: number;
    weightings?: number[];
    modulo1?: number;
    modulo2?: number;
};
export declare type LookupServiceType = {
    name: string;
    matches_regex: string;
    description: string;
};
export declare type MatchServiceType = {
    name: string;
    matches: string;
};
export declare type MatchCourier = {
    matches: string;
    country: string;
    courier: string;
    courier_url: string | null;
    upu_reference_url: string;
};
export declare type Lookup = LookupServiceType | MatchServiceType | MatchCourier;
export declare type Additional = {
    name: string;
    regex_group_name: string;
    lookup: Lookup[];
};
export declare type TrackingNumber = {
    name: string;
    trackingUrl: string | null;
    description: string | null;
    courier: {
        name: string;
        code: string;
    };
};
export declare type TrackingData = {
    tracking_url?: string | null;
    name: string;
    description?: string;
    regex: string | string[];
    validation: {
        checksum?: Checksum;
        serial_number_format?: SerialNumberFormat;
    };
    test_numbers: {
        valid: string[];
        invalid: string[];
    };
    additional?: Additional[];
};
export declare type Courier = {
    name: string;
    courier_code: string;
    tracking_numbers: TrackingData[];
};
export declare type SerialData = {
    serial: string;
    checkDigit: string;
    checksum: Checksum;
    groups?: {
        [key: string]: string;
    };
};
export {};
