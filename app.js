const fs = require('fs');
const pupHelper = require('./puppeteerhelper');
const siteLink = 'https://www.privateproperty.co.za';
const platform = 'privateproperty.co.za';

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

const run = async () => {
  const results = await fetchProvinceList();
  console.log(results);
}

run()