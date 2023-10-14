/* eslint-disable camelcase */

export type SerialNumberFormat = {
  readonly prepend_if: {
    readonly matches_regex: string;
    readonly content: string;
  };
};

type Checksum = {
  readonly name: string;
  readonly evens_multiplier?: number;
  readonly odds_multiplier?: number;
  readonly weightings?: readonly number[];
  readonly modulo1?: number;
  readonly modulo2?: number;
};

export type LookupServiceType = {
  readonly name: string;
  readonly matches_regex: string;
  readonly description?: string;
};

export type MatchServiceType = {
  readonly name: string;
  readonly matches: string;
};

export type MatchCourier = {
  readonly matches: string;
  readonly country: string;
  readonly courier?: string;
  readonly courier_url?: string | null;
  readonly upu_reference_url?: string;
};

export type Lookup = LookupServiceType | MatchServiceType | MatchCourier;

export type Additional = {
  readonly name: string;
  readonly regex_group_name: string;
  readonly lookup: readonly Lookup[];
};

export type TrackingData = {
  readonly tracking_url?: string | null;
  readonly name: string;
  readonly description?: string;
  readonly regex: string | readonly string[];
  readonly validation: {
    readonly checksum?: Checksum;
    readonly serial_number_format?: SerialNumberFormat;
  };
  readonly test_numbers: {
    readonly valid: readonly string[];
    readonly invalid: readonly string[];
  };
  readonly additional?: readonly Additional[];
};

export type TrackingCourier = {
  readonly name: string;
  readonly courier_code: string;
  readonly tracking_numbers: readonly TrackingData[];
};

export type SerialData = {
  readonly serial: string;
  readonly checkDigit: string;
  readonly checksum: Checksum;
  readonly groups?: { readonly [key: string]: string };
};

export type Courier = {
  readonly name: string;
  readonly code: string;
};

export type TrackingNumber = {
  readonly name: string;
  readonly trackingNumber: string;
  readonly trackingUrl: string | null;
  readonly description: string | null;
  readonly courier: Courier;
};
