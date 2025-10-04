/**
 * Wallet Icon - Enterprise Production Ready
 *
 * Finance icon for wallet/payment display.
 * Always-on icon with semantic tokens and standardized API.
 */

import { createIcon, type IconProperties, type IconReference, type IconElement } from './_base';

export const WalletIcon = createIcon('WalletIcon', () => (
  <>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3z" />
    <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
    <path d="M16 12h4" />
    <circle cx="16" cy="12" r="1.5" />
  </>
));

export type WalletIconProperties = IconProperties;
export type WalletIconReference = IconReference;
export type WalletIconElement = IconElement;
