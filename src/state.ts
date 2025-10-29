import { AuthService } from "./services/auth.service";
import { CalendarEventsService } from "./services/calendar-events-service";
import { HomeAssistantApi } from "./intergrations/home-assistant/home-assistant-api";
import { registerHomeAssistantAuth, registerPhotoPrismAuth } from "./auth";
import { PhotoPrismApi } from "./intergrations/photoprism/photo-prism-api";
import { ControlButtonsService } from "./services/control-buttons-service";
import { MediaService } from "./services/media.service";
import { WeatherService } from "./services/weather.service";
import { TimerService } from "./services/timer.service";

export const authService = new AuthService();

registerPhotoPrismAuth(authService);
registerHomeAssistantAuth(authService);

export const homeAssistantApi = new HomeAssistantApi(authService.getConfig('homeassistant')!);
export const photoPrismApi = new PhotoPrismApi(authService.getConfig('photoprism')!);

export const calendarEventsService = new CalendarEventsService(homeAssistantApi);
export const controlButtonsService = new ControlButtonsService(homeAssistantApi);
export const mediaPlayerService = new MediaService(homeAssistantApi);
export const weatherService = new WeatherService(homeAssistantApi);
export const timerService = new TimerService(homeAssistantApi);
