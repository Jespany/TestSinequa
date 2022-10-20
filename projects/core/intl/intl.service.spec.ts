import { TestBed, waitForAsync } from "@angular/core/testing"

import { AppLocalesConfig } from "@testing/mocks/app.locales.config";

import { IntlService, LOCALES_CONFIG } from "./intl.service";

describe('IntlService', () => {
  let service: IntlService;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        IntlService,
        { provide: LOCALES_CONFIG, useClass: AppLocalesConfig }
      ]
    });

    service = TestBed.inject(IntlService)
    service.init();
  });

  it("can load instance", () => {
    expect(service).toBeTruthy();
    expect(service.events).toBeDefined();
    expect(service.locales).toBeDefined();
  })

  it("should init() and overrides default locale with initial locale (en-US)", waitForAsync(() => {
    const init = spyOn(service, "init").and.callThrough();

    // default locale is set to "fr" but initial locale is "en-US"
    expect(service['localesConfig'].defaultLocale.name).toEqual('fr');

    // multiples calls to use() method make this test fails
    // refacto in "migration" branch resolves this issue
    service.events.subscribe(value => {
      expect(value.locale).toEqual("en-US");
    });

    service.init();
    expect(init).toHaveBeenCalled();

    // 3 locales are defined: [en, fr, de]
    expect(service.locales.length).toEqual(3);
    expect(service.locales[0].name).toEqual("en");

    expect(service.currentLocale.name).toEqual("en");
  }));

  it("should use() french locale", waitForAsync(() => {
    // here we can't use init() method, because this method override default locale
    // with inital locale (retrieved by the browser)

    // default locale is set to "fr" and initial locale is "en-US"
    expect(service['localesConfig'].defaultLocale.name).toEqual('fr');

    // after changing locale, we expect current locale to be "fr"
    service.events.subscribe(value => {
      expect(value.locale).toEqual("fr-FR");
    });

    // ask to use "fr" locale
    service.use('fr', false).subscribe(value => {
      // 3 locales are defined: [en, fr, de]
      expect(service.locales.length).toEqual(3);
      expect(service.locales[0].name).toEqual("en");

      expect(service.currentLocale.name).toEqual("fr");
    });
  }))

  describe('parseDate()', () => {
    it("should parse MM/DD/YYYY (en-US)", waitForAsync(() => {
      service.use("en", false).subscribe(() => {
        expect(service.parseDate("12/31/2022") instanceof Date).toBeTruthy();

        // for "moment" this string format is allowed vs "date-fns" does not
        expect(service.parseDate("12-31-2022") instanceof Date).toBeTruthy();

        // invalid dates
        expect(service.parseDate("31/12/2022") instanceof Date).toBeFalsy();
        expect(service.parseDate("31-12-2022") instanceof Date).toBeFalsy();
      });
    }))

    it("should parse DD/MM/YYYY (french)", waitForAsync(() => {
      service.use("fr", false).subscribe(() => {
        expect(service.parseDate("31/12/2022") instanceof Date).toBeTruthy();

        // Invalid dates
        expect(service.parseDate("31-12-2022") instanceof Date).toBeFalsy();

        expect(service.parseDate("12/31/2022") instanceof Date).toBeFalsy();
        expect(service.parseDate("12-31-2022") instanceof Date).toBeFalsy();
      });
    }))

  })

  describe('formatDate()', () => {
    it("should format a date in the current locale (en-US) - MM/DD/YYYY", () => {

      expect(service.formatDate("12/31/2022")).toEqual("12/31/2022");
      expect(service.formatDate("12-31-2022")).toEqual("12/31/2022");
      expect(service.formatDate("2022-12-31")).toEqual("12/31/2022");

      // Tue Sep 27 2022 15:52:11 GMT+0200
      expect(service.formatDate(1664286731218)).toEqual('9/27/2022');

    })

    it("should format a date in the current locale (french) - DD/MM/YYYY", waitForAsync(() => {
      service.use("fr", false).subscribe(() => {
        expect(service.formatDate("12/31/2022")).toEqual("31/12/2022");
        expect(service.formatDate("12-31-2022")).toEqual("31/12/2022");
        expect(service.formatDate("2022-12-31")).toEqual("31/12/2022");

        // Tue Sep 27 2022 15:52:11 GMT+0200
        expect(service.formatDate(1664286731218)).toEqual('27/09/2022');
      });
    }));

    it("should format a date in the current locale according options (en-US)", () => {
      const spy = spyOn(console, 'warn').and.callThrough();

      expect(service.formatDate("12/31/2022", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("Dec 31, 2022");
      expect(service.formatDate("12-31-2022", { year: 'numeric', month: 'long', day: '2-digit' })).toEqual("December 31, 2022");
      expect(service.formatDate("2022-12-31", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("Dec 31, 2022");

      expect(spy).not.toHaveBeenCalled();
    })

    it("should format a date in the current locale according options (french)", waitForAsync(() => {
      service.use("fr", false).subscribe(() => {
        // formatDate() seems accepts only MM/DD/YYYY format as input
        expect(service.formatDate("12/31/2022", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("31 déc. 2022");
        expect(service.formatDate("12-31-2022", { year: 'numeric', month: 'long', day: '2-digit' })).toEqual("31 décembre 2022");
        expect(service.formatDate("2022-12-31", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("31 déc. 2022");
      });
    }));

  })

  describe('formatTime()', () => {
    it("should format a time in the current locale (en-US)", () => {
      //  Moment triggers a deprecated warning
      expect(service.formatTime("12/31/2022")).toEqual("12:00 AM");
      expect(service.formatTime("12-31-2022")).toEqual("12:00 AM");

      // here again difference between moment and date-fns, date-fns returns 1:00 AM ??
      expect(service.formatTime("2022-12-31")).toEqual("12:00 AM");

      expect(service.formatTime("12/31/2022 18:12:36")).toEqual("6:12 PM");
      expect(service.formatTime("18:12:36")).toEqual('Invalid Date');

      // Tue Sep 27 2022 15:52:11 GMT+0200
      expect(service.formatTime(1664286731218)).toEqual('3:52 PM');
    })

    it("should format a time in the current locale (french)", waitForAsync(() => {
      service.use("fr", false).subscribe(() => {

        expect(service.formatTime("12/31/2022")).toEqual("00:00");
        expect(service.formatTime("12-31-2022")).toEqual("00:00");
        // here date-fns returns "01:00"
        expect(service.formatTime("2022-12-31")).toEqual("00:00");

        expect(service.formatTime("12/31/2022 18:12:36")).toEqual("18:12");
        expect(service.formatTime("18:12:36")).toEqual('Invalid Date');

        // Tue Sep 27 2022 15:52:11 GMT+0200
        expect(service.formatTime(1664286731218)).toEqual('15:52');

      });
    }));

    it("should format a time in the current locale according options (en-US)", () => {

      expect(service.formatTime("12/31/2022", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("Dec 31, 2022, 12:00 AM");
      expect(service.formatTime("12-31-2022", { year: 'numeric', month: 'long', day: '2-digit' })).toEqual("December 31, 2022 at 12:00 AM");
      // here again, date-fns convert datetime to "01:00 AM"
      expect(service.formatTime("2022-12-31", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("Dec 31, 2022, 12:00 AM");

    })

    it("should format a time in the current locale according options (french)", waitForAsync(() => {
      service.use("fr", false).subscribe(() => {

        // formatTime() seems accepts only MM/DD/YYYY format as input
        expect(service.formatTime("12/31/2022", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("31 déc. 2022, 00:00");
        expect(service.formatTime("12-31-2022", { year: 'numeric', month: 'long', day: '2-digit' })).toEqual("31 décembre 2022 à 00:00");

        // here again moment and date-fns returns differents results ?? 00:00 for Moment vs 01:00 for date-fns
        expect(service.formatTime("2022-12-31", { year: 'numeric', month: 'short', day: '2-digit' })).toEqual("31 déc. 2022, 00:00");

      });
    }))
  })

  describe('formatRelativeTime()', () => {
    beforeEach(() => {
      jasmine.clock().mockDate(new Date(2022, 9, 1));
    })

    it('should format a relative time in the current locale (en-US)', () => {
      spyOn(console, "warn");
      expect(service.formatRelativeTime("12/31/2022")).toEqual("in 3 months");
      expect(service.formatRelativeTime("12-31-2022")).toEqual("in 3 months");
      expect(service.formatRelativeTime("2022-12-31")).toEqual("in 3 months");

      expect(service.formatRelativeTime("12/31/2022 18:12:36")).toEqual("in 3 months");
      expect(service.formatRelativeTime("18:12:36")).toEqual('NaN');

      // "unit" arg is not taken in account ??
      expect(service.formatRelativeTime("12/31/2022", "day")).toEqual("in 3 months");

      expect(service.formatRelativeTime(3, "months")).toEqual('in 3 months');
      expect(service.formatRelativeTime(2, "hour")).toEqual('in 2 hours');
      expect(service.formatRelativeTime(1, "week")).toEqual('next week');

      // no differences between "weeks" and "week" ??
      expect(service.formatRelativeTime(2, "weeks")).toEqual('in 2 weeks');
      expect(service.formatRelativeTime(2, "week")).toEqual('in 2 weeks');
    })

    it('should format a relative time in the current locale (french)', waitForAsync(() => {
      service.use("fr", false).subscribe(() => {
        expect(service.formatRelativeTime("12/31/2022")).toEqual("dans 3 mois");
        expect(service.formatRelativeTime("12-31-2022")).toEqual("dans 3 mois");
        expect(service.formatRelativeTime("2022-12-31")).toEqual("dans 3 mois");

        expect(service.formatRelativeTime("12/31/2022 18:12:36")).toEqual("dans 3 mois");
        expect(service.formatRelativeTime("18:12:36")).toEqual('NaN');

        // "unit" arg is not taken in account ??
        expect(service.formatRelativeTime("12/31/2022", "day")).toEqual("dans 3 mois");

        expect(service.formatRelativeTime(3, "months")).toEqual('dans 3 mois');
        expect(service.formatRelativeTime(2, "hour")).toEqual('dans 2 heures');
        expect(service.formatRelativeTime(1, "week")).toEqual('la semaine prochaine');

        // no differences between "weeks" and "week" ??
        expect(service.formatRelativeTime(2, "weeks")).toEqual('dans 2 semaines');
        expect(service.formatRelativeTime(2, "week")).toEqual('dans 2 semaines');
      });
    }))

  })

})