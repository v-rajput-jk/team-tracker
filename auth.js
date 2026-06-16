import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./msalConfig";

const msalInstance = new PublicClientApplication(msalConfig);

export const login = async () => {
    const res = await msalInstance.loginPopup(loginRequest);
    return res;
};

export const getToken = async () => {
    const accounts = msalInstance.getAllAccounts();

    const token = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
    });

    return token.accessToken;
};