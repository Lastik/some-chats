import Konva from "konva";
import {DataTransformation, NumericDataRect, NumericPoint} from "../../geometry";
import {TextMeasureUtils} from "../../services";
import {AnimatedProperty} from "./animated-property";

export class PlotDrawableElement<DrawableType extends Konva.Group | Konva.Shape = Konva.Group | Konva.Shape> {

  public readonly dataPoint: AnimatedProperty<NumericPoint>;

  protected get isAnimationInProcess(): boolean{
    return this.dataPoint.isAnimationInProcess;
  };

  private runningAnimationId: number | undefined;
  private runningAnimation: Konva.Animation | undefined;

  constructor(dataPoint: NumericPoint, public readonly rootDrawable: DrawableType,
              protected textMeasureUtils: TextMeasureUtils = TextMeasureUtils.Instance) {
    this.dataPoint = new AnimatedProperty(dataPoint);
    this.rootDrawable = rootDrawable;
  }

  updateShapes(dataTransformation: DataTransformation, visible: NumericDataRect, screen: NumericDataRect): void {
    if (!this.isAnimationInProcess || this.runningAnimationId === this.dataPoint.animationId) {
      this.updateRootDrawableRenderLocation(this.dataPoint.animatedValue, dataTransformation, visible, screen);
      this.updateShapesInStatic(this.dataPoint.animatedValue, dataTransformation, visible, screen);
    } else {
      let self = this;

      if(this.runningAnimation){
        this.runningAnimation.stop();
      }

      this.runningAnimation = new Konva.Animation(function (frame) {

        self.tickAnimations(frame?.time);

        self.updateRootDrawableRenderLocation(self.dataPoint.animatedValue, dataTransformation, visible, screen);
        self.updateShapesInStatic(self.dataPoint.animatedValue, dataTransformation, visible, screen);

        if(!self.dataPoint.isAnimationInProcess){
          self.runningAnimation?.stop();
          self.runningAnimation = undefined;
        }
      }, this.rootDrawable.getLayer());
      this.runningAnimation.start();
      this.runningAnimationId = this.dataPoint.animationId;
    }
  }

  protected updateShapesInStatic(dataPoint: NumericPoint, dataTransformation: DataTransformation, visible: NumericDataRect, screen: NumericDataRect): void {}

  protected tickAnimations(time: number | undefined){
    this.dataPoint.tick(time);
  }

  private updateRootDrawableRenderLocation(dataPoint: NumericPoint, dataTransformation: DataTransformation, visible: NumericDataRect, screen: NumericDataRect): void {
    let screenLocation = this.getLocationOnScreen(dataPoint, dataTransformation, visible, screen);
    this.rootDrawable.setPosition(screenLocation);
  }

  protected getLocationOnScreen(dataPoint: NumericPoint, dataTransformation: DataTransformation, visible: NumericDataRect, screen: NumericDataRect){
    return dataTransformation.dataToScreenRegionXY(dataPoint, visible, screen);
  }

  destroy() {
    this.rootDrawable.destroy();
  }

  getBoundingRectangle(): NumericDataRect {

    let animatedDataPoint = this.dataPoint.animatedValue;

    return new NumericDataRect(animatedDataPoint.x, animatedDataPoint.x, animatedDataPoint.y, animatedDataPoint.y);
  }
}
