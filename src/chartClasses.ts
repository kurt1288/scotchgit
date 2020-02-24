import * as ChartJS from 'chart.js';
import 'chartjs-plugin-datalabels';
import Tabulator from "tabulator-tables";
import { Whisky, MapPosition } from "./whiskyClasses";

enum ChartType {
    Map = 0,
    PriceVRating
}

class DataSet {
    label: string;
    data: Array<MapPosition>;
    backgroundColor: string;
    borderColor: string = "#fff";
    pointRadius: number = 5;
    hidden: boolean = false;

    constructor(region: string, data: Array<Whisky>, chartType: ChartType, hidden?: boolean) {
        this.label = region;
        this.data = chartType === ChartType.Map ? data.map(x => x.Position) : data.filter(x => x.AveragePrice !== 0 && x.AverageRating !== 0).map(x => x.PriceVRatingPosition);
        this.hidden = hidden;
        this.backgroundColor = this.GetBackgroundColor(region);
    }

    GetBackgroundColor(region: string): string {
        switch (region) {
            case "Speyside":
                return "#434348";
            case "Highland":
                return "#7cb5ec";
            case "Island":
                return "#90ed7d";
            case "Islay":
                return "#f7a35c";
            case "Other":
                return "#8085e9";
            case "Lowland":
                return "#f15c80";
            case "Campbeltown":
                return "#e4d354";
            default:
                return "#000";
        }
    }
}

class Chart {
    private State: ChartType = ChartType.Map;
    private LabelHover = false;
    ChartJS: ChartJS;
    Whiskys: Array<Whisky>;

    constructor(canvas: HTMLCanvasElement, datasets: Array<DataSet>, whiskys: Array<Whisky>) {
        this.Whiskys = whiskys;
        this.ChartJS = new ChartJS.Chart(canvas.getContext("2d"), {
            type: "scatter",
            data: {
                datasets: datasets
            },
            options: {
                animation: {
                    duration: 0
                },
                hover: {
                    animationDuration: 0,
                    onHover: (e, el) => {
                        canvas.style.cursor = (el[0] || this.LabelHover) ? "pointer" : "default";
                    }
                },
                onClick: (context, item:any) => {
                    if (item.length === 0)
                        return;
    
                    this.ShowScotchInfo(item[0]._datasetIndex, item[0]._index);
                },
                tooltips: {
                    enabled: false,
                    displayColors: false,
                    backgroundColor: 'rgba(240,240,240,1)',
                    titleFontColor: 'black',
                    titleFontSize: 14,
                    bodyFontColor: 'black',
                    borderColor: 'black',
                    borderWidth: 1,
                    xPadding: 10,
                    yPadding: 10,
                    callbacks: {
                        title: (item, data) => {
                            return (data.datasets[item[0].datasetIndex].data[item[0].index] as MapPosition).name;
                        },
                        label: (item, data) => {
                            let whisky = this.Whiskys.find(x => x.Name === (this.ChartJS.data.datasets[item.datasetIndex].data[item.index] as MapPosition).name);
                            return [`Price: $${whisky.AveragePrice.toString()}`, `Rating: ${whisky.AverageRating.toString()}`];
                        }
                    }
                },
                plugins: {
                    datalabels: {
                        align: 'top',
                        color: 'white',
                        font: {
                            size: 11
                        },
                        textStrokeColor: 'black',
                        textStrokeWidth: 2,
                        textShadowColor: 'black',
                        textShadowBlur: 3,
                        formatter: function(value:MapPosition) {
                            return value.name;
                        },
                        listeners: {
                            enter: (context:any) => {
                                this.LabelHover = true;
                                canvas.style.cursor = "pointer";
                            },
                            leave: (context:any) => {
                                this.LabelHover = false;
                                canvas.style.cursor = "default";
                            },
                            click: (context:any) => {
                                this.ShowScotchInfo(context.datasetIndex, context.dataIndex);
                            }
                        }
                    }
                },
                aspectRatio: 1,
                scales: {
                    xAxes: [{
                        display: false,
                        ticks: {
                            min: -100,
                            max: 100
                        }
                    }],
                    yAxes: [{
                        display: false,
                        ticks: {
                            min: -100,
                            max: 100
                        }
                    }]
                },
                legend: {
                    display: false
                }
            }
        });
    }

    ShowScotchInfo(datasetIndex: number, dataIndex: number) {
        let data = this.Whiskys.find(x => x.Name === (this.ChartJS.data.datasets[datasetIndex].data[dataIndex] as MapPosition).name);

        let template = document.getElementById("scotchInfoTemplate") as HTMLTemplateElement;
        let element = template.content.cloneNode(true) as HTMLDivElement;
        element.querySelector("#scotchInfoName").textContent = data.Name;
        element.querySelector("#scotchInfoRating > div").textContent = data.AverageRating.toString();
        element.querySelector("#scotchInfoPrice > div").textContent = `$${data.AveragePrice.toString()} USD`;
        (element.querySelector("#scotchInfoWordCloud") as HTMLImageElement).src = data.ImageURL;

        document.getElementById("scotchInfoContainer").innerHTML = "";
        document.getElementById("scotchInfoContainer").appendChild(element);
        this.UpdateReviewsTable(data);
    }

    UpdateOptions() {
        this.State = this.State === ChartType.Map ? ChartType.PriceVRating : ChartType.Map;

        this.ChartJS.options.scales.xAxes[0].display = this.State === ChartType.Map ? false : true;
        this.ChartJS.options.scales.xAxes[0].ticks.min = this.State === ChartType.Map ? -100 : undefined;
        this.ChartJS.options.scales.xAxes[0].ticks.max = this.State === ChartType.Map ? 100 : undefined;
        this.ChartJS.options.scales.yAxes[0].display = this.State === ChartType.Map ? false : true;
        this.ChartJS.options.scales.yAxes[0].ticks.min = this.State === ChartType.Map ? -100 : undefined;
        this.ChartJS.options.scales.yAxes[0].ticks.max = this.State === ChartType.Map ? 100 : undefined;
    
        this.ChartJS.options.scales.xAxes[0].scaleLabel.display = this.State === ChartType.Map ? false : true;
        this.ChartJS.options.scales.xAxes[0].scaleLabel.labelString = "Price (USD)";
        this.ChartJS.options.scales.yAxes[0].scaleLabel.display = this.State === ChartType.Map ? false : true;
        this.ChartJS.options.scales.yAxes[0].scaleLabel.labelString = "Rating";
    
        this.ChartJS.options.plugins.datalabels.display = this.State === ChartType.Map ? true : false;
    
        this.ChartJS.options.tooltips.enabled = this.State === ChartType.Map ? false : true;
    
        this.ChartJS.update();
    }

    async UpdateReviewsTable(data: Whisky) {
        let formatDate = function(date: string) {
            const dateTime = new Date(date);
            const month = dateTime.toLocaleString('default', { month: 'long' });
            const day = dateTime.toLocaleString('default', { day: 'numeric' });
            const year = dateTime.toLocaleString('default', { year: 'numeric' });

            return `${month} ${day}, ${year}`;
        }

        const table = new Tabulator("#scotchReviewsTable", {
            height: 300,
            data: data.Reviews,
            layout: "fitColumns",
            columns: [
                {title: "Reviewer", field: "Reviewer"},
                {title: "Date", field: "Date", mutator:formatDate, sorter: "date", sorterParams: {
                    format: "MMMM DD, YYYY"
                }},
                {title: "Price", field: "Price"},
                {title: "Rating", field: "Rating"},
                {title: "Link", field: "ReviewLink", visible: false}
            ],
            initialSort: [
                {column: "Date", dir: "desc"}
            ],
            rowClick: (e, row) => {
                window.open(row.getData().ReviewLink, "_blank");
            }
        });
    }
}

export { DataSet, ChartType, Chart };