/* CONSTANTS & GLOBALS */
/* Variables we want access to throughout the application */
const width = window.innerWidth * 0.7,
  height = window.innerHeight * 0.7,
  margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10
  };

let svg;

/* APPLICATION STATE */
/* Variables that define the current state of the application */
let state = {
    data: null,
    community: null,
    email: null,
    months: 0,
    homelessInd: 0,
    chronicInd: 0,
    fiftyplusInd: 0,
    infected: 0,
    costQI: 0,
    costPH: 0
};


/* LOAD DATA */
console.log("current state:", state);
init();

/* INIT */
/* This function will be run once when the data finishes loading in */
function init() {
    console.log("initializing!")

    draw();
}

/* DRAW */
/* This function will run every time there is an update to the data or state */
function draw() {
    console.log("drawing!")
}
