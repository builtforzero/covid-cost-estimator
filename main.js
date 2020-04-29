/* VARIABLES */

// Global application state set to default values
let state = {
  // form inputs
  community: null,
  email: null,
  homelessNumber: 20, // Number of people experiencing homelessness to model
  costPerBedQI: 10, // Cost per bed for Q&I
  costPerBedPP: 5, // Cost per bed for Permanent Placement
  percentQI: 0.75, // Percent of beds that will be Q&I
  percentPP: 0.25, // Percent of beds that will be Permanent Placement
  percentInfected: 0.5, // Percent infected by COVID-19
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

console.log("Starting State", state)


/* UPDATE FUNCTIONS */
/* Update values and set event listeners */

// Utility function to update the global state (can be used in event listeners)
function setGlobalState(nextState) {
  state = {
    ...state,
    ...nextState
  }
};

// Calculate values from form inputs
function recalculate() {
  setGlobalState({
    bedsTotal: state.homelessNumber * state.percentInfected,
    bedsQI: (state.homelessNumber * state.percentInfected) * state.percentQI,
    bedsPP: (state.homelessNumber * state.percentInfected) * state.percentPP,
    costQI: ((state.homelessNumber * state.percentInfected) * state.percentQI) * state.costPerBedQI,
    costPP: ((state.homelessNumber * state.percentInfected) * state.percentPP) * state.costPerBedPP,
    costTotal: (((state.homelessNumber * state.percentInfected) * state.percentQI) * state.costPerBedQI) + (((state.homelessNumber * state.percentInfected) * state.percentPP) * state.costPerBedPP)
  })
  console.log("Recalculated State", state)
}

recalculate();


// Event listeners on form fields

const selectCommunity = d3
  .select("#community-dropdown")
  .on("change",
    function () {
      console.log("The new selected community is", this.value)
      setGlobalState({
        community: this.value,
      })
      recalculate();
    })

const homelessInput = d3
    .select("#homeless-input")
    .on("change",
      function () {
        console.log("The new selected number of homeless individuals are", this.value)
        setGlobalState({
          homelessNumber: +this.value,
        })
        recalculate();
      })




/* DISPLAY & SUBMIT FUNCTIONS */
/* Display values */

// Select display divs. Append state values


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