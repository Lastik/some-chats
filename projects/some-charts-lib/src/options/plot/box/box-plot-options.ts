import {PlotOptions} from "../plot-options";
import {PlotKind} from "../plot-kind";
import * as Color from "color";
import {Palette} from "../../../chart/plots";
import {MetricOptions} from "../metric-options";

/**
 * Marker plot options
 */
export interface BoxPlotOptions extends PlotOptions {

  /*
  * Marker plot metric with it's color.
  * */
  metric: MetricOptions<Color | Palette>;

  boxWidth?: number;

  whiskersWidth?: number

  lineWidth?: number;

  stroke?: Color;
}

export class BoxPlotOptionsDefaults
{
  private static _instance: BoxPlotOptions = {
    metric: {
      id: "",
      caption: "",
      color: new Color('#CF2734')
    },
    kind: PlotKind.Box,
    lineWidth: 2,
    stroke: new Color('white'),
    animate: false,
    animationDuration: 600
  }

  public static get Instance()
  {
    return this._instance;
  }
}
