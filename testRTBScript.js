const GAM_PATH = '/';
class adUnit {
  constructor(slot, native, region) {
    this.code = `${slot}`;
    this.mediaTypes = {
      ...(native && {
        native: {
          title: {
            required: true,
            sendId: true
          },
          body: {
            required: false,
            sendId: true
          },
          image: {
            required: true,
            // sendId: true
          },
          clickUrl: {
            sendId: true
          },
        }
      }),
      ...(!native && {
        banner: {
          sizes: [slot.replace('test-site-banner-', '').split('x').map(dimension => Number(dimension))],
        }
      }),
    },
      this.bids = [
        {
          bidder: 'rtbhouse',
          params: {
            region: `prebid-eu`,
            publisherId: '19LDVaTiaFOxkdi6muWS'
          }
        }
      ]
  }
};



window.addEventListener('DOMContentLoaded', (event) => {
  const adSlots = [];
  const PREBID_TIMEOUT = 1000;
  const FAILSAFE_TIMEOUT = 3000;
  const region = getParameterByName('region') || 'eu';
  let adUnits;

  document.querySelectorAll('.adSlot').forEach(node => {
    adSlots.push(node.id);
    toggleSlotLoading(node);
  });

  adUnits = adSlots.map(slot => {
    const isNative = slot.includes('native');
    return new adUnit(slot, isNative, region);
  });

  window.pbjs = pbjs || {};
  pbjs.que = pbjs.que || [];

  pbjs.que.push(() => {
    pbjs.addAdUnits(adUnits);
    pbjs.requestBids({
      bidsBackHandler: initAdserver,
      timeout: PREBID_TIMEOUT
    });
  });

  setTimeout(() => {
    initAdserver();
  }, FAILSAFE_TIMEOUT);
});
