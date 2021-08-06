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

const getParameterByName = (name, url = window.location.href) => {
  const clearName = name.replace(/[\[\]]/g, '\\$&'),
    regex = new RegExp('[?&]' + clearName + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results || !results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const extractSize = (adUnit) => {
  const regex = /test-site-banner-(\d+x\d+)/;
  const match = regex.exec(adUnit);
  return match && match[1].split('x') || [];
}

const toggleSlotLoading = (slot) => {
  let loadingElement = slot.querySelector('.lds-dual-ring');

  if (loadingElement) {
    loadingElement.remove();
  } else {
    slot.innerHTML = '<span class="lds-dual-ring"></span>';
    let size = extractSize(slot.id);
    let style = `width: ${size[0]}px; height: ${size[1]}px;`;
    if (slot.id.indexOf('native') === -1) {
      slot.setAttribute('style', style);
    }
  }
}

const renderDisplayPlaceholder = (slot, slotName) => {
  if (slot) {
    const slotDiv = document.querySelector(`#${slotName}`);
    const placeholder = document.createElement('img');
    const slotSizesForUrl = slot.mediaTypes.banner.sizes[0].toString().replace(',', 'x');
    const placeholderUrl = `https://place-hold.it/${slotSizesForUrl}/452846/fff?text=${slotSizesForUrl}+-+No+ad`;

    placeholder.src = placeholderUrl;
    slotDiv.appendChild(placeholder);
    toggleSlotLoading(slotDiv);
  }
}

const renderNativePlaceholder = (slot, slotName) => {
  if (slot) {
    const slotDiv = document.querySelector(`#${slotName}`);
    const placeholder = document.createElement('img');
    const placeholderUrl = `https://place-hold.it/120x82/452846/fff?text=NATIVE`;
    const titleElement = document.createElement('p');
    const descElement = document.createElement('p');

    placeholder.src = placeholderUrl;
    titleElement.innerHTML = '<a href="javascript:void(0);">Lorem ipsum dolor sit amet</a>';
    titleElement.className = 'ad-title';
    descElement.innerHTML = '<a href="javascript:void(0);">Consectetur adipiscing elit</a>';
    descElement.className = 'ad-description';

    slotDiv.appendChild(placeholder);
    slotDiv.appendChild(titleElement);
    slotDiv.appendChild(descElement);
    toggleSlotLoading(slotDiv);
  }
}

const initAdserver = () => {
  if (pbjs.initAdserverSet) return;
  pbjs.initAdserverSet = true;
  googletag.cmd.push(function () {
    pbjs.setTargetingForGPTAsync && pbjs.setTargetingForGPTAsync();
    googletag.pubads().refresh();
  });
};

const setPrebidConfig = (pbjs) => {
  pbjs.setConfig({
    debug: true,
  });

  pbjs.bidderSettings = {
    standard: {
      bidCpmAdjustment: (bidCpm, bid) => {
        return 20.00;
      },
      adserverTargeting: [{
        key: "hb_bidder",
        val: function (bidResponse) {
          return bidResponse.bidderCode;
        }
      },
      {
        key: "hb_adid",
        val: function (bidResponse) {
          return bidResponse.adId;
        }
      },
      {
        key: 'hb_format',
        val: function (bidResponse) {
          return bidResponse.mediaType;
        }
      }]
    }
  }
}

const defineSlots = (adUnits) => {
  adUnits.forEach(adUnit => {
    const isNative = !!adUnit.mediaTypes.native;
    if (isNative) {
      googletag
        .defineSlot(
          `${GAM_PATH}/native/${adUnit.code}`, // slot name
          "fluid", //"fluid" - there can't be any display set for fluid
          adUnit.code // slot node id
        )
        // fluid for google means fluid - this is different for prebid and google "understanding"
        .addService(googletag.pubads())
        .setTargeting('test-site', 1);
    } else {
      googletag
        .defineSlot(
          `${GAM_PATH}/banner/${adUnit.code}`,
          adUnit.mediaTypes.banner.sizes,
          adUnit.code
        )
        .addService(googletag.pubads())
        .setTargeting('test-site', 1);
    }

  });
}

window.addEventListener('DOMContentLoaded', (event) => {
  const adSlots = [];
  const PREBID_TIMEOUT = 1000;
  const FAILSAFE_TIMEOUT = 3000;
  const region = getParameterByName('region') || 'eu';
  const disableSingleRequest = getParameterByName('singleRequest').toLowerCase() === 'false';
  let adUnits;

  document.querySelectorAll('.adSlot').forEach(node => {
    adSlots.push(node.id);
    toggleSlotLoading(node);
  });

  adUnits = adSlots.map(slot => {
    const isNative = slot.includes('native');
    return new adUnit(slot, isNative, region);
  });

  // variable assigment for easy access
  window.adUnits = adUnits;

  window.googletag = googletag || {};
  googletag.cmd = googletag.cmd || [];

  googletag.cmd.push(() => {
    googletag.pubads().disableInitialLoad();
  });

  window.pbjs = pbjs || {};
  pbjs.que = pbjs.que || [];

  setPrebidConfig(pbjs);

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

  googletag.cmd.push(() => {
    defineSlots(adUnits);
    !disableSingleRequest && googletag.pubads().enableSingleRequest();
    googletag.enableServices();

    adUnits.forEach(adunit => {
      googletag.display(adunit.code);
    });

    googletag.pubads().addEventListener('slotRenderEnded', (event) => {
      const slotCode = event.slot.getAdUnitPath().substring(27);
      const slot = window.adUnits.filter(unit => unit.code.includes(slotCode))[0];

      // render placehoder in case of empty creation
      if (event.isEmpty) {
        if (slotCode.indexOf('native') === -1) {
          renderDisplayPlaceholder(slot, slotCode);
        } else {
          renderNativePlaceholder(slot, slotCode);
        }
      }
    });
  });
});
