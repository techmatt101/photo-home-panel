import { AuthService, AuthServiceRegistration } from "./services/auth-service";

export function registerPhotoPrismAuth(authService: AuthService) {
    const registration: AuthServiceRegistration = {
        type: 'photoprism',
        name: 'PhotoPrism',
        storageKey: 'photoprism_auth',
        formFields: [
            {
                id: 'baseUrl',
                label: 'PhotoPrism URL',
                type: 'url',
                placeholder: 'https://photoprism.local',
                required: true
            },
            {
                id: 'apiKey',
                label: 'API Key',
                type: 'password',
                placeholder: 'Enter your API key',
                required: true,
                helpText: 'The API key for authenticating with PhotoPrism'
            }
        ]
    };

    authService.registerService(registration);
}

export function registerHomeAssistantAuth(authService: AuthService) {
    const registration: AuthServiceRegistration = {
        type: 'homeassistant',
        name: 'Home Assistant',
        storageKey: 'homeassistant_auth',
        formFields: [
            {
                id: 'url',
                label: 'Home Assistant URL',
                type: 'url',
                placeholder: 'http://homeassistant.local',
                required: true
            },
            {
                id: 'accessToken',
                label: 'Long-lived Access Token (optional)',
                type: 'password',
                placeholder: 'Enter your access token',
                required: false,
                helpText: 'If you don\'t provide an access token, you\'ll be redirected to the Home Assistant login page.'
            }
        ]
    };

    authService.registerService(registration);
}


// import { HomeAssistantConfig } from "./intergrations/home-assistant/home-assistant.types";
// import { PhotoPrismConfig } from "./intergrations/photoprism/photoprism.types";
// import { authService, AuthServiceRegistration } from "./services/auth-service";
// import { HomeAssistantApi } from "./intergrations/home-assistant/home-assistant-api";
// import { PhotoPrismApi } from "./intergrations/photoprism/photo-prism-api";
//
// // Create service instances
// let homeAssistantService: HomeAssistantApi | null = null;
// let photoPrismApiService: PhotoPrismApi | null = null;
//
// // Function to handle auth requests
// const handleAuthRequest = (type: string, message: string) => {
//     authService.requestAuth(type, message);
// };
//
// export function registerPhotoPrismAuth() {
//     const registration: AuthServiceRegistration = {
//         type: 'photoprism',
//         name: 'PhotoPrism',
//         storageKey: 'photoprism_auth',
//         formFields: [
//             {
//                 id: 'baseUrl',
//                 label: 'PhotoPrism URL',
//                 type: 'url',
//                 placeholder: 'https://photoprism.local',
//                 required: true
//             },
//             {
//                 id: 'apiKey',
//                 label: 'API Key',
//                 type: 'password',
//                 placeholder: 'Enter your API key',
//                 required: true,
//                 helpText: 'The API key for authenticating with PhotoPrism'
//             }
//         ]
//     };
//
//     authService.registerService(registration);
//
//     // Get config if available
//     const config = authService.getConfig('photoprism') as PhotoPrismConfig | null;
//
//     // Create service instance with config
//     photoPrismApiService = new PhotoPrismApi(config || undefined, handleAuthRequest);
// }
//
// export function registerHomeAssistantAuth() {
//     const registration: AuthServiceRegistration = {
//         type: 'homeassistant',
//         name: 'Home Assistant',
//         storageKey: 'homeassistant_auth',
//         formFields: [
//             {
//                 id: 'url',
//                 label: 'Home Assistant URL',
//                 type: 'url',
//                 placeholder: 'http://homeassistant.local',
//                 required: true
//             },
//             {
//                 id: 'accessToken',
//                 label: 'Long-lived Access Token (optional)',
//                 type: 'password',
//                 placeholder: 'Enter your access token',
//                 required: false,
//                 helpText: 'If you don\'t provide an access token, you\'ll be redirected to the Home Assistant login page.'
//             }
//         ]
//     };
//
//     authService.registerService(registration);
//
//     // Get config if available
//     const config = authService.getConfig('homeassistant') as HomeAssistantConfig | null;
//
//     // Create service instance with config
//     homeAssistantService = new HomeAssistantApi(config);
// }
//
// // Export service instances
// export function getHomeAssistantService(): HomeAssistantApi {
//     if (!homeAssistantService) {
//         homeAssistantService = new HomeAssistantApi(undefi);
//     }
//     return homeAssistantService;
// }
//
// export function getPhotoPrismApiService(): PhotoprismApi {
//     if (!photoPrismApiService) {
//         photoPrismApiService = new PhotoPrismApi(undefined, handleAuthRequest);
//     }
//     return photoPrismApiService;
// }
