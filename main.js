/* VARIABLES */

// Global application state set to default values
let state = {
  communityData: {},
  // form inputs
  community: null,
  email: null,
  homelessNumber: 20, // Number of people experiencing homelessness to model
  costPerBedQI: 68.5, // Cost per bed for Q&I
  costPerBedPP: 128, // Cost per year for Permanent Placement
  percentQI: 0.75, // Percent of beds that will be Q&I
  percentPP: 0.25, // Percent of beds that will be Permanent Placement
  percentInfected: 0.4, // Percent infected by COVID-19
  // Calculated values
  bedsTotal: 0, // Total beds needed
  bedsQI: 0, // Number of Q&I beds needed
  bedsPP: 0, // Number of Permanent Placement beds needed
  costQI: 0, // Cost for all Q&I beds needed
  costPP: 0, // Cost for all Permanent Placement beds needed
  costTotal: 0 // Overall total cost
};

const scriptURL = 'https://script.google.com/macros/s/AKfycbzB4VKR9uSm83s0CFHUaMBUV611o4d24-NmQIfPFIhqFOh10qw/exec'
const form = document.forms['submitToGoogleSheet']

// Load the list of communities from a CSV file. This takes some time, so we wait until it is loaded
// to call the rest of the app functions
d3.csv("./data/communityData.csv", d3.autoType).then(
  data => {
    console.log("Community data loaded!")
    state.communityData = d3.map(data, d => d.communityName).keys().sort();
    state.communityData.unshift(["Select a Community"])
    app();
  }
)

console.log("Starting State", state)

// Utility function to update state variables - can be used in event listeners
function setGlobalState(nextState) {
  state = {
    ...state,
    ...nextState
  }
};


function app() {
  
  // Recalculate values from form inputs
  function recalculate() {
    setGlobalState({
      bedsTotal: state.homelessNumber * state.percentInfected,
      bedsQI: (state.homelessNumber * state.percentInfected) * state.percentQI,
      bedsPP: (state.homelessNumber * state.percentInfected) * state.percentPP,
      costQI: ((state.homelessNumber * state.percentInfected) * state.percentQI) * state.costPerBedQI,
      costPP: ((state.homelessNumber * state.percentInfected) * state.percentPP) * state.costPerBedPP,
      costTotal: Math.round((((state.homelessNumber * state.percentInfected) * state.percentQI) * state.costPerBedQI) + (((state.homelessNumber * state.percentInfected) * state.percentPP) * state.costPerBedPP), 2)
    })
    console.log("Recalculated State", state)
  }

  recalculate();


  // FORM FIELDS

  // Populate the community dropdown with values from the CSV file
  const selectCommunity = d3
    .select("#community-dropdown")
    .selectAll("option")
    .data(state.communityData)
    .join("option")
    .attr("value", d => d)
    .text(d => d)

  // Add an event listener to the community dropdown
  selectCommunity = d3
    .select("#community-dropdown")
    .on("change",
      function () {
        console.log("The new selected community is", this.value)
        setGlobalState({
          community: this.value,
        })
        recalculate();
        d3.select("#community-topline")
          .text(this.value)
      })

  // Event listener for homeless individual input
  const homelessInput = d3
    .select("#homeless-input")
    .on("change",
      function () {
        console.log("The new selected number of homeless individuals are", this.value)
        setGlobalState({
          homelessNumber: +this.value,
        })
        recalculate();
        d3.select("#homeless-topline")
          .text(this.value)
        d3.select("#costTotal-topline")
          .text('$' + state.costTotal)
      })



  // Submit form data to Google Sheets. Takes script URL and form object as arguments
  function submitData(scriptURL, form) {
    form.addEventListener('submit', e => {
      console.log("Submitting Data!")
      e.preventDefault()
      fetch(scriptURL, {
          method: 'POST',
          body: new FormData(form)
        })
        .then(response => console.log('Success!', response))
        .catch(error => console.error('Error!', error.message))
    })
  }

  submitData(scriptURL, form);

}