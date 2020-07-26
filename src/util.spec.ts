import { Courier } from './types';
import { couriers, getTracking, findTracking } from './util';
import { expect } from 'chai';

couriers.map((courier: Courier) => {
  describe(courier.name, () => {
    courier.tracking_numbers.map(trackingNumber => {
      describe(trackingNumber.name, () => {
        it('Choses the correct courier', done => {
          trackingNumber.test_numbers.valid.map(n => {
            expect(getTracking(n)!.courier.code).to.eq(courier.courier_code);
          })
          done();
        });
        it('Does not find a courier for invalid tracking numbers', done => {
          trackingNumber.test_numbers.invalid.map(n => {
            const tracking = getTracking(n);
            tracking
              ? expect(tracking.courier.code).to.not.eq(courier.courier_code)
              : expect(tracking).to.be.undefined;
          });
          done();
        });
      })
    })
  })
});

describe('Tracking Search', () => {
  it('Finds valid tracking codes in text', done => {
    const text = 'USPS tracking number: 9400111202555842332669, but 9261292700768711948020 is bad and 7112 3456 7891 2345 6787 is good';
    expect(findTracking(text)).to.have.length(2);
    done();
  });
})
