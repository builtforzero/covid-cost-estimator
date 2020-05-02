/* VARIABLES */

// Global application state set to default values
let state = {
  communityData: {},
  // form inputs
  community: "Select a Community",
  population: "Select a population",
  months: 3,
  homelessNumber: 100, // Number of people experiencing homelessness to model
  costPerBedQI: 100, // Cost per night for Q&I
  costPerBedPP: 12800, // Cost per night for Permanent Placement
  percentInfected: 0.4, // Percent infected by COVID-19
  // Calculated values
  bedsTotal: 0, // Total beds needed
  bedsQI: 0, // Number of Q&I beds needed
  bedsPP: 0, // Number of Permanent Placement beds needed
  costQI: 0, // Cost for all Q&I beds needed
  costPP: 0, // Cost for all Permanent Placement beds needed
  costTotal: 0, // Overall total cost
};

// Load the list of communities from a CSV file. This takes some time, so we wait until it is loaded
// to call the rest of the app functions
d3.csv("./data/communityData.csv", d3.autoType).then((data) => {
  console.log("Community data loaded!");
  state.communityData = d3
    .map(data, (d) => d.communityName)
    .keys()
    .sort(); // pulls out community names
  state.communityData.unshift(["Select a Community"]); // adds this value to the top of the list
  app(); // call the app function
});

console.log("Starting State", state); // check the starting state values

// Utility function to update state variables - can be used in event listeners
function setGlobalState(nextState) {
  state = {
    ...state,
    ...nextState,
  };
}

const format = d3.format(",.0");

// Recalculate state values
function recalculate() {
  setGlobalState({
    bedsTotal: state.homelessNumber * state.percentInfected,
    costQI: (state.homelessNumber * state.percentInfected) * state.costPerBedQI * (state.months * 30),
    costPP: (state.homelessNumber * state.percentInfected) * (state.costPerBedPP / 365) * (state.months * 30),
  });
  console.log("Recalculated State", state);
}

// Check whether community and population are selected. If not, disable the submit button
function buttonState() {
  if (
    state.community === "Select a Community" ||
    state.population === "Select a population"
  ) {
    d3.select("#submit-button")
      .attr("disabled", "true")
      .attr(
        "style",
        "background-color: rgb(211, 211, 211); border: 2px solid rgb(211, 211, 211); color: white;"
      );
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

// Function to populate the form values, set event listeners, and submit data to Google Sheets
function app() {
  buttonState();

  // Format numbers with commas (e.g. formatNumber(1000) = 1,000)
  let formatNumber = d3.format(",")

  // Populate the community dropdown field with values from the CSV file
  let selectCommunity = d3
    .select("#community-dropdown")
    .selectAll("option")
    .data(state.communityData)
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d);

  // Event listener on the community dropdown
  selectCommunity = d3.select("#community-dropdown").on("change", function () {
    console.log("The new selected community is", this.value);
    setGlobalState({
      community: this.value,
    });
    recalculate();
    buttonState();
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
  });

  // Event listener on the population dropdown
  const populationInput = d3
    .select("#population-dropdown")
    .on("change", function () {
      console.log("The new selected population is", this.value);
      setGlobalState({
        population: this.value,
      });
      recalculate();
      buttonState();
    });

  // Event listener on the months input
  const MonthsInput = d3.select("#months-input").on("change", function () {
    console.log("The new selected time is", this.value, " months");
    setGlobalState({
      months: +this.value,
    });
    recalculate();
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
    });

  // Event listener on the submit button to populate results
  const submitButton = d3.select("#submit-button").on("click", function () {
    recalculate();
    console.log("clicked button");

    // Populate the dashboard
    d3.select("#community-topline").text(state.community);
    d3.select("#population-topline").text(formatNumber(state.homelessNumber) + " " + state.population.toLowerCase());
    d3.select("#months-topline").text(state.months + " months (" + formatNumber((state.months * 30)) + " days)");
    d3.select("#infected-topline").text(state.percentInfected * 100 + "%");
    d3.select("#bedsTotal-topline").text(formatNumber(Math.round(state.bedsTotal)) + " beds");
    d3.select("#costQI-topline").text("$" + formatNumber(Math.round(state.costQI, 2)));
    d3.select("#costPP-topline").text("$" + formatNumber(Math.round(state.costPP, 2)));

    // Populate helptext calculations
    d3.select("#beds-calc").text(formatNumber(state.homelessNumber) + " individuals × " + state.percentInfected*100 + "% infected at peak");
    d3.select("#costQI-calc").text(formatNumber(Math.round(state.bedsTotal)) + " beds × $" + formatNumber(state.costPerBedQI) + " per night × " + formatNumber((state.months * 30)) + " days");
    d3.select("#costPP-calc").text(formatNumber(Math.round(state.bedsTotal)) + " beds × ( $" + formatNumber(state.costPerBedPP) + " per year / 365 days ) × " + formatNumber((state.months * 30)) + " days");

  });

  // Submit form data to Google Sheets. Takes script URL and form object as arguments
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbzB4VKR9uSm83s0CFHUaMBUV611o4d24-NmQIfPFIhqFOh10qw/exec";
  const form = document.forms["submitToGoogleSheet"];

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

  submitData(scriptURL, form);
}
