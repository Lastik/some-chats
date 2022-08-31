import {Component, OnInit} from '@angular/core';
import {Chart, DataRect, MarkerPlotOptions, NumericPoint, PlotKind, Size} from "some-charts";
import {DataSet} from "some-charts/types/data";
import * as Color from "color";
import {MoneyForIndex} from "./model/money-for-index";

@Component({
  selector: 'chart-demo',
  templateUrl: './chart-demo.component.html'
})
export class ChartDemoComponent implements OnInit {


  constructor() {
  }

  ngOnInit(): void {

    let dataSet = new DataSet<MoneyForIndex, number>([
        {index: 0, money: 1000},
        {index: 200, money: 4000},
        {index: 300, money: 5000},
        {index: 400, money: 1000}
      ],
      {
        money: item => {
          return item.money
        }
      },
      item => {
        return item.money
      }
    );

    let chart = new Chart<MoneyForIndex, number>(
      '#chart-element',
      new NumericPoint(0, 0),
      new Size(300, 300),
      new DataRect(0, 0, 100, 100),
      dataSet,
      {
        plots: [
          {
            kind: PlotKind.Marker, metric: {
              name: 'money',
              caption: 'Money',
              color: new Color("#AA0000")
            }
          } as MarkerPlotOptions
        ]
      }
    )
  }
}
