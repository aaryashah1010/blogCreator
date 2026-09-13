// Manually researched and verified — every URL and claim here was checked, not AI-generated.
// Keep this list short and legitimate rather than long and spammy: quality directories
// build real NAP citation consistency and trust signals; low-quality ones risk looking
// like a link scheme to Google. Re-verify entries occasionally — site policies change.

export const BACKLINK_CATEGORIES = [
  {
    category: "Business listings (local SEO citations)",
    note: "Mostly nofollow, but these build the NAP (name/address/phone) consistency Google and Bing use as a real local-ranking signal — and several show up directly in Maps/local search regardless of link value.",
    resources: [
      {
        name: "Google Business Profile",
        url: "https://www.google.com/business/",
        description: "The single most important free listing for any business with a physical location or service area. Powers Google Maps and local search results directly."
      },
      {
        name: "Bing Places for Business",
        url: "https://www.bingplaces.com/",
        description: "Microsoft's equivalent to Google Business Profile — can import your listing directly from Google in one click."
      },
      {
        name: "Apple Business Connect",
        url: "https://businessconnect.apple.com/",
        description: "Controls how your business appears on Apple Maps and in Siri results."
      },
      {
        name: "Facebook Business Page",
        url: "https://business.facebook.com/",
        description: "Free company page; widely trusted and doubles as a social presence, not just a directory entry."
      },
      {
        name: "Yelp for Business",
        url: "https://biz.yelp.com/",
        description: "Free basic listing with high domain authority — strong for any local or service-based business."
      },
      {
        name: "Foursquare for Business",
        url: "https://foursquare.com/business/",
        description: "Free listing; its location data feeds into a number of other apps and services."
      },
      {
        name: "Manta",
        url: "https://www.manta.com/business-listings/free-business-listing",
        description: "Free small-business directory listing, running for 20+ years."
      }
    ]
  },
  {
    category: "Professional / B2B directories",
    note: "Better for credibility and referral traffic than raw link value, but genuinely useful for B2B trust-building.",
    resources: [
      {
        name: "LinkedIn Company Page",
        url: "https://business.linkedin.com/",
        description: "Free — close to essential for B2B credibility. Also lets you publish long-form articles (LinkedIn Pulse) with a link back to your site."
      },
      {
        name: "Crunchbase",
        url: "https://www.crunchbase.com/",
        description: "Free company profile, well-known in tech/startup/investor circles, solid domain authority."
      },
      {
        name: "Clutch",
        url: "https://clutch.co/",
        description: "Free profile with client reviews — best fit for agencies and B2B service providers specifically."
      },
      {
        name: "Better Business Bureau (BBB)",
        url: "https://www.bbb.org/",
        description: "Free basic listing adds a trust signal; a full accredited profile with a dofollow link requires paid accreditation."
      }
    ]
  },
  {
    category: "Reviews & trust",
    resources: [
      {
        name: "Trustpilot",
        url: "https://business.trustpilot.com/",
        description: "Free business profile for collecting and showcasing customer reviews — a strong trust signal plus a backlink."
      }
    ]
  },
  {
    category: "Content platforms (genuine backlinks, not directory entries)",
    note: "These only work if the content itself is genuinely useful — a link dropped with no real answer or article reads as spam and gets removed or downvoted.",
    resources: [
      {
        name: "Medium",
        url: "https://medium.com/",
        description: "Free publishing platform — write or republish an article with a link back to your site."
      },
      {
        name: "Quora",
        url: "https://www.quora.com/",
        description: "Free — answer questions in your niche with a link back where it's genuinely relevant, not forced in. Value comes from real expertise."
      }
    ]
  }
];
