import { expect } from 'chai';
import { spec } from 'modules/beopBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';

const ENDPOINT = 'https://s.beop.io/bid';

describe('BeOp Bid Adapter tests', () => {
  const adapter = newBidder(spec);

  describe('inherited functions', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', function() {
    let bid = {
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
      'creativeId': 'er2ee'
    };
  });
});
