const fs = require('fs');
const pupHelper = require('./puppeteerhelper');
const siteLink = 'https://www.privateproperty.co.za';
const platform = 'privateproperty.co.za';

// Function to Fetch Provinces List from Site
const fetchProvinceList = () => new Promise(async (resolve, reject) => {
  let browser;
  console.log(`Fetching Province List from ${platform}`)
  try {
    const returnObj = {
      platform: {
        platform,
        url: `${siteLink}/for-sale/gauteng/3`,
      },
      areas: [],
    };

    browser = await pupHelper.launchBrowser();
    const page = await pupHelper.launchPage(browser, true);

    await page.goto(returnObj.platform.url, {timeout: 0, waitUntil: 'networkidle2'});

    await page.waitForSelector('div#areas ul.linksHolder > li');
    const areaNodes = await page.$$('div#areas ul.linksHolder > li');

    for (let i = 0; i < areaNodes.length; i++) {
      const area = {
        name: await areaNodes[i].$eval('a', elm => elm.innerText.trim()),
        url: await areaNodes[i].$eval('a', (elm, siteLink) => siteLink + elm.getAttribute('a'), siteLink),
        listingCount: await areaNodes[i].$eval('span.numOfListings', elm => parseInt(elm.innerText.trim())),
      }
      returnObj.areas.push(area);
    }
    
    fs.writeFileSync('provinceList.json', JSON.stringify(returnObj))
    await browser.close();
    resolve(returnObj);
  } catch (error) {
    if (browser) await browser.close();
    console.log(`fetchProvinceList Error: ${error.message}`);
    reject(error);
  }
})

// Function to fetch properties listings from an Area
const fetchProperties = (areaLink) => new Promise(async (resolve, reject) => {
  let browser;
  console.log(`Fetching Properties from [${areaLink}]`);
  try {
    const returnObj = {
      platform: {
        platform,
        url: areaLink,
      },
      properties: [],
    };

    browser = await pupHelper.launchBrowser();
    const page = await pupHelper.launchPage(browser);

    await page.goto(returnObj.platform.url, {timeout: 0, waitUntil: 'networkidle0'});

    await page.waitForSelector('.resultsItemsContainer > .listingResult');

    let numberOfPages = 1;
    const gotPages = await page.$('.pagination > .pageNumbers > a:nth-last-child(2)');
    if (gotPages) {
      numberOfPages = parseInt(await pupHelper.getTxt('.pagination > .pageNumbers > a:nth-last-child(2)', page));
    }
    console.log(`Number of Pages found: ${numberOfPages}`);

    for (let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {
      console.log(`Fetching Properties from Page: ${pageNumber}/${numberOfPages}`)
      if (pageNumber > 1) {
        await page.goto(`${returnObj.platform.url}&page=${pageNumber}`, {timeout: 0, waitUntil: 'networkidle0'});
      }
      await pupHelper.autoScroll(page);
      await page.waitForSelector('.resultsItemsContainer > .listingResult');

      const propertiesNodes = await page.$$('.resultsItemsContainer > .listingResult');

      for (let i = 0; i < propertiesNodes.length; i++) {
        const property = {};

        property.title = await pupHelper.getTxt('.infoHolder > .title', propertiesNodes[i]);
        property.imageUrl = await pupHelper.getAttr('.imageHolder > .content > img', 'src', propertiesNodes[i])
        property.listingState = await pupHelper.getTxtMultiple('.imageHolder > .content > .statusFlags > .statusFlag', propertiesNodes[i])
        property.propertyType = await pupHelper.getTxt('.infoHolder > .propertyType', propertiesNodes[i]);
        property.suburb = await pupHelper.getTxt('.infoHolder > .suburb', propertiesNodes[i])

        const price = await pupHelper.getTxt('.infoHolder > .priceDescription', propertiesNodes[i])
        property.price = {
          currency: /^\D\s/gi.test(price) ? price.match(/^\D\s/gi)[0].trim() : '',
          amount: price.replace(/^\D\s/gi, '').replace(/\s/gi, '').trim()
        };

        property.rawAddress = await pupHelper.getTxt('.infoHolder > .address', propertiesNodes[i]);
        property.shortDescription = await pupHelper.getTxt('.infoHolder > .uspsString', propertiesNodes[i]);
        property.seller = {
          imageUrl: await pupHelper.getAttr('.infoHolder > .agentImage > img', 'src', propertiesNodes[i]),
          name: await pupHelper.getTxt('.infoHolder > .agentBankOrPrivateSellerName', propertiesNodes[i])
        }

        property.specs = {
          bedrooms: await fetchFeatures('bedroom', propertiesNodes[i]),
          bathrooms: await fetchFeatures('bathroom', propertiesNodes[i]),
          garages: await fetchFeatures('garage', propertiesNodes[i]),
        }

        returnObj.properties.push(property);
      }
    }
    
    fs.writeFileSync('properties.json', JSON.stringify(returnObj))
    await browser.close();
    resolve(returnObj);
  } catch (error) {
    if (browser) await browser.close();
    console.log(`fetchProvinceList Error: ${error.message}`);
    reject(error);
  }
});

// Function to Fetch Property Details
const fetchDetails = (propertyLink) => new Promise(async (resolve, reject) => {
  let browser;
  console.log(`Fetching Property Details from [${propertyLink}]`);
  try {
    const returnObj = {
      platform: {
        platform,
        platformId: propertyLink.split('/').pop(),
        url: propertyLink,
      },
      property: {},
      owner: {name: '', cellPhone: '', workPhone: ''},
      estateAgents: [],
      estateAgency: {}
    };

    browser = await pupHelper.launchBrowser();
    const page = await pupHelper.launchPage(browser);
    await page.goto(propertyLink, {timeout: 0, waitUntil: 'networkidle0'});
    await page.waitForSelector('.titleContainer > h1');

    returnObj.property.listingState = await pupHelper.getTxt('.listingStateHolder > .wrapper > .listingState', page);

    returnObj.property.propertyType = await pupHelper.getTxt('.titleContainer > h1', page);

    returnObj.property.rawAddressParts = await pupHelper.getTxtMultiple('.mainCrumbs > a, .mainCrumbs > span', page);
    returnObj.property.rawAddressParts.pop();

    returnObj.property.price = {
      currency: await pupHelper.getTxt('.titleContainer > h2.priceInfo > .detailsCurrencySymbol', page),
      price: await pupHelper.getTxt('.titleContainer > h2.priceInfo > .detailsPrice', page)
    }
    returnObj.property.price.price = Number(returnObj.property.price.price.replace(/\s/gi, '').trim());

    const rates = await fetchFeatureDetails('rates', page);
    returnObj.property.rates = rates == '' ? {currency: '', amount: 0} : {currency: rates.match(/^\D\s/gi)[0].trim(), price: Number(rates.replace(/^\D\s/gi, '').replace(/\s/gi, '').trim())}
    
    const levies = await fetchFeatureDetails('levy', page);
    returnObj.property.levies = levies == '' ? {currency: '', amount: 0} : {currency: levies.match(/^\D\s/gi)[0].trim(), price: Number(levies.replace(/^\D\s/gi, '').replace(/\s/gi, '').trim())}

    const landArea = await fetchFeatureDetails('land area', page);
    returnObj.property.landArea = landArea == '' ? {amount: 0, unit: ''} : {amount: landArea.match(/^\d+\s/gi)[0].trim(), unit: landArea.match(/\s.*$/gi)[0].trim()}
    
    const floorArea = await fetchFeatureDetails('floor area', page);
    returnObj.property.floorArea = floorArea == '' ? {amount: 0, unit: ''} : {amount: floorArea.match(/^\d+\s/gi)[0].trim(), unit: floorArea.match(/\s.*$/gi)[0].trim()}

    returnObj.property.description = await pupHelper.getHTML('.description #descriptionParagraph', page);

    returnObj.property.specs = await fetchSpecifications(page);

    await page.click('#contactGallery .swiper-container .telNos.button > button');
    await page.waitForSelector('#contactGallery .swiper-container .telNos > .telNo');
    const seller = await page.$('#contactGallery .sellerDetails');
    if (seller) {
      returnObj.owner.name = await pupHelper.getTxt('#contactGallery .swiper-container .contactName', page);
      returnObj.owner.workPhone = await fetchPhoneNumber('work', seller);
      returnObj.owner.cellPhone = await fetchPhoneNumber('cell', seller);
    } else {
      const agentsNodes = await page.$$('#contactGallery > .agentDetails > .swiper-wrapper > .agent');
      for (let i = 0; i < agentsNodes.length; i++) {
        const agent = {};
        agent.name = await pupHelper.getTxt('.contactName', agentsNodes[i]);
        agent.cellPhone = await fetchPhoneNumber('cell', agentsNodes[i]);
        agent.workPhone = await fetchPhoneNumber('work', agentsNodes[i]);
        agent.portraitUrl = await pupHelper.getAttr('.agentImage > img', 'src', agentsNodes[i]);
        returnObj.estateAgents.push(agent);
      }
    }

    returnObj.estateAgency.name = await pupHelper.getAttr('#contactGallery .officeLogo > a > img', 'alt', page);
    
    returnObj.estateAgency.logoUrl = await pupHelper.getAttr('#contactGallery .officeLogo > a > img', 'src', page);

    returnObj.estateAgency.url = await pupHelper.getAttr('#contactGallery .officeLogo > a', 'href', page);
    returnObj.estateAgency.url = returnObj.estateAgency.url == '' ? '' : siteLink + returnObj.estateAgency.url;

    returnObj.property.imageUrls = await fetchImages(page);

    returnObj.property.videoUrls = await fetchVideos(page);

    fs.writeFileSync('property.json', JSON.stringify(returnObj))
    await browser.close();
    resolve(returnObj);
  } catch (error) {
    if (browser) await browser.close();
    console.log(`fetchDetails [${propertyLink}] Error: `, error);
    reject(error);
  }
});

const fetchFeatures = (cls, node) => new Promise(async (resolve, reject) => {
  try {
    const featuresNodes = await node.$$('.infoHolder > .features.row > div');
    for (let i = 0; i < featuresNodes.length - 1; i++) {
      const featureClass = await node.$eval(`.infoHolder > .features.row > div:nth-child(${i+2})`, elm => elm.getAttribute('class'));
      if (featureClass.toLowerCase().includes(cls.toLowerCase())) {
        const featureValue = Number(await node.$eval(`.infoHolder > .features.row > div:nth-child(${i+1})`, elm => elm.innerText.trim()));
        return resolve(featureValue);
      }
    }
    resolve(0);
  } catch (error) {
    console.log('fetchFeatures Error: ', error);
    reject(error);
  }
});

const fetchFeatureDetails = (featureName, page) => new Promise(async (resolve, reject) => {
  try {
    let returnVal = '';
    await page.waitForSelector('.mainFeatures > .mainFeature');
    const features = await page.$$('.mainFeatures > .mainFeature');

    for (let i = 0; i < features.length; i++) {
      const featureLabel = await features[i].$eval('strong', elm => elm.innerText.toLowerCase().trim());
      if (featureLabel == featureName.toLowerCase()) {
        returnVal = await page.evaluate((feature) => feature.innerText.trim(), features[i]);
        const featureRegEx = new RegExp(featureName, 'gi');
        returnVal = returnVal.replace(featureRegEx, '').trim();
        break;
      }
    }

    resolve(returnVal);
  } catch (error) {
    console.log('fetchFeatureDetails Error: ', error);
    reject(error);
  }
});

const fetchSpecifications = (page) => new Promise(async (resolve, reject) => {
  try {
    let returnVal = {features: {}};
    await page.waitForSelector('.features > .featureCols > .attribute');
    const features = await page.$$('.features > .featureCols > .attribute');

    for (let i = 0; i < features.length; i++) {
      const featureVal = await features[i].$eval('.propAttrValue', elm => elm.innerText.trim());
      let featureName = await features[i].$eval('.attributeLabel', elm => elm.innerText.trim().toLowerCase());
      featureName = camelize(featureName.replace(/-/gi, ' '));
      if (isNaN(featureVal)) {
        if (featureVal == '✔') {
          returnVal.features[featureName] = true;
        } else {
          returnVal.features[featureName] = false;
        }
      } else {
        returnVal[featureName] = Number(featureVal);
      }
    }

    resolve(returnVal);
  } catch (error) {
    console.log('fetchSpecifications Error: ', error);
    reject(error);
  }
});

const fetchImages = (page) => new Promise(async (resolve, reject) => {
  try {
    let returnVal = [];
    // await page.waitForSelector('.galleryBand > .wrapper > .mainImage > a');
    await page.waitForSelector('.galleryBand a.modalLink');
    await page.click('.galleryBand a.modalLink');
    await page.waitForSelector('#listingDetailsGallery > .photoThumbs > .thumbNav');
    
    const allImages = await page.$$('#listingDetailsGallery > .photoThumbs > .thumbNav > .thumb.image');
    
    for (let i = 0; i < allImages.length; i++) {
      await page.evaluate(elm => elm.click(), allImages[i]);
      await page.waitFor(3000);
      const imgUrl = await pupHelper.getAttr('#modalGallery > .swiper-wrapper > .swiper-slide-active > img', 'src', page);
      returnVal.push(imgUrl);
    }
    // await page.click('a.closeButton');
    // await page.waitFor(2000);

    resolve(returnVal);
  } catch (error) {
    console.log('fetchImages Error: ', error);
    reject(error);
  }
});

const fetchVideos = (page) => new Promise(async (resolve, reject) => {
  try {
    let returnVal = [];
    await page.waitForSelector('.galleryBand a.modalLink');
    await page.click('.galleryBand a.modalLink');
    await page.waitForSelector('#listingDetailsGallery > .photoThumbs > .thumbNav');
    
    const gotVideos = await page.$('#listingDetailsGallery > .photoThumbs > .thumbNav > .thumb.video');
    if (gotVideos) {
      const videoLinks = await page.$$('#listingDetailsGallery > .photoThumbs > .thumbNav > .thumb.video');
      for (let i = 0; i < videoLinks.length; i++) {
        await page.evaluate(elm => elm.click(), videoLinks[i]);
        await page.waitFor(3000);
        const videoUrl = await pupHelper.getAttr('#modalGallery > .swiper-wrapper > .swiper-slide-active iframe', 'src', page);
        returnVal.push(videoUrl);
      }
    }
    // await page.click('a.closeButton');
    // await page.waitFor(2000);

    resolve(returnVal);
  } catch (error) {
    console.log('fetchImages Error: ', error);
    reject(error);
  }
});

const fetchPhoneNumber = (label, node) => new Promise(async (resolve, reject) => {
  try {
    let returnVal = '';
    const numbers = await node.$$('.telNos > .telNo');
    for (let i = 0; i < numbers.length; i++) {
      const numberLabel = await numbers[i].$eval('span', elm => elm.innerText.trim().toLowerCase());
      if (numberLabel.includes(label.toLowerCase())) {
        returnVal = await numbers[i].$eval('a', elm => elm.innerText.trim())
      }
    }

    resolve(returnVal);
  } catch (error) {
    console.log('fetchPhoneNumber Error: ', error);
    reject(error);
  }
});

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

const run = async () => {
  // const results = await fetchProvinceList();
  // console.log(results);

  // const results = await fetchProperties('https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/191?sorttype=3');
  // console.log(results);

  // const results = await fetchDetails('https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/16-vandag/24-steve-biko/T2563695');
  const results = await fetchDetails('https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/lukasrand/570-sibelius-street/T7542');
  // const results = await fetchDetails('https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/150-rivier/T2533661');
  console.log(results);
}

run()