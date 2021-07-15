import * as utils from '../src/utils.js';
import { registerBidder } from '../src/adapters/bidderFactory.js';
import { config } from '../src/config.js';
const BIDDER_CODE = 'beop';
const ENDPOINT_URL = 'https://s.beop.io/bid';
const TCF_VENDOR_ID = 666;

export const spec = {
  code: BIDDER_CODE,
  gvlid: TCF_VENDOR_ID,
  aliases: ['bp'],
  /**
    * Test if the bid request is valid.
    *
    * @param {bid} : The Bid params
    * @return boolean true if the bid request is valid (aka contains a valid accountId or networkId and is open for BANNER), false otherwise.
    */
  isBidRequestValid: function(bid) {
    return !!((bid.params.accountId || bid.params.networkId) && bid.mediaTypes.banner);
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
    let pageUrl = utils.deepAccess(bidderRequest, 'refererInfo.canonicalUrl') || config.getConfig('pageUrl') || utils.deepAccess(window, 'location.href');
    let fpd = config.getLegacyFpd(config.getConfig('ortb2')) || {site: {keywords: []}};
    let gdpr = bidderRequest.gdprConsent;

    let payloadObject = {
      at: new Date().toString(),
      nid: slots[0].nid,
      nptnid: slots[0].nptnid,
      pid: slots[0].pid,
      url: encodeURIComponent(pageUrl),
      lang: (window.navigator.language || window.navigator.languages[0]),
      kwds: fpd.site.keywords,
      dbg: false,
      slts: slots,
      is_amp: utils.deepAccess(bidderRequest, 'referrerInfo.isAmp'),
      tc_string: (gdpr && gdpr.gdprApplies) ? gdpr.consentString : '',
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
    if (serverResponse && serverResponse.body && utils.isArray(serverResponse.body.bids && serverResponse.body.bids.length)) {
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

    let trackingParams = buildTrackingParams(timeoutData, 'timeout', timeoutData.timeout);

    utils.logWarn(BIDDER_CODE + ': timed out request');
    utils.triggerPixel(utils.buildUrl({
      protocol: 'https',
      hostname: 't.beop.io',
      pathname: '/i',
      search: trackingParams}));
  },
  onBidWon: function(bid) {
    if (bid == null) {
      return;
    }
    let trackingParams = buildTrackingParams(bid, 'won', bid.cpm);

    utils.logInfo(BIDDER_CODE + ': won request');
    utils.triggerPixel(utils.buildUrl({
      protocol: 'https',
      hostname: 't.beop.io',
      pathname: '/i',
      search: trackingParams}));
  },
  onSetTargeting: function(bid) {}
}

function buildTrackingParams(data, info, value) {
  return {
    pid: utils.getValue(data.params, 'accountId'),
    nid: utils.getValue(data.params, 'networkId'),
    nptnid: utils.getValue(data.params, 'networkPatnerId'),
    bid: data.bidId,
    sl_n: data.adUnitCode,
    aid: data.auctionId,
    se_ca: 'bid',
    se_ac: info,
    se_va: value
  };
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
    const floorInfo = bid.getFloor({currency: publisherCurrency, mediaType: 'banner', size: [1, 1]});
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
