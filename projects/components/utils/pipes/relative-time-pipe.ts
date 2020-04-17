import {Pipe, ChangeDetectorRef} from "@angular/core";
import {AbstractIntlPipe, IntlService} from "@sinequa/core/intl";

// tslint:disable-next-line: use-pipe-transform-interface
@Pipe({name: "sqRelativeTime", pure: false})
export class RelativeTimePipe extends AbstractIntlPipe {
    constructor(
        intlService: IntlService,
        changeDetectorRef: ChangeDetectorRef) {
        super(intlService, changeDetectorRef);
    }

    updateValue(key: number | Date | undefined, params: {unit: Intl.RelativeTimeUnit} & Intl.RelativeTimeFormatOptions & { format?: string; }): void {
        super.updateValue(key, params);
        this.value = this.intlService.formatRelativeTime(key, params ? params.unit : undefined, params);
    }
}