﻿import {Chart} from "./chart";
import Konva from "konva";
import extend from "lodash-es/extend";
import {ChartRenderableItem} from "./chart-renderable-item";
import {NumericPoint, Size} from "../../model";
import {GridOptions, GridOptionsDefaults} from "../../model";
import {MathHelper} from "../../services";
import {LayerName} from "../layer-name";

export class Grid extends ChartRenderableItem {

  private location: NumericPoint;
  private size: Size;

  protected horizontalLinesCoords: number[];
  protected verticalLinesCoords: number[];

  private compositeShape: Konva.Shape;
  private borderShape: Konva.Shape;

  private options: GridOptions;

  /**
   * Creates new instance of grid. Grid is grid net on chart's plot area.
   * @param {NumericPoint} location - Grid location on renderer.
   * @param {Size} size - Grid size.
   * @param {GridOptions} options - Grid options object.
   */
  constructor(location: NumericPoint, size: Size, options?: GridOptions) {
    super();
    this.location = location;
    this.size = size;

    this.options = extend(GridOptionsDefaults.Instance, options);

    this.horizontalLinesCoords = [];
    this.verticalLinesCoords = [];

    let grid = this;

    this.compositeShape = new Konva.Shape({
      fill: this.options.backgroundColor,
      stroke: this.options.foregroundColor,
      strokeWidth: 0.5,
      sceneFunc: function (context, shape) {

        let horizontalLines = grid.horizontalLinesCoords;
        let verticalLines = grid.verticalLinesCoords;

        let location = grid.location;
        let size = grid.size;

        let width = size.width;
        let height = size.height;

        context.save();
        context.beginPath();
        context.rect(location.x, location.y, width, height);
        context.clip();

        if (horizontalLines != null) {
          for (let i = 0; i < horizontalLines.length; i++) {
            let tick = horizontalLines[i];

            let start = new NumericPoint(
              MathHelper.optimizeValue(location.x),
              MathHelper.optimizeValue(location.y + tick));

            let stop = new NumericPoint(
              MathHelper.optimizeValue(location.x + size.width),
              MathHelper.optimizeValue(location.y + tick));

            context.moveTo(start.x, start.y);
            context.lineTo(stop.x, stop.y);
          }
        }

        if (verticalLines != null) {
          for (let i = 0; i < verticalLines.length; i++) {
            let tick = verticalLines[i];

            let start = new NumericPoint(
              MathHelper.optimizeValue(location.x + tick),
              MathHelper.optimizeValue(location.y));

            let stop = new NumericPoint(
              MathHelper.optimizeValue(location.x + tick),
              MathHelper.optimizeValue(location.y + size.height));

            context.moveTo(start.x, start.y);
            context.lineTo(stop.x, stop.y);
          }
        }

        context.stroke();
        context.restore();
      }
    });

    this.borderShape = new Konva.Shape({
      fill: this.options.backgroundColor,
      stroke: this.options.foregroundColor,
      strokeWidth: 1,
      sceneFunc: function (context, shape) {
        let location = grid.location;
        let size = grid.size;
        context.strokeRect(location.x, location.y, size.width, size.height);
        context.fillRect(location.x, location.y, size.width, size.height);
      }
    });
  }

  getDependantLayers(): string[] {
    return [LayerName.Chart];
  }

  override placeOnChart(chart?: Chart) {
    super.placeOnChart(chart);

    if (chart) {
      let chartLayer = chart!.getLayer(LayerName.Chart);
      if(chartLayer) {
        chartLayer.add(this.borderShape);
        chartLayer.add(this.compositeShape);
      }
    }
  }

  override removeFromChart() {
    super.removeFromChart();
    this.borderShape.remove();
    this.compositeShape.remove();
  }

  /**
   * Uprates grid's state.
   * @param {NumericPoint} location - Grid location on renderer.
   * @param {Size} size - Grid size.
   */
  update(location: NumericPoint, size: Size) {
    this.location = location;
    this.size = size;
    this.markDirty();
  }

  /**
   * Uprates grid's horizontal and vertical lines.
   * @param {Array<number>} horizontalLinesCoords - Grid's horizontal lines Y coordinates.
   * @param {Array<number>} verticalLinesCoords - Grid's vertical lines X coordinates.
   * */
  setLinesCoords(horizontalLinesCoords: Array<number>,
                 verticalLinesCoords: Array<number>) {
    this.horizontalLinesCoords = horizontalLinesCoords;
    this.verticalLinesCoords = verticalLinesCoords;
    this.markDirty();
  }
}