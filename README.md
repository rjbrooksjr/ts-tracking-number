# TS Tracking Number
This package will validate individual tracking numbers or search for valid tracking numbers within given text. It is based off the specifcations in the [jkeen/tracking_number](https://github.com/jkeen/tracking_number) repository.

Current supported Couriers are USPS, UPS, FedEx, DHL, OnTrac, Amazon Logistics, and national postal services using the S10 standard.

## Install
`npm install ts-tracking-number`

or

`yarn add ts-tracking-number`

## Usage

### Check an invididual tracking number
```
import { getTracking } from 'ts-tracking-number';

// Good tracking number
const tracking = getTracking('9400111202555842332669');

/*
  {
   "name":"USPS 91",
   "trackingUrl":"https://tools.usps.com/go/TrackConfirmAction?tLabels=%s",
   "description":"USPS now calls this the IMpd barcode format",
   "trackingNumber":"9400111202555842332669",
   "courier":{
      "name":"United States Postal Service",
      "code":"usps"
   }
}
*/

// Invalid tracking number
const tracking = getTracking('9261292700768711948020'); // undefined

```

### Search text for tracking numbers
```
import { findTracking } from 'ts-tracking-number';

const text = `A good number is 9400111202555842332669, but 9261292700768711948020 is bad and
  7112 3456 7891 2345 6787 is also good`;

const tracking = findTracking(text);

/*
[
  {
    name: 'FedEx Express (12)',
    trackingUrl: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=%s',
    description: null,
    trackingNumber: '986578788855',
    courier: { name: 'FedEx', code: 'fedex' }
  },
  {
    name: 'USPS 20',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=%s',
    description: '20 digit USPS numbers',
    trackingNumber: '71123456789123456787',
    courier: { name: 'United States Postal Service', code: 'usps' }
  }
]
*/

```
..
