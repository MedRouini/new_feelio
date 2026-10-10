// Shared by server code and tests. No secrets here.
export const CHILD_DEVICE_CONFIG_ID = "child-device";
export const CHILD_DEVICE_KEY_DAYS = 30;
export const CHILD_DEVICE_COOKIE = "feelio_device";

// Permissions carried by a child device key. Server-only: clients can never set them.
export const CHILD_PERMISSIONS = { child: ["play"] } as const;
