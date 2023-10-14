/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-expression-statement */
import { TrackingCourier } from './types';
import { allCouriers, getTracking, findTracking, fedex } from './util';
import { expect } from 'chai';

allCouriers.map((courier: TrackingCourier) => {
  describe(courier.name, () => {
    courier.tracking_numbers.map((trackingNumber) => {
      describe(trackingNumber.name, () => {
        it('Choses the correct courier', (done) => {
          trackingNumber.test_numbers.valid.map((n) => {
            expect(getTracking(n)!.courier.code).to.eq(courier.courier_code);
          });
          done();
        });
        it('Does not find a courier for invalid tracking numbers', (done) => {
          trackingNumber.test_numbers.invalid.map((n) => {
            const tracking = getTracking(n);
            tracking
              ? expect(tracking.courier.code).to.not.eq(courier.courier_code)
              : expect(tracking).to.be.undefined;
          });
          done();
        });
      });
    });
  });
});

describe('getTracking', () => {
  it('Uses all couriers when none are specified', (done) => {
    expect(getTracking('9400111202555842332669')).to.not.be.undefined;
    done();
  });
  it('Uses only supplied couriers when specified', (done) => {
    expect(getTracking('9400111202555842332669', [fedex])).to.be.undefined;
    done();
  });
});

describe('Tracking Search', () => {
  it('Finds valid tracking codes in text', (done) => {
    const text =
      'USPS tracking number: 9400111202555842332669, but 9261292700768711948020 is bad and ' +
      '7112 3456 7891 2345 6787 is good and this is a dupe 94001 11202 55584 2332669';
    expect(findTracking(text)).to.have.length(2);
    done();
  });

  it('Treats new lines correctly', (done) => {
    expect(findTracking('254899580324\n254899580324')).to.have.length(1);
    expect(findTracking('254899580324\r254899580324')).to.have.length(1);
    expect(findTracking('254899580324\r\n254899580324')).to.have.length(1);
    expect(findTracking('254899580324\n\n254899580324')).to.have.length(1);
    done();
  });
});
