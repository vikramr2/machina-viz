import React from 'react';
import { useState } from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import dagre from 'cytoscape-dagre';

Cytoscape.use(COSEBilkent);
Cytoscape.use(dagre);

function ClonalTree(props) {
  var hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

  const colorPalette = [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
    "#cab2d6",
    "#6a3d9a",
    "#ffff99",
    "#b15928"
  ]
  const ncolors = colorPalette.length;

  function getColor(label) {
    let color = props.coloring.map((value, index) => {
      if (value[0] === label) return value[1]}).filter((item) => {return item != undefined})[0];
    return hexColorRegex.test(color) ? color : colorPalette[parseInt(color) % ncolors]
  }

  const [width, setWith] = useState("100%");
  const [height, setHeight] = useState("100%");

  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }

  function findLabel(node) {
    return props.labeling.map((value, index) => {
      if (value[0] === node) return value[1]}).filter((item) => {return item != undefined})[0];
  }

  let nodes = props.tree.flat().filter(onlyUnique).map((value, index) => {
    return { data: { id: value, label: findLabel(value), type: "ip"} };
  });
  let edges = props.tree.map((value, index) => {
    return { data: { source: value[0], target: value[1], label: `${value[0]}->${value[1]}`, migration: `${findLabel(value[0])}->${findLabel(value[1])}`} }
  })

  const [graphData, setGraphData] = useState({
    nodes: nodes,
    edges: edges
  });

  let styleSheet = [
    {
      selector: "node",
      style: {
        backgroundColor: "#4a56a6",
        width: 15,
        height: 15,
        label: "data(id)",

        // "width": "mapData(score, 0, 0.006769776522008331, 20, 60)",
        // "height": "mapData(score, 0, 0.006769776522008331, 20, 60)",
        // "text-valign": "center",
        // "text-halign": "center",
        "overlay-padding": "6px",
        "z-index": "10",
        //text props
        //"text-outline-color": "#4a56a6",
        "text-outline-width": "2px",
        color: "white",
        fontSize: 15
      }
    },
    {
      selector: "node:selected",
      style: {
        "border-width": "6px",
        "border-color": "#AAD8FF",
        "border-opacity": "0.5",
        "background-color": "#77828C",
        width: 50,
        height: 50,
        //text props
        "text-outline-color": "#77828C",
        "text-outline-width": 8
      }
    },
    {
      selector: "edge",
      style: {
        width: 3,
        // "line-color": "#6774cb",
        "line-color": "#AAD8FF",
        "target-arrow-color": "#6774cb",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier"
      }
    }
  ];

  props.coloring.map((value, index) => {
    styleSheet.push({
      selector: `node[label='${value[0]}']`,
      style: {
        backgroundColor: hexColorRegex.test(value[1]) ? value[1] : colorPalette[parseInt(value[1]) % ncolors]
      }
    })
  })

  edges.map((value, index) => {
    let source = value.data.source;
    let target = value.data.target;
    console.log(source);
    styleSheet.push({
      selector: `edge[label='${source}->${target}']`,
      style: {
        'line-fill': 'linear-gradient',
        'line-gradient-stop-colors': `${getColor(findLabel(source))} ${getColor(findLabel(target))}`,
        'line-gradient-stop-positions': '33% 66%',
        "target-arrow-color": `${getColor(findLabel(target))}`
      }
    })
  })

  let myCyRef;
  const layout = {
    name: "dagre",
    fit: true,
    // circle: true,
    directed: true,
    padding: 50,
    // spacingFactor: 1.5,
    animate: true,
    animationDuration: 1000,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: false,
    ready: function() {
      const listener = (eventName, eventData) => {
        // Respond to event from other graph here
        // For example:
        if (eventName === 'selectNodeCl') {
          const node = myCyRef.getElementById(eventData.nodeId);
          myCyRef.$(`edge[migration='${eventData.nodeId}']`).css({
            width: 10
          })
          node.trigger('select');
        }
        if (eventName === 'deselectNodeCl') {
          const node = myCyRef.getElementById(eventData.nodeId);
          myCyRef.$(`edge[migration='${eventData.nodeId}']`).css({
            width: 3
          })
          node.trigger('select');
        }
      };
      props.evtbus.addListener(listener);
    }
  };

  return <CytoscapeComponent
    elements={CytoscapeComponent.normalizeElements(graphData)}
    // pan={{ x: 200, y: 200 }}
    style={{ width: width, height: height }}
    zoomingEnabled={true}
    maxZoom={3}
    minZoom={0.1}
    autounselectify={false}
    boxSelectionEnabled={true}
    layout={layout}
    stylesheet={styleSheet}
    cy={cy => {
      myCyRef = cy;

      console.log("EVT", cy);

      cy.on("tap", "node", evt => {
        var node = evt.target;
        console.log("EVT", evt);
        console.log("TARGET", node.data());
        console.log("TARGET TYPE", typeof node[0]);
      });

      cy.on('mouseover', 'node', function(event) {
        // Get the node information
        var node = event.target;
        var label = node.data('label');
        
        // Create the div element
        var div = document.createElement("div");
        div.setAttribute("class", "panel popup");

        div.innerHTML = `<p>${label}&nbsp;</p>`;
      
        // Position the div element near the node
        const canvas = document.getElementsByTagName('canvas')[0];
        div.style.position = "absolute";
        div.style.top = (node.renderedPosition('y') + canvas.height*0.5 + 30) + 'px';
        div.style.left = node.renderedPosition('x') + 'px';
      
        // Add the div element to the page
        document.body.appendChild(div);
      });

      cy.on('mouseout', 'node', function(event){
        // Remove the div element on mouseout
        var div = document.querySelector('.panel.popup');
        document.body.removeChild(div);
      });

      cy.on('mouseover', 'edge', function(event) {
        const { target } = event;
        target.css({
          width: 10
        })
        const nodeId = event.target.id();
        let source = findLabel(target.data().source);
        let sink = findLabel(target.data().target);
        props.evtbus.fireEvent('selectNode', { nodeId, source, sink, target});
      });

      cy.on('mouseout', 'edge', function(event) {
        const { target } = event;
        target.css({
          width: 3
        })
        const nodeId = event.target.id();
        let source = findLabel(target.data().source);
        let sink = findLabel(target.data().target);
        props.evtbus.fireEvent('deselectNode', { nodeId, source, sink, target});
      });
    }}
    abc={console.log("myCyRef", myCyRef)}
  />
}

export default ClonalTree;