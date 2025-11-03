import { Observable } from "rxjs";

function msToNextMinute() {
    const now = new Date();
    return (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
}

export function minuteSync(): Observable<Date> {
    return new Observable(subscriber => {
        function tick() {
            subscriber.next(new Date());
            setTimeout(tick, msToNextMinute());
        }

        subscriber.next(new Date());
        setTimeout(tick, msToNextMinute());
    });
}