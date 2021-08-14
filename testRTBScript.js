const GAM_PATH = '/';
class adUnit {
  constructor(slot, region) {
    this.code = `${slot}`;
    this.mediaTypes = {
        banner: {
          sizes: [slot.replace('inads-test-banner-', '').split('x').map(dimension => Number(dimension))],
        }
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
  const region = "prebid-eu"
  let adUnits;

  document.querySelectorAll('.adSlot').forEach(node => {
    adSlots.push(node.id);
  });

  adUnits = adSlots.map(slot => {
    return new adUnit(slot, region);
  });

  window.pbjs = pbjs || {};
  pbjs.que = pbjs.que || [];

  pbjs.que.push(() => {
    pbjs.addAdUnits(adUnits);
    pbjs.requestBids({
      timeout: PREBID_TIMEOUT
    });
  });
});
