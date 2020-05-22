/* IMPORT CHART COMPONENT */
import { Chart } from "./chart.js"
let chart;

/* VARIABLES & CONSTANTS */

// Global application state
let state = {
  // Data
  communityData: {},
  communityNames: {},
  filteredData: {},
  suggestedInd: 1000,
  suggestedChr: 1000,
  suggested50: 400,

  // Form inputs set to default values
  community: "Select a Community",
  population: "Select a population",
  months: 3,
  homelessNumber: 1000, // Number of people experiencing homelessness to model
  costPerBedQI: 100, // Cost per night for Q&I
  costPerBedPP: 12800, // Cost per night for Permanent Placement
  percentInfected: 0.4, // Percent infected by COVID-19

  // Calculated values
  bedsTotal: 400, // Total beds needed
  bedsQI: 0, // Number of Q&I beds needed
  bedsPP: 0, // Number of Permanent Placement beds needed
  costQI: 3600000, // Cost for all Q&I beds needed
  costPP: 1262466, // Cost for all Permanent Placement beds needed
  costTotal: 0, // Overall total cost

  // Existing funds
  existingQI: 0,
  existingPP: 0,
  sourceQI: "Name of Q&I funding source",
  sourcePP: "Name of PP funding source",

  // Data visualization
  vizPercent: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  chart1Data: [],

};

// Variables for script to submit data to Google Sheets
const scriptURL =
  "https://script.google.com/macros/s/AKfycbzIx7Xp2G8KzVLKdPP-PDpVy6pegRsxnLPG2iZXxkPLO-HhfKM/exec";
const form = document.forms["submitToGoogleSheet"];


/* DATA SOURCE */

// Load data and call the app function when complete
d3.csv("data/communityData.csv", d3.autoType).then(
  data => {
    console.log("Community data loaded!");
    // All data
    state.communityData = data;
    // Community name data for dropdown
    state.communityNames = d3.map(data, d => d.communityName).keys().sort();
    state.communityNames.unshift(["Select a Community"]);
    // Create a new "chart" component
    chart = new Chart(state, setGlobalState);
    // Call the app function
    app();
  });

console.log("Starting State", state); // check the starting state values



/* FUNCTIONS */

// Update global state
function setGlobalState(nextState) {
  state = {
    ...state,
    ...nextState,
  };
}

// Format numbers with commas (syntax: formatNumber(1000) = 1,000)
let formatNumber = d3.format(",")

// Recalculate state values
function recalculate() {
  setGlobalState({
    filteredData: state.communityData.filter(d => d.communityName === state.community),
    bedsTotal: state.homelessNumber * state.percentInfected,
    costQI: ((state.homelessNumber * state.percentInfected) * state.costPerBedQI * (state.months * 30)) - state.existingQI,
    costPP: Math.round(((state.homelessNumber * state.percentInfected) * (state.costPerBedPP / 365) * (state.months * 30)) - state.existingPP),
  });
  console.log("Recalculated State", state);
}

// Check whether community and population are selected. If not, disable the submit button
function buttonState() {
  if (
    state.community === "Select a Community" || state.population === "Select a population"
  ) {
    d3.select("#submit-button")
      .attr("disabled", "true")
      .attr("style", "background-color: rgb(211, 211, 211); border: 2px solid rgb(211, 211, 211); color: white;");
    d3.select(".warning-text").text(
      "Please select a community and population to continue."
    );
  } else if (
    state.community != "Select a Community" &&
    state.population != "Select a population"
  ) {
    d3.select("#submit-button").attr("disabled", null).attr("style", "");
    d3.select(".warning-text").text("");
  }
}

// Submit data to Google Sheets
function submitData(scriptURL, form) {
  form.addEventListener("submit", (e) => {
    console.log("Submitting Data!");
    e.preventDefault();
    fetch(scriptURL, {
        method: "POST",
        body: new FormData(form),
      })
      .then((response) => console.log("Success!", response))
      .catch((error) => console.error("Error!", error.message));
  });
}

// Populate suggested homeless number field
function datatext() {
  if (state.community === "Select a Community" || state.population === "Select a population") {
    d3.select("#datatext")
      .text("")
  } else if (state.community != "Select a Community" && state.population === "Individuals (All)") {
    setGlobalState({
      suggestedInd: +d3.map(state.filteredData, d => d.ind2019).keys(),
      suggestedChr: +d3.map(state.filteredData, d => d.chind2019).keys(),
      suggested50: +d3.map(state.filteredData, d => Math.round(d.ind2019 * 0.4)).keys(),
    });
    d3.select("#datatext")
      .text("Suggested: " + state.suggestedInd + " individuals, based on the number (adults + groups of adults + unaccompanied youth) reported in your 2019 PIT count.")
  } else if (state.community != "Select a Community" && state.population === "Chronically homeless individuals") {
    setGlobalState({
      suggestedInd: +d3.map(state.filteredData, d => d.ind2019).keys(),
      suggestedChr: +d3.map(state.filteredData, d => d.chind2019).keys(),
      suggested50: +d3.map(state.filteredData, d => Math.round(d.ind2019 * 0.4)).keys(),
    });
    d3.select("#datatext")
      .text("Suggested: " + state.suggestedChr + " individuals, based on the number reported in your 2019 PIT count. You may want to refer to your BNL.")
  } else if (state.community != "Select a Community" && state.population === "Individuals 50+ years old") {
    setGlobalState({
      suggestedInd: +d3.map(state.filteredData, d => d.ind2019).keys(),
      suggestedChr: +d3.map(state.filteredData, d => d.chind2019).keys(),
      suggested50: +d3.map(state.filteredData, d => Math.round(d.ind2019 * 0.4)).keys(),
    });
    d3.select("#datatext")
      .text("Suggested: " + state.suggested50 + " individuals, based on national HMIS estimates that 40% of the population is over 50, and your 2019 PIT count.")
  }
}



/* APP */

function app() {
  buttonState(); // Check button state

  chart.hideChart(0);
  chart.draw(state, setGlobalState);

  /* CALCULATOR */

  // Populate the community dropdown field with values from the CSV file
  let selectCommunity = d3
    .select("#community-dropdown")
    .selectAll("option")
    .data(state.communityNames)
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d);

  // Event listener on the community dropdown
  selectCommunity = d3.select("#community-dropdown").on("change", function () {
    setGlobalState({
      community: this.value,
    });
    recalculate();
    buttonState();
    datatext();
    chart.hideChart(0.3);
    d3.select("#community-dropdown").attr("style", "color:black;")
  });

  // Event listener on the population dropdown
  const populationInput = d3
    .select("#population-dropdown")
    .on("change", function () {
      console.log("The new selected population is", this.value);
      setGlobalState({
        population: this.value,
        suggestedInd: +d3.map(state.filteredData, d => d.ind2019).keys(),
        suggestedChr: +d3.map(state.filteredData, d => d.chind2019).keys(),
        suggested50: +d3.map(state.filteredData, d => Math.round(d.ind2019 * 0.4)).keys(),
      });
      recalculate();
      buttonState();
      datatext();
      chart.hideChart(0.3);
      d3.select("#population-dropdown").attr("style", "color:black; margin: 0px;")
    });

  // Event listener on homeless individual input
  const homelessInput = d3.select("#homeless-input").on("change", function () {
    console.log(
      "The new selected number of homeless individuals is",
      this.value
    );
    setGlobalState({
      homelessNumber: +this.value,
    });
    recalculate();
    chart.hideChart(0.3);
    d3.select("#homeless-input").attr("style", "color:black;");
  });

  // Event listener on the months input
  const MonthsInput = d3.select("#months-input").on("change", function () {
    setGlobalState({
      months: +this.value,
    });
    recalculate();
    chart.hideChart(0.3);
    d3.select("#months-input").attr("style", "color:black;");
  });

  // Event listener on the percent infected input
  const InfectedInput = d3
    .select("#percentInfected-input")
    .on("change", function () {
      console.log("The new selected infected percentage is", this.value);
      setGlobalState({
        percentInfected: +this.value / 100,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#percentInfected-input").attr("style", "color:black;");
    });

  // Event listener on the QI Cost input
  const QICostInput = d3
    .select("#costPerBedQI-input")
    .on("change", function () {
      console.log("The new QI cost is", this.value);
      setGlobalState({
        costPerBedQI: +this.value,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#costPerBedQI-input").attr("style", "color:black;")
    });

  // Event listener on the PP Cost input
  const PPCostInput = d3
    .select("#costPerBedPP-input")
    .on("change", function () {
      console.log("The new PP cost is", this.value);
      setGlobalState({
        costPerBedPP: +this.value,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#costPerBedPP-input").attr("style", "color:black;")
    });


  // Event listener on the QI existing funding source
  const sourceQIInput = d3
    .select("#sourceQI-input")
    .on("change", function () {
      setGlobalState({
        sourceQI: this.value,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#sourceQI-input").attr("style", "color:black; margin: 0;")
    });

  // Event listener on the QI existing funding amount
  const existingQIInput = d3
    .select("#existingQI-input")
    .on("change", function () {
      setGlobalState({
        existingQI: +this.value,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#existingQI-input").attr("style", "color:black;")
    });

  // Event listener on the PP existing funding source
  const sourcePPInput = d3
    .select("#sourcePP-input")
    .on("change", function () {
      setGlobalState({
        sourcePP: this.value,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#sourcePP-input").attr("style", "color:black; margin: 0;")
    });

  // Event listener on the PP existing funding amount
  const existingPPInput = d3
    .select("#existingPP-input")
    .on("change", function () {
      setGlobalState({
        existingPP: +this.value,
      });
      recalculate();
      chart.hideChart(0.3);
      d3.select("#existingPP-input").attr("style", "color:black;")
    });





  // Event listener on the submit button to populate results
  const submitButton = d3.select("#submit-button").on("click", function () {
    recalculate();
    console.log("clicked button");

    // Populate the dashboard and set the opacity of the values to 1
    d3.select("#community-topline").text(state.community).attr("style", "opacity: 1;");
    d3.select("#population-topline").text(formatNumber(state.homelessNumber) + " " + state.population.toLowerCase()).attr("style", "opacity: 1;");
    d3.select("#months-topline").text(state.months + " months (" + formatNumber((state.months * 30)) + " days)").attr("style", "opacity: 1;");
    d3.select("#infected-topline").text(state.percentInfected * 100 + "%").attr("style", "opacity: 1;");
    d3.select("#bedsTotal-topline").text(formatNumber(Math.round(state.bedsTotal)) + " beds").attr("style", "opacity: 1;");
    d3.select("#costQI-topline").text("$" + formatNumber(Math.round(state.costQI, 2))).attr("style", "opacity: 1;");
    d3.select("#costPP-topline").text("$" + formatNumber(Math.round(state.costPP, 2))).attr("style", "opacity: 1;");

    // Populate helptext calculations
    d3.select("#beds-calc").text(formatNumber(state.homelessNumber) + " individuals × " + state.percentInfected * 100 + "% infected at peak").attr("style", "opacity: 1;");
    d3.select("#costQI-calc").text("(" + formatNumber(Math.round(state.bedsTotal)) + " beds × $" + formatNumber(state.costPerBedQI) + " per night × " + formatNumber((state.months * 30)) + " days)" + " - $" + formatNumber(state.existingQI) + " existing Q&I funds").attr("style", "opacity: 1;");
    d3.select("#costPP-calc").text("(" + formatNumber(Math.round(state.bedsTotal)) + " beds × ( $" + formatNumber(state.costPerBedPP) + " per year / 365 days ) × " + formatNumber((state.months * 30)) + " days)" + " - $" + formatNumber(state.existingPP) + " existing PP funds").attr("style", "opacity: 1;");

    // Make the graph visible
    chart.draw(state, setGlobalState);
    chart.displayChart();
  });

  // Submit form data to Google Sheets
  submitData(scriptURL, form);
}