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