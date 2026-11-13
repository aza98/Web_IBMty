/*
 * Sunday service schedule from IBMty.config.service in IBMty.config.timeZone.
 * Shared by the countdown (pages/home.js) and the latest video (components/video.js).
 */
(function(IBMty) {
    'use strict';
    const WEEK = 7 * 24 * 3600;
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formats = new Map();
    const formatter = (timeZone) => formats.get(timeZone) || formats.set(timeZone, new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23'
    })).get(timeZone);

    function serviceState(now, {
        service,
        timeZone
    }) {
        const parts = {};
        formatter(timeZone).formatToParts(now).forEach(({
            type,
            value
        }) => {
            parts[type] = value
        });
        const nowSec = DAYS.indexOf(parts.weekday) * 86400 + parts.hour * 3600 + parts.minute * 60 + Number(parts.second);
        const startSec = service.weekday * 86400 + service.hour * 3600 + service.minute * 60;
        const sinceStart = (nowSec - startSec + WEEK) % WEEK;
        const live = sinceStart < service.durationMinutes * 60;
        return {
            live,
            untilStart: live ? 0 : WEEK - sinceStart,
            sinceStart
        }
    }
    IBMty.schedule = {
        serviceState
    }
})(self.IBMty = self.IBMty || {})