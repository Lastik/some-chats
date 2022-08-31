import {Tick} from "../tick";
import {Point, Range} from "../../../../index"
import {MajorTicksGenerator} from "../major-ticks-generator";
import chain from "lodash-es/chain";
import {LabeledTick} from "../labeled-tick";

export class LabeledMajorTicksGenerator extends MajorTicksGenerator<number> {

  private labels: Array<Point<string>>;

  constructor(majorTickHeight: number, labels: Array<Point<string>>) {
    super(majorTickHeight);
    this.labels = labels;
  }

  override get defaultTicksCount(): number {
    return this.labels.length;
  }

  generateTicks(range: Range<number>, ticksCount: number): Array<Tick<number>> {
    return chain(this.labels).filter(label => {
      return label.y >= range.min && label.y <= range.max;
    }).map((label, index) => {
      return new LabeledTick(label.y, this.majorTickHeight, index, label.x);
    }).value();
  }

  suggestDecreasedTickCount(ticksCount: number): number {
    return ticksCount;
  }

  suggestIncreasedTicksCount(ticksCount: number): number {
    return ticksCount;
  }

  setLabels(labels: Array<Point<string>>) {
    this.labels = labels;
  }
}