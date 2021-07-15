import { expect } from 'chai';
import { spec } from 'modules/beopBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';

const ENDPOINT = 'https://s.beop.io/bid';

let validBid = {
  'bidder': 'beop',
  'params': {
    'accountId': '5a8af500c9e77c00017e4cad'
  },
  'adUnitCode': 'bellow-article',
  'mediaTypes': {
    'banner': {
      'sizes': [[1, 1]]
    }
  },
  'bidId': '30b31c1838de1e',
  'bidderRequestId': '22edbae2733bf6',
  'auctionId': '1d1a030790a475',
  'transactionId': '04f2659e-c005-4eb1-a57c-fa93145e3843',
  'creativeId': 'er2ee'
};

describe('BeOp Bid Adapter tests', () => {
  const adapter = newBidder(spec);

  describe('inherited functions', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', function() {
    it('should return true when accountId params found', function () {
      expect(spec.isBidRequestValid(validBid)).to.equal(true);
    });

    it('should return true if no accountId but networkId', function () {
      let bid = Object.assign({}, validBid);
      delete bid.params;
      bid.params = {
        'networkId': '5a8af500c9e77c00017e4aaa'
      };
      expect(spec.isBidRequestValid(bid)).to.equal(true);
    });

    it('should return false if neither account or network id param found', function () {
      let bid = Object.assign({}, validBid);
      delete bid.params;
      bid.params = {
        'someId': '5a8af500c9e77c00017e4aaa'
      };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should return false if account Id param is not an ObjectId', function () {
      let bid = Object.assign({}, validBid);
      delete bid.params;
      bid.params = {
        'someId': '12345'
      };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should return false if there is no banner media type', function () {
      let bid = Object.assign({}, validBid);
      delete bid.mediaTypes;
      bid.mediaTypes = {
        'native': {
          'sizes': [[1, 1]]
        }
      };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });
  });

  describe('buildRequests', function () {
    let bidRequests = [];
    bidRequests.push(validBid);

    it('should build the request', function () {
      const request = spec.buildRequests(bidRequests, {});
      const payload = JSON.parse(request.data);
      expect(payload.pid).to.exist;
      expect(payload.pid).to.equal('5a8af500c9e77c00017e4cad');
      expect(payload.slts[0].name).to.exist;
      expect(payload.slts[0].name).to.equal('bellow-article');
    });
  });
});
