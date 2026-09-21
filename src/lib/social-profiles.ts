// The footer's social links. A plain list on purpose: these handles change
// about once a decade, and a hardcoded list never breaks the footer. (An
// earlier version looked them up through Ayrshare's API; that subscription
// ended in September 2026.)

export type SocialProfile = {
  platform: string;
  displayName: string;
  url: string;
};

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    platform: "instagram",
    displayName: "Barbara J Demers",
    url: "https://www.instagram.com/barbarajdemers",
  },
  {
    platform: "facebook",
    displayName: "The Artist Barbara J Demers",
    url: "https://www.facebook.com/526477770698863",
  },
  {
    platform: "pinterest",
    displayName: "The Artist Barbara J Demers",
    url: "https://www.pinterest.com/barbgbcreations/",
  },
  {
    platform: "tiktok",
    displayName: "barbarajdemers",
    url: "https://www.tiktok.com/@barbarajdemers",
  },
];
