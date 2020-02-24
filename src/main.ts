import Papa from 'papaparse';
import WhiskysList from './whiskysList';
import { Whisky, Review, MapPosition } from './whiskyClasses';
import { DataSet, ChartType, Chart } from './chartClasses';

const scotchFile = './dist/scotchfile.csv';
let Whiskys: Array<Whisky> = new Array<Whisky>();
let Regions: Array<string> = new Array<string>();
let chart:Chart = null;

async function Init() {
    const response = await fetch(scotchFile);
    const file = await response.text();

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            processResults(results.data);
        }
    });
}

function processResults(results:any) {
    let regexString = "";

    for (let i=0; i<WhiskysList.length; i++) {
        Whiskys.push(new Whisky(WhiskysList[i][0].toString(), WhiskysList[i][2].toString(), WhiskysList[i][3].toString(), new MapPosition((WhiskysList[i][4] as number), (WhiskysList[i][5] as number), WhiskysList[i][0].toString())));
        regexString += `|${WhiskysList[i][0]}`;
    }

    regexString = regexString.substr(1);
    const regEx = new RegExp(regexString, "g");
    
    /* Filters the full list of scotch reviews from the file down to only the ones we want to display */
    let filteredReviews = results.filter((x: { [x: string]: string; }) => {
        if (!x["Whisky Name"])
            return false;

        return x["Whisky Name"].match(regEx);;
    });

    // Go through all the reviews and place them into the corresponding Whisky object
    for (let i=0; i<filteredReviews.length; i++) {
        let review = new Review(new Date(filteredReviews[i].Date), filteredReviews[i]["Link To reddit Review"], filteredReviews[i].Price, filteredReviews[i].Rating, filteredReviews[i]["Reviewer Username"]);
        Whiskys.find(x => filteredReviews[i]["Whisky Name"].trim().match(x.Name)).AddReview(review);
    }

    Regions = Array.from(new Set(Whiskys.map(item => item.Region)));

    ControlsInit();
    ChartInit();
}

function ControlsInit() {
    let inputTimeout: ReturnType<typeof setTimeout> = null

    document.getElementById("chartSwapButton").addEventListener("click", (e) => {
        document.getElementById("scotchInfoContainer").innerHTML = "";
        document.getElementById("mapChart").classList.toggle("map");
        (e.target as HTMLButtonElement).innerText = (e.target as HTMLButtonElement).dataset.chartType === "map" ? "Show Malt Map" : "Show Price vs Rating Chart";
        (e.target as HTMLButtonElement).dataset.chartType = (e.target as HTMLButtonElement).dataset.chartType === "map" ? "price" : "map";
        FilterData();
        chart.UpdateOptions();
    });

    document.querySelectorAll(".filterPriceInput, .filterRatingsInput").forEach(item => {
        item.addEventListener("input", () => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                FilterData();
            }, 200);
        })
    });

    document.querySelectorAll("#regionMap > path").forEach(item => {
        item.addEventListener("mouseover", () => {
            document.getElementById("regionMouseoverName").innerText = item.id;
        });

        item.addEventListener("mouseout", () => {
            document.getElementById("regionMouseoverName").innerText = "";
        });

        item.addEventListener("click", () => {
            (document.querySelector(`.regionFilters[value=${item.id}`) as HTMLInputElement).checked = !(document.querySelector(`.regionFilters[value=${item.id}`) as HTMLInputElement).checked;
            (document.querySelector(`.regionFilters[value=${item.id}`) as HTMLInputElement).dispatchEvent(new Event("change"));
        });
    });

    const maxPrice = Math.max.apply(Math, Whiskys.map(x => x.AveragePrice));
    (document.getElementById("priceHigh") as HTMLInputElement).value = maxPrice;
    (document.getElementById("priceHigh") as HTMLInputElement).max = maxPrice;

    // Generate the region filters checkboxes
    const regionList = document.getElementById("regionList") as HTMLDivElement;
    const template = document.getElementById("regionSelectorTemplate") as HTMLTemplateElement;
    for (const item of Regions) {
        let element = template.content.cloneNode(true) as HTMLLabelElement;
        //element.querySelector("span").textContent = item;
        element.querySelector("label").textContent = item;
        element.querySelector("label").setAttribute("for", item);
        element.querySelector("input").value = item;
        element.querySelector("input").id = item;
        element.querySelector("input").addEventListener("change", (e) => {
            chart.ChartJS.data.datasets.find(x => x.label === item).hidden = !chart.ChartJS.data.datasets.find(x => x.label === item).hidden;
            chart.ChartJS.update();
        });
        element.querySelector("label").addEventListener("mouseover", (e) => {
            let value = (e.target as HTMLLabelElement).innerText;
            if (value === "Other")
                return;

            (document.querySelector(`#regionMap > path#${value}`) as SVGPathElement).classList.add("hovered");
        });
        element.querySelector("label").addEventListener("mouseout", (e) => {
            let value = (e.target as HTMLLabelElement).innerText;
            if (value === "Other")
                return;

            (document.querySelector(`#regionMap > path#${value}`) as SVGPathElement).classList.remove("hovered");
        });
        regionList.appendChild(element);
    }
}

function ChartInit() {
    const canvas = (document.getElementById("mapChart") as HTMLCanvasElement);

    let datasets = new Array<DataSet>();

    for (const item of Regions) {
        datasets.push(new DataSet(item, Whiskys.filter(x => x.Region === item), ChartType.Map));
    }

    chart = new Chart(canvas, datasets, Whiskys);
}

function FilterData() {
    let minRating = parseFloat((document.getElementById("ratingLow") as HTMLInputElement).value);
    let maxRating = parseFloat((document.getElementById("ratingHigh") as HTMLInputElement).value);
    let minPrice = parseFloat((document.getElementById("priceLow") as HTMLInputElement).value);
    let maxPrice = parseFloat((document.getElementById("priceHigh") as HTMLInputElement).value);

    let type = document.getElementById("chartSwapButton").dataset.chartType === "map" ? ChartType.Map : ChartType.PriceVRating;
    let datasets = new Array<DataSet>();
    for (const item of Regions) {
        let filteredData = Whiskys.filter(x => x.Region === item && x.AverageRating >= minRating && x.AverageRating <= maxRating && x.AveragePrice >= minPrice && x.AveragePrice <= maxPrice);
        datasets.push(new DataSet(item, filteredData, type, !(document.querySelector(`.regionFilters[value=${item}]`) as HTMLInputElement).checked));
    }

    chart.ChartJS.data.datasets = datasets;
    chart.ChartJS.update();
}

document.addEventListener("DOMContentLoaded", () => {
    Init();
});