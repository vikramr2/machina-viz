import React from 'react';
import { useState } from "react";
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';

Cytoscape.use(COSEBilkent);

function Migration(props) {
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
    
      const [width, setWith] = useState("100%");
      const [height, setHeight] = useState("100%");
    
      function onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
      }
    
      function findLabel(node) {
        return props.labeling.map((value, index) => {
          if (value[0] === node) return value[1]}).filter((item) => {return item != undefined})[0];
      }

      function getColor(label) {
        let color = props.coloring.map((value, index) => {
          if (value[0] === label) return value[1]}).filter((item) => {return item != undefined})[0];
        return hexColorRegex.test(color) ? color : colorPalette[parseInt(color) % ncolors]
      }
    
      let nodes = props.tree.flat().filter(onlyUnique).map((value, index) => {
        return { data: { id:  findLabel(value), label: findLabel(value), type: "ip"} };
      });
      let edges_t = props.tree.map((value, index) => {
        return { data: { source: findLabel(value[0]), target: findLabel(value[1]), label: 1, id: `${findLabel(value[0])}->${findLabel(value[1])}`, clsource: value[0], cltarget: value[1] } }
      })

      let edges = [];

      for (const [i, edge] of edges_t.entries()) {
        let flag = false;
        for (const [j, edge2] of edges.entries()) {
          if (edge.data.source == edge2.data.source && edge.data.target == edge2.data.target) {
            edges[j].data.label++;
            flag = true;
            break;
          }
        }
        if (!flag) edges.push(edges_t[i]);
      }

      for (const [i, edge] of edges.entries()) {
        if (edge.data.label == 1) {
          edges[i].data.label = "";
        }
      }

      console.log(edges);
    
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
            label: "data(label)",
    
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
          selector: "node[type='device']",
          style: {
            shape: "rectangle"
          }
        },
        {
          selector: "edge",
          style: {
            width: 3,
            // "line-color": "#6774cb",
            label: "data(label)",
            "target-arrow-color": "#6774cb",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "text-outline-width": "2px",
            color: "white",
            fontSize: 15
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
        console.log(value.data.id);
        console.log(source);
        styleSheet.push({
          selector: `edge[id='${source}->${target}']`,
          style: {
            'line-fill': 'linear-gradient',
            'line-gradient-stop-colors': `${getColor(source)} ${getColor(target)}`,
            'line-gradient-stop-positions': '33% 66%',
            "target-arrow-color": `${getColor(target)}`
          }
        })
      })
    
      let myCyRef;
      const layout = {
        name: "breadthfirst",
        fit: true,
        circle: true,
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
            if (eventName === 'selectNode') {
              const node = myCyRef.getElementById(eventData.nodeId);
              let source = eventData.source;
              let target = eventData.sink;
              myCyRef.$(`edge[id='${source}->${target}']`).css({
                width: 10
              })
              node.trigger('select');
            }
            if (eventName === 'deselectNode') {
              const node = myCyRef.getElementById(eventData.nodeId);
              let source = eventData.source;
              let target = eventData.sink;
              myCyRef.$(`edge[id='${source}->${target}']`).css({
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

          cy.on('mouseover', 'edge', function(event) {
            const { target } = event;
            target.css({
              width: 10
            })
            const nodeId = event.target.id();
            props.evtbus.fireEvent('selectNodeCl', { nodeId, target});
          });
    
          cy.on('mouseout', 'edge', function(event) {
            const { target } = event;
            target.css({
              width: 3
            })
            const nodeId = event.target.id();
            props.evtbus.fireEvent('deselectNodeCl', { nodeId, target});
          });
        }}
        abc={console.log("myCyRef", myCyRef)}
      />
}

export default Migration;