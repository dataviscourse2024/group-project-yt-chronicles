
document.getElementById("dark-mode-toggle").addEventListener("change", function () {
    document.body.classList.toggle("dark-mode");
});


const width = 800;
const height = 500;


const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);


const projection = d3.geoMercator().scale(130).translate([width / 2, height / 1.5]);
const path = d3.geoPath().projection(projection);


const defaultColor = "#FF0000";  // Default country color
const outlineColor = "#000000";  // Country border color
const selectedColor = "#FFFFFF"; // Highlight color for selected country


let youtubeData = [];
let selectedCountry = null;


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


function resetSelection() {
    svg.selectAll("path").attr("fill", defaultColor);  
    document.getElementById("selected-country-name").innerText = "None";  
    selectedCountry = null;
    const selectedMetric = document.getElementById("metric-select").value;
    updateLineChart(selectedMetric); 
}

document.getElementById("reset-selection").addEventListener("click", resetSelection);




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
    renderBubbleChart();
});


function updateLineChart(metric) {
    const linechart = d3.select("#linechart");
    linechart.selectAll("*").remove(); 


    const filteredData = selectedCountry
        ? youtubeData.filter(d => d.country === selectedCountry)
        : youtubeData;


    const top5 = filteredData.sort((a, b) => b[metric] - a[metric]).slice(0, 5);

    const margin = {top: 20, right: 20, bottom: 30, left: 40},
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;


    const x = d3.scaleBand()
        .domain(top5.map(d => d.title))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(top5, d => d[metric])])
        .nice()
        .range([height, 0]);


    const svg = linechart.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));


    const formatY = (d) => {
        if (d >= 1e9) return (d / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'; // Billions
        if (d >= 1e6) return (d / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'; // Millions
        if (d >= 1e3) return (d / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; // Thousands
        return d.toString(); 
    };


    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).tickFormat(formatY)); 


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


document.getElementById("metric-select").addEventListener("change", function() {
    const selectedMetric = this.value;
    updateLineChart(selectedMetric);
});

function createYoutuberStatsTable() {
    const container = d3.select("#youtuber-stats");

    const table = container.append("table").attr("class", "stats-table");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    const columns = ["Rank", "Title", "Subscribers", "Video Views"];

    thead.append("tr")
        .selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .text(d => d);

    function updateTable(data) {
        const top10 = data.slice(0, 10);

        tbody.selectAll("tr").remove();

        const rows = tbody.selectAll("tr")
            .data(top10)
            .enter()
            .append("tr");

        rows.selectAll("td")
            .data(d => [d.rank, d.Title, d.subscribers, d["video views"]])
            .enter()
            .append("td")
            .text(d => d);

        const containerElement = document.getElementById("youtuber-stats");
        containerElement.scrollTop = 0;
    }

    d3.csv("data/data.csv").then(data => {
        data.forEach(d => {
            d.rank = +d.rank;
            d.subscribers = d3.format(",")(+d.subscribers);
            d["video views"] = d3.format(",")(+d["video views"]);
        });

        const top10 = data.sort((a, b) => a.rank - b.rank).slice(0, 10);
        updateTable(top10);

        const targetNode = document.getElementById("selected-country-name");

        const observer = new MutationObserver(() => {
            const selectedCountry = d3.select("#selected-country-name").text();

            if (selectedCountry === "None") {
                updateTable(top10);
            } else {
                const filteredData = data
                    .filter(d => d.Country === selectedCountry)
                    .sort((a, b) => a.rank - b.rank)
                    .slice(0, 10);

                if (filteredData.length === 0) {
                    tbody.selectAll("tr").remove();
                    tbody.append("tr").append("td")
                        .attr("colspan", columns.length)
                        .text("No data available for the selected country.")
                        .style("text-align", "center");
                } else {
                    updateTable(filteredData);
                }
            }
        });

        observer.observe(targetNode, { childList: true });
    });
}


// function createYoutuberStatsTable() {
//     const container = d3.select("#youtuber-stats");


//     const table = container.append("table").attr("class", "stats-table");
//     const thead = table.append("thead");
//     const tbody = table.append("tbody");


//     const columns = ["Rank", "Title", "Subscribers", "Video Views"];


//     thead.append("tr")
//         .selectAll("th")
//         .data(columns)
//         .enter()
//         .append("th")
//         .text(d => d);


//     function updateTable(data) {
//         const top10 = data.slice(0, 10);

//         tbody.selectAll("tr").remove();

//         const rows = tbody.selectAll("tr")
//             .data(top10)
//             .enter()
//             .append("tr");

//         rows.selectAll("td")
//             .data(d => [d.rank, d.Title, d.subscribers, d["video views"]])
//             .enter()
//             .append("td")
//             .text(d => d);

//         const containerElement = document.getElementById("youtuber-stats");
//         containerElement.scrollTop = 0; 
//     }

//     // Load the CSV data
//     d3.csv("data/data.csv").then(data => {
//         // Parse numerical data
//         data.forEach(d => {
//             d.rank = +d.rank;
//             d.subscribers = d3.format(",")(+d.subscribers); 
//             d["video views"] = d3.format(",")(+d["video views"]); 
//         });

//         // Set default display for the top 10 YouTubers
//         const top10 = data.sort((a, b) => a.rank - b.rank).slice(0, 10);
//         updateTable(top10);

   
//         d3.select("#selected-country-name").on("DOMSubtreeModified", function () {
//             const selectedCountry = d3.select("#selected-country-name").text();

//             if (selectedCountry === "None") {
//                 updateTable(top10);
//             } else {
//                 const filteredData = data
//                     .filter(d => d.Country === selectedCountry)
//                     .sort((a, b) => a.rank - b.rank)
//                     .slice(0, 10);

//                 if (filteredData.length === 0) {
//                     tbody.selectAll("tr").remove();
//                     tbody.append("tr").append("td")
//                         .attr("colspan", columns.length)
//                         .text("No data available for the selected country.")
//                         .style("text-align", "center");
//                 } else {
//                     updateTable(filteredData);
//                 }
//             }
//         });
//     });
// }

createYoutuberStatsTable();

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

    const topCategories = Array.from(d3.rollup(
        youtubeData,
        v => v.length,
        d => d.category
    ))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(d => d[0]);

   
    const countries = Array.from(d3.rollup(
        youtubeData,
        v => v.length,
        d => d.country
    ))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(d => d[0]);
    

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
        .attr("transform",`translate(${margin.left},${margin.top})`);

   
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
        .attr("transform",`translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));
}
       





function renderBubbleChart() {
    const bubbleChartDiv = document.getElementById("bubble-chart");
    bubbleChartDiv.innerHTML = ""; // Clear the existing chart

    const selectedMetric = document.getElementById("metric-select").value;

    const metrics = ["views", "subscribers", "earnings"];
    const sizeMetric = selectedMetric;
    const [xMetric, yMetric] = metrics.filter(metric => metric !== sizeMetric);

    const margin = { top: 20, right: 20, bottom: 60, left: 70 };
    const width = bubbleChartDiv.clientWidth - margin.left - margin.right;
    const height = bubbleChartDiv.clientHeight - margin.top - margin.bottom;

    const svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const filteredData = youtubeData.filter(d => d[xMetric] > 0 && d[yMetric] > 0);

    const xDomain = d3.extent(filteredData, d => d[xMetric]);
    const yDomain = d3.extent(filteredData, d => d[yMetric]);

    const x = d3.scaleLog()
        .domain([xDomain[0] * 0.9, xDomain[1] * 1.1]) 
        .range([0, width])
        .clamp(true);

    const y = d3.scaleLinear()
        .domain([yDomain[0] * 0.9, yDomain[1] * 1.1])
        .range([height, 0])
        .clamp(true);

    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(filteredData, d => d[sizeMetric])])
        .range([5, 50]);


    const colorScale = d3.scaleOrdinal()
        .domain([...new Set(filteredData.map(d => d.category))]) 
        .range(d3.schemeCategory10);


    const xAxis = d3.axisBottom(x).ticks(10, "~s");
    const yAxis = d3.axisLeft(y).tickFormat(d => {
        if (d >= 1e6) return `${d / 1e6}M`; 
        if (d >= 1e3) return `${d / 1e3}K`; 
        return d;
    });

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`) 
        .call(xAxis);

    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10) 
        .text(xMetric.charAt(0).toUpperCase() + xMetric.slice(1)); 

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20) 
        .text(yMetric.charAt(0).toUpperCase() + yMetric.slice(1)); 

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("padding", "10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px");


    svg.selectAll(".bubble")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("class", "bubble")
    .attr("cx", d => x(d[xMetric]))
    .attr("cy", d => y(d[yMetric]))
    .attr("r", d => sizeScale(d[sizeMetric]))
    .attr("fill", d => colorScale(d.category)) 
    .attr("opacity", 0.7)
    .on("mouseover", function (event, d) {
        tooltip.html(`
            <strong>Youtuber: ${d.title}</strong><br>
            Country: ${d.country}<br>
            Views: ${d.views.toLocaleString()}<br>
            Subscribers: ${d.subscribers.toLocaleString()}<br>
            Earnings: $${d.earnings.toLocaleString()}
        `)
        .style("visibility", "visible")
        .style("top", `${event.pageY + 10}px`)
        .style("left", `${event.pageX + 10}px`);
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
    })
    .on("mousemove", function (event) {
        tooltip.style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
        d3.select(this).attr("stroke", null);
    });
}



document.getElementById("metric-select").addEventListener("change", renderBubbleChart);

d3.csv("data/data.csv").then(function(data) {
    youtubeData = data.map(d => ({
        title: d.Title,
        views: +d['video views'],
        subscribers: +d.subscribers,
        earnings: +d['highest_yearly_earnings'],
        country: d.Country,
        category: d.category
    }));
    renderBubbleChart(); 
});


