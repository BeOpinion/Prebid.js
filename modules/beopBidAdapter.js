import * as utils from '../src/utils.js';
import { registerBidder } from '../src/adapters/bidderFactory.js';
import { BANNER, VIDEO } from '../src/mediaTypes.js';
import { config } from '../src/config.js';
const BIDDER_CODE = 'beop';
const ENDPOINT_URL = 'https://s.beop.io/bid';

export const spec = {
  code: BIDDER_CODE,
  aliases: ['bp'], // short
  /**
    * Test if the bid request is valid.
    *
    * @param {bid} : The Bid params
    * @return boolean true if the bid request is valid (aka contains a valid accountId), false otherwise.
    */
  isBidRequestValid: function(bid) {
    let isValid = false;
    if (typeof bid.params !== 'undefined') {
      let regexp = new RegExp('^[0-9a-fA-F]{24}$');
      let accountIdToTest = utils.getValue(bid.params, 'accountId') || utils.getValue(bid.params, 'networkId')
      let isValidAccountId = regexp.test(accountIdToTest);
      let isBannerMediaTypeAllowed = bid.mediaType === BANNER || deepAccess(bid, 'mediaTypes.banner');
      isValid = isValidAccountId && isBannerMediaTypeAllowed;
      if (!isValid && !isValidAccountId) {
        utils.logError('BeOp requires a valid accountId in the Bid Parameters → Bid is aborted');
      } else if (!isValid && !isBannerMediaTypeAllowed) {
        utils.logWarn('BeOp is only bidding for banner MediaType')
      }
    }
    return isValid;
  },
  /**
    * Create a BeOp server request from a list of BidRequest
    *
    * @param {validBidRequests[], ...} : The array of validated bidRequests
    * @param {... , bidderRequest} : Common params for each bidRequests
    * @return ServerRequest Info describing the request to the BeOp's server
    */
  buildRequests: function(validBidRequests, bidderRequest) {
    const slots = validBidRequests.map(beOpRequestObjectMaker);
    let date = new Date();
    let dateISO = date.toISOString().split('.')[0] + date.offsetToTimezone();
    let pageUrl = utils.deepAccess(bidderRequest, 'refererInfo.canonicalUrl') || config.getConfig('pageUrl') || utils.deepAccess(window, 'location.href');
    let fpd = config.getLegacyFpd(config.getConfig('ortb2')) || {site: {keywords: []}};
    let gdpr = bidderRequest.gdprConsent;

    let payloadObject = {
      at: date.toString(),
      nid: slots[0].nid,
      nptnid: slots[0].nptnid,
      pid: slots[0].pid,
      url: encodeURIComponent(pageUrl),
      date: dateISO,
      lang: (window.navigator.language || window.navigator.languages[0]),
      kwds: fpd.site.keywords,
      dbg: false,
      slts: slots,
      is_amp: utils.deepAccess(bidderRequest, 'referrerInfo.isAmp'),
      tc_string: (gdpr && gdpr.gdprApplies) ? gdpr.consentString : '';
    };
    const payloadString = JSON.stringify(payloadObject);
    return {
      method: 'POST',
      url: ENDPOINT_URL,
      data: payloadString
    }
  },
  interpretResponse: function(serverResponse, request) {
    let bids = [];
    if (serverResponse && serverResponse.body && utils.isArray(serverResponse.body.bids && serverResponse.body.bids.length)){
      serverResponse.body.bids.forEach((bid) => {
        // For now, no transformation to do
        bids.push(bid);
      });
    }
    return bids;
  },
  onTimeout: function(timeoutData) {
    if (timeoutData == null) {
      return;
    }
    let trackingParams = {
      pid: utils.getValue(timeoutData.params, 'accountId'),
      nid: utils.getValue(timeoutData.params, 'networkId'),
      nptnid: utils.getValue(timeoutData.params, 'networkPatnerId'),
      bid: timeoutData.bidId,
      sl_n: timeoutData.adUnitCode,
      aid: timeoutData.auctionId,
      se_ca: 'bid',
      se_ac: 'timeout',
      se_va: timeoutData.timeout
    };

    utils.logWarn(BIDDER_CODE + ': timed out request');
    utils.triggerPixel(utils.buildUrl({
                           protocol: 'https',
                           hostname: 't.beop.io',
                           pathname: '/i',
                           search: trackingParams}));
  },
  onBidWon: function(bid) {},
  onSetTargeting: function(bid) {}
}

/** function mongoObjectId() {
  var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
    return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
}; */

function beOpRequestObjectMaker(bid) {
  const beOpReqObject = {};
  let bannerReq = utils.deepAccess(bid, 'mediaTypes.banner');
  let bannerSizes = bannerReq.sizes;

  beOpReqObject.sizes = utils.isArray(bannerSizes) ? utils.isArray(bannerSizes) : bid.sizes;

  var publisherCurrency = utils.getValue(bid.params, 'currency') || 'EUR';
  var floor;
  if (typeof bid.getFloor === 'function') {
    const floorInfo = bid.getFloor({currency: publisherCurrency,'banner',[1,1]});
    if (typeof floorInfo === 'object' && floorInfo.currency === publisherCurrency && !isNaN(parseFloat(floorInfo.floor))) {
      floor = parseFloat(floorInfo.floor);
    }
  }
  beOpReqObject.flr = floor;

  beOpReqObject.pid = utils.getValue(bid.params, 'accountId');
  beOpReqObject.nid = utils.getValue(bid.params, 'networkId');
  beOpReqObject.nptnid = utils.getValue(bid.params, 'networkPatnerId');

  beOpReqObject.bid = utils.getBidIdParameter('bidId', bid);
  beOpReqObject.brid = utils.getBidIdParameter('bidderRequestId', bid);
  beOpReqObject.name = utils.getBidIdParameter('adUnitCode', bid);
  beOpReqObject.aid = utils.getBidIdParameter('auctionId', bid);
  beOpReqObject.tid = utils.getBidIdParameter('transactionId', bid);
  beOpReqObject.brc = utils.getBidIdParameter('bidRequestsCount', bid);
  beOpReqObject.bdrc = utils.getBidIdParameter('bidderRequestCount', bid);
  beOpReqObject.bwc = utils.getBidIdParameter('bidderWinsCount', bid);

  return beOpReqObject;
}

registerBidder(spec);
