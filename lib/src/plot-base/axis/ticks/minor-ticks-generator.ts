import {Range} from "../../../model/range";
import { Tick } from "./tick";

export interface MinorTicksGenerator<T> {
  /**
   * Generates minor ticks in specified range.
   * @param {Range} range - data range.
   * @param {Array<Tick>} majorTicks - array of major ticks in specified range.
   * @return {Array<Tick>} - array of generated ticks
   * */
  generateMinorTicks(range: Range<T>, majorTicks: Array<Tick<T>>): Array<Tick<T>>;
}