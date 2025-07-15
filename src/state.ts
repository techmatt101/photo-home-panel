import { AuthService } from "./services/auth-service";
import { CalendarEventsService } from "./services/calendar-events-service";
import { HomeAssistantApi } from "./intergrations/home-assistant/home-assistant-api";
import { registerHomeAssistantAuth, registerPhotoPrismAuth } from "./auth";
import { PhotoPrismApi } from "./intergrations/photoprism/photo-prism-api";
import { ControlButtonsService } from "./services/control-buttons-service";
import { MediaPlayerService } from "./services/media-player-service";
import { WeatherService } from "./services/weather-service";
import { TimeService } from "./services/time-service";
import { SlideshowService } from "./services/slideshow-service";
import { PhotoService } from "./services/photo-service";

export const authService = new AuthService();

registerPhotoPrismAuth(authService);
registerHomeAssistantAuth(authService);

export const homeAssistantApi = new HomeAssistantApi(authService.getConfig('homeassistant')!);
export const photoPrismApi = new PhotoPrismApi(authService.getConfig('photoprism')!);

export const calendarEventsService = new CalendarEventsService(homeAssistantApi);
export const controlButtonsService = new ControlButtonsService(homeAssistantApi);
export const mediaPlayerService = new MediaPlayerService(homeAssistantApi);
export const timeService = new TimeService();
export const weatherService = new WeatherService(homeAssistantApi);

export const slideshowService = new SlideshowService(new PhotoService(photoPrismApi));