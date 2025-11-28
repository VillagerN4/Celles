const gameState = {
  turn: 1,
  phase: 'token',
  activePlayer: 'nazis',
  actionTokens: { nazis: [], allies: [] },
  availableActions: { nazis: 0, allies: 0 },
  units: {},
  formations: {},
  board: board_data.board,
  rows: rows,
  columns: columns
};

const terrainCost = { clear: { mot:2, inf:1 }, rough:{ mot:3, inf:2 }, woods:{ mot:4, inf:3 }, town:{ mot:2, inf:1 } };
const roadCost = { mot:1, inf:1 };
const highwayCost = { mot:0.5, inf:1 };
const edgeCost = { none: { mot:0, inf:0 },  river: { mot:2, inf:1 }, "large river": { mot:999999999, inf:999999999 }};
const enterOccupiedMotorizedExtra = 2;

const factions = ["allies", "nazis", "brits"];
const modes = ["reduced", "standard", "active"];

const edgeInfo = ["none", "river", "large river"];
const edgeNames = ["top-left", "top", "top-right", "bottom-left", "bottom", "bottom-right"];
const terrainTypes = ["clear", "rough", "woods", "town"];

var pos1 = 0;
var pos2 = 0;
var pos3 = 0;
var pos4 = 0;
var cx = 0;
var cy = 0;
var mouseDown = false;
var selectedRow = null;
var selectedColumn = null;
let selectedUnitId = null;

const simpleCRT = {
  '4': {0:'2A',1:'2A',2:'2A',3:'1A',4:'1A',5:'1A',6:'1A',7:'1A',8:'1A',9:'-'},
  '3': {0:'2A',1:'1A',2:'1A',3:'1A',4:'1A',5:'1A',6:'-',7:'-',8:'-',9:'-'},
  '2': {0:'2A',1:'1A',2:'1A',3:'1A',4:'1A',5:'-',6:'-',7:'-',8:'-',9:'-'},
  '1': {0:'1A',1:'1A',2:'-',3:'-',4:'-',5:'-',6:'-',7:'-',8:'-',9:'-'},
  '0': {0:'1D',1:'1D',2:'1D',3:'1D',4:'1D',5:'1D',6:'1D',7:'1D',8:'1D',9:'1D'}
};