import { SOCIAL_LINKS } from '../../../data/footerContent';
import {
  InstagramIcon,
  TikTokIcon,
  PinterestIcon,
  YouTubeIcon,
  FacebookIcon,
  XIcon,
} from '../Icons';

const ICON_MAP = [InstagramIcon, TikTokIcon, PinterestIcon, YouTubeIcon, FacebookIcon, XIcon];

export const FOOTER_SOCIAL_ICONS = SOCIAL_LINKS.map((link, index) => ({
  ...link,
  Icon: ICON_MAP[index],
}));
