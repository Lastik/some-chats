import {Tick} from "../tick";
import {Range} from "../../../../index"
import {MajorTicksGenerator} from "../major-ticks-generator";
import {MathHelper} from "../../../../services";

export class NumericMajorLogarithmicTicksGenerator extends MajorTicksGenerator<number> {
  private logarithmBase: number;

  constructor(logarithmBase: number, majorTickHeight: number) {
    super(majorTickHeight);

    this.logarithmBase = logarithmBase;
  }

  generateTicks(range: Range<number>, ticksCount: number): Array<Tick<number>> {
    let firstTickValue = Math.floor(MathHelper.logByBase(this.logarithmBase, range.min));
    let lastTickValue = Math.ceil(MathHelper.logByBase(this.logarithmBase, range.max));

    let actualTicksCount = lastTickValue - firstTickValue + 1;

    let ticks = Array(actualTicksCount);
    for (let i = 0; i < actualTicksCount; i++) {
      ticks[i] = new Tick(
        Math.pow(this.logarithmBase, firstTickValue + i),
        this.majorTickHeight,
        i);
    }

    return ticks;
  }

  suggestDecreasedTickCount(ticksCount: number): number {
    return ticksCount;
  }

  suggestIncreasedTicksCount(ticksCount: number): number {
    return ticksCount;
  }
}