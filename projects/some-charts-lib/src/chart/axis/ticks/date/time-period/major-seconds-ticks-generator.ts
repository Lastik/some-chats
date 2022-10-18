import * as moment from "moment";
import {MajorTimeUnitTicksGenerator} from "../major-time-unit-ticks-generator";
import {TimeUnit} from "../time-unit";

export class MajorSecondsTicksGenerator extends MajorTimeUnitTicksGenerator {

  constructor(majorTickHeight: number) {
    super(majorTickHeight);
  }

  protected getTimeUnitValueAsString(date: moment.Moment, detailed: boolean): string {
    if (detailed) {
      return date.format('MMMM Do YYYY, H:mm:ss');
    }
    return date.seconds().toString() + 's';
  }

  get timeUnit(): TimeUnit {
    return 'seconds';
  }
}