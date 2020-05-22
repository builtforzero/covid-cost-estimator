class Chart {
    // Defines constants to use in object
    constructor(state, setGlobalState) {
        // Sets margins
        this.margin = {
            top: 40,
            right: 80,
            bottom: 20,
            left: 40
        };

        // Sets the dimensions of the chart
        this.chartWidth = 500;
        this.chartHeight = 300;

        // Defines the SVG canvas, makes it responsive
        this.lineChartSVG = d3
            .select("#chart1-viz")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 600 400")
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

        console.log("Setting up chart!")
    }

    // Builds the dataset
    buildDataset(state, setGlobalState) {

        let i, j, bed, qi, pp;
        let vizBeds = [];
        let vizQIcost = [];
        let vizPPcost = [];

        for (i = 0; i < state.vizPercent.length; i++) {
            bed = Math.floor(state.vizPercent[i] * state.homelessNumber)
            vizBeds.push(bed);
        }

        // Calculate costs
        for (j = 0; j < state.vizPercent.length; j++) {
            // Calculate the QI cost at each level and push to array
            qi = Math.round((vizBeds[j] * state.costPerBedQI * (state.months * 30)));
            vizQIcost.push(qi);

            // Calculate the PP cost at each level and push to array
            pp = Math.round(vizBeds[j] * (state.costPerBedPP / 365) * (state.months * 30));
            vizPPcost.push(pp);
        }

        // Create an array from 0 to the number of percentages we want to model
        let keys = [...Array(state.vizPercent.length).keys()];

        // For each key, add the calculated values
        keys.forEach((key, i) => state.chart1Data[key] = {
            "percent": state.vizPercent[i],
            "beds": vizBeds[i],
            "qiCost": vizQIcost[i],
            "ppCost": vizPPcost[i],
        })

        // Flatten the new dataset
        state.chart1Data = state.chart1Data.flat();

        console.log("Building dataset!", state.chart1Data)
    }

    // Builds the line graph
    buildLine(canvas, width, height, data, state, setGlobalState) {
        console.log("Building line chart!")

        let formatXAxis = d3.format(".2s") // makes shorthand e.g. "5M" or "3K"
        let formatNumber = d3.format(",") // adds commas e.g. "5,000,000"

        // Wipe chart clean upon reload
        canvas
            .selectAll(".line")
            .style("opacity", 1)
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();

        canvas
            .selectAll(".axis")
            .style("opacity", 1)
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();

        canvas
            .selectAll("circle")
            .style("opacity", 1)
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();

        canvas
            .selectAll(".fixed-tooltip")
            .style("opacity", 1)
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();

        canvas
            .selectAll(".fixed-tooltip-cost")
            .style("opacity", 1)
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();

        canvas
            .selectAll(".fixed-tooltip-label")
            .style("opacity", 1)
            .transition()
            .duration(200)
            .style("opacity", 0)
            .remove();

        // Get the maximum x-axis (cost) value
        function maxValue() {
            if (d3.max(data, d => d.qiCost >= d3.max(data, d => d.ppCost))) {
                return d3.max(data, d => d.qiCost)
            } else if (d3.max(data, d => d.ppCost < d3.max(data, d => d.ppCost))) {
                return d3.max(data, d => d.ppCost)
            }
        }

        // Set scales
        let xScale = d3
            .scaleLinear()
            .domain([0, 1])
            .range([this.margin.left, width])

        let yScale = d3
            .scaleLinear()
            .domain([0, maxValue() + 100])
            .range([height, 0]);

        // Line functions
        const ppFunc = d3
            .line()
            .x(function (d) {
                return xScale(d.percent)
            })
            .y(function (d) {
                return yScale(d.ppCost)
            });

        const qiFunc = d3
            .line()
            .x(function (d) {
                return xScale(d.percent)
            })
            .y(function (d) {
                return yScale(d.qiCost)
            });

        const highlightFunc = d3
            .line()
            .x(xScale(state.percentInfected))
            .y(function (d) { return yScale(d.qiCost) })



        // X Axis
        let xAxis = canvas
            .append("g")
            .attr("class", "x axis")
            .call(d3.axisBottom(xScale)
                .tickFormat(d => d * 100 + "%"))
            .attr("transform", "translate(0," + height + ")")
            .style("opacity", 0)
            .transition()
            .duration(400)
            .style("opacity", 1);


        // Y Axis
        let yAxis = canvas
            .append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale)
                .ticks(5)
                .tickFormat(d => "$" + formatXAxis(d)))
            .attr("transform", "translate(40, 0)")
            .style("opacity", 0)
            .transition()
            .duration(400)
            .style("opacity", 1);


        // Cost of PSH line
        canvas.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", ppFunc)
            .style("stroke", "#a50a51") // dark pink
            .attr("stroke-width", 3)
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 0.6);

        // Cost of QI line
        canvas.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", qiFunc)
            .style("stroke", "#0494cb") // dark blue
            .attr("stroke-width", 3)
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 0.6);

        // Percent Infected Line
        canvas.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("id", "highlight-line")
            .attr("d", highlightFunc)
            .style("stroke", "#aaa")
            .attr("stroke-width", 3)
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 0.6);

        // Fixed tooltip: % Infected
        canvas
            .append("text")
            .attr("class", "fixed-tooltip")
            .attr("fill", "grey")
            .style("text-shadow", "0 0 2px #fff")
            .attr("x", function () {
                return xScale(state.percentInfected) - 15;
            })
            .attr("y", function () {
                return yScale(this.margin);
            })
            .text(formatNumber(state.percentInfected * 100) + "%")
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1);

        // Fixed tooltip: PSH cost
        canvas
            .append("text")
            .attr("class", "fixed-tooltip-cost")
            .attr("fill", "#a50a51")
            .style("text-shadow", "0 0 2px #fff")
            .attr("x", function () {
                return xScale(state.percentInfected) - 30;
            })
            .attr("y", function () {
                return yScale(state.costPP) - 15;
            })
            .text("$" + formatNumber(state.costPP))
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1);

        // Fixed tooltip: QI cost
        canvas
            .append("text")
            .attr("class", "fixed-tooltip-cost")
            .attr("fill", "#0494cb")
            .style("text-shadow", "0 0 2px #fff")
            .attr("x", function () {
                return xScale(state.percentInfected) - 30;
            })
            .attr("y", function () {
                return yScale(state.costQI) - 15;
            })
            .text("$" + formatNumber(state.costQI))
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1);

        // Q&I Label
        canvas
            .append("text")
            .attr("class", "fixed-tooltip-label")
            .attr("fill", "#0494cb")
            .style("text-shadow", "0 0 2px #fff")
            .attr("x", function () {
                return xScale(1) - 30;
            })
            .attr("y", function () {
                return yScale(d3.max(data, d => d.qiCost)) - 15;
            })
            .text("Q&I Cost")
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1);

        // PSH Label
        canvas
            .append("text")
            .attr("class", "fixed-tooltip-label")
            .attr("fill", "#a50a51")
            .style("text-shadow", "0 0 2px #fff")
            .attr("x", function () {
                return xScale(1) - 30;
            })
            .attr("y", function () {
                return yScale(d3.max(data, d => d.ppCost)) - 15;
            })
            .text("PSH Cost")
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1);


        // Add PSH dots
        canvas.selectAll(".dotPP")
            .data(data)
            .enter()
            .append("circle") // Uses the enter().append() method
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", function (d) {
                return xScale(d.percent)
            })
            .attr("cy", function (d) {
                return yScale(d.ppCost)
            })
            .attr("r", 4)
            .attr("fill", "#a50a51")
            .attr("id", function (d, i) {
                return "dot" + i
            })
            .on("mouseover", function (d, i) {

                // Change dot
                d3.selectAll("#" + this.id)
                    .attr("r", 6)
                    .style("cursor", "pointer")
                    .style("opacity", 1);

                // Remove the original cost numbers
                d3.selectAll(".fixed-tooltip-cost")
                    .style("opacity", 0);

                // Add percent infected label
                canvas
                    .append("text")
                    .attr("class", "moving-tooltip")
                    .attr("fill", "grey")
                    .style("text-shadow", "0 0 2px #fff")
                    .attr("x", function () {
                        return xScale(d.percent) - 10;
                    })
                    .attr("y", function () {
                        return yScale(this.margin);
                    })
                    .text(formatNumber(d.percent * 100) + "%")
                    .style("opacity", 0)
                    .transition()
                    .duration(100)
                    .style("opacity", 1);

                // Add PP cost label
                canvas
                    .append("text")
                    .attr("class", "tooltip")
                    .attr("fill", "#a50a51")
                    .style("text-shadow", "0 0 2px #fff")
                    .attr("x", function () {
                        return xScale(d.percent) - 30;
                    })
                    .attr("y", function () {
                        return yScale(d.ppCost) - 15;
                    })
                    .text("$" + formatNumber(d.ppCost))
                    .style("opacity", 0)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);

                // Add QI cost label
                canvas
                    .append("text")
                    .attr("class", "tooltip")
                    .attr("fill", "#0494cb")
                    .style("text-shadow", "0 0 2px #fff")
                    .attr("x", function () {
                        return xScale(d.percent) - 30;
                    })
                    .attr("y", function () {
                        return yScale(d.qiCost) - 15;
                    })
                    .text("$" + formatNumber(d.qiCost))
                    .style("opacity", 0)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);

            })
            .on("mouseout", function (d) {
                d3.selectAll("#" + this.id)
                    .attr("r", 4)
                    .style("opacity", 0.4);

                d3.selectAll(".moving-tooltip")
                    .style("opacity", 0.6)
                    .transition()
                    .duration(100)
                    .style("opacity", 0)
                    .remove();

                d3.selectAll(".tooltip")
                    .remove();

                d3.selectAll(".fixed-tooltip-cost")
                    .style("opacity", 1);
            })
            .style("opacity", 0)
            .transition()
            .delay(d => 500 * d.percent)
            .style("opacity", 0.4);


        // Add QI dots
        canvas.selectAll(".dotQI")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", function (d) {
                return xScale(d.percent)
            })
            .attr("cy", function (d) {
                return yScale(d.qiCost)
            })
            .attr("r", 4)
            .attr("fill", "#0494cb")
            .attr("id", function (d, i) {
                return "dot" + i
            })
            .on("mouseover", function (d, i) {

                d3.selectAll("#" + this.id)
                    .attr("r", 6)
                    .style("z-index", "1000")
                    .style("cursor", "pointer")
                    .style("opacity", 1);

                d3.selectAll(".fixed-tooltip-cost")
                    .style("opacity", 0);

                canvas
                    .append("text")
                    .attr("class", "moving-tooltip")
                    .attr("fill", "grey")
                    .style("text-shadow", "0 0 2px #fff")
                    .attr("x", function () {
                        return xScale(d.percent) - 10;
                    })
                    .attr("y", function () {
                        return yScale(this.margin);
                    })
                    .text(formatNumber(d.percent * 100) + "%")
                    .style("opacity", 0)
                    .transition()
                    .duration(100)
                    .style("opacity", 1);

                canvas
                    .append("text")
                    .attr("class", "tooltip")
                    .attr("fill", "#a50a51")
                    .style("text-shadow", "0 0 2px #fff")
                    .attr("x", function () {
                        return xScale(d.percent) - 30;
                    })
                    .attr("y", function () {
                        return yScale(d.ppCost) - 15;
                    })
                    .text("$" + formatNumber(d.ppCost))
                    .style("opacity", 0)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);

                canvas
                    .append("text")
                    .attr("class", "tooltip")
                    .attr("fill", "#0494cb")
                    .style("text-shadow", "0 0 2px #fff")
                    .attr("x", function () {
                        return xScale(d.percent) - 30;
                    })
                    .attr("y", function () {
                        return yScale(d.qiCost) - 15;
                    })
                    .text("$" + formatNumber(d.qiCost))
                    .style("opacity", 0)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
                

            })
            .on("mouseout", function (d) {
                d3.selectAll("#" + this.id)
                    .attr("r", 4)
                    .style("opacity", 0.4);

                d3.selectAll(".moving-tooltip")
                    .style("opacity", 0.6)
                    .transition()
                    .duration(100)
                    .style("opacity", 0)
                    .remove();

                d3.selectAll(".tooltip")
                    .style("opacity", 1)
                    .transition()
                    .duration(100)
                    .style("opacity", 0)
                    .remove();

                    d3.selectAll(".fixed-tooltip-cost")
                    .style("opacity", 1);
            })
            .style("opacity", 0)
            .transition()
            .delay(d => 500 * d.percent)
            .style("opacity", 0.4);


    }

    // Builds the dataset and line using state values
    draw(state, setGlobalState) {
        console.log("Drawing chart!")

        this.buildDataset(state, setGlobalState);
        this.buildLine(this.lineChartSVG, this.chartWidth, this.chartHeight, state.chart1Data, state, setGlobalState);

    }

    // Sets opacity of chart to 1
    displayChart() {
        d3.select("#chart1-viz")
        .style("opacity", 1)
    }

    // Sets opacity of chart to 0.3
    hideChart(opacity) {
        d3.select("#chart1-viz")
        .style("opacity", opacity)
    }
}

export {
    Chart
};