import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
    componentDidUpdate(){
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
        return;
    }
    
    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    // Write the D3.js code to create the interactive streamgraph visualization here
    const svg = d3.select(".svg_parent");

    const columns = Object.keys(chartData[0]).slice(1);
    
    const stack = d3.stack().keys(llmModels).offset(d3.stackOffsetWiggle);
    const stackedSeries = stack(chartData);
    
    // Get the actual min/max from stacked data
    const yExtent = d3.extent(stackedSeries.flat(), d => d[1]);
    const yMin = d3.min(stackedSeries.flat(), d => d[0]);

    const xScale = d3.scaleTime().domain(d3.extent(chartData, d => new Date(d.Date))).range([30, 420]);
    const yScale = d3.scaleLinear().domain([yMin, yExtent[1]]).range([410, 0]);

    
    const colorScale = d3.scaleOrdinal().domain(llmModels).range(["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"]);

    const areaGenerator = d3.area()
      .x(d => xScale(new Date(d.data.Date)))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveCardinal);

    // Create tooltip
    const tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "10px")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
      .style("display", "none");

    svg.selectAll("path").data(stackedSeries).join("path")
      .style('fill', d => colorScale(d.key))
      .attr('d', d => areaGenerator(d))
      .on("mouseover mousemove", (event, d) => {
        const modelData = chartData.map(item => ({
          month: d3.timeFormat("%b")(new Date(item.Date)),
          count: item[d.key]
        }));
        
        // Clear previous content
        tooltip.selectAll("*").remove();
        
        // Add title
        tooltip.append("div")
          .style("font-weight", "bold")
          .style("margin-bottom", "5px")
          .text(d.key);
        
        // Create mini chart
        const width = 270, height = 170;
        const margin = { left: 30, right: 10, top: 10, bottom: 30 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        
        const tooltipSvg = tooltip.append("svg")
          .attr("width", width)
          .attr("height", height);
          
        const innerChart = tooltipSvg.append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);
          
        // Create scales
        const xScale = d3.scaleBand()
          .domain(modelData.map(d => d.month))
          .range([0, innerWidth])
          .padding(0.2);
          
        const yScale = d3.scaleLinear()
          .domain([0, d3.max(modelData, d => d.count)])
          .range([innerHeight, 0]);
        
        // Generate x axis
        const xAxisGenerator = d3.axisBottom(xScale);
        innerChart.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0, ${innerHeight})`)
          .call(xAxisGenerator)
          .selectAll("text")
          .style("font-size", "10px")
          .style("fill", "black");
          
        // Generate y axis
        const yAxisGenerator = d3.axisLeft(yScale).ticks(3);
        innerChart.append("g")
          .attr("class", "y-axis")
          .call(yAxisGenerator)
          .selectAll("text")
          .style("font-size", "10px")
          .style("fill", "black");
          
        // Style axis lines
        innerChart.selectAll(".domain, .tick line")
          .style("stroke", "black");
        
        // Render the bars
        innerChart.selectAll("rect")
          .data(modelData)
          .join("rect")
          .attr("x", d => xScale(d.month))
          .attr("width", xScale.bandwidth())
          .attr("y", innerHeight)
          .attr("height", 0)
          .attr("fill", colorScale(d.key))
          .transition()
          .duration(300)
          .attr("y", d => yScale(d.count))
          .attr("height", d => innerHeight - yScale(d.count));
        
        tooltip.style("display", "block")
          .style("opacity", 0)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
      
    // Add legend
    const legend = svg.selectAll(".legend")
      .data(llmModels)
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(460, ${150 + i * 20})`);
      
    legend.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .style("fill", d => colorScale(d));
      
    legend.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d)
      .style("font-size", "12px");
      
    // Add x-axis
    svg.append("g")
      .attr("transform", "translate(0, 420)")
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b")));

  }

  render() {
    return (
      <svg style={{ width: 600, height: 500, display: "flex", justifyContent: "center", alignItems: "center" }} className="svg_parent">

      </svg>
    );
  }
}

export default InteractiveStreamGraph;
