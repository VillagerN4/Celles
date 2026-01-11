const debugMode = true;

var pageAnimating = false;
var pageFadeTime = !debugMode ? 1500 : 1;
var musicStarted = false;
var musicVolume = 1;
var panBlurAmount = 4;
var movementMultiplier = debugMode ? 9999 : 1;
var schoolMode = true;
var allowNazisBridge = debugMode;

const gameState = {
  page: 'menu',
  terminalTab: 'log',
  unreadLogs: 0,
  turn: 1,
  phase: 'movement',
  activePlayer: 'nazis',
  actionTokens: { nazis: [], allies: [] },
  availableActions: { nazis: 0, allies: 0 },
  units: {},
  formations: {},
  board: board_data.board,
  rows: rows,
  columns: columns,
  pathVisualizers: [],
  animatedUnits: {},
  combat: {primary: null, attackers: [], defenders: []}
};

const terrainCost = { clear: { mot: 2, inf: 1 }, rough: { mot: 3, inf: 2 }, woods: { mot: 4, inf: 3 }, town: { mot: 2, inf: 1 } };
const roadCost = { mot: 1, inf: 1 };
const highwayCost = { mot: 0.5, inf: 1 };
const edgeCost = { none: { mot: 0, inf: 0 }, river: { mot: 2, inf: 1 }, "large river": { mot: 999999999, inf: 999999999 } };
const enterOccupiedMotorizedExtra = 2;
const maxMovementCostPerTurn = 16;

const edgeToAngle = [-60, 0, 60, 240, 180, 120];
const easing = {start: t => t * t, mid: t => t, end: t => t * (2 - t), inout: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2};

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
var selectedUnitId = null;

const CRT = {
  '4': { 0: '2A', 1: '2A', 2: 'RD', 3: '1A', 4: 'RD', 5: 'RD', 6: 'RD', 7: '1A', 8: '1A', 9: '-' },
  '3': { 0: '2A', 1: 'RD', 2: '1A', 3: '1A', 4: '1A', 5: '1A', 6: '-', 7: '-', 8: '-', 9: '-' },
  '2': { 0: '2A', 1: '1A', 2: '1A', 3: '1A', 4: 'RD', 5: '-', 6: '-', 7: 'RD', 8: '-', 9: '-' },
  '1': { 0: '1A', 1: '1A', 2: '-', 3: 'RD', 4: 'RD', 5: 'RD', 6: '-', 7: '-', 8: '-', 9: '-' },
  '0': { 0: '1D', 1: '1D', 2: 'RD', 3: '1D', 4: '1D', 5: 'RD', 6: 'RD', 7: 'RD', 8: 'RD', 9: 'RD' }
};