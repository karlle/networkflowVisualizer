const infoTop = document.querySelector('.top-info');
const infoBottom = document.querySelector('.bottom-info')
const canvas = document.querySelector('.canvas')

canvas.width = 720
canvas.height = 405 //16:9 ratio 
let c = canvas.getContext("2d")

const nodeRadius = 17

let highlightedNode = undefined
let highlightedEdge = undefined

sourceNode = undefined 
sinkNode = undefined

let nodes = []
let edges = []

class Node{

    constructor(x,y,sourceNode=false, sinkNode=false){
        this.x = x
        this.y = y
        this.highlighted = false
        this.sourceNode = sourceNode
        this.sinkNode = sinkNode
    }

    draw(){
        
        c.fillStyle = "#E27D60";
        c.beginPath();
        c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI);
        c.fill();

        
        if(this.sourceNode || this.sinkNode){
            this.sourceNode ? c.strokeStyle = "#4DCCBD" : c.strokeStyle = "#2374AB"
            c.lineWidth = 3
            c.beginPath();
            c.arc(this.x, this.y, nodeRadius-2, 0, 2 * Math.PI);
            c.stroke();
        }
        
        if (this.highlighted){
            c.strokeStyle = "black"
            c.lineWidth = 1
            c.beginPath();
            c.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI);
            c.stroke();
        }

    }

    addHighlight(){
        this.highlighted = true
    }

    removeHighlight(){
        this.highlighted = false
    }
}



class Edge{

    constructor(n1,n2){
        //allways keep the node with the highest x value as node1 to help with calculating angles
        n1.x >= n2.x ?  [this.node1,this.node2] = [n1,n2] : [this.node1,this.node2] = [n2,n1] 
        this.highlighted = false
        this.midPoint = this.getMidPoint()
        this.angle = this.getAngle()
    }

    getMidPoint(){
        return ({x:(this.node1.x+this.node2.x)/2, y: (this.node1.y+this.node2.y)/2})
    }

    getAngle(){
        let dx = this.node1.x - this.node2.x
        let dy = this.node1.y - this.node2.y 
        return Math.atan2(dy,dx)
    }

    draw(){
        c.strokeStyle = "#E27D60";
        c.beginPath()
        c.moveTo(this.node1.x, this.node1.y)
        c.lineTo(this.node2.x, this.node2.y)
        c.lineWidth = 4
        c.stroke()

        if (this.highlighted){
            c.strokeStyle = "black"
            c.lineWidth = 1
            c.beginPath();
            c.moveTo(this.node1.x, this.node1.y)
            c.lineTo(this.node2.x, this.node2.y)    
            c.stroke();
        }
 
        //write text above line
        c.fillStyle = "black"
        c.font = '12px Arial'
        c.lineWidth = 0.4
        c.save()
        c.translate(this.midPoint.x,this.midPoint.y)
        c.rotate(this.angle);
        c.textAlign = "center";
        c.fillText((Math.round(this.angle*100)/100).toString(),0, -5);
        c.restore();
    }

    addHighlight(){
        this.highlighted = true
    }

    removeHighlight(){
        this.highlighted = false
    }
}


function mouseClick(e){
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left 
    let y = e.clientY - rect.top 

    // clicking on a node
    let n = clickedExistingNode(x,y)
    if (n !== undefined){
        if (highlightedNode === undefined){
            toggleHighlights(n)
        }
        else if (n.highlighted) {
            toggleHighlights()
        }
        else{
            if (!edgeExists(n,highlightedNode)){
                edges.push(new Edge(n,highlightedNode)) 
                toggleHighlights()
            }
        }
        redrawCanvas()
        return
    }

    //clicking on an edge
    let edge = clickedExistingEdge(x,y)
    if (edge !== undefined){
        if (edge.highlighted){
            toggleHighlights()
        }
        else{
            toggleHighlights(edge)
        }
        redrawCanvas()
        return 
    }
    
    // clicking somewhere else - make new node if possible
    if (outOfBounds(x,y)) {return}
    
    else if (!onOtherNode(x,y)) {
        if (sourceNode === undefined){
            let newNode = new Node (x,y,sourceNode = true)
            nodes.push(newNode)
            sourceNode = newNode
        }
        else if(sinkNode === undefined) {
            let newNode = new Node (x,y,sourceNode = false,sinkNode = true)
            nodes.push(newNode)
            sinkNode = newNode
        }
        else{
            nodes.push(new Node(x,y))
        }
        toggleHighlights()
        redrawCanvas()
    }
}

function toggleHighlights(addHighlight=undefined){
    //remove highlight
    if (highlightedNode !== undefined){
        highlightedNode.removeHighlight()
        highlightedNode = undefined
    }
    if (highlightedEdge !== undefined){
        highlightedEdge.removeHighlight()
        highlightedEdge = undefined
    }

    //add highlight
    if (addHighlight!==undefined){
        addHighlight.addHighlight()
        addHighlight instanceof Edge ? highlightedEdge = addHighlight : highlightedNode = addHighlight
    }
}


function clickedExistingEdge(x,y){
    for(let i = 0; i < edges.length; i++){

        let node1 = edges[i].node1 
        let node2 = edges[i].node2
        let buffer = 3

        //first check if clicked inside a rectangular box with the line as its diagonal 
        if (x>(Math.min(node1.x,node2.x)-buffer) && x<(Math.max(node1.x,node2.x)+buffer) 
            && (y > (Math.min(node1.y,node2.y)-buffer)) && (y<(Math.max(node1.y,node2.y)+buffer))){
            
            //calculate distance from point to line
            let nom = Math.abs((node2.x-node1.x)*(node1.y-y) - (node1.x-x)*(node2.y-node1.y))
            let den = Math.sqrt(Math.pow((node2.x-node1.x),2)+ Math.pow((node2.y-node1.y),2))
            let d = nom / den
            if (d<5){
                return edges[i]
            }
        }   
    }   
    return undefined
}

function outOfBounds(x,y){
    if (x-nodeRadius < 0 || x + nodeRadius > canvas.width || y - nodeRadius < 0 || y + nodeRadius > canvas.height){
        return true
    }
    return false
}

//return true if a circle with mid point (x,y) and radius nodeRadius intersects with a previously placed node 
function onOtherNode(x,y){
    for(let i = 0; i < nodes.length; i++){
        let d = getDistance(x, nodes[i].x, y, nodes[i].y )
        if (d <= nodeRadius * 2 + 2){return true}
    }
    return false
}   


function clickedExistingNode(x,y){
    for(let i = 0; i < nodes.length; i++){
        let d = getDistance(x, nodes[i].x, y, nodes[i].y)
        if (d <= nodeRadius){return nodes[i]}
    }
    return undefined
}

function getDistance(x1,x2,y1,y2){
    let deltaX = x1 - x2 
    let deltaY = y1 - y2  
    return (Math.sqrt(deltaX*deltaX  + deltaY*deltaY))
}

function redrawCanvas(){
    writeInstructions()
    c.clearRect(0,0,canvas.width,canvas.height)
    nodes.forEach(node => { 
        node.draw()
    });
    edges.forEach(edge => {
        edge.draw()
    })
}

function edgeExists(node1,node2){
    for(let i = 0; i < edges.length; i++){
        if ( (edges[i].node1 === node1 && edges[i].node2 === node2) ||
             (edges[i].node2 === node1 && edges[i].node1 === node2)){return true}
    }
    return false
}

//removes all ingoing and outgoing edges from a node
function removeEdges(node){
    for(let i = edges.length-1; i>=0; i--){
        if(edges[i].node1 === node || edges[i].node2 === node){
            edges.splice(i,1)
        }
    }
}

function keyPress(e){
    if(e.key === "Escape"){
        if (highlightedNode !== undefined){
            removeEdges(highlightedNode)
            if(highlightedNode.sourceNode){
                sourceNode = undefined
                writeInstructions()
            }
            else if (highlightedNode.sinkNode){
                sinkNode = undefined
                writeInstructions()
            }
            let index = nodes.indexOf(highlightedNode)
            nodes.splice(index,1)
            highlightedNode = undefined
            redrawCanvas()
        }
        else if(highlightedEdge !== undefined){
            let index = edges.indexOf(highlightedEdge)
            edges.splice(index,1)
            highlightedEdge = undefined 
            redrawCanvas()
        }
    }
}

function writeInstructions(){
    if(sourceNode === undefined){
        infoBottom.innerHTML = "Click To Place Source Node"
    }
    else if(sinkNode===undefined){
        infoBottom.innerHTML ="Click To Place Place Sink Node"
    }
    else{   
        infoBottom.innerHTML =" - Click to Place Node <br> - Click Two Nodes To Create Edge <br> - Click Edge or Node and press Esc to delete it "
    }
}

canvas.addEventListener("click", mouseClick)
document.addEventListener('keydown', keyPress)
writeInstructions()




