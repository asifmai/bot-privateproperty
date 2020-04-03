// Examples:
// https://www.privateproperty.co.za/for-sale/gauteng/midrand/waterfall-estate/T7142
// https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/lukasrand/570-sibelius-street/T7542
// https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sterrewag/38-jack-bennet/T2490587
// https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/150-rivier/T2533661
//
export const privatePropertyDetailsPage = {
  platform: {
    // Always the same value for this website
    platform: 'privateproperty.co.za',
    // From the URL or breadcrumbs
    platformId: 'T2490587',
    // The URL that was scraped
    url: '',
  },

  property: {
    // There may be a text label on the photos with a listing state, otherwise an empty string
    // See https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/150-rivier/T2533661
    listingState: 'Offer Pending',
    // After the photos there is text like "1 Bed Flat in Sunnyside" which contains the property type
    propertyType: 'flat', // or 'house' etc.
    // From the breadcrumbs
    rawAddressParts: ['South Africa', 'Gauteng', 'Pretoria', 'Pretoria Central and Old East', 'Lukasrand'],
    // Below the price
    rawStreetAddress: '321 South Street',
    // Selling price
    price: { currency: 'R', amount: 975000 },
    // Depending on the property there can be up to these four values that I've seen,
    // for all four see https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/16-vandag/24-steve-biko/T2563695
    // To make it future proof if there are additional values in this section camel case the label and include the value as a string
    rates: { currency: 'R', amount: 278 },
    levies: { currency: 'R', amount: 982 },
    landArea: { amount: 100, unit: 'm2' },
    floorArea: { amount: 57, unit: 'm2' },
    // All the long text including HTML tags for the bullet lists etc.
    description: 'This is a very nice property',
    // Specs or key features are listed with either a number of a tick mark
    specs: {
      // Items with a number should be added directly with a camel cased property derived from the label
      bedrooms: 2,
      bathrooms: 1.5,
      garages: 0,
      carports: 2,
      storeys: 1,
      // Items with a tick mark should be added to the features with a camel cased property derived from the label and value of true
      features: { airCon: true },
    },
    // From the photo gallery. Please ensure URLs of the full size images are captured and not just thumbnails
    imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    // Some properties also have a video tour
    // See https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/lukasrand/570-sibelius-street/T7542
    videoUrls: ['https://www.youtube.com/embed/QFE6sjmDzK0?enablejsapi=1&rel=0'],
  },

  // A property will either have owner or estate agent details at the top right
  // The "Show phone no" button should be clicked
  owner: {
    name: 'John Smith',
    cellPhone: '072 345 4321',
    workPhone: '012 345 7873',
  },
  // There may be more than one agent
  // See https://www.privateproperty.co.za/for-sale/gauteng/pretoria/pretoria-central-and-old-east/sunnyside/16-vandag/24-steve-biko/T2563695
  estateAgents: [{
    name: 'John Smith',
    cellPhone: '072 345 4321',
    workPhone: '012 345 7873',
    portraitUrl: 'https://prppublicstore.blob.core.windows.net/live-za-images/accountholders/1768850/image/16218e3fc36748db92b1f2016e61b0ec_ach.jpg',
  }],

  // Logo at the bottom of the agent details
  estateAgency: {
    // Alt text of the logo image
    name: 'Harcourts-Rentalsdotcom Highpoint',
    logoUrl: '...',
    // Href of the link around the logo
    url: '/estate-agency/rentalsdotcom-highpoint/3950?rt=',
  }
}
