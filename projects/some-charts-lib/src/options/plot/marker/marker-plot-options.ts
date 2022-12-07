import {PlotOptions} from "../plot-options";
import {PlotKind} from "../plot-kind";
import * as Color from "color";
import {MetricDependantValue, Palette} from "../../../chart/plots";
import {MetricOptions} from "../metric-options";
import {MajorOptions, OptionsDefaults, SkinOptions} from "../../options-defaults";
import {Skin} from "../../skin";
import {CommonOptionsValues} from "../../common";

/**
 * Marker plot options
 */
export interface MarkerPlotOptions extends MarkerPlotMajorOptions, MarkerPlotSkin { }


export interface MarkerPlotMajorOptions extends PlotOptions, MajorOptions {
  /*
  * Marker plot metric with it's color.
  * */
  metric: MetricOptions<Color | Palette>;
}

export interface MarkerPlotSkin extends SkinOptions {
  /**
   * Marker size.
   */
  markerSize: number | MetricDependantValue<number>;
}

export class MarkerPlotOptionsDefaults extends OptionsDefaults<MarkerPlotSkin, MarkerPlotMajorOptions, MarkerPlotOptions>
{
  private constructor() {
    super();
  }

  public readonly skins: { [key: string]: MarkerPlotSkin } = {
    [Skin.Default]: {
      markerSize: 5
    }
  }

  public readonly majorOptions: MarkerPlotMajorOptions = {
    kind: PlotKind.Marker,
    metric: {
      id: "",
      caption: "",
      color: new Color('#CF2734')
    },
    animate: CommonOptionsValues.Animate,
    animationDuration: CommonOptionsValues.AnimationDuration
  }

  public static readonly Instance = new MarkerPlotOptionsDefaults();
}
