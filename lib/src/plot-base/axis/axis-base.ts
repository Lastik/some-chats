﻿import {NumericPoint} from "../../model/point/numeric-point";
import {Size} from "../../model/size";
import {AxisOptions, AxisOptionsDefaults} from "../../options/axis-options";
import Konva from "konva";
import {MathHelper} from "../../services/math-helper";
import {ChartRenderableItem} from "../../core/chart-renderable-item";
import {Chart} from "../chart";
import {TextMeasureUtils} from "../../services/text-measure-utils";
import {FontHelper} from "../../services/font-helper";
import {Tick} from "./ticks/tick";
import {tick} from "@angular/core/testing";
import {MajorTicksGenerator} from "./ticks/major-ticks-generator";
import {MinorTicksGenerator} from "./ticks/minor-ticks-generator";
import {Range} from '../../model/range';
import zipWith from 'lodash-es/zipWith';
import chain from 'lodash-es/chain';
import {DataTransformation} from "../../model/transformation/data-transformation";

export abstract class AxisBase<T extends Object> extends ChartRenderableItem {
  /**
   * Vertical multiplier, which must be used for defining an offset for fillText canvas method.
   * Each text must be shifted by this constant in top direction (Y axis).
   */
  public static readonly textVerticalOffsetMultiplier: number = 0.17;

  protected location: NumericPoint;
  protected range: Range<T>;
  protected initialWidth: number | undefined;
  protected initialHeight: number | undefined;
  protected orientation: AxisOrientation;
  protected options: AxisOptions;

  protected size: Size;

  private borderShape: Konva.Shape;
  private ticksShape: Konva.Shape;

  protected majorTicks: Tick<T>[];
  protected minorTicks?: Tick<T>[];

  protected majorTicksLabelsSizes: Size[];
  protected majorTicksScreenCoords: number[];
  protected minorTicksScreenCoords: number[];

  protected readonly majorTicksGenerator: MajorTicksGenerator<T>;
  protected readonly minorTicksGenerator?: MinorTicksGenerator<T>;

  static readonly increaseTicksCountCoeff = 2;
  static readonly decreaseTicksCountCoeff = 1.5;
  static readonly generateMajorTicksMaxAttempts = 12;

  protected constructor(location: NumericPoint,
                        orientation: AxisOrientation,
                        range: Range<T>,
                        width?: number,
                        height?: number,
                        options?: AxisOptions) {
    super();

    this.location = location;
    this.range = range;

    this.initialWidth = width;
    this.initialHeight = height;

    this.validateAxisInitialWidth();
    this.validateAxisInitialHeight();

    this.size = new Size(width ?? 0, height ?? 0);

    this.markDirty();

    this.orientation = orientation;

    this.majorTicks = [];
    this.minorTicks = [];

    this.majorTicksLabelsSizes = [];

    this.majorTicksScreenCoords = [];
    this.minorTicksScreenCoords = [];

    this.options = options ?? AxisOptionsDefaults.Instance;

    this.majorTicksGenerator = this.createMajorTicksGenerator();
    this.minorTicksGenerator = this.createMinorTicksGenerator();

    let self = this;

    this.borderShape = new Konva.Shape({
      fill: this.options.backgroundColor,
      stroke: this.options.foregroundColor,
      strokeWidth: 1,
      sceneFunc: function (context, shape) {
        let location = self.location;
        let size = self.size;

        let roundedX = MathHelper.optimizeValue(location.x);
        let roundedY = MathHelper.optimizeValue(location.y);

        let roundedWidth = MathHelper.optimizeValue(size!.width);
        let roundedHeight = MathHelper.optimizeValue(size!.height);
        if (self.options.drawBorder) {
          context.strokeRect(roundedX, roundedY, roundedWidth, roundedHeight);
        }
        context.fillRect(roundedX, roundedY, roundedWidth, roundedHeight);
      }
    });

    this.ticksShape = new Konva.Shape({
      fill: this.options.backgroundColor,
      stroke: this.options.foregroundColor,
      strokeWidth: 1,
      sceneFunc: function(context: Konva.Context, shape: Konva.Shape) {
        let majorTicks = self.majorTicks;

        let majorTicksCount = self.majorTicks.length;
        let minorTicksCount = self.minorTicks?.length ?? 0;

        let majorTicksScreenXCoords = self.majorTicksScreenCoords;
        let minorTicksScreenXCoords = self.minorTicksScreenCoords;

        let axisRenderOriginX = MathHelper.optimizeValue(self.location.x);
        let axisRenderOriginY = MathHelper.optimizeValue(self.location.y);

        let axisRenderWidth = MathHelper.optimizeValue(self.size.width);
        let axisRenderHeight = MathHelper.optimizeValue(self.size.height);

        context.save();
        context.beginPath();
        context.rect(axisRenderOriginX, axisRenderOriginY, axisRenderWidth, axisRenderHeight);
        context.clip();

        context.setAttr('font', FontHelper.fontToString(self.options.font));
        context.setAttr('textBaseline', 'top');

        context.beginPath();

        if (self.orientation == AxisOrientation.Horizontal) {

          for (let i = 0; i < majorTicksCount; i++) {
            let tick = majorTicks[i];

            let tickScreenXCoord = majorTicksScreenXCoords[i];
            let labelSize = self.measureLabelSizeForMajorTick(tick);

            context.fillText(tick.toString(),
              self.location.x + tickScreenXCoord - labelSize.width / 2,
              self.location.y + tick.length - labelSize.height * AxisBase.textVerticalOffsetMultiplier);

            let xVal = MathHelper.optimizeValue(self.location.x + tickScreenXCoord);
            let yVal = MathHelper.optimizeValue(self.location.y);
            context.moveTo(xVal, yVal);
            yVal = MathHelper.optimizeValue(self.location.y + tick.length);
            context.lineTo(xVal, yVal);
          }

          if(self.minorTicks !== undefined) {
            let minorTicks = self.minorTicks!;
            for (let i = 0; i < minorTicksCount; i++) {
              let tick = minorTicks[i];
              let ticksScreenXCoord = minorTicksScreenXCoords[i]

              let xVal = MathHelper.optimizeValue(self.location.x + ticksScreenXCoord);
              let yVal = MathHelper.optimizeValue(self.location.y);
              context.moveTo(xVal, yVal);
              yVal = MathHelper.optimizeValue(self.location.y + tick.length);
              context.lineTo(xVal, yVal);
            }
          }
        } else {

          let labelVerticalDelimiter = 2 - 2 * AxisBase.textVerticalOffsetMultiplier;

          for (let i = 0; i < majorTicksCount; i++) {
            let tick = majorTicks[i];

            let tickScreenXCoord = majorTicksScreenXCoords[i];
            let labelSize = self.measureLabelSizeForMajorTick(tick);

            context.fillText(tick.toString(),
              self.location.x + self.size.width - labelSize.width - (tick.length + 2),
              self.location.y + tickScreenXCoord - labelSize.height / labelVerticalDelimiter);

            let xVal = MathHelper.optimizeValue(self.location.x + self.size.width - tick.length);
            let yVal = MathHelper.optimizeValue(self.location.y + tickScreenXCoord);
            context.moveTo(xVal, yVal);
            xVal = MathHelper.optimizeValue(self.location.x + self.size.width);
            context.lineTo(xVal, yVal);
          }

          for (let i = 0; i < minorTicksCount; i++) {
            let tickSceenXCoord = minorTicksScreenXCoords[i];

            let xVal = MathHelper.optimizeValue(self.location.x + self.size.width - tick.length);
            let yVal = MathHelper.optimizeValue(self.location.y + tickSceenXCoord);
            context.moveTo(xVal, yVal);
            xVal = MathHelper.optimizeValue(self.location.x + self.size.width);
            context.lineTo(xVal, yVal);
          }
        }
        context.stroke();
        context.restore();
      }
    })
  }

  protected validateAxisInitialWidth(){
    if(this.initialWidth === undefined && this.orientation != AxisOrientation.Vertical){
      throw "Undefined width is supported for vertical axis only";
    }
  }

  protected validateAxisInitialHeight(){
    if(this.initialHeight === undefined && this.orientation != AxisOrientation.Horizontal){
      throw "Undefined width is supported for horizontal axis only";
    }
  }

  protected abstract createMajorTicksGenerator(): MajorTicksGenerator<T>;
  protected abstract createMinorTicksGenerator(): MinorTicksGenerator<T> | undefined;

  /**
   * Returns axis dependant layers.
   * @returns {Array<string>} Axis dependant layers.
   */
  override getDependantLayers(): Array<string> {
    return ["visibleObjects"];
  }

  override placeOnChart(chart?: Chart) {
    super.placeOnChart(chart);

    if (chart) {
      let visibleObjectsLayer = chart!.getLayer('visibleObjects');
      visibleObjectsLayer.add(this.borderShape);
      visibleObjectsLayer.add(this.ticksShape);
      this.update(this.location, this.range, this.initialWidth, this.initialHeight);
    }
  }

  /**
   * Returns axis size
   * @returns {Size} axis size.
   */
  getSize() {
    /// <summary>Returns axis actual width.</summary>
    /// <returns type="Number" />
    return this.size;
  }

  /**
   * Returns axis orientation
   * @returns {AxisOrientation} axis orientation.
   */
  getOrientation() {
    return this.orientation;
  }


  /**
   * Removes axis from chart.
   */
  override removeFromChart() {
    super.removeFromChart();
    this.ticksShape.remove();
    this.borderShape.remove();
  }

  /**
   * Returns tick's screen coordinate
   * @returns {number} Tick's screen coordinate.
   */
  protected getTickScreenCoordinate(tick: Tick<T>, screenWidth: number, screenHeight: number, range: Range<T>): number {

    let numericRange = new Range<number>(this.axisValueToNumber(range.min), this.axisValueToNumber(range.max));

    if (this.orientation == AxisOrientation.Horizontal)
      return DataTransformation.dataToScreenX(this.axisValueToNumber(tick.value), numericRange, screenWidth);
    else
      return DataTransformation.dataToScreenY(this.axisValueToNumber(tick.value), numericRange, screenHeight);
  }

  /**
   * Converts value from axis inits to number.
   * */
  abstract axisValueToNumber(tickValue: T): number;

  /**
   * Measures labels sizes for an array of major ticks
   * @param { Array<Tick>} ticks - Array of ticks
   * @returns {Array<Size>}
   * */
  protected measureLabelsSizesForMajorTicks(ticks: Array<Tick<T>>): Array<Size> {

    let labelsSizes = [];

    for (let tick of ticks) {
      labelsSizes.push(this.measureLabelSizeForMajorTick(tick));
    }

    return labelsSizes;
  }

  /**
   * Measures label's size for specified major tick.
   * @param {string} tick - Tick for which to generate label size.
   * @returns {Size} Label's size.
   */
  protected measureLabelSizeForMajorTick(tick: Tick<T>): Size{
    if (this.majorTicks != null) {
      let tickFromArr = this.majorTicks[tick.index];
      if (tickFromArr != null && tickFromArr.index === tick.index) {
        return this.majorTicksLabelsSizes[tick.index];
      }
      else {
        return this.measureLabelSize(tick.toString());
      }
    }
    else {
      return this.measureLabelSize(tick.toString());
    }
  }

  /**
   * Generates label's size for specified label.
   * @param {string} label - Label to measure.
   * @returns {Size} Label's size.
   */
  protected measureLabelSize(label: string): Size {
    let width = TextMeasureUtils.measureTextWidth(FontHelper.fontToString(this.options.font), label);
    let height = this.options.font.size;
    return new Size(width, height);
  }

  /**
   * Updates axis state.
   * @param {Point} location - axis location on chart.
   * @param {Range} range - axis data range.
   * @param {number} width - axis width. May be undefined (for vertical axis only)
   * @param {number} height - axis height. May be undefined (for horizontal axis only)
   */
  public update(location: NumericPoint,
                range: Range<T>,
                width?: number,
                height?: number){

    this.location = location;
    this.range = range;

    this.initialWidth = width;
    this.initialHeight = height;

    this.validateAxisInitialWidth();
    this.validateAxisInitialHeight();

    this.updateTicksData(this.location, this.range, this.size);
    this.updateAxisSize();
    this.markDirty();
  }

  protected updateTicksData(location: NumericPoint,
                            range: Range<T>,
                            size: Size){

    this.majorTicks = this.generateMajorTicks(range, size);
    this.measureLabelsSizesForMajorTicks(this.majorTicks);
    this.minorTicks = this.minorTicksGenerator?.generateMinorTicks(range, this.majorTicks);

    let majorTicksScreenCoords = [];
    let minorTicksScreenCoords = [];

    for (let tick of this.majorTicks) {
      majorTicksScreenCoords.push(this.getTickScreenCoordinate(tick, size.width, size.height, range));
    }

    this.majorTicksScreenCoords = majorTicksScreenCoords;

    if(this.minorTicks) {
      for (let tick of this.minorTicks) {
        minorTicksScreenCoords.push(this.getTickScreenCoordinate(tick, size.width, size.height, range));
      }
    }

    this.minorTicksScreenCoords = minorTicksScreenCoords;
  }

  protected updateAxisSize() {

    let renderWidth = this.initialWidth;
    let renderHeight = this.initialHeight;

    if (this.initialWidth === undefined && this.orientation == AxisOrientation.Vertical) {
      renderWidth = 0;

      for (let tick of this.majorTicks) {
        let labelSize = this.measureLabelSizeForMajorTick(tick);
        renderWidth = Math.max(labelSize.width, renderWidth);
      }

      renderWidth += this.options.majorTickHeight + 4;
    }

    if (this.initialHeight === undefined && this.orientation == AxisOrientation.Horizontal) {
      renderHeight = TextMeasureUtils.measureFontHeight(this.options.font) + this.options.majorTickHeight + 2;
    }

    this.size = new Size(renderWidth!, renderHeight!);
  }

  /**
   * Generates ticks for specified axis.
   * @param {Range} range - axis range.
   * @param {Size} size - axis size;
   * @returns {Array<Tick>}
   * */
  protected generateMajorTicks(range: Range<T>, size: Size): Array<Tick<T>> {
    let state: TicksCountChange | undefined = undefined;
    let prevState;
    let prevTicksArrLength = -1;
    let ticksCount = this.majorTicksGenerator.defaultTicksCount;
    let attempt = 1;
    let ticks: Array<Tick<T>> = [];

    while(state != TicksCountChange.OK) {
      if (attempt++ >= AxisBase.generateMajorTicksMaxAttempts){
        console.log('Axis major ticks generation failed');
        ticks = [];
        break;
      }
      else {

        if (range.isPoint())
          ticksCount = 1;

        ticks = this.majorTicksGenerator.generateTicks(this.range, ticksCount);

        if (ticks.length == prevTicksArrLength) {
          state = TicksCountChange.OK;
        }
        else {
          prevTicksArrLength = ticks.length;

          let labelsSizes = this.measureLabelsSizesForMajorTicks(ticks);

          prevState = state;

          state = this.checkLabelsArrangement(this.size, labelsSizes, ticks, range);

          if (prevState == TicksCountChange.Decrease && state == TicksCountChange.Increase) {
            state = TicksCountChange.OK;
          }
          if (state != TicksCountChange.OK) {

            let prevTicksCount = ticksCount;

            if (state == TicksCountChange.Decrease) {
              ticksCount = this.majorTicksGenerator.suggestIncreasedTicksCount(ticksCount);
            } else {
              ticksCount = this.majorTicksGenerator.suggestDecreasedTickCount(ticksCount);
            }
            if (ticksCount == 0 || prevTicksCount == ticksCount) {
              ticksCount = prevTicksCount;
              state = TicksCountChange.OK;
            }
          }
        }
      }
    }

    return ticks;
  }

  /**
  * Checks labels arrangement on axis (whether they overlap with each other or not).
  * Returns if the amount of ticks on axis must be changed or preserved.
  * @param {Size} axisSize - axis size;
  * @param {Array<Size>} ticksLabelsSizes - sizes of ticks labels;
  * @param {Array<Tick>} ticks - ticks.
  * @param {Range} range - axis range.
  * @returns {TicksCountChange}
  * */
  protected checkLabelsArrangement(axisSize: Size, ticksLabelsSizes: Array<Size>, ticks: Array<Tick<T>>, range: Range<T>): TicksCountChange {
    let isAxisHorizontal = this.orientation == AxisOrientation.Horizontal;

    let ticksRenderInfo = chain(zipWith(ticksLabelsSizes, ticks, (size, tick) => { return {tick: tick, labelSize: size };})).map(sizeTickTuple=>{
      return {
        coord: this.getTickScreenCoordinate(sizeTickTuple.tick, axisSize.width, axisSize.height, range),
        length: isAxisHorizontal ? sizeTickTuple.labelSize.width : sizeTickTuple.labelSize.height
      }
    }).sortBy(i => i.coord).value();

    let res: TicksCountChange = TicksCountChange.OK;

    for (let i = 0; i < ticksRenderInfo.length - 1; i++) {
      let leftTickRenderInfo = ticksRenderInfo[i];
      let rightTickRenderInfo = ticksRenderInfo[i + 1];

      if ((leftTickRenderInfo.coord + leftTickRenderInfo.length * AxisBase.decreaseTicksCountCoeff) > rightTickRenderInfo.coord) {
        res = TicksCountChange.Decrease;
        break;
      }
      if ((leftTickRenderInfo.coord + leftTickRenderInfo.length * AxisBase.increaseTicksCountCoeff) < rightTickRenderInfo.coord) {
        res = TicksCountChange.Increase;
      }
    }
    return res;
  }
}
