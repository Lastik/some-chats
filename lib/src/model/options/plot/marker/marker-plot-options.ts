import {TextOptions} from "../../common";
import {FontUnits} from "../../../font";
import {PlotOptions} from "../plot-options";
import {PlotKind} from "../plot-kind";
import * as Color from "color";
import {MetricDependantValue} from "../../../plots/metric/metric-dependant-value";
import {Palette} from "../../../plots/metric/palette";

/**
 * Marker plot options
 */
export interface MarkerPlotOptions extends PlotOptions, TextOptions {

  /*
  * Marker fill color.
  * */
  fill: Color | Palette;

  /**
   * Marker size.
   */
  markerSize: number | MetricDependantValue<number>;
}

export class MarkerPlotOptionsDefaults
{
  private static _instance: MarkerPlotOptions = {
    metricName: "",
    markerSize: 5,
    caption: "",
    fill: new Color("blue"),
    kind: PlotKind.Bars,
    font: {
      family: 'Calibri',
      size: 10,
      units: FontUnits.Points
    },
    foregroundColor:''
  }

  public static get Instance()
  {
    return this._instance;
  }
}
