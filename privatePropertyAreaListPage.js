// Examples:
// https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/lukasrand/1629?sorttype=3
// https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/191?sorttype=3
//
export const privatePropertyAreaListPage = {
  platform: {
    // Always the same value for this website
    platform: 'privateproperty.co.za',
    // The URL that was scraped
    url: '',
  },

  // If there are additional pages (pagination at the bottom) we would want to scrape these details
  // of all the properties across all the pages.
  properties: [
    // I have given guidelines about which info to capture below, but looking at the HTML it seems the
    // contents of the `class=infoHolder` blocks are very well structured. If you could capture as much
    // information from there as possible along the same lines as my object below, including data which
    // seems to be hidden from the UI, that would be great.
    {
      imageUrl: '...',
      // There may be one or more text labels on the photo; it looks like finding them by `class=statusFlag`
      // might be the best approach
      listingState: ['Offer Pending', 'HD media'], // or 'New' etc.
      // There is text like "4 Bed House in Lukasrand" which contains the property type
      propertyType: 'flat', // or 'house' etc.
      // There may be a hidden div with `class="suburb"`, otherwise from the text "4 Bed House in Lukasrand" which
      // gives the suburb after "in"
      suburb: 'Lukasrand',
      // Selling price
      price: { currency: 'R', amount: 975000 },
      // In some cases there is an address below the price
      rawAddress: '321 South Street ...',
      // Specs are derived from the features icon row, icon names can be used as keys for the values in the object
      specs: {
        bedrooms: 2,
        bathrooms: 1.5,
        garages: 0,
      },
      // Up-selling string after the icons row
      shortDescription: 'Pet Friendly, Pool and Staff Quarters.',

      // At the bottom of the info block are owner / agent details in varying formats. Please scrape as much
      // as possible similar to the details page here.
      seller: {},
    },
  ],
}
