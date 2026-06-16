import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "9aab5471-1a01-4bb0-9161-28b93796efb5",
    authority: import.meta.env.VITE_MSAL_AUTHORITY || "https://login.microsoftonline.com/4dab0fef-f02d-440b-97c3-712e9483bd68",
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || "/",
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const loginRequest = {
  scopes: ["Sites.ReadWrite.All", "User.Read"],
  prompt: "select_account"
};
