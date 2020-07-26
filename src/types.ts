export type SerialNumberFormat = {
  prepend_if: {
    matches_regex: string;
    content: string;
  };
};

type Checksum = {
  name: string;
  evens_multiplier?: number;
  odds_multiplier?: number;
  weightings?: number[];
  modulo1?: number;
  modulo2?: number;
};

export type LookupServiceType = {
  name: string;
  matches_regex: string;
  description: string;
};

export type MatchServiceType = {
  name: string;
  matches: string;
};

export type MatchCourier = {
  matches: string;
  country: string;
  courier: string;
  courier_url: string | null;
  upu_reference_url: string;
};

export type Lookup = LookupServiceType | MatchServiceType | MatchCourier;

export type Additional = {
  name: string;
  regex_group_name: string;
  lookup: Lookup[];
};

export type TrackingNumber = {
  name: string;
  trackingUrl: string | null;
  description: string | null;
  courier: {
    name: string;
    code: string;
  };
}

export type TrackingData = {
  tracking_url?: string | null;
  name: string;
  description?: string;
  regex: string | string[];
  validation: {
    checksum?: Checksum;
    serial_number_format?: SerialNumberFormat;
  };
  test_numbers: { valid: string[], invalid: string[] };
  additional?: Additional[];
};

export type Courier = {
  name: string;
  courier_code: string;
  tracking_numbers: TrackingData[];
};

export type SerialData = {
  serial: string;
  checkDigit: string;
  checksum: Checksum;
  groups?: { [key: string]: string };
};