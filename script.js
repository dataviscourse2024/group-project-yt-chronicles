
document.getElementById("dark-mode-toggle").addEventListener("change", function () {
    document.body.classList.toggle("dark-mode");
});

// Set dimensions for the map
const width = 800;
const height = 500;

// Set up the SVG container for the map
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Map projection setup
const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.5]);
const path = d3.geoPath().projection(projection);

// Define colors
const defaultColor = "#FF0000";  // Default country color "#FFAAAA"
const outlineColor = "#000000";  // Country border color
const selectedColor = "#FFFFFF"; // Highlight color for selected country "#FFFFFF"

// Initialize variables for YouTube data and country selection
let youtubeData = [];
let selectedCountry = null;

// Load the map data and render the map
d3.json("world.geo.json").then(function(data) {
    svg.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", defaultColor)
        .attr("stroke", outlineColor)
        .attr("stroke-width", 0.5)
        .on("click", function(event, d) {
            svg.selectAll("path").attr("fill", defaultColor); // Reset colors
            d3.select(this).attr("fill", selectedColor); // Highlight selected country
            document.getElementById("selected-country-name").innerText = d.properties.name || "Unknown";
            selectedCountry = d.properties.name;
            const selectedMetric = document.getElementById("metric-select").value;
            updateLineChart(selectedMetric); // Update chart based on selected country
        });
});

// Reset selection when reset button is clicked
function resetSelection() {
    svg.selectAll("path").attr("fill", defaultColor);  // Reset country colors
    document.getElementById("selected-country-name").innerText = "None";  
    selectedCountry = null;
    const selectedMetric = document.getElementById("metric-select").value;
    updateLineChart(selectedMetric); // Update chart with no country filter
}

document.getElementById("reset-selection").addEventListener("click", resetSelection);

// Load YouTube data and initialize line chart
d3.csv("data/data.csv").then(function(data) {
    youtubeData = data.map(d => ({
        title: d.Title,
        views: +d['video views'],
        subscribers: +d.subscribers,
        earnings: +d['highest_yearly_earnings'],
        country: d.Country,
        category:d.category
    }));
    updateLineChart("views");
    renderMatrixMap();  
});

// Update the line chart based on selected metric and country
function updateLineChart(metric) {
    const linechart = d3.select("#linechart");
    linechart.selectAll("*").remove(); // Clear existing chart

    // Filter data for selected country if any
    const filteredData = selectedCountry
        ? youtubeData.filter(d => d.country === selectedCountry)
        : youtubeData;

    // Sort data by metric and keep top 5
    const top5 = filteredData.sort((a, b) => b[metric] - a[metric]).slice(0, 5);

    const margin = {top: 20, right: 20, bottom: 30, left: 40},
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Set up x-axis (titles) and y-axis (metrics)
    const x = d3.scaleBand()
        .domain(top5.map(d => d.title))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(top5, d => d[metric])])
        .nice()
        .range([height, 0]);

    // Create SVG for line chart
    const svg = linechart.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Render x-axis
    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Format y-axis labels based on value scale
    const formatY = (d) => {
        if (d >= 1e9) return (d / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'; // Billions
        if (d >= 1e6) return (d / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; // Millions
        if (d >= 1e3) return (d / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; // Thousands
        return d.toString(); 
    };

    // Render y-axis with formatted labels
    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).tickFormat(formatY)); 

    // Draw bars for the top 5 items in selected metric
    svg.selectAll(".bar")
        .data(top5)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.title))
        .attr("y", d => y(d[metric]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[metric]))
        .attr("fill", defaultColor); 

}

// Update chart when dropdown selection changes
document.getElementById("metric-select").addEventListener("change", function() {
    const selectedMetric = this.value;
    updateLineChart(selectedMetric);
});

function renderMatrixMap() {
    const matrixMap = d3.select("#matrix-map");
    matrixMap.selectAll("*").remove(); 

    const margin = { top: 40, right: 20, bottom: 100, left: 120 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

   
    const categoryCountryCounts = d3.rollup(
        youtubeData,
        v => v.length,
        d => d.category,
        d => d.country
    );

    // Get the top 10 categories by count
    const topCategories = Array.from(d3.rollup(
        youtubeData,
        v => v.length,
        d => d.category
    ))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(d => d[0]);

   
    const countries = Array.from(new Set(
        youtubeData.filter(d => topCategories.includes(d.category)).map(d => d.country)
    ));

    const x = d3.scaleBand()
        .domain(countries)
        .range([0, width])
        .padding(0.05);

    const y = d3.scaleBand()
        .domain(topCategories)
        .range([0, height])
        .padding(0.05);

    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(Array.from(categoryCountryCounts.values(), d =>
            d3.max(Array.from(d.values()))))])
        .interpolator(d3.interpolateReds);

    const svg = matrixMap.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

   
    svg.selectAll()
        .data(topCategories.flatMap(category =>
            countries.map(country => ({
                category: category,
                country: country,
                value: categoryCountryCounts.get(category)?.get(country) || 0
            }))
        ))
        .enter()
        .append("rect")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d.category))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.value))
        .append("title")
        .text(d => `${d.category}, ${d.country}: ${d.value}`);

    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));
}

